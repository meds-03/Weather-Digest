"""Async client for geocoding and weather data from Open-Meteo."""

from datetime import date, datetime
from types import TracebackType
from typing import Self

import httpx
from pydantic import BaseModel, ConfigDict, Field

from app.config import Settings, settings
from app.schemas import (
    CurrentWeather,
    DailyForecast,
    DigestItem,
    ForecastResponse,
)


class CityNotFoundError(LookupError):
    """Raised when Open-Meteo cannot geocode the requested city."""


class _GeocodingResult(BaseModel):
    """Subset of an Open-Meteo geocoding result used by this client."""

    model_config = ConfigDict(extra="ignore")

    name: str
    latitude: float
    longitude: float
    country: str | None = None

    @property
    def display_name(self) -> str:
        """Return the city name with its country when available."""
        if self.country:
            return f"{self.name}, {self.country}"
        return self.name


class _GeocodingResponse(BaseModel):
    """Subset of the Open-Meteo geocoding response."""

    model_config = ConfigDict(extra="ignore")

    results: list[_GeocodingResult] = Field(default_factory=list)


class _CurrentData(BaseModel):
    """Current conditions in the Open-Meteo response format."""

    model_config = ConfigDict(extra="ignore")

    time: datetime
    temperature_2m: float
    wind_speed_10m: float
    weather_code: int | None = None


class _DailyData(BaseModel):
    """Daily values in the Open-Meteo response format."""

    model_config = ConfigDict(extra="ignore")

    time: list[date]
    temperature_2m_max: list[float]
    temperature_2m_min: list[float]
    precipitation_sum: list[float]
    precipitation_probability_max: list[float]
    weather_code: list[int]
    wind_speed_10m_max: list[float]


class _CurrentResponseData(BaseModel):
    """Open-Meteo response fields required for current conditions."""

    model_config = ConfigDict(extra="ignore")

    latitude: float
    longitude: float
    timezone: str
    current: _CurrentData


class _ForecastData(_CurrentResponseData):
    """Open-Meteo response fields required for a daily forecast."""

    daily: _DailyData


class OpenMeteoService:
    """Geocode cities and fetch their current and daily weather."""

    def __init__(
        self,
        client: httpx.AsyncClient | None = None,
        config: Settings = settings,
    ) -> None:
        """Create the service, optionally using a caller-managed HTTP client."""
        self._client = (
            client
            if client is not None
            else httpx.AsyncClient(timeout=httpx.Timeout(10.0))
        )
        self._owns_client = client is None
        self._config = config

    async def __aenter__(self) -> Self:
        """Return this service for use as an async context manager."""
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_value: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        """Close the HTTP client when this service created it."""
        await self.aclose()

    async def aclose(self) -> None:
        """Close the owned HTTP client, if any."""
        if self._owns_client:
            await self._client.aclose()

    async def geocode_city(self, city: str) -> tuple[float, float, str]:
        """Resolve a city to latitude, longitude, and display name."""
        location = await self._geocode(city)
        return location.latitude, location.longitude, location.display_name

    async def get_current_weather(self, city: str) -> CurrentWeather:
        """Fetch current weather for a city."""
        location = await self._geocode(city)
        current = await self._fetch_current(location)
        return self._map_current(current)

    async def get_forecast(
        self,
        city: str,
        forecast_days: int = 7,
    ) -> ForecastResponse:
        """Fetch current conditions and up to 16 days of daily forecast."""
        if not 1 <= forecast_days <= 16:
            raise ValueError("forecast_days must be between 1 and 16")

        location = await self._geocode(city)
        params: dict[str, str | int | float] = {
            "latitude": location.latitude,
            "longitude": location.longitude,
            "current": "temperature_2m,wind_speed_10m,weather_code",
            "daily": (
                "temperature_2m_max,temperature_2m_min,precipitation_sum,"
                "precipitation_probability_max,weather_code,wind_speed_10m_max"
            ),
            "forecast_days": forecast_days,
            "temperature_unit": "celsius",
            "wind_speed_unit": "kmh",
            "precipitation_unit": "mm",
            "timezone": "auto",
        }
        response = await self._client.get(
            str(self._config.open_meteo_forecast_base_url),
            params=params,
        )
        response.raise_for_status()
        payload = _ForecastData.model_validate(response.json())

        return ForecastResponse(
            city=location.display_name,
            latitude=payload.latitude,
            longitude=payload.longitude,
            timezone=payload.timezone,
            current=self._map_current(payload.current),
            daily=self._map_daily(payload.daily),
        )

    async def get_digest_item(self, city: str) -> DigestItem:
        """Fetch and summarize current conditions and rain chance for a city."""
        forecast = await self.get_forecast(city, forecast_days=1)
        if not forecast.daily:
            raise ValueError("Open-Meteo returned no daily forecast data")

        current = forecast.current
        rain_chance = forecast.daily[0].precipitation_probability_max_percent
        return DigestItem(
            city=forecast.city,
            latitude=forecast.latitude,
            longitude=forecast.longitude,
            current=current,
            rain_chance_percent=rain_chance,
            summary=self._format_summary(
                current.weather_code,
                current.temperature_c,
                rain_chance,
            ),
        )

    async def _geocode(self, city: str) -> _GeocodingResult:
        """Return the first geocoding result or raise for an unknown city."""
        city_name = city.strip()
        if not city_name:
            raise ValueError("city must not be empty")

        response = await self._client.get(
            str(self._config.open_meteo_geocoding_base_url),
            params={
                "name": city_name,
                "count": 1,
                "language": "en",
                "format": "json",
            },
        )
        response.raise_for_status()
        payload = _GeocodingResponse.model_validate(response.json())
        if not payload.results:
            raise CityNotFoundError(f"No location found for {city_name!r}")
        return payload.results[0]

    async def _fetch_current(self, location: _GeocodingResult) -> _CurrentData:
        """Fetch and validate current weather for a geocoded location."""
        response = await self._client.get(
            str(self._config.open_meteo_forecast_base_url),
            params={
                "latitude": location.latitude,
                "longitude": location.longitude,
                "current": "temperature_2m,wind_speed_10m,weather_code",
                "temperature_unit": "celsius",
                "wind_speed_unit": "kmh",
                "timezone": "auto",
            },
        )
        response.raise_for_status()
        payload = _CurrentResponseData.model_validate(response.json())
        return payload.current

    @staticmethod
    def _map_current(current: _CurrentData) -> CurrentWeather:
        """Map Open-Meteo current fields to the public model."""
        return CurrentWeather(
            time=current.time,
            temperature_c=current.temperature_2m,
            wind_speed_kmh=current.wind_speed_10m,
            weather_code=current.weather_code,
        )

    @staticmethod
    def _map_daily(daily: _DailyData) -> list[DailyForecast]:
        """Map Open-Meteo daily arrays into individual forecast records."""
        return [
            DailyForecast(
                date=forecast_date,
                temperature_max_c=temperature_max,
                temperature_min_c=temperature_min,
                precipitation_sum_mm=precipitation,
                precipitation_probability_max_percent=probability_max,
                weather_code=weather_code,
                wind_speed_max_kmh=wind_speed_max,
            )
            for (
                forecast_date,
                temperature_max,
                temperature_min,
                precipitation,
                probability_max,
                weather_code,
                wind_speed_max,
            ) in zip(
                daily.time,
                daily.temperature_2m_max,
                daily.temperature_2m_min,
                daily.precipitation_sum,
                daily.precipitation_probability_max,
                daily.weather_code,
                daily.wind_speed_10m_max,
                strict=True,
            )
        ]

    @staticmethod
    def _format_summary(
        weather_code: int | None,
        temperature_c: float,
        rain_chance_percent: float,
    ) -> str:
        """Format weather values as a short human-readable digest line."""
        if weather_code == 0:
            condition = "Sunny"
        elif weather_code == 1:
            condition = "Mostly sunny"
        elif weather_code == 2:
            condition = "Partly cloudy"
        elif weather_code == 3:
            condition = "Cloudy"
        elif weather_code in (45, 48):
            condition = "Fog"
        elif weather_code in (51, 53, 55, 56, 57):
            condition = "Drizzle"
        elif weather_code in (61, 63, 65, 66, 67, 80, 81, 82):
            condition = "Rain"
        elif weather_code in (71, 73, 75, 77, 85, 86):
            condition = "Snow"
        elif weather_code in (95, 96, 99):
            condition = "Thunderstorms"
        else:
            condition = "Conditions unavailable"

        return (
            f"{condition}, {temperature_c:g}°C, "
            f"rain chance {rain_chance_percent:g}%"
        )

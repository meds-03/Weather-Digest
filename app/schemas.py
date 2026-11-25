"""Public response models for weather data."""

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class CurrentWeather(BaseModel):
    """Current weather conditions for a location."""

    model_config = ConfigDict(extra="forbid")

    time: datetime
    temperature_c: float
    wind_speed_kmh: float
    weather_code: int | None = None


class DailyForecast(BaseModel):
    """Weather summary for one local calendar day."""

    model_config = ConfigDict(extra="forbid")

    date: date
    temperature_max_c: float
    temperature_min_c: float
    precipitation_sum_mm: float
    precipitation_probability_max_percent: float = Field(ge=0, le=100)
    weather_code: int
    wind_speed_max_kmh: float


class ForecastResponse(BaseModel):
    """Current conditions and daily forecast for a geocoded city."""

    model_config = ConfigDict(extra="forbid")

    city: str
    latitude: float
    longitude: float
    timezone: str
    current: CurrentWeather
    daily: list[DailyForecast]


class DigestItem(BaseModel):
    """Current conditions and coordinates for one city in a digest."""

    model_config = ConfigDict(extra="forbid")

    city: str
    latitude: float
    longitude: float
    current: CurrentWeather
    rain_chance_percent: float = Field(ge=0, le=100)
    summary: str = Field(min_length=1)

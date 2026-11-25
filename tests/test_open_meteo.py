"""Tests for the Open-Meteo service response mapping."""

import unittest

import httpx

from app.schemas import ForecastResponse
from app.services.open_meteo import CityNotFoundError, OpenMeteoService


class OpenMeteoServiceTests(unittest.IsolatedAsyncioTestCase):
    """Exercise geocoding and forecast parsing without network access."""

    async def test_get_forecast_maps_geocoding_current_and_daily_data(self) -> None:
        """Map the API payload into the public forecast schema."""
        def handler(request: httpx.Request) -> httpx.Response:
            if request.url.path.endswith("/v1/search"):
                return httpx.Response(
                    200,
                    json={
                        "results": [
                            {
                                "name": "Berlin",
                                "latitude": 52.512604,
                                "longitude": 13.419517,
                                "country": "Germany",
                            }
                        ]
                    },
                )
            return httpx.Response(
                200,
                json={
                    "latitude": 52.5,
                    "longitude": 13.4,
                    "timezone": "Europe/Berlin",
                    "current": {
                        "time": "2026-11-25T20:15",
                        "temperature_2m": -0.2,
                        "wind_speed_10m": 8.4,
                        "weather_code": 3,
                    },
                    "daily": {
                        "time": ["2026-11-25", "2026-11-26"],
                        "temperature_2m_max": [1.7, 1.4],
                        "temperature_2m_min": [-0.5, -1.5],
                        "precipitation_sum": [0.0, 0.2],
                        "precipitation_probability_max": [10, 20],
                        "weather_code": [3, 71],
                        "wind_speed_10m_max": [12.3, 12.4],
                    },
                },
            )

        transport = httpx.MockTransport(handler)
        async with httpx.AsyncClient(transport=transport) as http_client:
            service = OpenMeteoService(client=http_client)
            result = await service.get_forecast("Berlin", forecast_days=2)

        self.assertIsInstance(result, ForecastResponse)
        self.assertEqual(result.city, "Berlin, Germany")
        self.assertEqual(result.current.temperature_c, -0.2)
        self.assertEqual(len(result.daily), 2)
        self.assertEqual(result.daily[1].weather_code, 71)

    async def test_get_forecast_raises_when_city_is_not_found(self) -> None:
        """Report an unknown city instead of returning empty weather data."""
        transport = httpx.MockTransport(
            lambda request: httpx.Response(200, json={})
        )
        async with httpx.AsyncClient(transport=transport) as http_client:
            service = OpenMeteoService(client=http_client)
            with self.assertRaises(CityNotFoundError):
                await service.get_forecast("No Such City")

    async def test_current_weather_and_digest_mapping(self) -> None:
        """Map current weather and summarize daily rain probability."""
        def handler(request: httpx.Request) -> httpx.Response:
            if request.url.path.endswith("/v1/search"):
                return httpx.Response(
                    200,
                    json={
                        "results": [
                            {
                                "name": "Berlin",
                                "latitude": 52.512604,
                                "longitude": 13.419517,
                                "country": "Germany",
                            }
                        ]
                    },
                )
            return httpx.Response(
                200,
                json={
                    "latitude": 52.5,
                    "longitude": 13.4,
                    "timezone": "Europe/Berlin",
                    "current": {
                        "time": "2026-11-25T20:15",
                        "temperature_2m": -0.2,
                        "wind_speed_10m": 8.4,
                        "weather_code": 3,
                    },
                    "daily": {
                        "time": ["2026-11-25"],
                        "temperature_2m_max": [1.7],
                        "temperature_2m_min": [-0.5],
                        "precipitation_sum": [0.0],
                        "precipitation_probability_max": [10],
                        "weather_code": [3],
                        "wind_speed_10m_max": [12.3],
                    },
                },
            )

        transport = httpx.MockTransport(handler)
        async with httpx.AsyncClient(transport=transport) as http_client:
            service = OpenMeteoService(client=http_client)
            current = await service.get_current_weather("Berlin")
            digest_item = await service.get_digest_item("Berlin")

        self.assertEqual(current.temperature_c, -0.2)
        self.assertEqual(digest_item.city, "Berlin, Germany")
        self.assertEqual(digest_item.current.wind_speed_kmh, 8.4)
        self.assertEqual(digest_item.summary, "Cloudy, -0.2°C, rain chance 10%")


if __name__ == "__main__":
    unittest.main()

"""Tests for weather endpoint validation and digest concurrency."""

import asyncio
import unittest
from datetime import datetime

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routers.weather import get_weather_service, router
from app.schemas import CurrentWeather, DailyForecast, DigestItem, ForecastResponse


class FakeWeatherService:
    """Provide deterministic weather responses for route tests."""

    def __init__(self) -> None:
        self.active_digest_calls = 0
        self.max_active_digest_calls = 0
        self.requested_days: int | None = None

    async def get_current_weather(self, city: str) -> CurrentWeather:
        """Return a fixed current-weather response."""
        return CurrentWeather(
            time=datetime(2026, 11, 25, 20, 15),
            temperature_c=24,
            wind_speed_kmh=8.4,
            weather_code=0,
        )

    async def get_forecast(
        self,
        city: str,
        forecast_days: int = 7,
    ) -> ForecastResponse:
        """Return a fixed forecast and remember the requested day count."""
        self.requested_days = forecast_days
        return ForecastResponse(
            city=city,
            latitude=36.8,
            longitude=10.2,
            timezone="Africa/Tunis",
            current=await self.get_current_weather(city),
            daily=[
                DailyForecast(
                    date="2026-11-25",
                    temperature_max_c=25,
                    temperature_min_c=18,
                    precipitation_sum_mm=0,
                    precipitation_probability_max_percent=10,
                    weather_code=0,
                    wind_speed_max_kmh=12,
                )
            ],
        )

    async def get_digest_item(self, city: str) -> DigestItem:
        """Return a fixed digest item while tracking overlapping calls."""
        self.active_digest_calls += 1
        self.max_active_digest_calls = max(
            self.max_active_digest_calls,
            self.active_digest_calls,
        )
        try:
            await asyncio.sleep(0.01)
            return DigestItem(
                city=city,
                latitude=36.8,
                longitude=10.2,
                current=await self.get_current_weather(city),
                rain_chance_percent=10,
                summary="Sunny, 24°C, rain chance 10%",
            )
        finally:
            self.active_digest_calls -= 1


class WeatherRouteTests(unittest.TestCase):
    """Verify route output, query limits, and concurrent digest calls."""

    def setUp(self) -> None:
        self.service = FakeWeatherService()
        app = FastAPI()
        app.include_router(router)
        app.dependency_overrides[get_weather_service] = lambda: self.service
        self.client = TestClient(app)
        self.client.__enter__()

    def tearDown(self) -> None:
        """Close the test client after each test."""
        self.client.__exit__(None, None, None)

    def test_forecast_uses_response_model_and_requested_days(self) -> None:
        """Return a validated forecast and pass the requested day count."""
        response = self.client.get(
            "/weather/forecast",
            params={"city": "Tunis", "days": 3},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.service.requested_days, 3)
        self.assertEqual(response.json()["daily"][0]["weather_code"], 0)

    def test_current_rejects_city_names_shorter_than_two_characters(self) -> None:
        """Enforce the minimum city query length."""
        response = self.client.get("/weather/current", params={"city": "T"})

        self.assertEqual(response.status_code, 422)

    def test_forecast_rejects_days_outside_the_allowed_range(self) -> None:
        """Reject a forecast request exceeding the seven-day limit."""
        response = self.client.get(
            "/weather/forecast",
            params={"city": "Tunis", "days": 8},
        )

        self.assertEqual(response.status_code, 422)

    def test_digest_caps_city_count_and_fetches_concurrently(self) -> None:
        """Limit digests to five cities and overlap per-city requests."""
        response = self.client.get(
            "/digest",
            params={"cities": "Tunis,Paris,Oslo"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 3)
        self.assertEqual(
            response.json()[0]["summary"],
            "Sunny, 24°C, rain chance 10%",
        )
        self.assertGreater(self.service.max_active_digest_calls, 1)

        too_many = self.client.get(
            "/digest",
            params={"cities": "Tunis,Paris,Oslo,Rome,Berlin,Tokyo"},
        )
        self.assertEqual(too_many.status_code, 422)


if __name__ == "__main__":
    unittest.main()

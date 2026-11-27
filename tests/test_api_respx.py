"""API integration tests using TestClient and mocked Open-Meteo requests."""

import respx
from httpx import Response

from app.config import settings

GEOCODING_URL = str(settings.open_meteo_geocoding_base_url)
FORECAST_URL = str(settings.open_meteo_forecast_base_url)


def _mock_geocoding(
    mock: respx.MockRouter,
    city: str,
    latitude: float = 36.8,
    longitude: float = 10.2,
) -> respx.Route:
    return mock.get(
        GEOCODING_URL,
        params={
            "name": city,
            "count": "1",
            "language": "en",
            "format": "json",
        },
    ).mock(
        return_value=Response(
            200,
            json={
                "results": [
                    {
                        "name": city,
                        "latitude": latitude,
                        "longitude": longitude,
                        "country": "Testland",
                    }
                ]
            },
        )
    )


def _weather_payload(days: int = 1) -> dict[str, object]:
    dates = [f"2026-11-{day:02d}" for day in range(25, 25 + days)]
    return {
        "latitude": 36.8,
        "longitude": 10.2,
        "timezone": "Africa/Tunis",
        "current": {
            "time": "2026-11-25T20:15",
            "temperature_2m": 24,
            "wind_speed_10m": 8.4,
            "weather_code": 0,
        },
        "daily": {
            "time": dates,
            "temperature_2m_max": [25] * days,
            "temperature_2m_min": [18] * days,
            "precipitation_sum": [0] * days,
            "precipitation_probability_max": [10] * days,
            "weather_code": [0] * days,
            "wind_speed_10m_max": [12] * days,
        },
    }


def test_current_weather_success(api_client, open_meteo_mock) -> None:
    _mock_geocoding(open_meteo_mock, "Tunis")
    open_meteo_mock.get(FORECAST_URL).mock(
        return_value=Response(200, json=_weather_payload())
    )

    response = api_client.get("/weather/current", params={"city": "Tunis"})

    assert response.status_code == 200
    assert response.json()["temperature_c"] == 24
    assert response.json()["weather_code"] == 0
    assert response.headers["X-Cache"] == "MISS"


def test_forecast_days_validation_returns_clean_422(
    api_client,
    open_meteo_mock,
) -> None:
    response = api_client.get(
        "/weather/forecast",
        params={"city": "Tunis", "days": 8},
    )

    assert response.status_code == 422
    assert response.json()["error"] == "Invalid input"
    assert "days" in response.json()["detail"]
    assert not open_meteo_mock.calls


def test_city_not_found_returns_404(api_client, open_meteo_mock) -> None:
    open_meteo_mock.get(
        GEOCODING_URL,
        params={
            "name": "Atlantis",
            "count": "1",
            "language": "en",
            "format": "json",
        },
    ).mock(return_value=Response(200, json={"results": []}))

    response = api_client.get(
        "/weather/current",
        params={"city": "Atlantis"},
    )

    assert response.status_code == 404
    assert response.json() == {
        "error": "City not found",
        "detail": "No location found for 'Atlantis'",
    }


def test_upstream_failure_returns_502_after_one_retry(
    api_client,
    open_meteo_mock,
) -> None:
    _mock_geocoding(open_meteo_mock, "Tunis")
    forecast_route = open_meteo_mock.get(FORECAST_URL).mock(
        return_value=Response(503)
    )

    response = api_client.get("/weather/current", params={"city": "Tunis"})

    assert response.status_code == 502
    assert response.json() == {
        "error": "Upstream API failure",
        "detail": "Weather provider request failed",
    }
    assert forecast_route.call_count == 2


def test_repeated_current_lookup_is_cached(
    api_client,
    open_meteo_mock,
) -> None:
    geocoding_route = _mock_geocoding(open_meteo_mock, "Tunis")
    forecast_route = open_meteo_mock.get(FORECAST_URL).mock(
        return_value=Response(200, json=_weather_payload())
    )

    first = api_client.get("/weather/current", params={"city": "Tunis"})
    second = api_client.get("/weather/current", params={"city": "Tunis"})

    assert first.headers["X-Cache"] == "MISS"
    assert second.headers["X-Cache"] == "HIT"
    assert geocoding_route.call_count == 1
    assert forecast_route.call_count == 1


def test_digest_returns_multiple_cities(api_client, open_meteo_mock) -> None:
    _mock_geocoding(open_meteo_mock, "Tunis", 36.8, 10.2)
    _mock_geocoding(open_meteo_mock, "Paris", 48.8, 2.3)
    forecast_route = open_meteo_mock.get(FORECAST_URL).mock(
        return_value=Response(200, json=_weather_payload())
    )

    response = api_client.get("/digest", params={"cities": "Tunis,Paris"})

    assert response.status_code == 200
    assert [item["city"] for item in response.json()] == [
        "Tunis, Testland",
        "Paris, Testland",
    ]
    assert all(
        item["summary"] == "Sunny, 24°C, rain chance 10%"
        for item in response.json()
    )
    assert forecast_route.call_count == 2

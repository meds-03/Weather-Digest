"""Weather and multi-city digest endpoints."""

import asyncio
from collections.abc import Awaitable, Callable
from typing import Annotated, TypeVar

from fastapi import APIRouter, Depends, Query, Request, Response

from app.exceptions import APIError, InvalidInputError
from app.schemas import CurrentWeather, DigestItem, ForecastResponse
from app.services.cache import track_cache_status
from app.services.open_meteo import OpenMeteoService

router = APIRouter()
T = TypeVar("T")


def get_weather_service(request: Request) -> OpenMeteoService:
    """Return the application-scoped Open-Meteo service."""
    return request.app.state.open_meteo_service


def _clean_city(city: str) -> str:
    """Trim a city name and enforce its minimum meaningful length."""
    cleaned = city.strip()
    if len(cleaned) < 2:
        raise InvalidInputError(
            "city must contain at least 2 non-whitespace characters"
        )
    return cleaned


def _parse_cities(value: str) -> list[str]:
    """Parse and validate a comma-separated city list with a five-city limit."""
    cities = [city.strip() for city in value.split(",")]
    if len(cities) > 5:
        raise InvalidInputError("A digest supports at most 5 cities")
    if any(len(city) < 2 for city in cities):
        raise InvalidInputError(
            "Each city must contain at least 2 non-whitespace characters"
        )
    return cities


async def _resolve_weather(
    operation: Callable[[], Awaitable[T]],
    response: Response,
) -> T:
    """Track cache status while letting application errors reach their handlers."""
    with track_cache_status() as cache_events:
        try:
            result = await operation()
        except APIError as error:
            error.headers["X-Cache"] = _cache_status(cache_events)
            raise

    response.headers["X-Cache"] = _cache_status(cache_events)
    return result


def _cache_status(events: list[bool]) -> str:
    """Report HIT only when every lookup for this request was a hit."""
    return "HIT" if events and all(events) else "MISS"


@router.get(
    "/weather/current",
    response_model=CurrentWeather,
    tags=["weather"],
)
async def current_weather(
    city: Annotated[str, Query(min_length=2)],
    service: Annotated[OpenMeteoService, Depends(get_weather_service)],
    response: Response,
) -> CurrentWeather:
    """Return current weather for the requested city."""
    return await _resolve_weather(
        lambda: service.get_current_weather(_clean_city(city)),
        response,
    )


@router.get(
    "/weather/forecast",
    response_model=ForecastResponse,
    tags=["weather"],
)
async def weather_forecast(
    city: Annotated[str, Query(min_length=2)],
    service: Annotated[OpenMeteoService, Depends(get_weather_service)],
    response: Response,
    days: Annotated[int, Query(ge=1, le=7)] = 7,
) -> ForecastResponse:
    """Return current conditions and a daily forecast for the requested city."""
    return await _resolve_weather(
        lambda: service.get_forecast(_clean_city(city), forecast_days=days),
        response,
    )


@router.get(
    "/digest",
    response_model=list[DigestItem],
    tags=["weather"],
)
async def weather_digest(
    cities: Annotated[
        str,
        Query(min_length=2, description="Comma-separated city names; up to 5"),
    ],
    service: Annotated[OpenMeteoService, Depends(get_weather_service)],
    response: Response,
) -> list[DigestItem]:
    """Fetch and summarize weather for up to five cities concurrently."""
    city_names = _parse_cities(cities)
    return await _resolve_weather(
        lambda: asyncio.gather(
            *(service.get_digest_item(city) for city in city_names)
        ),
        response,
    )

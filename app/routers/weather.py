"""Weather and multi-city digest endpoints."""

import asyncio
from collections.abc import Awaitable
from typing import Annotated, TypeVar

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.schemas import CurrentWeather, DigestItem, ForecastResponse
from app.services.open_meteo import CityNotFoundError, OpenMeteoService

router = APIRouter()
T = TypeVar("T")


def get_weather_service(request: Request) -> OpenMeteoService:
    """Return the application-scoped Open-Meteo service."""
    return request.app.state.open_meteo_service


def _clean_city(city: str) -> str:
    """Trim a city name and enforce its minimum meaningful length."""
    cleaned = city.strip()
    if len(cleaned) < 2:
        raise HTTPException(
            status_code=422,
            detail="city must contain at least 2 non-whitespace characters",
        )
    return cleaned


def _parse_cities(value: str) -> list[str]:
    """Parse and validate a comma-separated city list with a five-city limit."""
    cities = [city.strip() for city in value.split(",")]
    if len(cities) > 5:
        raise HTTPException(
            status_code=422,
            detail="A digest supports at most 5 cities",
        )
    if any(len(city) < 2 for city in cities):
        raise HTTPException(
            status_code=422,
            detail="Each city must contain at least 2 non-whitespace characters",
        )
    return cities


async def _resolve_weather(awaitable: Awaitable[T]) -> T:
    """Translate provider failures into appropriate API responses."""
    try:
        return await awaitable
    except CityNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except (httpx.HTTPError, ValueError) as error:
        raise HTTPException(
            status_code=502,
            detail="Weather provider request failed or returned invalid data",
        ) from error


@router.get(
    "/weather/current",
    response_model=CurrentWeather,
    tags=["weather"],
)
async def current_weather(
    city: Annotated[str, Query(min_length=2)],
    service: Annotated[OpenMeteoService, Depends(get_weather_service)],
) -> CurrentWeather:
    """Return current weather for the requested city."""
    return await _resolve_weather(service.get_current_weather(_clean_city(city)))


@router.get(
    "/weather/forecast",
    response_model=ForecastResponse,
    tags=["weather"],
)
async def weather_forecast(
    city: Annotated[str, Query(min_length=2)],
    service: Annotated[OpenMeteoService, Depends(get_weather_service)],
    days: Annotated[int, Query(ge=1, le=7)] = 7,
) -> ForecastResponse:
    """Return current conditions and a daily forecast for the requested city."""
    return await _resolve_weather(
        service.get_forecast(_clean_city(city), forecast_days=days)
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
) -> list[DigestItem]:
    """Fetch and summarize weather for up to five cities concurrently."""
    city_names = _parse_cities(cities)
    return await _resolve_weather(
        asyncio.gather(
            *(service.get_digest_item(city) for city in city_names)
        )
    )

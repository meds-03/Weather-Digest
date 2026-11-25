"""FastAPI application entry point."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Response, status

from app.routers.weather import router as weather_router
from app.services.open_meteo import OpenMeteoService


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Create and close a shared Open-Meteo HTTP client with the app."""
    async with OpenMeteoService() as weather_service:
        app.state.open_meteo_service = weather_service
        yield


app = FastAPI(
    title="Weather Digest API",
    lifespan=lifespan,
)
app.include_router(weather_router)


@app.get("/", response_model=dict[str, str], tags=["health"])
def root() -> dict[str, str]:
    return {
        "service": "Weather Digest API",
        "health": "/health",
        "docs": "/docs",
    }


@app.get("/health", response_model=dict[str, str], tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get(
    "/favicon.ico",
    response_model=None,
    include_in_schema=False,
    status_code=status.HTTP_204_NO_CONTENT,
)
def favicon() -> Response:
    return Response(status_code=status.HTTP_204_NO_CONTENT)

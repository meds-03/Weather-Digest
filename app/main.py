"""FastAPI application entry point."""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, Response, status
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import FileResponse, JSONResponse
from starlette.staticfiles import StaticFiles

from app.exceptions import APIError
from app.routers.weather import router as weather_router
from app.services.open_meteo import OpenMeteoService

logger = logging.getLogger(__name__)
FRONTEND_DIST = Path(__file__).resolve().parents[1] / "frontend" / "dist"
FRONTEND_INDEX = FRONTEND_DIST / "index.html"


async def handle_api_error(request: Request, error: APIError) -> JSONResponse:
    """Render application exceptions using the common error format."""
    log_method = logger.error if error.status_code >= 500 else logger.info
    log_method("API request failed: %s", error.error)
    return JSONResponse(
        status_code=error.status_code,
        content={"error": error.error, "detail": error.detail},
        headers=error.headers,
    )


async def handle_validation_error(
    request: Request,
    error: RequestValidationError,
) -> JSONResponse:
    """Return concise validation messages without echoing submitted values."""
    details: list[str] = []
    for validation_error in error.errors():
        location = validation_error.get("loc", ())
        field = ".".join(
            str(part)
            for part in location
            if part not in ("query", "path", "body", "header", "cookie")
        )
        message = str(validation_error.get("msg", "Invalid value"))
        details.append(f"{field}: {message}" if field else message)

    detail = "; ".join(details) or "Request validation failed"
    logger.info("Request validation failed: %s", detail)
    return JSONResponse(
        status_code=422,
        content={"error": "Invalid input", "detail": detail},
    )


async def handle_http_error(
    request: Request,
    error: StarletteHTTPException,
) -> JSONResponse:
    """Render framework HTTP errors using the common error format."""
    if error.status_code == 404:
        title = "Not found"
    elif error.status_code == 422:
        title = "Invalid input"
    else:
        title = "HTTP error"
    logger.info("HTTP request failed with status %d", error.status_code)
    return JSONResponse(
        status_code=error.status_code,
        content={"error": title, "detail": str(error.detail)},
        headers=error.headers,
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Install consistent error responses for API and request validation errors."""
    app.add_exception_handler(APIError, handle_api_error)
    app.add_exception_handler(RequestValidationError, handle_validation_error)
    app.add_exception_handler(StarletteHTTPException, handle_http_error)


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
register_exception_handlers(app)
if FRONTEND_DIST.is_dir():
    app.mount(
        "/assets",
        StaticFiles(directory=str(FRONTEND_DIST / "assets"), check_dir=False),
        name="frontend-assets",
    )
app.include_router(weather_router)


@app.get("/", response_model=None, tags=["health"])
def root() -> Response | dict[str, str]:
    if FRONTEND_INDEX.is_file():
        return FileResponse(FRONTEND_INDEX)
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


if FRONTEND_DIST.is_dir():

    @app.get("/{path:path}", response_model=None, include_in_schema=False)
    def frontend_fallback(path: str) -> Response:
        reserved_roots = {
            "assets",
            "digest",
            "docs",
            "health",
            "openapi.json",
            "redoc",
            "weather",
        }
        if path.split("/", maxsplit=1)[0] in reserved_roots:
            raise StarletteHTTPException(status_code=404, detail="Not Found")
        if not FRONTEND_INDEX.is_file():
            raise StarletteHTTPException(status_code=404, detail="Not Found")
        return FileResponse(FRONTEND_INDEX)

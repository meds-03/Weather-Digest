"""Shared fixtures for API integration tests."""

from collections.abc import Iterator

import pytest
import respx
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def open_meteo_mock():
    """Intercept Open-Meteo HTTP requests for one test."""
    with respx.mock(assert_all_called=False) as mock:
        yield mock


@pytest.fixture
def api_client(open_meteo_mock) -> Iterator[TestClient]:
    """Run the application with its normal lifespan and test client."""
    with TestClient(app) as client:
        yield client

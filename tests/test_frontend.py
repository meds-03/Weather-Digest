"""Tests for serving the production frontend build."""

import pytest

from app.main import FRONTEND_DIST


@pytest.mark.skipif(
    not FRONTEND_DIST.is_dir(),
    reason="frontend production build is not present",
)
def test_root_serves_frontend(api_client) -> None:
    """Serve the built SPA entry point from the API root."""
    response = api_client.get("/")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    assert response.text.lstrip().lower().startswith("<!doctype html>")

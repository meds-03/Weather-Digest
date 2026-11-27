"""Application exceptions rendered by the API error handlers."""


class APIError(Exception):
    """Base exception for errors with a public HTTP response."""

    status_code = 500
    error = "API error"

    def __init__(
        self,
        detail: str,
        *,
        headers: dict[str, str] | None = None,
    ) -> None:
        super().__init__(detail)
        self.detail = detail
        self.headers = dict(headers or {})


class CityNotFoundError(APIError, LookupError):
    """Raised when geocoding cannot find the requested city."""

    status_code = 404
    error = "City not found"


class UpstreamAPIError(APIError):
    """Raised when the weather provider fails or returns invalid data."""

    status_code = 502
    error = "Upstream API failure"


class UpstreamTimeoutError(APIError):
    """Raised when the weather provider does not respond before timeout."""

    status_code = 504
    error = "Upstream API timeout"


class InvalidInputError(APIError):
    """Raised when a request value is invalid after parsing."""

    status_code = 422
    error = "Invalid input"

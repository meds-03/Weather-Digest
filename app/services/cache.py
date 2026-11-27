"""Small async cache helpers for weather service lookups."""

from collections.abc import Awaitable, Callable, Hashable, Iterator
from contextlib import contextmanager
from contextvars import ContextVar, Token
from typing import Generic, TypeVar

from cachetools import TTLCache

Key = TypeVar("Key", bound=Hashable)
Value = TypeVar("Value")

_cache_events: ContextVar[list[bool] | None] = ContextVar(
    "weather_cache_events",
    default=None,
)


@contextmanager
def track_cache_status() -> Iterator[list[bool]]:
    """Track cache hits and misses within the current request context."""
    events: list[bool] = []
    token: Token[list[bool] | None] = _cache_events.set(events)
    try:
        yield events
    finally:
        _cache_events.reset(token)


class AsyncTTLCache(Generic[Key, Value]):
    """Cache values produced by async loaders for a configured TTL."""

    def __init__(self, ttl_seconds: int, maxsize: int = 256) -> None:
        self._ttl_seconds = ttl_seconds
        self._values: TTLCache[Key, Value] = TTLCache(
            maxsize=maxsize,
            ttl=max(ttl_seconds, 1),
        )

    async def get_or_create(
        self,
        key: Key,
        loader: Callable[[], Awaitable[Value]],
    ) -> Value:
        """Return a cached value or load and cache it."""
        try:
            value = self._values[key]
        except KeyError:
            self._record_cache_event(False)
            value = await loader()
            if self._ttl_seconds > 0:
                self._values[key] = value
            return value

        self._record_cache_event(True)
        return value

    @staticmethod
    def _record_cache_event(hit: bool) -> None:
        events = _cache_events.get()
        if events is not None:
            events.append(hit)

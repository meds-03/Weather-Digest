from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="WEATHER_DIGEST_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    open_meteo_forecast_base_url: AnyHttpUrl = "https://api.open-meteo.com/v1/forecast"
    open_meteo_geocoding_base_url: AnyHttpUrl = (
        "https://geocoding-api.open-meteo.com/v1/search"
    )
    cache_ttl_seconds: int = Field(default=300, ge=0)


settings = Settings()

export interface CurrentWeather {
  time: string
  temperature_c: number
  wind_speed_kmh: number
  weather_code: number | null
}

export interface DailyForecast {
  date: string
  temperature_max_c: number
  temperature_min_c: number
  precipitation_sum_mm: number
  precipitation_probability_max_percent: number
  weather_code: number
  wind_speed_max_kmh: number
}

export interface ForecastResponse {
  city: string
  latitude: number
  longitude: number
  timezone: string
  current: CurrentWeather
  daily: DailyForecast[]
}

export interface DigestItem {
  city: string
  latitude: number
  longitude: number
  current: CurrentWeather
  rain_chance_percent: number
  summary: string
}

export interface ApiError {
  status: number
  error: string
  detail: string
}

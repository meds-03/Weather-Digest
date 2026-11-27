import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TemperatureUnit } from './context/settings'

export type WeatherTheme = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'night'

export interface WeatherCodeInfo {
  label: string
  icon: LucideIcon
  theme: WeatherTheme
}

export function isDaytime(time: string): boolean {
  const hour = Number(time.slice(11, 13))
  return Number.isFinite(hour) ? hour >= 6 && hour < 18 : true
}

export function weatherCodeToInfo(
  code: number | null,
  isDay: boolean,
): WeatherCodeInfo {
  switch (code) {
    case 0:
      return isDay
        ? { label: 'Clear sky', icon: Sun, theme: 'sunny' }
        : { label: 'Clear sky', icon: Moon, theme: 'night' }
    case 1:
      return isDay
        ? { label: 'Mainly clear', icon: CloudSun, theme: 'sunny' }
        : { label: 'Mainly clear', icon: CloudMoon, theme: 'night' }
    case 2:
      return isDay
        ? { label: 'Partly cloudy', icon: CloudSun, theme: 'cloudy' }
        : { label: 'Partly cloudy', icon: CloudMoon, theme: 'night' }
    case 3:
      return { label: 'Overcast', icon: Cloud, theme: 'cloudy' }
    case 45:
    case 48:
      return { label: 'Fog', icon: CloudFog, theme: 'cloudy' }
    case 51:
    case 53:
    case 55:
      return { label: 'Drizzle', icon: CloudDrizzle, theme: 'rainy' }
    case 56:
    case 57:
      return { label: 'Freezing drizzle', icon: CloudDrizzle, theme: 'rainy' }
    case 61:
    case 63:
    case 65:
      return { label: 'Rain', icon: CloudRain, theme: 'rainy' }
    case 66:
    case 67:
      return { label: 'Freezing rain', icon: CloudRain, theme: 'snowy' }
    case 71:
    case 73:
    case 75:
    case 77:
      return { label: 'Snow', icon: CloudSnow, theme: 'snowy' }
    case 80:
    case 81:
    case 82:
      return { label: 'Rain showers', icon: CloudRain, theme: 'rainy' }
    case 85:
    case 86:
      return { label: 'Snow showers', icon: CloudSnow, theme: 'snowy' }
    case 95:
    case 96:
    case 99:
      return { label: 'Thunderstorm', icon: CloudLightning, theme: 'stormy' }
    default:
      return { label: 'Unknown conditions', icon: Cloud, theme: 'cloudy' }
  }
}

export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32
}

export function convertTemperature(
  celsius: number,
  unit: TemperatureUnit,
): number {
  return unit === 'F' ? celsiusToFahrenheit(celsius) : celsius
}

export function formatTemperature(
  celsius: number,
  unit: TemperatureUnit,
): string {
  return `${Math.round(convertTemperature(celsius, unit))}°${unit}`
}

export function convertSummaryTemperature(
  summary: string,
  unit: TemperatureUnit,
): string {
  if (unit === 'C') {
    return summary
  }

  return summary.replace(/(-?\d+(?:\.\d+)?)°C/g, (_match, celsius: string) =>
    formatTemperature(Number(celsius), unit),
  )
}

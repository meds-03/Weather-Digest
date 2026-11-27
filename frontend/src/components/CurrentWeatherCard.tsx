import { MapPin, Wind } from 'lucide-react'
import { useSettings } from '../context/useSettings'
import type { CurrentWeather } from '../types'
import { convertTemperature, isDaytime, weatherCodeToInfo } from '../utils'

interface CurrentWeatherCardProps {
  city: string
  country: string
  weather: CurrentWeather
}

const themeStyles = {
  sunny: {
    card: 'from-amber-100/80 via-white/60 to-orange-50/80 dark:from-amber-950/80 dark:via-slate-900/80 dark:to-orange-950/60',
    icon: 'text-amber-500',
    glow: 'bg-amber-200/60 dark:bg-amber-500/20',
  },
  cloudy: {
    card: 'from-slate-100/90 via-white/60 to-sky-100/70 dark:from-slate-800/90 dark:via-slate-900/80 dark:to-sky-950/70',
    icon: 'text-slate-500 dark:text-slate-300',
    glow: 'bg-slate-200/70 dark:bg-slate-500/20',
  },
  rainy: {
    card: 'from-blue-100/80 via-white/60 to-cyan-100/70 dark:from-blue-950/80 dark:via-slate-900/80 dark:to-cyan-950/70',
    icon: 'text-blue-600 dark:text-blue-300',
    glow: 'bg-blue-200/70 dark:bg-blue-500/20',
  },
  snowy: {
    card: 'from-cyan-100/80 via-white/60 to-sky-100/70 dark:from-cyan-950/80 dark:via-slate-900/80 dark:to-sky-950/70',
    icon: 'text-cyan-600 dark:text-cyan-300',
    glow: 'bg-cyan-200/70 dark:bg-cyan-500/20',
  },
  stormy: {
    card: 'from-violet-100/80 via-white/60 to-indigo-100/70 dark:from-violet-950/80 dark:via-slate-900/80 dark:to-indigo-950/70',
    icon: 'text-violet-600 dark:text-violet-300',
    glow: 'bg-violet-200/70 dark:bg-violet-500/20',
  },
  night: {
    card: 'from-indigo-200/80 via-white/60 to-violet-100/70 dark:from-indigo-950/80 dark:via-slate-900/80 dark:to-violet-950/70',
    icon: 'text-indigo-600 dark:text-indigo-300',
    glow: 'bg-indigo-200/70 dark:bg-indigo-500/20',
  },
} as const

function CurrentWeatherCard({
  city,
  country,
  weather,
}: CurrentWeatherCardProps) {
  const { temperatureUnit } = useSettings()
  const weatherInfo = weatherCodeToInfo(
    weather.weather_code,
    isDaytime(weather.time),
  )
  const WeatherIcon = weatherInfo.icon
  const theme = themeStyles[weatherInfo.theme]

  return (
    <section
      aria-label={`Current weather in ${city}`}
      className={`relative isolate overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br ${theme.card} p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl animate-fade-in dark:border-white/10 sm:p-9`}
    >
      <div
        aria-hidden="true"
        className={`absolute -right-12 -top-16 -z-10 size-56 rounded-full blur-3xl ${theme.glow}`}
      />
      <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <MapPin aria-hidden="true" size={17} />
            <p className="truncate text-sm font-medium">
              {[city, country].filter(Boolean).join(', ')}
            </p>
          </div>
          <p className="mt-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            Current weather
          </p>
          <p className="mt-1 text-7xl font-semibold tracking-[-0.08em] text-slate-950 dark:text-white sm:text-8xl">
            {Math.round(convertTemperature(weather.temperature_c, temperatureUnit))}
            <span className="ml-1 align-top text-4xl font-normal tracking-normal text-slate-500 dark:text-slate-300 sm:text-5xl">
              °{temperatureUnit}
            </span>
          </p>
          <p className="mt-2 text-lg font-medium text-slate-700 dark:text-slate-200">
            {weatherInfo.label}
          </p>
        </div>

        <div className="flex items-center justify-between gap-5 sm:flex-col sm:items-end sm:gap-8">
          <div
            className={`flex size-28 items-center justify-center rounded-full border border-white/60 bg-white/50 shadow-inner backdrop-blur-md dark:border-white/10 dark:bg-slate-900/40 sm:size-36 ${theme.icon}`}
          >
            <WeatherIcon aria-hidden="true" size={72} strokeWidth={1.4} />
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/50 px-4 py-3 text-slate-700 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-100">
            <Wind aria-hidden="true" className="text-sky-700" size={20} />
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Wind</p>
              <p className="text-sm font-semibold">
                {Math.round(weather.wind_speed_kmh)} km/h
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CurrentWeatherCard

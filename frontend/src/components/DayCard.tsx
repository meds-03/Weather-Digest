import { Droplets } from 'lucide-react'
import { useSettings } from '../context/useSettings'
import type { DailyForecast } from '../types'
import { formatTemperature, weatherCodeToInfo } from '../utils'

interface DayCardProps {
  forecast: DailyForecast
}

function getLocalDate(date: string): Date {
  return new Date(`${date}T00:00:00`)
}

function DayCard({ forecast }: DayCardProps) {
  const { temperatureUnit } = useSettings()
  const date = getLocalDate(forecast.date)
  const weekday = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
  }).format(date)
  const monthAndDay = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date)
  const weatherInfo = weatherCodeToInfo(forecast.weather_code, true)
  const WeatherIcon = weatherInfo.icon
  const maximum = formatTemperature(forecast.temperature_max_c, temperatureUnit)
  const minimum = formatTemperature(forecast.temperature_min_c, temperatureUnit)

  return (
    <article
      aria-label={`${weekday}, ${monthAndDay}: ${weatherInfo.label}, high ${maximum}, low ${minimum}`}
      className="min-w-[138px] snap-start rounded-3xl border border-white/70 bg-white/65 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/80 dark:border-white/10 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 lg:min-w-0"
      role="listitem"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{weekday}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{monthAndDay}</p>
        </div>
        <WeatherIcon
          aria-hidden="true"
          className="shrink-0 text-sky-600"
          size={23}
          strokeWidth={1.7}
        />
      </div>

      <p className="mt-4 min-h-8 text-xs leading-4 text-slate-600 dark:text-slate-300">
        {weatherInfo.label}
      </p>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {maximum}
        </span>
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {minimum}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-sky-700 dark:text-sky-300">
        <Droplets aria-hidden="true" size={14} />
        <span>{Math.round(forecast.precipitation_probability_max_percent)}%</span>
        <span className="text-slate-500 dark:text-slate-400">rain</span>
      </div>
    </article>
  )
}

export default DayCard

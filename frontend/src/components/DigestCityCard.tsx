import { CloudOff, MapPin } from 'lucide-react'
import type { DigestCityOutcome } from '../hooks'
import { useSettings } from '../context/useSettings'
import {
  convertSummaryTemperature,
  formatTemperature,
  isDaytime,
  weatherCodeToInfo,
} from '../utils'

interface DigestCityCardProps {
  outcome: DigestCityOutcome
  index: number
}

const staggerDelays = [
  'delay-0',
  'delay-75',
  'delay-150',
  'delay-200',
  'delay-300',
]

const themeStyles = {
  sunny: 'text-amber-500 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/60',
  cloudy: 'text-slate-500 bg-slate-100 dark:text-slate-300 dark:bg-slate-800',
  rainy: 'text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/60',
  snowy: 'text-cyan-600 bg-cyan-50 dark:text-cyan-300 dark:bg-cyan-950/60',
  stormy: 'text-violet-600 bg-violet-50 dark:text-violet-300 dark:bg-violet-950/60',
  night: 'text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950/60',
} as const

function DigestCityCard({ outcome, index }: DigestCityCardProps) {
  const { temperatureUnit } = useSettings()
  const animationDelay = staggerDelays[index] ?? 'delay-300'
  const baseClassName = `animate-fade-in ${animationDelay} rounded-3xl border border-white/70 bg-white/70 p-5 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65`

  if ('error' in outcome) {
    return (
      <article
        aria-label={`Weather unavailable for ${outcome.city}`}
        className={`${baseClassName} flex min-h-48 flex-col justify-between`}
        role="listitem"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-slate-700 dark:text-slate-200">
            <MapPin aria-hidden="true" className="shrink-0 text-slate-400" size={16} />
            <h3 className="truncate text-sm font-semibold">{outcome.city}</h3>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/60 dark:text-rose-300">
            <CloudOff aria-hidden="true" size={22} />
          </div>
        </div>
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">Weather unavailable</p>
          <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
            We could not load conditions for this city.
          </p>
        </div>
      </article>
    )
  }

  const { item } = outcome
  const weatherInfo = weatherCodeToInfo(
    item.current.weather_code,
    isDaytime(item.current.time),
  )
  const WeatherIcon = weatherInfo.icon

  return (
    <article
      aria-label={`Weather summary for ${item.city}`}
      className={`${baseClassName} flex min-h-48 flex-col justify-between`}
      role="listitem"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-slate-700 dark:text-slate-200">
          <MapPin aria-hidden="true" className="shrink-0 text-slate-400" size={16} />
          <h3 className="truncate text-sm font-semibold">{item.city}</h3>
        </div>
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${themeStyles[weatherInfo.theme]}`}
        >
          <WeatherIcon aria-hidden="true" size={24} strokeWidth={1.6} />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="min-w-0 text-sm leading-5 text-slate-600 dark:text-slate-300">
          {convertSummaryTemperature(item.summary, temperatureUnit)}
        </p>
        <p className="shrink-0 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
          {formatTemperature(item.current.temperature_c, temperatureUnit)}
        </p>
      </div>
    </article>
  )
}

export default DigestCityCard

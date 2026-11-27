import { lazy, Suspense, useRef, useState } from 'react'
import DayCard from './DayCard'
import DevStrip from './DevStrip'
import ErrorMessage from './ErrorMessage'
import ForecastSkeleton from './ForecastSkeleton'
import { useForecast } from '../hooks'
import { weatherCodeToInfo } from '../utils'

const TemperatureChart = lazy(() => import('./TemperatureChart'))

interface ForecastSectionProps {
  city: string
}

const dayOptions = [1, 2, 3, 4, 5, 6, 7] as const

function ForecastSection({ city }: ForecastSectionProps) {
  const [days, setDays] = useState<number>(3)
  const dayButtonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const forecastQuery = useForecast(city, days)
  const forecastResult = forecastQuery.data
  const forecast = forecastResult?.data
  const theme = weatherCodeToInfo(
    forecast?.daily[0]?.weather_code ?? null,
    true,
  ).theme

  function selectDays(nextDays: number) {
    setDays(nextDays)
    dayButtonRefs.current[nextDays - 1]?.focus()
  }

  function handleDayKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) {
    let nextDays: number | undefined

    switch (event.key) {
      case 'ArrowRight':
        nextDays = days === 7 ? 1 : days + 1
        break
      case 'ArrowLeft':
        nextDays = days === 1 ? 7 : days - 1
        break
      case 'Home':
        nextDays = 1
        break
      case 'End':
        nextDays = 7
        break
      default:
        return
    }

    event.preventDefault()
    selectDays(nextDays)
  }

  return (
    <section
      aria-labelledby="forecast-heading"
      className="w-full space-y-5 animate-fade-in"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
            Plan ahead
          </p>
          <h2
            className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white"
            id="forecast-heading"
          >
            {days}-day forecast
          </h2>
        </div>

        <div
          aria-label="Forecast length"
          className="grid grid-cols-7 rounded-2xl border border-white/70 bg-white/55 p-1 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70"
          role="radiogroup"
        >
          {dayOptions.map((option) => (
            <button
              aria-checked={days === option}
              aria-label={`${option} ${option === 1 ? 'day' : 'days'}`}
              className={`min-w-0 rounded-xl px-2 py-2 text-sm font-semibold transition focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 ${
                days === option
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
              key={option}
              onClick={() => selectDays(option)}
              onKeyDown={handleDayKeyDown}
              ref={(element) => {
                dayButtonRefs.current[option - 1] = element
              }}
              role="radio"
              tabIndex={days === option ? 0 : -1}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {forecastQuery.isPending && <ForecastSkeleton />}
      {forecastQuery.error && (
        <ErrorMessage
          error={forecastQuery.error}
          onRetry={() => {
            void forecastQuery.refetch()
          }}
        />
      )}
      {forecast && forecastResult && (
        <>
          <div
            aria-label="Daily forecast"
            aria-busy={forecastQuery.isFetching}
            aria-live="polite"
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:gap-4 lg:grid lg:grid-cols-4 lg:overflow-visible xl:grid-cols-7"
            role="list"
          >
            {forecast.daily.map((day) => (
              <DayCard forecast={day} key={day.date} />
            ))}
          </div>
          <Suspense
            fallback={
              <div
                aria-label="Loading temperature chart"
                aria-busy="true"
                className="h-64 animate-pulse rounded-3xl border border-white/70 bg-white/60 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60 sm:h-72"
                role="status"
              >
                <span className="sr-only">Loading temperature chart...</span>
              </div>
            }
          >
            <TemperatureChart forecast={forecast.daily} theme={theme} />
          </Suspense>
          <DevStrip meta={forecastResult.meta} />
        </>
      )}
    </section>
  )
}

export default ForecastSection

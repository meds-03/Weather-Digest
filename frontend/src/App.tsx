import { useState } from 'react'
import { CloudSun, Moon, Sun } from 'lucide-react'
import CurrentWeatherCard from './components/CurrentWeatherCard'
import CurrentWeatherSkeleton from './components/CurrentWeatherSkeleton'
import DevStrip from './components/DevStrip'
import DigestSection from './components/DigestSection'
import ErrorMessage from './components/ErrorMessage'
import ForecastSection from './components/ForecastSection'
import SearchBar, { type CitySelection } from './components/SearchBar'
import { useSettings } from './context/useSettings'
import useLocalStorage from './hooks/useLocalStorage'
import { useCurrent } from './hooks'
import { isDaytime, weatherCodeToInfo } from './utils'
import type { WeatherTheme } from './utils'

const weatherThemes: WeatherTheme[] = [
  'sunny',
  'cloudy',
  'rainy',
  'snowy',
  'stormy',
  'night',
]

const backgroundGradients: Record<WeatherTheme, string> = {
  sunny:
    'from-amber-100 via-orange-50 to-sky-100 dark:from-amber-950 dark:via-slate-950 dark:to-slate-900',
  cloudy:
    'from-slate-100 via-sky-50 to-slate-200 dark:from-slate-800 dark:via-slate-950 dark:to-slate-900',
  rainy:
    'from-blue-100 via-slate-100 to-cyan-100 dark:from-blue-950 dark:via-slate-950 dark:to-cyan-950',
  snowy:
    'from-cyan-50 via-white to-blue-100 dark:from-cyan-950 dark:via-slate-950 dark:to-blue-950',
  stormy:
    'from-violet-100 via-slate-100 to-indigo-200 dark:from-violet-950 dark:via-slate-950 dark:to-indigo-950',
  night:
    'from-indigo-200 via-slate-100 to-violet-200 dark:from-indigo-950 dark:via-slate-950 dark:to-violet-950',
}

function getLocationKey(location: CitySelection): string {
  return `${location.city.trim().toLowerCase()}|${location.country.trim().toLowerCase()}`
}

function App() {
  const [lastCity, setLastCity] = useLocalStorage<CitySelection | null>(
    'weather-last-city',
    null,
  )
  const [recentCities, setRecentCities] = useLocalStorage<CitySelection[]>(
    'weather-recent-cities',
    [],
  )
  const [location, setLocation] = useState<CitySelection | null>(lastCity)
  const { temperatureUnit, theme, toggleTemperatureUnit, toggleTheme } =
    useSettings()
  const currentWeather = useCurrent(location?.city ?? '')
  const weatherTheme = currentWeather.data
    ? weatherCodeToInfo(
        currentWeather.data.data.weather_code,
        isDaytime(currentWeather.data.data.time),
      ).theme
    : 'cloudy'

  function searchCity(nextLocation: CitySelection) {
    setLocation(nextLocation)
    setLastCity(nextLocation)
    setRecentCities((currentCities) =>
      [
        nextLocation,
        ...currentCities.filter(
          (recentCity) => getLocationKey(recentCity) !== getLocationKey(nextLocation),
        ),
      ].slice(0, 5),
    )
  }

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-x-clip bg-slate-50 text-slate-900 transition-colors duration-500 dark:bg-slate-950 dark:text-slate-100">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        {weatherThemes.map((weather) => (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${backgroundGradients[weather]} transition-opacity duration-1000 ease-in-out ${
              weatherTheme === weather ? 'opacity-100' : 'opacity-0'
            }`}
            key={weather}
          />
        ))}
      </div>

      <header className="border-b border-white/60 bg-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/35">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-sky-700 shadow-sm dark:bg-slate-800 dark:text-sky-300">
              <CloudSun aria-hidden="true" size={23} />
            </div>
            <span className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Weather Digest
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div
              aria-label="Temperature unit"
              className="flex items-center rounded-xl border border-white/70 bg-white/60 p-1 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70"
              role="group"
            >
              {(['C', 'F'] as const).map((unit) => (
                <button
                  aria-pressed={temperatureUnit === unit}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 ${
                    temperatureUnit === unit
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                  key={unit}
                  onClick={() => {
                    if (temperatureUnit !== unit) {
                      toggleTemperatureUnit()
                    }
                  }}
                  type="button"
                >
                  °{unit}
                </button>
              ))}
            </div>
            <button
              aria-label={
                theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
              }
              aria-pressed={theme === 'dark'}
              className="flex size-10 items-center justify-center rounded-xl border border-white/70 bg-white/60 text-slate-700 shadow-sm backdrop-blur-xl transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={toggleTheme}
              type="button"
            >
              {theme === 'dark' ? (
                <Sun aria-hidden="true" size={18} />
              ) : (
                <Moon aria-hidden="true" size={18} />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-5 py-12 sm:px-8 sm:py-20">
        <div className="mb-8 max-w-2xl text-center sm:mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">
            Weather, made simple
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            Find your forecast.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
            Search for a city to see its current conditions.
          </p>
        </div>

        <SearchBar onSearch={searchCity} />

        {recentCities.length > 0 && (
          <section
            aria-label="Recent searches"
            className="mt-4 flex w-full max-w-2xl flex-wrap items-center justify-center gap-2"
          >
            <span className="mr-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              Recent
            </span>
            {recentCities.map((recentCity) => (
              <button
                className="rounded-full border border-white/70 bg-white/55 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm backdrop-blur transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
                key={getLocationKey(recentCity)}
                onClick={() => searchCity(recentCity)}
                type="button"
              >
                {recentCity.city}
                {recentCity.country && `, ${recentCity.country}`}
              </button>
            ))}
          </section>
        )}

        {location && (
          <div className="mt-8 w-full max-w-5xl space-y-8">
            <div
              aria-busy={currentWeather.isPending}
              aria-live="polite"
              className="mx-auto w-full max-w-2xl"
            >
              {currentWeather.isPending && <CurrentWeatherSkeleton />}
              {currentWeather.error && (
                <ErrorMessage
                  error={currentWeather.error}
                  onRetry={() => {
                    void currentWeather.refetch()
                  }}
                />
              )}
              {currentWeather.data && (
                <>
                  <CurrentWeatherCard
                    city={location.city}
                    country={location.country}
                    weather={currentWeather.data.data}
                  />
                  <DevStrip meta={currentWeather.data.meta} />
                </>
              )}
            </div>
            {currentWeather.data && <ForecastSection city={location.city} />}
          </div>
        )}
        {!location && (
          <div className="mt-8 w-full max-w-2xl animate-fade-in rounded-3xl border border-white/70 bg-white/55 px-6 py-12 text-center shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/55 sm:py-16">
            <CloudSun
              aria-hidden="true"
              className="mx-auto text-sky-600 dark:text-sky-300"
              size={42}
              strokeWidth={1.5}
            />
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              Your local weather is just a search away.
            </p>
          </div>
        )}
        <div className="mt-10 w-full max-w-5xl">
          <DigestSection />
        </div>
      </main>

      <footer className="border-t border-white/60 bg-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/35">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-5 text-center text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:px-8">
          <span>Built with FastAPI, Pydantic, React and Open-Meteo</span>
          <a
            aria-label="GitHub project link placeholder"
            className="font-medium text-sky-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:text-sky-300"
            href="https://github.com/"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App

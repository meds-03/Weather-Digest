import { useState } from 'react'
import { ArrowRight, LoaderCircle, X } from 'lucide-react'
import DigestCityCard from './DigestCityCard'
import DevStrip from './DevStrip'
import ErrorMessage from './ErrorMessage'
import { useDigest } from '../hooks'

const maximumCities = 5

function DigestSection() {
  const [cities, setCities] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [notice, setNotice] = useState('')
  const [comparedCities, setComparedCities] = useState<string[]>([])
  const digestQuery = useDigest(comparedCities)
  const report = digestQuery.data
  const failedOutcomes =
    report?.outcomes.filter((outcome) => 'error' in outcome) ?? []
  const allCitiesFailed =
    report !== undefined &&
    report.outcomes.length > 0 &&
    report.data.length === 0

  function addCity() {
    const city = draft.trim()
    if (!city) {
      return
    }

    if (cities.some((existingCity) => existingCity.toLowerCase() === city.toLowerCase())) {
      setNotice('That city is already on your list.')
      return
    }

    if (cities.length >= maximumCities) {
      setNotice('You can compare up to 5 cities. Remove one to add another.')
      return
    }

    const nextCities = [...cities, city]
    setCities(nextCities)
    setComparedCities([])
    setDraft('')
    setNotice(
      nextCities.length === maximumCities
        ? 'You can compare up to 5 cities. Remove one to add another.'
        : '',
    )
  }

  function removeCity(cityToRemove: string) {
    setCities((currentCities) =>
      currentCities.filter((city) => city !== cityToRemove),
    )
    setComparedCities([])
    setNotice('')
  }

  function compareCities() {
    const sameAsPrevious =
      cities.length === comparedCities.length &&
      cities.every((city, index) => city === comparedCities[index])

    setNotice('')
    setComparedCities([...cities])
    if (sameAsPrevious) {
      void digestQuery.refetch()
    }
  }

  return (
    <section
      aria-labelledby="digest-heading"
      className="w-full space-y-6 animate-fade-in"
    >
      <div className="rounded-3xl border border-white/70 bg-white/55 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65 sm:p-7">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
            Side by side
          </p>
          <h2
            className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white"
            id="digest-heading"
          >
            City digest
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Add up to five cities to compare current conditions.
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            addCity()
          }}
        >
          <label className="sr-only" htmlFor="digest-city-input">
            Add a city to compare
          </label>
          <input
            aria-describedby="digest-city-help"
            autoComplete="off"
            className="w-full rounded-2xl border border-white/80 bg-white/80 px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-700 dark:focus:ring-sky-950"
            id="digest-city-input"
            onChange={(event) => {
              setDraft(event.currentTarget.value)
              if (notice && cities.length < maximumCities) {
                setNotice('')
              }
            }}
            placeholder={
              cities.length >= maximumCities
                ? 'Remove a city to add another'
                : 'Type a city and press Enter'
            }
            value={draft}
          />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400" id="digest-city-help">
            Press Enter to add a city. {cities.length}/{maximumCities} added.
          </p>
        </form>

        {cities.length > 0 && (
          <ul
            aria-label="Cities to compare"
            className="mt-4 flex flex-wrap gap-2"
          >
            {cities.map((city) => (
              <li key={city.toLowerCase()}>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-900 dark:border-sky-900 dark:bg-sky-950/70 dark:text-sky-100">
                  {city}
                  <button
                    aria-label={`Remove ${city}`}
                    className="rounded-full p-0.5 text-sky-700 transition hover:bg-sky-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-600 dark:text-sky-300 dark:hover:bg-sky-900 dark:focus-visible:outline-sky-300"
                    onClick={() => removeCity(city)}
                    type="button"
                  >
                    <X aria-hidden="true" size={14} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        {notice && (
          <p
            aria-live="polite"
            className="mt-3 text-sm font-medium text-amber-800 dark:text-amber-300"
            role="status"
          >
            {notice}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-sky-900/10 transition hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={cities.length === 0 || digestQuery.isFetching}
            onClick={compareCities}
            type="button"
          >
            {digestQuery.isFetching ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" size={17} />
            ) : (
              <ArrowRight aria-hidden="true" size={17} />
            )}
            {digestQuery.isFetching ? 'Comparing...' : 'Compare'}
          </button>
          {failedOutcomes.length > 0 && report && report.data.length > 0 && (
            <p             className="text-sm text-slate-600 dark:text-slate-300" role="status">
              {failedOutcomes.length} of {report.outcomes.length} cities could not
              be loaded. Their cards show the unavailable status.
            </p>
          )}
        </div>
      </div>

      {digestQuery.error && (
        <ErrorMessage
          error={digestQuery.error}
          onRetry={() => {
            void digestQuery.refetch()
          }}
        />
      )}
      {allCitiesFailed && report && (
        <ErrorMessage
          error={
            report.outcomes.find((outcome) => 'error' in outcome)?.error
          }
          onRetry={() => {
            void digestQuery.refetch()
          }}
        />
      )}
      {report && report.data.length > 0 && (
        <>
          <div
            aria-label="City weather comparisons"
            aria-busy={digestQuery.isFetching}
            aria-live="polite"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            role="list"
          >
            {report.outcomes.map((outcome, index) => (
              <DigestCityCard
                index={index}
                key={outcome.city.toLowerCase()}
                outcome={outcome}
              />
            ))}
          </div>
          <DevStrip meta={report.meta} />
        </>
      )}
    </section>
  )
}

export default DigestSection

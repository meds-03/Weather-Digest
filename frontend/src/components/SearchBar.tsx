import { useEffect, useState } from 'react'
import { LoaderCircle, MapPin, Search } from 'lucide-react'

export interface CitySelection {
  city: string
  country: string
}

interface GeocodingCity {
  id: number
  name: string
  country?: string
  admin1?: string
}

interface SearchBarProps {
  onSearch: (location: CitySelection) => void
}

function isGeocodingCity(value: unknown): value is GeocodingCity {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'number' &&
    'name' in value &&
    typeof value.name === 'string' &&
    (!('country' in value) || typeof value.country === 'string') &&
    (!('admin1' in value) || typeof value.admin1 === 'string')
  )
}

function getGeocodingResults(payload: unknown): GeocodingCity[] {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('results' in payload) ||
    !Array.isArray(payload.results)
  ) {
    return []
  }

  return payload.results.filter(isGeocodingCity)
}

function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState<GeocodingCity | null>(null)
  const [suggestions, setSuggestions] = useState<GeocodingCity[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasSuggestionError, setHasSuggestionError] = useState(false)

  useEffect(() => {
    const searchTerm = query.trim()

    if (
      searchTerm.length < 2 ||
      (selectedCity !== null && selectedCity.name === searchTerm)
    ) {
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => {
      async function loadSuggestions() {
        try {
          const params = new URLSearchParams({
            name: searchTerm,
            count: '5',
            language: 'en',
            format: 'json',
          })
          const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`,
            { signal: controller.signal },
          )

          if (!response.ok) {
            throw new Error('Geocoding request failed')
          }

          const payload: unknown = await response.json()
          setSuggestions(getGeocodingResults(payload))
          setActiveIndex(-1)
          setIsOpen(true)
        } catch {
          if (!controller.signal.aborted) {
            setSuggestions([])
            setHasSuggestionError(true)
            setIsOpen(true)
          }
        } finally {
          if (!controller.signal.aborted) {
            setIsLoading(false)
          }
        }
      }

      void loadSuggestions()
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [query, selectedCity])

  function chooseCity(city: GeocodingCity) {
    setSelectedCity(city)
    setQuery(city.name)
    setSuggestions([])
    setActiveIndex(-1)
    setIsOpen(false)
    setIsLoading(false)
    setHasSuggestionError(false)
  }

  function submitSearch() {
    const city = query.trim()
    if (!city) {
      return
    }

    const selection =
      selectedCity?.name === city
        ? selectedCity
        : suggestions.find(
            (suggestion) =>
              suggestion.name.toLocaleLowerCase() === city.toLocaleLowerCase(),
          )
    onSearch({ city, country: selection?.country ?? '' })
    setSuggestions([])
    setActiveIndex(-1)
    setIsOpen(false)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && suggestions.length > 0) {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((index) => (index + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp' && suggestions.length > 0) {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((index) =>
        index <= 0 ? suggestions.length - 1 : index - 1,
      )
    } else if (
      event.key === 'Enter' &&
      isOpen &&
      activeIndex >= 0 &&
      suggestions[activeIndex]
    ) {
      event.preventDefault()
      chooseCity(suggestions[activeIndex])
    } else if (event.key === 'Escape' && isOpen) {
      event.preventDefault()
      setIsOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <form
      className="relative mx-auto w-full max-w-2xl"
      onBlur={(event) => {
        const nextFocusedElement = event.relatedTarget
        if (
          !(nextFocusedElement instanceof Node) ||
          !event.currentTarget.contains(nextFocusedElement)
        ) {
          setIsOpen(false)
          setActiveIndex(-1)
        }
      }}
      onSubmit={(event) => {
        event.preventDefault()
        submitSearch()
      }}
    >
      <label className="sr-only" htmlFor="city-search">
        Search for a city
      </label>
      <div className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/80 p-2 shadow-lg shadow-slate-900/5 backdrop-blur-xl transition focus-within:border-sky-300 focus-within:ring-4 focus-within:ring-sky-100 dark:border-white/10 dark:bg-slate-900/80 dark:focus-within:border-sky-700 dark:focus-within:ring-sky-950">
        <Search
          aria-hidden="true"
          className="ml-3 shrink-0 text-slate-400 dark:text-slate-500"
          size={20}
        />
        <input
          id="city-search"
          aria-activedescendant={
            activeIndex >= 0 ? `city-suggestion-${activeIndex}` : undefined
          }
          aria-autocomplete="list"
          aria-controls="city-suggestions"
          aria-expanded={isOpen}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent px-1 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
          onChange={(event) => {
            const nextQuery = event.currentTarget.value
            setQuery(nextQuery)
            setSelectedCity(null)
            setActiveIndex(-1)
            setSuggestions([])
            setHasSuggestionError(false)
            setIsLoading(nextQuery.trim().length >= 2)
            setIsOpen(nextQuery.trim().length >= 2)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search any city..."
          role="combobox"
          value={query}
        />
        {isLoading && (
          <LoaderCircle
            aria-label="Loading city suggestions"
            className="mr-1 animate-spin text-sky-600 dark:text-sky-400"
            size={18}
          />
        )}
        <button
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-sky-900/10 transition hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={query.trim().length === 0}
          type="submit"
        >
          <Search aria-hidden="true" size={16} />
          <span>Search</span>
        </button>
      </div>

      {isOpen && (
        <ul
          className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/70 bg-white/95 p-2 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95"
          id="city-suggestions"
          role="listbox"
        >
          {isLoading && (
            <li className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400" role="presentation">
              Looking up cities...
            </li>
          )}
          {!isLoading && hasSuggestionError && (
            <li
              className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400"
              role="presentation"
            >
              City suggestions are temporarily unavailable.
            </li>
          )}
          {!isLoading &&
            !hasSuggestionError &&
            suggestions.length === 0 && (
              <li
                className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400"
                role="presentation"
              >
                No matching cities found.
              </li>
            )}
          {!isLoading &&
            suggestions.map((city, index) => (
              <li
                aria-selected={activeIndex === index}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                  activeIndex === index
                    ? 'bg-sky-50 text-sky-900 dark:bg-sky-950 dark:text-sky-100'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
                id={`city-suggestion-${index}`}
                key={city.id}
                onClick={() => chooseCity(city)}
                onMouseDown={(event) => event.preventDefault()}
                role="option"
              >
                <MapPin
                  aria-hidden="true"
                  className="shrink-0 text-sky-600 dark:text-sky-400"
                  size={17}
                />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{city.name}</span>
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                    {[city.admin1, city.country].filter(Boolean).join(', ')}
                  </span>
                </span>
              </li>
            ))}
        </ul>
      )}
    </form>
  )
}

export default SearchBar

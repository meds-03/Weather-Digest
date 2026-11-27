import { useQuery } from '@tanstack/react-query'
import { ApiError, getCurrent, getDigest, getForecast } from './api'
import type { ApiResult } from './api'
import type { CurrentWeather, DigestItem, ForecastResponse } from './types'

const currentStaleTime = 60_000
const forecastStaleTime = 5 * 60_000
const digestStaleTime = 60_000

export type DigestCityOutcome =
  | { city: string; item: DigestItem }
  | { city: string; error: ApiError }

export interface DigestReport extends ApiResult<DigestItem[]> {
  outcomes: DigestCityOutcome[]
}

function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && [404, 422].includes(error.status)) {
    return false
  }

  return failureCount < 2
}

async function getDigestReport(cities: string[]): Promise<DigestReport> {
  const startedAt = performance.now()

  try {
    const result = await getDigest(cities)
    const outcomes = cities.map((city, index): DigestCityOutcome => {
      const item = result.data[index]
      return item
        ? { city, item }
        : {
            city,
            error: new ApiError(
              502,
              'Incomplete digest response',
              'The server did not return a result for this city.',
            ),
          }
    })

    return {
      ...result,
      data: outcomes.flatMap((outcome) =>
        'item' in outcome ? [outcome.item] : [],
      ),
      outcomes,
    }
  } catch (cause) {
    if (!(cause instanceof ApiError)) {
      throw cause
    }

    if (cities.length === 1 || cause.status === 0) {
      return {
        data: [],
        meta: {
          status: cause.status,
          ms: performance.now() - startedAt,
          cache: null,
        },
        outcomes: cities.map((city) => ({ city, error: cause })),
      }
    }

    const individualResults = await Promise.all(
      cities.map(async (city) => {
        try {
          const result = await getDigest([city])
          const item = result.data[0]
          const outcome: DigestCityOutcome = item
            ? { city, item }
            : {
                city,
                error: new ApiError(
                  502,
                  'Incomplete digest response',
                  'The server did not return a result for this city.',
                ),
              }

          return {
            city,
            meta: result.meta,
            outcome,
          }
        } catch (individualCause) {
          if (!(individualCause instanceof ApiError)) {
            throw individualCause
          }

          const outcome: DigestCityOutcome = {
            city,
            error: individualCause,
          }
          return { city, meta: null, outcome }
        }
      }),
    )
    const outcomes = individualResults.map((result) => result.outcome)
    const data = outcomes.flatMap((outcome) =>
      'item' in outcome ? [outcome.item] : [],
    )
    const allSucceeded = outcomes.every((outcome) => 'item' in outcome)

    return {
      data,
      outcomes,
      meta: {
        status: data.length > 0 ? 200 : cause.status,
        ms: performance.now() - startedAt,
        cache:
          allSucceeded &&
          individualResults.every((result) => result.meta?.cache === 'HIT')
            ? 'HIT'
            : 'MISS',
      },
    }
  }
}

export function useCurrent(city: string) {
  return useQuery<ApiResult<CurrentWeather>, Error>({
    queryKey: ['weather', 'current', city],
    queryFn: () => getCurrent(city),
    enabled: city.trim().length > 0,
    staleTime: currentStaleTime,
    retry: shouldRetry,
  })
}

export function useForecast(city: string, days: number) {
  return useQuery<ApiResult<ForecastResponse>, Error>({
    queryKey: ['weather', 'forecast', city, days],
    queryFn: () => getForecast(city, days),
    enabled: city.trim().length > 0,
    staleTime: forecastStaleTime,
    retry: shouldRetry,
  })
}

export function useDigest(cities: string[]) {
  return useQuery<DigestReport, Error>({
    queryKey: ['weather', 'digest', cities],
    queryFn: () => getDigestReport(cities),
    enabled: cities.length > 0,
    staleTime: digestStaleTime,
    retry: shouldRetry,
  })
}

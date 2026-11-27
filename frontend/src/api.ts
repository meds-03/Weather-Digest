import type {
  ApiError as ApiErrorShape,
  CurrentWeather,
  DigestItem,
  ForecastResponse,
} from './types'

export class ApiError extends Error implements ApiErrorShape {
  readonly status: number
  readonly error: string
  readonly detail: string

  constructor(
    status: number,
    error: string,
    detail: string,
  ) {
    super(error)
    this.name = 'ApiError'
    this.status = status
    this.error = error
    this.detail = detail
  }
}

export interface ApiMeta {
  status: number
  ms: number
  cache: string | null
}

export interface ApiResult<T> {
  data: T
  meta: ApiMeta
}

function isApiErrorPayload(value: unknown): value is Pick<ApiErrorShape, 'error' | 'detail'> {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  return (
    'error' in value &&
    typeof value.error === 'string' &&
    'detail' in value &&
    typeof value.detail === 'string'
  )
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch (cause) {
    if (cause instanceof SyntaxError) {
      throw new ApiError(
        response.status,
        'Invalid response',
        'The server returned invalid JSON.',
      )
    }

    throw new ApiError(
      0,
      'Network error',
      cause instanceof Error ? cause.message : 'The response could not be read.',
    )
  }
}

async function request<T>(path: string): Promise<ApiResult<T>> {
  const startedAt = performance.now()
  let response: Response

  try {
    response = await fetch(path, {
      headers: { Accept: 'application/json' },
    })
  } catch (cause) {
    throw new ApiError(
      0,
      'Network error',
      cause instanceof Error ? cause.message : 'The API could not be reached.',
    )
  }

  const payload = await readJson(response)

  if (!response.ok) {
    if (isApiErrorPayload(payload)) {
      throw new ApiError(response.status, payload.error, payload.detail)
    }

    throw new ApiError(
      response.status,
      'Request failed',
      'The server returned an unexpected error response.',
    )
  }

  return {
    data: payload as T,
    meta: {
      status: response.status,
      ms: performance.now() - startedAt,
      cache: response.headers.get('X-Cache'),
    },
  }
}

export function getCurrent(city: string): Promise<ApiResult<CurrentWeather>> {
  const params = new URLSearchParams({ city })
  return request(`/weather/current?${params.toString()}`)
}

export function getForecast(
  city: string,
  days: number,
): Promise<ApiResult<ForecastResponse>> {
  const params = new URLSearchParams({ city, days: String(days) })
  return request(`/weather/forecast?${params.toString()}`)
}

export function getDigest(cities: string[]): Promise<ApiResult<DigestItem[]>> {
  const params = new URLSearchParams({ cities: cities.join(',') })
  return request(`/digest?${params.toString()}`)
}

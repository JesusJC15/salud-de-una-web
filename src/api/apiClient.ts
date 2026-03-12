import { authService } from '@/services/authService'
import envConfig from '@/utils/config/envConfig'

type PrimitiveQueryValue = string | number | boolean | null | undefined

export interface ApiClientRequestConfig extends Omit<RequestInit, 'body' | 'headers'> {
  data?: BodyInit | Record<string, unknown> | unknown[] | null
  endpoint?: string
  headers?: HeadersInit
  params?: Record<string, PrimitiveQueryValue>
  requiresAuth?: boolean
}

export interface ApiResponse<T> {
  config: ApiClientRequestConfig
  data: T
  headers: Headers
  status: number
  statusText: string
  url: string
}

const TRAILING_SLASHES_PATTERN = /\/+$/g
const LEADING_SLASHES_PATTERN = /^\/+/

function normalizeSegment(value: string) {
  return value.replace(LEADING_SLASHES_PATTERN, '')
}

function normalizeBaseUrl(value: string) {
  return value.replace(TRAILING_SLASHES_PATTERN, '')
}

function buildUrl(basePath: string, endpoint = '', params?: Record<string, PrimitiveQueryValue>) {
  const base = normalizeBaseUrl(envConfig.apiBaseUrl)
  const prefix = basePath ? `/${normalizeSegment(basePath)}` : ''
  const suffix = endpoint ? `/${normalizeSegment(endpoint)}` : ''
  const url = new URL(`${base}${prefix}${suffix}`)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined) {
        continue
      }

      url.searchParams.set(key, String(value))
    }
  }

  return url.toString()
}

function isJsonBody(value: unknown): value is Record<string, unknown> | unknown[] {
  return Boolean(value)
    && !(value instanceof FormData)
    && !(value instanceof Blob)
    && !(value instanceof URLSearchParams)
    && typeof value === 'object'
}

function createHeaders(headers?: HeadersInit) {
  const nextHeaders = new Headers(headers)

  if (!nextHeaders.has('Accept')) {
    nextHeaders.set('Accept', 'application/json')
  }

  return nextHeaders
}

async function readResponseData<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return await response.json() as T
  }

  return await response.text() as T
}

async function readError(response: Response, fallback: string) {
  try {
    const payload = await readResponseData<{ message?: string | string[] }>(response)
    const message = Array.isArray(payload?.message)
      ? payload.message.join(', ')
      : payload?.message

    return new Error(message || fallback)
  }
  catch {
    return new Error(fallback)
  }
}

async function resolveAccessToken(requiresAuth: boolean) {
  if (!requiresAuth) {
    return null
  }

  let accessToken = authService.getAccessToken()
  if (accessToken) {
    return accessToken
  }

  if (!authService.getRefreshToken()) {
    await authService.logout()
    throw new Error('User not authenticated')
  }

  const refreshed = await authService.refresh()
  accessToken = refreshed?.accessToken ?? null

  if (!accessToken) {
    await authService.logout()
    throw new Error('Session expired')
  }

  return accessToken
}

async function executeRequest<T>(
  basePath: string,
  endpoint: string,
  config: ApiClientRequestConfig,
  retryOnUnauthorized = true,
): Promise<ApiResponse<T>> {
  const {
    data,
    headers,
    params,
    requiresAuth = true,
    ...requestInit
  } = config

  const requestHeaders = createHeaders(headers)
  const accessToken = await resolveAccessToken(requiresAuth)

  if (accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`)
  }

  let body: BodyInit | undefined
  if (data !== undefined && data !== null) {
    if (isJsonBody(data)) {
      requestHeaders.set('Content-Type', 'application/json')
      body = JSON.stringify(data)
    }
    else {
      body = data
    }
  }

  const url = buildUrl(basePath, endpoint, params)
  const response = await fetch(url, {
    ...requestInit,
    headers: requestHeaders,
    body,
  })

  if (response.status === 401 && requiresAuth && retryOnUnauthorized) {
    const refreshed = await authService.refresh()

    if (!refreshed?.accessToken) {
      await authService.logout()
      throw new Error('Session expired')
    }

    return executeRequest<T>(basePath, endpoint, config, false)
  }

  if (!response.ok) {
    throw await readError(response, `Request failed with status ${response.status}`)
  }

  return {
    config,
    data: await readResponseData<T>(response),
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
    url,
  }
}

export function apiClient(url = '') {
  return {
    request: async <T = unknown>(config: ApiClientRequestConfig): Promise<ApiResponse<T>> => {
      return executeRequest<T>(url, config.endpoint ?? '', config)
    },

    get: async <T = unknown>(
      endpoint: string,
      configOrAuth?: ApiClientRequestConfig | boolean,
      auth = true,
    ): Promise<ApiResponse<T>> => {
      const config = typeof configOrAuth === 'boolean' || !configOrAuth ? {} : configOrAuth
      const requiresAuth = typeof configOrAuth === 'boolean' ? configOrAuth : auth

      return executeRequest<T>(url, endpoint, {
        ...config,
        method: 'GET',
        requiresAuth,
      })
    },

    post: async <T = unknown>(
      endpoint: string,
      data?: ApiClientRequestConfig['data'],
      configOrAuth: ApiClientRequestConfig | boolean = true,
    ): Promise<ApiResponse<T>> => {
      const config = typeof configOrAuth === 'boolean' ? {} : configOrAuth
      const requiresAuth = typeof configOrAuth === 'boolean' ? configOrAuth : true

      return executeRequest<T>(url, endpoint, {
        ...config,
        method: 'POST',
        data,
        requiresAuth,
      })
    },

    put: async <T = unknown>(
      endpoint: string,
      data?: ApiClientRequestConfig['data'],
      configOrAuth: ApiClientRequestConfig | boolean = true,
    ): Promise<ApiResponse<T>> => {
      const config = typeof configOrAuth === 'boolean' ? {} : configOrAuth
      const requiresAuth = typeof configOrAuth === 'boolean' ? configOrAuth : true

      return executeRequest<T>(url, endpoint, {
        ...config,
        method: 'PUT',
        data,
        requiresAuth,
      })
    },

    patch: async <T = unknown>(
      endpoint: string,
      data?: ApiClientRequestConfig['data'],
      configOrAuth: ApiClientRequestConfig | boolean = true,
    ): Promise<ApiResponse<T>> => {
      const config = typeof configOrAuth === 'boolean' ? {} : configOrAuth
      const requiresAuth = typeof configOrAuth === 'boolean' ? configOrAuth : true

      return executeRequest<T>(url, endpoint, {
        ...config,
        method: 'PATCH',
        data,
        requiresAuth,
      })
    },

    delete: async <T = unknown>(
      endpoint: string,
      configOrAuth: ApiClientRequestConfig | boolean = true,
    ): Promise<ApiResponse<T>> => {
      const config = typeof configOrAuth === 'boolean' ? {} : configOrAuth
      const requiresAuth = typeof configOrAuth === 'boolean' ? configOrAuth : true

      return executeRequest<T>(url, endpoint, {
        ...config,
        method: 'DELETE',
        requiresAuth,
      })
    },
  }
}

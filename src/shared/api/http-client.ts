import { env } from "@/config/env"
import { authStorage } from "@/features/auth/auth-storage"
import type { ApiErrorPayload, RefreshSessionResponse, Session } from "@/shared/api/types"

type RequestOptions = {
  method?: string
  body?: unknown
  headers?: HeadersInit
  signal?: AbortSignal
  skipAuth?: boolean
  retryOnAuthError?: boolean
}

let refreshPromise: Promise<RefreshSessionResponse> | null = null
let unauthorizedHandler: (() => void) | null = null

const buildUrl = (path: string) =>
  path.startsWith("http") ? path : `${env.apiBaseUrl}${path}`

const isJsonResponse = (response: Response) =>
  response.headers.get("content-type")?.includes("application/json") ?? false

const parseBody = async (response: Response) => {
  if (response.status === 204) {
    return null
  }

  if (isJsonResponse(response)) {
    return response.json()
  }

  const text = await response.text()
  return text.length > 0 ? text : null
}

export class ApiError extends Error {
  status: number
  payload: ApiErrorPayload | null

  constructor(status: number, payload: ApiErrorPayload | null) {
    super(payload?.message || "Falha ao consumir a API.")
    this.name = "ApiError"
    this.status = status
    this.payload = payload
  }
}

const refreshSession = async (): Promise<RefreshSessionResponse> => {
  if (refreshPromise) {
    return refreshPromise
  }

  const session = authStorage.get()

  if (!session?.refreshToken) {
    throw new ApiError(401, {
      message: "Sessão expirada.",
      code: "SESSION_EXPIRED",
    })
  }

  refreshPromise = fetch(buildUrl("/auth/refresh"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  })
    .then(async (response) => {
      const payload = await parseBody(response)

      if (!response.ok) {
        throw new ApiError(response.status, (payload ?? null) as ApiErrorPayload | null)
      }

      if (
        !payload ||
        typeof payload !== "object" ||
        !("accessToken" in payload) ||
        !("refreshToken" in payload)
      ) {
        throw new ApiError(500, {
          message: "Resposta inválida ao renovar a sessão.",
          code: "INVALID_REFRESH_RESPONSE",
        })
      }

      const refreshPayload = payload as RefreshSessionResponse

      const nextSession: Session = {
        accessToken: refreshPayload.accessToken,
        refreshToken: refreshPayload.refreshToken,
        user: session.user,
      }

      authStorage.set(nextSession)
      return refreshPayload
    })
    .catch((error) => {
      authStorage.clear()
      unauthorizedHandler?.()
      throw error
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  unauthorizedHandler = handler
}

export const apiClient = {
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const session = authStorage.get()
    const headers = new Headers(options.headers)

    if (!headers.has("Content-Type") && options.body !== undefined) {
      headers.set("Content-Type", "application/json")
    }

    if (!options.skipAuth && session?.accessToken) {
      headers.set("Authorization", `Bearer ${session.accessToken}`)
    }

    const response = await fetch(buildUrl(path), {
      method: options.method || "GET",
      headers,
      body:
        options.body === undefined ||
        options.body === null ||
        options.body instanceof FormData
          ? (options.body as BodyInit | null | undefined)
          : JSON.stringify(options.body),
      signal: options.signal,
    })

    if (
      response.status === 401 &&
      !options.skipAuth &&
      options.retryOnAuthError !== false &&
      !path.startsWith("/auth/refresh")
    ) {
      await refreshSession()
      return this.request<T>(path, {
        ...options,
        retryOnAuthError: false,
      })
    }

    const payload = (await parseBody(response)) as T | ApiErrorPayload | null

    if (!response.ok) {
      throw new ApiError(response.status, (payload ?? null) as ApiErrorPayload | null)
    }

    return payload as T
  },

  get<T>(path: string, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T>(path, options)
  },

  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body,
    })
  },

  patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T>(path, {
      ...options,
      method: "PATCH",
      body,
    })
  },

  delete(path: string, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<void>(path, {
      ...options,
      method: "DELETE",
    })
  },
}

import { apiClient } from "@/shared/api/http-client"
import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  RefreshSessionRequest,
  RefreshSessionResponse,
} from "@/shared/api/types"

export const authService = {
  login(payload: LoginRequest) {
    return apiClient.post<LoginResponse>("/auth/login", payload, {
      skipAuth: true,
    })
  },

  refresh(payload: RefreshSessionRequest) {
    return apiClient.post<RefreshSessionResponse>("/auth/refresh", payload, {
      skipAuth: true,
      retryOnAuthError: false,
    })
  },

  me() {
    return apiClient.get<AuthUser>("/auth/me")
  },
}

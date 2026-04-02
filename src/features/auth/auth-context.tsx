import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { authService } from "@/features/auth/auth-service"
import { authStorage } from "@/features/auth/auth-storage"
import { setUnauthorizedHandler } from "@/shared/api/http-client"
import type { AuthUser, LoginRequest, Session } from "@/shared/api/types"

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

type AuthContextValue = {
  status: AuthStatus
  user: AuthUser | null
  session: Session | null
  login: (payload: LoginRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>("loading")
  const [session, setSession] = useState<Session | null>(() => authStorage.get())

  const logout = useCallback(() => {
    authStorage.clear()
    setSession(null)
    setStatus("unauthenticated")
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)

    return () => {
      setUnauthorizedHandler(null)
    }
  }, [logout])

  useEffect(() => {
    let active = true

    const restoreSession = async () => {
      const currentSession = authStorage.get()

      if (!currentSession) {
        if (active) {
          setSession(null)
          setStatus("unauthenticated")
        }
        return
      }

      try {
        const user = await authService.me()
        const nextSession = {
          ...currentSession,
          user,
        }

        authStorage.set(nextSession)

        if (active) {
          setSession(nextSession)
          setStatus("authenticated")
        }
      } catch {
        if (active) {
          logout()
        }
      }
    }

    void restoreSession()

    return () => {
      active = false
    }
  }, [logout])

  const login = useCallback(async (payload: LoginRequest) => {
    const nextSession = await authService.login(payload)
    authStorage.set(nextSession)
    setSession(nextSession)
    setStatus("authenticated")
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: session?.user ?? null,
      session,
      login,
      logout,
    }),
    [login, logout, session, status]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.")
  }

  return context
}

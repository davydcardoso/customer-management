import type { Session } from "@/shared/api/types"

const STORAGE_KEY = "zr.auth.session"

export const authStorage = {
  get() {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return null
    }

    try {
      return JSON.parse(raw) as Session
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
  },

  set(session: Session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY)
  },
}

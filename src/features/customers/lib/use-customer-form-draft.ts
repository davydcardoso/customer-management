import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { UseFormReturn } from "react-hook-form"

import type { CustomerFormValues } from "@/features/customers/types/customer-form-types"

const DRAFT_STORAGE_PREFIX = "zr:customer-form-draft"
const DRAFT_VERSION = 1
const DRAFT_TTL_MS = 1000 * 60 * 60 * 24 * 7
const SAVE_DEBOUNCE_MS = 300

type CustomerFormDraft = {
  version: number
  updatedAt: string
  activeTab: string
  values: CustomerFormValues
}

type UseCustomerFormDraftArgs = {
  form: UseFormReturn<CustomerFormValues>
  mode: "create" | "edit"
  customerId?: string
  activeTab: string
  setActiveTab: (value: string) => void
}

const buildDraftKey = (mode: "create" | "edit", customerId?: string) =>
  `${DRAFT_STORAGE_PREFIX}:${mode}:${customerId ?? "new"}`

const readDraft = (storageKey: string): CustomerFormDraft | null => {
  const rawValue = localStorage.getItem(storageKey)

  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue) as CustomerFormDraft
    const draftTimestamp = new Date(parsed.updatedAt).getTime()

    if (
      parsed.version !== DRAFT_VERSION ||
      Number.isNaN(draftTimestamp) ||
      Date.now() - draftTimestamp > DRAFT_TTL_MS
    ) {
      localStorage.removeItem(storageKey)
      return null
    }

    return parsed
  } catch {
    localStorage.removeItem(storageKey)
    return null
  }
}

export const useCustomerFormDraft = ({
  form,
  mode,
  customerId,
  activeTab,
  setActiveTab,
}: UseCustomerFormDraftArgs) => {
  const storageKey = useMemo(
    () => buildDraftKey(mode, customerId),
    [customerId, mode]
  )
  const [availableDraft, setAvailableDraft] = useState<CustomerFormDraft | null>(
    null
  )
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const isHydratingRef = useRef(true)
  const saveTimeoutRef = useRef<number | null>(null)

  const clearPendingSave = useCallback(() => {
    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
  }, [])

  const persistDraft = useCallback(
    (values: CustomerFormValues) => {
      const draft: CustomerFormDraft = {
        version: DRAFT_VERSION,
        updatedAt: new Date().toISOString(),
        activeTab,
        values,
      }

      localStorage.setItem(storageKey, JSON.stringify(draft))
      setLastSavedAt(draft.updatedAt)
    },
    [activeTab, storageKey]
  )

  const clearDraft = useCallback(() => {
    clearPendingSave()
    localStorage.removeItem(storageKey)
    setAvailableDraft(null)
    setLastSavedAt(null)
  }, [clearPendingSave, storageKey])

  const syncDraftAvailability = useCallback(() => {
    isHydratingRef.current = true
    clearPendingSave()

    const draft = readDraft(storageKey)
    setAvailableDraft(draft)
    setLastSavedAt(draft?.updatedAt ?? null)

    window.setTimeout(() => {
      isHydratingRef.current = false
    }, 0)
  }, [clearPendingSave, storageKey])

  const discardDraft = useCallback(() => {
    clearDraft()
  }, [clearDraft])

  const restoreDraft = useCallback(() => {
    const draft = readDraft(storageKey)

    if (!draft) {
      setAvailableDraft(null)
      return false
    }

    isHydratingRef.current = true
    clearPendingSave()

    form.reset({
      ...draft.values,
      computed: form.getValues("computed"),
    })

    setActiveTab(
      draft.activeTab === "responsibles" &&
        draft.values.personType === "COMPANY"
        ? "responsibles"
        : "main"
    )
    setAvailableDraft(null)
    setLastSavedAt(draft.updatedAt)

    window.setTimeout(() => {
      isHydratingRef.current = false
    }, 0)

    return true
  }, [clearPendingSave, form, setActiveTab, storageKey])

  useEffect(() => {
    const subscription = form.watch((values) => {
      if (isHydratingRef.current) {
        return
      }

      clearPendingSave()
      saveTimeoutRef.current = window.setTimeout(() => {
        persistDraft(values as CustomerFormValues)
      }, SAVE_DEBOUNCE_MS)
    })

    return () => {
      clearPendingSave()
      subscription.unsubscribe()
    }
  }, [clearPendingSave, form, persistDraft])

  useEffect(() => {
    const flushDraft = () => {
      if (isHydratingRef.current) {
        return
      }

      clearPendingSave()
      persistDraft(form.getValues())
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushDraft()
      }
    }

    window.addEventListener("pagehide", flushDraft)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("pagehide", flushDraft)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [clearPendingSave, form, persistDraft])

  return {
    availableDraft,
    clearDraft,
    discardDraft,
    lastSavedAt,
    restoreDraft,
    syncDraftAvailability,
  }
}

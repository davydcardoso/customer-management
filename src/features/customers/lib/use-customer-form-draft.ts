import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { UseFormReturn } from "react-hook-form"

import {
  createCommunicationPreferences,
  createDefaultValues,
  createEmptyContact,
  createEmptyEmail,
  createEmptyResponsible,
} from "@/features/customers/lib/customer-form-helpers"
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

const LEGACY_CORE_KEYS = [
  "active",
  "customerSince",
  "classification",
  "referralSource",
  "referralName",
  "allowsInvoice",
  "hasRestriction",
  "isFinalConsumer",
  "isRuralProducer",
  "notes",
] as const

const LEGACY_PROFILE_KEYS = [
  "cpf",
  "rg",
  "fullName",
  "nickname",
  "birthDate",
  "gender",
  "familyRelationship",
  "profession",
  "driverLicenseExpiresAt",
  "cnpj",
  "stateRegistration",
  "corporateName",
  "tradeName",
  "municipalRegistration",
  "suframaRegistration",
  "taxpayerType",
  "openingDate",
  "companySegment",
  "issWithheld",
] as const

const LEGACY_FINANCIAL_KEYS = [
  "creditLimit",
  "amountSpent",
  "balance",
  "consumedAmount",
  "costAmount",
  "commissionPercentage",
  "paymentDay",
  "pixKeyOrDescription",
] as const

const LEGACY_ADDRESS_KEYS = [
  "zipCode",
  "street",
  "number",
  "complement",
  "district",
  "city",
  "state",
  "cityCode",
  "stateCode",
  "reference",
] as const

const coerceLegacyDraftValues = (values?: Partial<CustomerFormValues>) => {
  if (!values) {
    return values
  }

  const draftValues = values as Partial<CustomerFormValues> &
    Record<string, unknown>

  return {
    ...draftValues,
    core: {
      ...(draftValues.core ?? {}),
      ...Object.fromEntries(
        LEGACY_CORE_KEYS.flatMap((key) =>
          key in draftValues ? [[key, draftValues[key]]] : []
        )
      ),
    },
    profile: {
      ...(draftValues.profile ?? {}),
      ...Object.fromEntries(
        LEGACY_PROFILE_KEYS.flatMap((key) =>
          key in draftValues ? [[key, draftValues[key]]] : []
        )
      ),
    },
    financial: {
      ...(draftValues.financial ?? {}),
      ...Object.fromEntries(
        LEGACY_FINANCIAL_KEYS.flatMap((key) =>
          key in draftValues ? [[key, draftValues[key]]] : []
        )
      ),
    },
    address: {
      ...(draftValues.address ?? {}),
      ...Object.fromEntries(
        LEGACY_ADDRESS_KEYS.flatMap((key) =>
          key in draftValues ? [[key, draftValues[key]]] : []
        )
      ),
    },
  }
}

const hydrateDraftValues = (
  values?: Partial<CustomerFormValues>
): CustomerFormValues => {
  const defaults = createDefaultValues()
  const normalizedValues = coerceLegacyDraftValues(values)

  return {
    ...defaults,
    ...normalizedValues,
    core: {
      ...defaults.core,
      ...(normalizedValues?.core ?? {}),
    },
    profile: {
      ...defaults.profile,
      ...(normalizedValues?.profile ?? {}),
    },
    financial: {
      ...defaults.financial,
      ...(normalizedValues?.financial ?? {}),
    },
    address: {
      ...defaults.address,
      ...(normalizedValues?.address ?? {}),
    },
    contacts: normalizedValues?.contacts?.length
      ? normalizedValues.contacts.map((contact) => ({
          ...createEmptyContact(),
          ...contact,
        }))
      : defaults.contacts,
    emails: normalizedValues?.emails?.length
      ? normalizedValues.emails.map((email) => ({
          ...createEmptyEmail(),
          ...email,
        }))
      : defaults.emails,
    communicationPreferences: normalizedValues?.communicationPreferences?.length
      ? createCommunicationPreferences().map((preference) => {
          const existingPreference =
            normalizedValues.communicationPreferences?.find(
              (item) =>
                item.channel === preference.channel &&
                item.topic === preference.topic
            )

          return existingPreference
            ? {
                ...preference,
                ...existingPreference,
              }
            : preference
        })
      : defaults.communicationPreferences,
    responsibles: normalizedValues?.responsibles?.length
      ? normalizedValues.responsibles.map((responsible) => ({
          ...createEmptyResponsible(),
          ...responsible,
          address: {
            ...createEmptyResponsible().address,
            ...(responsible.address ?? {}),
          },
          contacts: responsible.contacts?.length
            ? responsible.contacts.map((contact) => ({
                ...createEmptyContact(),
                ...contact,
              }))
            : [createEmptyContact()],
          emails: responsible.emails?.length
            ? responsible.emails.map((email) => ({
                ...createEmptyEmail(),
                ...email,
              }))
            : [createEmptyEmail()],
        }))
      : defaults.responsibles,
    computed: {
      ...defaults.computed,
      ...(normalizedValues?.computed ?? {}),
    },
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
  const [availableDraft, setAvailableDraft] =
    useState<CustomerFormDraft | null>(null)
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
        values: hydrateDraftValues(values),
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
    const draft = availableDraft ?? readDraft(storageKey)

    if (!draft) {
      setAvailableDraft(null)
      return false
    }

    isHydratingRef.current = true
    clearPendingSave()

    form.reset({
      ...hydrateDraftValues(draft.values),
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
  }, [availableDraft, clearPendingSave, form, setActiveTab, storageKey])

  useEffect(() => {
    const subscription = form.watch(() => {
      if (isHydratingRef.current || availableDraft) {
        return
      }

      clearPendingSave()
      saveTimeoutRef.current = window.setTimeout(() => {
        persistDraft(form.getValues())
      }, SAVE_DEBOUNCE_MS)
    })

    return () => {
      clearPendingSave()
      subscription.unsubscribe()
    }
  }, [availableDraft, clearPendingSave, form, persistDraft])

  useEffect(() => {
    const flushDraft = () => {
      if (isHydratingRef.current || availableDraft) {
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
  }, [availableDraft, clearPendingSave, form, persistDraft])

  return {
    availableDraft,
    clearDraft,
    discardDraft,
    lastSavedAt,
    restoreDraft,
    syncDraftAvailability,
  }
}

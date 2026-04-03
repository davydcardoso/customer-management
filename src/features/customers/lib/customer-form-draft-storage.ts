export type CustomerFormDraftMode = "create" | "edit"

const DRAFT_STORAGE_PREFIX = "zr:customer-form-draft"

export const buildCustomerFormDraftKey = (
  mode: CustomerFormDraftMode,
  customerId?: string
) => `${DRAFT_STORAGE_PREFIX}:${mode}:${customerId ?? "new"}`

export const clearCustomerFormDraft = (
  mode: CustomerFormDraftMode,
  customerId?: string
) => {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(buildCustomerFormDraftKey(mode, customerId))
}

export const clearCustomerFormDrafts = ({
  preserveMode,
  preserveCustomerId,
}: {
  preserveMode?: CustomerFormDraftMode
  preserveCustomerId?: string
} = {}) => {
  if (typeof window === "undefined") {
    return
  }

  const preservedKey =
    preserveMode !== undefined
      ? buildCustomerFormDraftKey(preserveMode, preserveCustomerId)
      : null

  const keysToRemove: string[] = []

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index)

    if (
      key?.startsWith(DRAFT_STORAGE_PREFIX) &&
      (!preservedKey || key !== preservedKey)
    ) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach((key) => window.localStorage.removeItem(key))
}

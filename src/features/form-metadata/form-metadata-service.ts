import { apiClient } from "@/shared/api/http-client"
import type { FormMetadataResponse, PersonType } from "@/shared/api/types"

const withQuery = (path: string, params?: Record<string, string | undefined>) => {
  const url = new URL(path, "http://placeholder.local")

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value)
    }
  })

  return `${url.pathname}${url.search}`
}

export const formMetadataService = {
  getCustomerFields(personType?: PersonType) {
    return apiClient.get<FormMetadataResponse>(
      withQuery("/form-metadata/customers/fields", { personType })
    )
  },

  getResponsibles() {
    return apiClient.get<FormMetadataResponse>("/form-metadata/responsibles")
  },
}

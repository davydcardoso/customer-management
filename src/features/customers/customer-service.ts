import { apiClient } from "@/shared/api/http-client"
import type {
  CustomerCreateInput,
  CustomerResponse,
  CustomerSearchResult,
  CustomerUpdateInput,
  PaginatedCustomersResponse,
} from "@/shared/api/types"

const withQuery = (path: string, params: Record<string, string | number | undefined>) => {
  const url = new URL(path, "http://placeholder.local")

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value))
    }
  })

  return `${url.pathname}${url.search}`
}

export const customerService = {
  list(page: number, limit: number) {
    return apiClient.get<PaginatedCustomersResponse>(
      withQuery("/customers", { page, limit })
    )
  },

  search(query: string, limit = 8) {
    return apiClient.get<CustomerSearchResult[]>(
      withQuery("/customers/search", { query, limit })
    )
  },

  getById(customerId: string) {
    return apiClient.get<CustomerResponse>(`/customers/${customerId}`)
  },

  create(payload: CustomerCreateInput) {
    return apiClient.post<CustomerResponse>("/customers", payload)
  },

  update(customerId: string, payload: CustomerUpdateInput) {
    return apiClient.patch<CustomerResponse>(`/customers/${customerId}`, payload)
  },

  remove(customerId: string) {
    return apiClient.delete(`/customers/${customerId}`)
  },
}

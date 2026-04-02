import { apiClient } from "@/shared/api/http-client"
import type { ResponsibleInput, ResponsibleResponse } from "@/shared/api/types"

export const responsibleService = {
  list(customerId: string) {
    return apiClient.get<ResponsibleResponse[]>(
      `/customers/${customerId}/responsibles`
    )
  },

  getById(customerId: string, responsibleId: string) {
    return apiClient.get<ResponsibleResponse>(
      `/customers/${customerId}/responsibles/${responsibleId}`
    )
  },

  create(customerId: string, payload: ResponsibleInput) {
    return apiClient.post<ResponsibleResponse>(
      `/customers/${customerId}/responsibles`,
      payload
    )
  },

  update(customerId: string, responsibleId: string, payload: Partial<ResponsibleInput>) {
    return apiClient.patch<ResponsibleResponse>(
      `/customers/${customerId}/responsibles/${responsibleId}`,
      payload
    )
  },

  remove(customerId: string, responsibleId: string) {
    return apiClient.delete(
      `/customers/${customerId}/responsibles/${responsibleId}`
    )
  },
}

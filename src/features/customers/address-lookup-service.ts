import { apiClient, ApiError } from "@/shared/api/http-client"
import { digitsOnly } from "@/shared/lib/masks"

type ViaCepResponse = {
  cep?: string
  logradouro?: string
  complemento?: string
  bairro?: string
  localidade?: string
  uf?: string
  ibge?: string
  erro?: boolean
}

export type AddressLookupResult = {
  zipCode: string
  street: string
  complement: string
  district: string
  city: string
  state: string
  cityCode: string
}

export const addressLookupService = {
  async findByZipCode(value: string): Promise<AddressLookupResult> {
    const zipCode = digitsOnly(value)

    if (zipCode.length !== 8) {
      throw new Error("Informe um CEP com 8 dígitos.")
    }

    const response = await apiClient.get<ViaCepResponse>(
      `https://viacep.com.br/ws/${zipCode}/json/`,
      {
        skipAuth: true,
        retryOnAuthError: false,
      }
    )

    if (response.erro) {
      throw new ApiError(404, {
        message: "CEP não encontrado.",
        code: "ZIP_CODE_NOT_FOUND",
      })
    }

    return {
      zipCode: response.cep ?? value,
      street: response.logradouro ?? "",
      complement: response.complemento ?? "",
      district: response.bairro ?? "",
      city: response.localidade ?? "",
      state: response.uf ?? "",
      cityCode: response.ibge ?? "",
    }
  },
}

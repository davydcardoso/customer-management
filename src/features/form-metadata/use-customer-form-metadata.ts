import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { formMetadataService } from "@/features/form-metadata/form-metadata-service"
import type {
  FormMetadataResponse,
  PersonType,
  UpdateFormFieldConfigInput,
} from "@/shared/api/types"

const CUSTOMER_FORM_METADATA_QUERY_KEY = "customer-form-metadata"

export const useCustomerFormMetadata = (personType?: PersonType) => {
  const queryClient = useQueryClient()

  const metadataQuery = useQuery({
    queryKey: [CUSTOMER_FORM_METADATA_QUERY_KEY, personType ?? "ALL"],
    queryFn: () => formMetadataService.getCustomerFields(personType),
  })

  const updateFieldMutation = useMutation({
    mutationFn: ({
      fieldKey,
      input,
    }: {
      fieldKey: string
      input: UpdateFormFieldConfigInput
    }) => formMetadataService.updateCustomerField(fieldKey, input),
    onSuccess: (response: FormMetadataResponse) => {
      queryClient.setQueryData(
        [CUSTOMER_FORM_METADATA_QUERY_KEY, response.scope?.personType ?? "ALL"],
        response
      )
      void queryClient.invalidateQueries({
        queryKey: [CUSTOMER_FORM_METADATA_QUERY_KEY],
      })
    },
  })

  return {
    metadataQuery,
    updateFieldMutation,
  }
}

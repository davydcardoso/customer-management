import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import type {
  CommunicationChannel,
  CommunicationTopic,
  CustomerResponse,
  PersonType,
} from "@/shared/api/types"

export const formatDate = (value?: string | null) => {
  if (!value) {
    return "—"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return format(date, "dd/MM/yyyy", { locale: ptBR })
}

export const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—"
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export const formatPercent = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—"
  }

  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value)}%`
}

export const getPersonTypeLabel = (value: PersonType) =>
  value === "INDIVIDUAL" ? "Pessoa Física" : "Pessoa Jurídica"

export const getCustomerDisplayName = (customer: CustomerResponse) => {
  if (customer.personType === "INDIVIDUAL") {
    return (customer.profile.fullName as string | undefined) || "Cliente PF"
  }

  return (
    (customer.profile.tradeName as string | undefined) ||
    (customer.profile.corporateName as string | undefined) ||
    "Cliente PJ"
  )
}

export const getCustomerDocument = (customer: CustomerResponse) => {
  if (customer.personType === "INDIVIDUAL") {
    return (customer.profile.cpf as string | undefined) || "—"
  }

  return (customer.profile.cnpj as string | undefined) || "—"
}

export const getCommunicationTopicLabel = (topic: CommunicationTopic) =>
  (
    {
      KM_UPDATE: "Atualizar km",
      CHARGING: "Cobrança",
      MAINTENANCE_ALERT: "Aviso de manutenção",
      CAMPAIGNS: "Campanhas",
      NPS: "NPS",
      INVOICE: "Notas fiscais",
      NEXT_REVISIONS: "Próximas revisões",
      SERVICE_ORDER_COMPLETED: "OS finalizada",
      BUDGET_APPROVAL: "Orçamento",
      BIRTHDAY: "Aniversário",
    } satisfies Record<CommunicationTopic, string>
  )[topic]

export const getCommunicationChannelLabel = (channel: CommunicationChannel) =>
  channel === "PHONE" ? "Telefone" : "E-mail"

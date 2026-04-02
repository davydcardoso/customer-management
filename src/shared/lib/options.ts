import type {
  CommunicationChannel,
  CommunicationTopic,
  ContactType,
  PersonType,
} from "@/shared/api/types"

export type SelectOption<T extends string = string> = {
  value: T
  label: string
}

export const PERSON_TYPE_OPTIONS: SelectOption<PersonType>[] = [
  { value: "INDIVIDUAL", label: "Pessoa Física" },
  { value: "COMPANY", label: "Pessoa Jurídica" },
]

export const GENDER_OPTIONS: SelectOption[] = [
  { value: "MASCULINO", label: "Masculino" },
  { value: "FEMININO", label: "Feminino" },
  { value: "OUTRO", label: "Outro" },
]

export const FAMILY_RELATIONSHIP_OPTIONS: SelectOption[] = [
  { value: "PAI", label: "Pai" },
  { value: "MAE", label: "Mãe" },
  { value: "FILHO", label: "Filho(a)" },
  { value: "SOCIO", label: "Sócio" },
  { value: "CONJUGE", label: "Cônjuge" },
  { value: "OUTRO", label: "Outro" },
]

export const TAXPAYER_TYPE_OPTIONS: SelectOption[] = [
  { value: "ICMS_CONTRIBUINTE", label: "Contribuinte de ICMS" },
  { value: "ICMS_ISENTO", label: "Contribuinte isento" },
  { value: "NAO_CONTRIBUINTE", label: "Não contribuinte" },
]

export const CONTACT_TYPE_OPTIONS: SelectOption<ContactType>[] = [
  { value: "PHONE", label: "Telefone" },
  { value: "MOBILE", label: "Celular" },
  { value: "MESSAGING", label: "Mensagens" },
]

export const COMMUNICATION_CHANNEL_OPTIONS: SelectOption<CommunicationChannel>[] =
  [
    { value: "PHONE", label: "Telefone" },
    { value: "EMAIL", label: "E-mail" },
  ]

export const COMMUNICATION_TOPIC_OPTIONS: SelectOption<CommunicationTopic>[] = [
  { value: "KM_UPDATE", label: "Atualizar km" },
  { value: "CHARGING", label: "Cobrança" },
  { value: "MAINTENANCE_ALERT", label: "Aviso de manutenção" },
  { value: "CAMPAIGNS", label: "Campanhas" },
  { value: "NPS", label: "NPS (pós-venda)" },
  { value: "INVOICE", label: "Notas fiscais" },
  { value: "NEXT_REVISIONS", label: "Próximas revisões" },
  { value: "SERVICE_ORDER_COMPLETED", label: "OS finalizada" },
  { value: "BUDGET_APPROVAL", label: "Orçamento p/ aprovação" },
  { value: "BIRTHDAY", label: "Aniversário" },
]

export const STATE_OPTIONS: SelectOption[] = [
  { value: "Acre", label: "Acre" },
  { value: "Alagoas", label: "Alagoas" },
  { value: "Amapá", label: "Amapá" },
  { value: "Amazonas", label: "Amazonas" },
  { value: "Bahia", label: "Bahia" },
  { value: "Ceará", label: "Ceará" },
  { value: "Distrito Federal", label: "Distrito Federal" },
  { value: "Espírito Santo", label: "Espírito Santo" },
  { value: "Goiás", label: "Goiás" },
  { value: "Maranhão", label: "Maranhão" },
  { value: "Mato Grosso", label: "Mato Grosso" },
  { value: "Mato Grosso do Sul", label: "Mato Grosso do Sul" },
  { value: "Minas Gerais", label: "Minas Gerais" },
  { value: "Pará", label: "Pará" },
  { value: "Paraíba", label: "Paraíba" },
  { value: "Paraná", label: "Paraná" },
  { value: "Pernambuco", label: "Pernambuco" },
  { value: "Piauí", label: "Piauí" },
  { value: "Rio de Janeiro", label: "Rio de Janeiro" },
  { value: "Rio Grande do Norte", label: "Rio Grande do Norte" },
  { value: "Rio Grande do Sul", label: "Rio Grande do Sul" },
  { value: "Rondônia", label: "Rondônia" },
  { value: "Roraima", label: "Roraima" },
  { value: "Santa Catarina", label: "Santa Catarina" },
  { value: "São Paulo", label: "São Paulo" },
  { value: "Sergipe", label: "Sergipe" },
  { value: "Tocantins", label: "Tocantins" },
]

export const CITY_OPTIONS: SelectOption[] = [
  { value: "São Paulo", label: "São Paulo" },
  { value: "Campinas", label: "Campinas" },
  { value: "Santos", label: "Santos" },
  { value: "Rio de Janeiro", label: "Rio de Janeiro" },
  { value: "Niterói", label: "Niterói" },
  { value: "Belo Horizonte", label: "Belo Horizonte" },
  { value: "Curitiba", label: "Curitiba" },
  { value: "Porto Alegre", label: "Porto Alegre" },
  { value: "Salvador", label: "Salvador" },
  { value: "Recife", label: "Recife" },
  { value: "Fortaleza", label: "Fortaleza" },
  { value: "Brasília", label: "Brasília" },
]

export const getStaticOptions = (source?: string | null): SelectOption[] => {
  switch (source) {
    case "static:person-types":
      return PERSON_TYPE_OPTIONS
    case "static:genders":
      return GENDER_OPTIONS
    case "static:family-relationships":
      return FAMILY_RELATIONSHIP_OPTIONS
    case "static:taxpayer-types":
      return TAXPAYER_TYPE_OPTIONS
    default:
      return []
  }
}

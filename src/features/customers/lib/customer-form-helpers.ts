import type {
  AddressInput,
  ContactInput,
  CustomerCreateInput,
  CustomerResponse,
  CustomerUpdateInput,
  FieldConfig,
  FormMetadataResponse,
  GroupedFieldSection,
  ResponsibleInput,
} from "@/shared/api/types"
import { digitsOnly } from "@/shared/lib/masks"
import {
  COMMUNICATION_CHANNEL_OPTIONS,
  COMMUNICATION_TOPIC_OPTIONS,
} from "@/shared/lib/options"
import type {
  AddressFormValues,
  BooleanFieldValue,
  ContactFormValues,
  CustomerFormValues,
  EmailFormValues,
  ResponsibleFormValues,
} from "@/features/customers/types/customer-form-types"

export const EMPTY_SELECT_VALUE = "__empty__"

const fallbackResponsibleFields: FieldConfig[] = [
  {
    fieldKey: "cpf",
    label: "CPF",
    section: "profile",
    required: false,
    importance: "HIGH",
    inputType: "document",
    dataType: "string",
    multiple: false,
    computed: false,
    readOnly: false,
    order: 4,
    visibleWhen: null,
    description: "Documento do responsável.",
    businessImpact: "Complementa a identificação do responsável vinculado.",
    mask: "cpf",
  },
  {
    fieldKey: "rg",
    label: "RG",
    section: "profile",
    required: false,
    importance: "LOW",
    inputType: "document",
    dataType: "string",
    multiple: false,
    computed: false,
    readOnly: false,
    order: 5,
    visibleWhen: null,
    description: "Documento secundário do responsável.",
    businessImpact: "Apoia validações e conferência de cadastro.",
  },
  {
    fieldKey: "nickname",
    label: "Apelido",
    section: "profile",
    required: false,
    importance: "LOW",
    inputType: "text",
    dataType: "string",
    multiple: false,
    computed: false,
    readOnly: false,
    order: 6,
    visibleWhen: null,
    description: "Apelido ou nome preferencial.",
    businessImpact: "Facilita identificação em atendimento.",
  },
  {
    fieldKey: "gender",
    label: "Sexo",
    section: "profile",
    required: false,
    importance: "MEDIUM",
    inputType: "select",
    dataType: "string",
    multiple: false,
    computed: false,
    readOnly: false,
    order: 7,
    visibleWhen: null,
    description: "Gênero informado no cadastro.",
    businessImpact: "Usado para contexto operacional, sem bloquear fluxos.",
    optionsSource: "static:genders",
  },
  {
    fieldKey: "role",
    label: "Cargo",
    section: "profile",
    required: false,
    importance: "HIGH",
    inputType: "text",
    dataType: "string",
    multiple: false,
    computed: false,
    readOnly: false,
    order: 8,
    visibleWhen: null,
    description: "Função do responsável na empresa.",
    businessImpact: "Explica o papel de cada responsável no relacionamento.",
  },
  {
    fieldKey: "profession",
    label: "Profissão",
    section: "profile",
    required: false,
    importance: "LOW",
    inputType: "text",
    dataType: "string",
    multiple: false,
    computed: false,
    readOnly: false,
    order: 9,
    visibleWhen: null,
    description: "Profissão do responsável.",
    businessImpact: "Ajuda na contextualização do cadastro.",
  },
  {
    fieldKey: "driverLicenseExpiresAt",
    label: "CNH Vencimento",
    section: "profile",
    required: false,
    importance: "LOW",
    inputType: "date",
    dataType: "date",
    multiple: false,
    computed: false,
    readOnly: false,
    order: 10,
    visibleWhen: null,
    description: "Data de vencimento da CNH do responsável.",
    businessImpact: "Apoia futuras rotinas de alerta e validação operacional.",
  },
  {
    fieldKey: "active",
    label: "Status Ativo",
    section: "profile",
    required: false,
    importance: "MEDIUM",
    inputType: "boolean",
    dataType: "boolean",
    multiple: false,
    computed: false,
    readOnly: false,
    order: 11,
    visibleWhen: null,
    description: "Define se o responsável está ativo no relacionamento.",
    businessImpact: "Permite manter histórico sem excluir dados vinculados.",
  },
  {
    fieldKey: "customerSince",
    label: "Cliente Desde",
    section: "profile",
    required: false,
    importance: "LOW",
    inputType: "date",
    dataType: "date",
    multiple: false,
    computed: false,
    readOnly: false,
    order: 12,
    visibleWhen: null,
    description: "Início do relacionamento deste responsável.",
    businessImpact: "Ajuda a medir tempo de vínculo.",
  },
  {
    fieldKey: "referralSource",
    label: "Como Nos Conheceu",
    section: "profile",
    required: false,
    importance: "HIGH",
    inputType: "text",
    dataType: "string",
    multiple: false,
    computed: false,
    readOnly: false,
    order: 13,
    visibleWhen: null,
    description: "Origem de captação associada ao responsável.",
    businessImpact: "Mantém rastreabilidade comercial e de marketing.",
  },
  {
    fieldKey: "referralName",
    label: "Quem é o Amigo",
    section: "profile",
    required: false,
    importance: "LOW",
    inputType: "text",
    dataType: "string",
    multiple: false,
    computed: false,
    readOnly: false,
    order: 14,
    visibleWhen: null,
    description: "Nome do indicador associado ao responsável.",
    businessImpact: "Conecta indicação sem forçar relacionamento formal.",
  },
  {
    fieldKey: "notes",
    label: "Observação",
    section: "profile",
    required: false,
    importance: "LOW",
    inputType: "textarea",
    dataType: "string",
    multiple: false,
    computed: false,
    readOnly: false,
    order: 15,
    visibleWhen: null,
    description: "Anotações livres sobre o responsável.",
    businessImpact: "Registra contexto operacional complementar.",
  },
  {
    fieldKey: "address.zipCode",
    label: "CEP",
    section: "address",
    required: false,
    importance: "LOW",
    inputType: "document",
    dataType: "string",
    multiple: false,
    computed: false,
    readOnly: false,
    order: 16,
    visibleWhen: null,
    description: "CEP do endereço principal.",
    businessImpact: "Apoia localização e validação futura.",
    mask: "cep",
  },
  {
    fieldKey: "address.street",
    label: "Endereço Completo",
    section: "address",
    required: false,
    importance: "LOW",
    inputType: "text",
    dataType: "string",
    multiple: false,
    computed: false,
    readOnly: false,
    order: 17,
    visibleWhen: null,
    description: "Logradouro do responsável.",
    businessImpact: "Compõe a localização principal do vínculo.",
  },
  {
    fieldKey: "address.number",
    label: "Número",
    section: "address",
    required: false,
    importance: "LOW",
    inputType: "text",
    dataType: "string",
    multiple: false,
    computed: false,
    readOnly: false,
    order: 18,
    visibleWhen: null,
    description: "Número do endereço.",
    businessImpact: "Detalha a localização.",
  },
  {
    fieldKey: "address.complement",
    label: "Complemento",
    section: "address",
    required: false,
    importance: "LOW",
    inputType: "text",
    dataType: "string",
    multiple: false,
    computed: false,
    readOnly: false,
    order: 19,
    visibleWhen: null,
    description: "Complemento do endereço.",
    businessImpact: "Melhora precisão da entrega e visita.",
  },
  {
    fieldKey: "address.district",
    label: "Bairro",
    section: "address",
    required: false,
    importance: "LOW",
    inputType: "text",
    dataType: "string",
    multiple: false,
    computed: false,
    readOnly: false,
    order: 20,
    visibleWhen: null,
    description: "Bairro do endereço.",
    businessImpact: "Apoia filtros e localização.",
  },
  {
    fieldKey: "address.city",
    label: "Cidade",
    section: "address",
    required: false,
    importance: "LOW",
    inputType: "text",
    dataType: "string",
    multiple: false,
    computed: false,
    readOnly: false,
    order: 21,
    visibleWhen: null,
    description: "Cidade em texto livre.",
    businessImpact: "Suporta localização e filtros geográficos.",
  },
  {
    fieldKey: "address.state",
    label: "Estado",
    section: "address",
    required: false,
    importance: "LOW",
    inputType: "text",
    dataType: "string",
    multiple: false,
    computed: false,
    readOnly: false,
    order: 22,
    visibleWhen: null,
    description: "Estado em texto livre.",
    businessImpact: "Suporta segmentações regionais.",
  },
  {
    fieldKey: "address.cityCode",
    label: "Código Cidade",
    section: "address",
    required: false,
    importance: "LOW",
    inputType: "text",
    dataType: "string",
    multiple: false,
    computed: false,
    readOnly: false,
    order: 23,
    visibleWhen: null,
    description: "Código opcional de cidade.",
    businessImpact: "Prepara integrações futuras.",
  },
  {
    fieldKey: "address.stateCode",
    label: "Código Estado",
    section: "address",
    required: false,
    importance: "LOW",
    inputType: "text",
    dataType: "string",
    multiple: false,
    computed: false,
    readOnly: false,
    order: 24,
    visibleWhen: null,
    description: "Código opcional do estado.",
    businessImpact: "Prepara integrações futuras.",
  },
  {
    fieldKey: "address.reference",
    label: "Referência",
    section: "address",
    required: false,
    importance: "LOW",
    inputType: "text",
    dataType: "string",
    multiple: false,
    computed: false,
    readOnly: false,
    order: 25,
    visibleWhen: null,
    description: "Ponto de referência.",
    businessImpact: "Facilita localização operacional.",
  },
]

export const createEmptyAddress = (): AddressFormValues => ({
  zipCode: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
  cityCode: "",
  stateCode: "",
  reference: "",
})

export const createEmptyContact = (): ContactFormValues => ({
  value: "",
  type: "MOBILE",
  isWhatsapp: true,
  label: "",
})

export const createEmptyEmail = (): EmailFormValues => ({
  email: "",
  label: "",
})

export const createCommunicationPreferences = () =>
  COMMUNICATION_CHANNEL_OPTIONS.flatMap(({ value: channel }) =>
    COMMUNICATION_TOPIC_OPTIONS.map(({ value: topic }) => ({
      channel,
      topic,
      enabled: false,
    }))
  )

export const createEmptyResponsible = (): ResponsibleFormValues => ({
  fullName: "",
  cpf: "",
  rg: "",
  nickname: "",
  birthDate: "",
  gender: "",
  familyRelationship: "",
  role: "",
  profession: "",
  driverLicenseExpiresAt: "",
  active: "true",
  customerSince: "",
  referralSource: "",
  referralName: "",
  notes: "",
  address: createEmptyAddress(),
  contacts: [createEmptyContact()],
  emails: [createEmptyEmail()],
})

export const createDefaultValues = (): CustomerFormValues => ({
  personType: "INDIVIDUAL",
  core: {
    active: "true",
    customerSince: "",
    classification: "",
    referralSource: "",
    referralName: "",
    allowsInvoice: "false",
    hasRestriction: "false",
    isFinalConsumer: "false",
    isRuralProducer: "false",
    notes: "",
  },
  profile: {
    cpf: "",
    rg: "",
    fullName: "",
    nickname: "",
    birthDate: "",
    gender: "",
    familyRelationship: "",
    profession: "",
    driverLicenseExpiresAt: "",
    cnpj: "",
    stateRegistration: "",
    corporateName: "",
    tradeName: "",
    municipalRegistration: "",
    suframaRegistration: "",
    taxpayerType: "",
    openingDate: "",
    companySegment: "",
    issWithheld: "false",
  },
  financial: {
    creditLimit: "",
    amountSpent: "",
    balance: "",
    consumedAmount: "",
    costAmount: "",
    commissionPercentage: "",
    paymentDay: "",
    pixKeyOrDescription: "",
  },
  address: createEmptyAddress(),
  contacts: [createEmptyContact()],
  emails: [createEmptyEmail()],
  communicationPreferences: createCommunicationPreferences(),
  responsibles: [],
  computed: {
    customerAge: "",
    companyAge: "",
    profitabilityAmount: "",
    profitabilityPercentage: "",
  },
})

export const groupFields = (
  metadata: FormMetadataResponse
): GroupedFieldSection[] => {
  if (metadata.groupedFields?.length) {
    return metadata.groupedFields
  }

  return metadata.sections
    .filter((section) =>
      metadata.fields.some((field) => field.section === section.key)
    )
    .sort((left, right) => left.order - right.order)
    .map((section) => ({
      section,
      fields: metadata.fields
        .filter((field) => field.section === section.key)
        .sort((left, right) => left.order - right.order),
    }))
}

export const mergeResponsibleMetadata = (metadata?: FormMetadataResponse) => {
  if (!metadata) {
    return []
  }

  const fieldMap = new Map<string, FieldConfig>()
  metadata.fields.forEach((field) => fieldMap.set(field.fieldKey, field))
  fallbackResponsibleFields.forEach((field) => {
    if (!fieldMap.has(field.fieldKey)) {
      fieldMap.set(field.fieldKey, field)
    }
  })

  return metadata.sections
    .sort((left, right) => left.order - right.order)
    .map((section) => ({
      section,
      fields: [...fieldMap.values()]
        .filter((field) => field.section === section.key)
        .sort((left, right) => left.order - right.order),
    }))
}

export const toBooleanFieldValue = (
  value?: boolean | null
): BooleanFieldValue => {
  if (value === null || value === undefined) {
    return ""
  }

  return value ? "true" : "false"
}

export const normalizeText = (value: string) => {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const normalizeDate = (value: string) => {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const normalizeNumber = (value: string) => {
  const trimmed = value.trim().replace(/\s/g, "").replace(",", ".")

  if (!trimmed) {
    return null
  }

  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

export const normalizeBoolean = (value: BooleanFieldValue) => {
  if (value === "") {
    return null
  }

  return value === "true"
}

export const normalizeOptionalBoolean = (value: BooleanFieldValue) => {
  if (value === "") {
    return undefined
  }

  return value === "true"
}

export const normalizeRequiredBoolean = (
  value: BooleanFieldValue,
  fallback = true
) => (value === "" ? fallback : value === "true")

export const calculateYearsFromDate = (value?: string) => {
  if (!value) {
    return ""
  }

  const parts = value.split("-").map(Number)
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return ""
  }

  const [year, month, day] = parts
  const today = new Date()
  let years = today.getFullYear() - year
  const hasHadBirthdayThisYear =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day)

  if (!hasHadBirthdayThisYear) {
    years -= 1
  }

  return years >= 0 ? String(years) : ""
}

export const normalizeAddress = (address: AddressFormValues): AddressInput => ({
  zipCode: normalizeText(digitsOnly(address.zipCode)),
  street: normalizeText(address.street),
  number: normalizeText(address.number),
  complement: normalizeText(address.complement),
  district: normalizeText(address.district),
  city: normalizeText(address.city),
  state: normalizeText(address.state),
  cityCode: normalizeText(address.cityCode),
  stateCode: normalizeText(address.stateCode),
  reference: normalizeText(address.reference),
})

export const isAddressEmpty = (address: AddressInput) =>
  Object.values(address).every((value) => value === null)

export const mapContacts = (contacts: ContactFormValues[]): ContactInput[] =>
  contacts
    .filter((contact) => contact.value.trim().length > 0)
    .map((contact) => ({
      value:
        contact.type === "MESSAGING"
          ? contact.value.trim()
          : digitsOnly(contact.value),
      type: contact.type,
      isWhatsapp: contact.isWhatsapp,
      label: normalizeText(contact.label),
    }))

export const mapEmails = (emails: EmailFormValues[]) =>
  emails
    .filter((email) => email.email.trim().length > 0)
    .map((email) => ({
      email: email.email.trim().toLowerCase(),
      label: normalizeText(email.label),
    }))

export const mapResponsiblePayload = (
  values: ResponsibleFormValues
): ResponsibleInput | null => {
  if (!values.fullName.trim()) {
    return null
  }

  const address = normalizeAddress(values.address)

  return {
    fullName: values.fullName.trim(),
    cpf: normalizeText(digitsOnly(values.cpf)),
    rg: normalizeText(values.rg),
    nickname: normalizeText(values.nickname),
    birthDate: normalizeDate(values.birthDate),
    gender: normalizeText(values.gender),
    familyRelationship: normalizeText(values.familyRelationship),
    role: normalizeText(values.role),
    profession: normalizeText(values.profession),
    driverLicenseExpiresAt: normalizeDate(values.driverLicenseExpiresAt),
    active: normalizeRequiredBoolean(values.active),
    customerSince: normalizeDate(values.customerSince),
    referralSource: normalizeText(values.referralSource),
    referralName: normalizeText(values.referralName),
    notes: normalizeText(values.notes),
    address: isAddressEmpty(address) ? undefined : address,
    contacts: mapContacts(values.contacts),
    emails: mapEmails(values.emails),
  }
}

export const toPayload = (
  values: CustomerFormValues
): CustomerCreateInput | CustomerUpdateInput => {
  const core = {
    active: normalizeRequiredBoolean(values.core.active),
    customerSince: normalizeDate(values.core.customerSince),
    classification: normalizeText(values.core.classification),
    referralSource: normalizeText(values.core.referralSource),
    referralName: normalizeText(values.core.referralName),
    allowsInvoice: normalizeOptionalBoolean(values.core.allowsInvoice),
    hasRestriction: normalizeOptionalBoolean(values.core.hasRestriction),
    isFinalConsumer: normalizeOptionalBoolean(values.core.isFinalConsumer),
    isRuralProducer: normalizeOptionalBoolean(values.core.isRuralProducer),
    notes: normalizeText(values.core.notes),
  }

  const financial = {
    creditLimit: normalizeNumber(values.financial.creditLimit),
    amountSpent: normalizeNumber(values.financial.amountSpent),
    balance: normalizeNumber(values.financial.balance),
    consumedAmount: normalizeNumber(values.financial.consumedAmount),
    costAmount: normalizeNumber(values.financial.costAmount),
    commissionPercentage: normalizeNumber(
      values.financial.commissionPercentage
    ),
    paymentDay: normalizeNumber(values.financial.paymentDay),
    pixKeyOrDescription: normalizeText(values.financial.pixKeyOrDescription),
  }

  const address = normalizeAddress(values.address)
  const contacts = mapContacts(values.contacts)
  const emails = mapEmails(values.emails)
  const communicationPreferences = values.communicationPreferences.map(
    (preference) => ({
      channel: preference.channel,
      topic: preference.topic,
      enabled: preference.enabled,
    })
  )

  if (values.personType === "INDIVIDUAL") {
    return {
      personType: "INDIVIDUAL",
      core,
      profile: {
        cpf: digitsOnly(values.profile.cpf),
        rg: normalizeText(values.profile.rg),
        fullName: values.profile.fullName.trim(),
        nickname: normalizeText(values.profile.nickname),
        birthDate: normalizeDate(values.profile.birthDate),
        gender: normalizeText(values.profile.gender),
        familyRelationship: normalizeText(values.profile.familyRelationship),
        profession: normalizeText(values.profile.profession),
        driverLicenseExpiresAt: normalizeDate(
          values.profile.driverLicenseExpiresAt
        ),
      },
      financial,
      address,
      contacts,
      emails,
      communicationPreferences,
      responsibles: [],
    }
  }

  return {
    personType: "COMPANY",
    core,
    profile: {
      cnpj: digitsOnly(values.profile.cnpj),
      stateRegistration: normalizeText(values.profile.stateRegistration),
      corporateName: values.profile.corporateName.trim(),
      tradeName: values.profile.tradeName.trim(),
      municipalRegistration: normalizeText(
        values.profile.municipalRegistration
      ),
      suframaRegistration: normalizeText(values.profile.suframaRegistration),
      taxpayerType: normalizeText(values.profile.taxpayerType),
      openingDate: normalizeDate(values.profile.openingDate),
      companySegment: normalizeText(values.profile.companySegment),
      issWithheld: normalizeOptionalBoolean(values.profile.issWithheld),
    },
    financial,
    address,
    contacts,
    emails,
    communicationPreferences,
    responsibles: values.responsibles
      .map(mapResponsiblePayload)
      .filter(Boolean) as ResponsibleInput[],
  }
}

export const mapAddressValues = (
  address?: AddressInput | null
): AddressFormValues => ({
  zipCode: address?.zipCode || "",
  street: address?.street || "",
  number: address?.number || "",
  complement: address?.complement || "",
  district: address?.district || "",
  city: address?.city || "",
  state: address?.state || "",
  cityCode: address?.cityCode || "",
  stateCode: address?.stateCode || "",
  reference: address?.reference || "",
})

export const mapCustomerToFormValues = (
  customer: CustomerResponse
): CustomerFormValues => {
  const defaults = createDefaultValues()
  const profile = customer.profile as Record<string, string | boolean | null>

  return {
    ...defaults,
    personType: customer.personType,
    core: {
      active: toBooleanFieldValue(customer.core.active ?? true),
      customerSince: customer.core.customerSince || "",
      classification: customer.core.classification || "",
      referralSource: customer.core.referralSource || "",
      referralName: customer.core.referralName || "",
      allowsInvoice:
        customer.core.allowsInvoice === null ||
        customer.core.allowsInvoice === undefined
          ? defaults.core.allowsInvoice
          : toBooleanFieldValue(customer.core.allowsInvoice),
      hasRestriction:
        customer.core.hasRestriction === null ||
        customer.core.hasRestriction === undefined
          ? defaults.core.hasRestriction
          : toBooleanFieldValue(customer.core.hasRestriction),
      isFinalConsumer:
        customer.core.isFinalConsumer === null ||
        customer.core.isFinalConsumer === undefined
          ? defaults.core.isFinalConsumer
          : toBooleanFieldValue(customer.core.isFinalConsumer),
      isRuralProducer:
        customer.core.isRuralProducer === null ||
        customer.core.isRuralProducer === undefined
          ? defaults.core.isRuralProducer
          : toBooleanFieldValue(customer.core.isRuralProducer),
      notes: customer.core.notes || "",
    },
    profile: {
      ...defaults.profile,
      cpf: (profile.cpf as string | undefined) || "",
      rg: (profile.rg as string | undefined) || "",
      fullName: (profile.fullName as string | undefined) || "",
      nickname: (profile.nickname as string | undefined) || "",
      birthDate: (profile.birthDate as string | undefined) || "",
      gender: (profile.gender as string | undefined) || "",
      familyRelationship:
        (profile.familyRelationship as string | undefined) || "",
      profession: (profile.profession as string | undefined) || "",
      driverLicenseExpiresAt:
        (profile.driverLicenseExpiresAt as string | undefined) || "",
      cnpj: (profile.cnpj as string | undefined) || "",
      stateRegistration:
        (profile.stateRegistration as string | undefined) || "",
      corporateName: (profile.corporateName as string | undefined) || "",
      tradeName: (profile.tradeName as string | undefined) || "",
      municipalRegistration:
        (profile.municipalRegistration as string | undefined) || "",
      suframaRegistration:
        (profile.suframaRegistration as string | undefined) || "",
      taxpayerType: (profile.taxpayerType as string | undefined) || "",
      openingDate: (profile.openingDate as string | undefined) || "",
      companySegment: (profile.companySegment as string | undefined) || "",
      issWithheld:
        profile.issWithheld === null || profile.issWithheld === undefined
          ? defaults.profile.issWithheld
          : toBooleanFieldValue(
              profile.issWithheld as boolean | null | undefined
            ),
    },
    financial: {
      creditLimit: customer.financial?.creditLimit?.toString() || "",
      amountSpent: customer.financial?.amountSpent?.toString() || "",
      balance: customer.financial?.balance?.toString() || "",
      consumedAmount: customer.financial?.consumedAmount?.toString() || "",
      costAmount: customer.financial?.costAmount?.toString() || "",
      commissionPercentage:
        customer.financial?.commissionPercentage?.toString() || "",
      paymentDay: customer.financial?.paymentDay?.toString() || "",
      pixKeyOrDescription: customer.financial?.pixKeyOrDescription || "",
    },
    address: mapAddressValues(customer.address),
    contacts: customer.contacts.map((contact) => ({
      value: contact.value,
      type: contact.type,
      isWhatsapp: Boolean(contact.isWhatsapp),
      label: contact.label || "",
    })) || [createEmptyContact()],
    emails: customer.emails.map((email) => ({
      email: email.email,
      label: email.label || "",
    })) || [createEmptyEmail()],
    communicationPreferences: createCommunicationPreferences().map(
      (preference) => {
        const existing = customer.communicationPreferences.find(
          (item) =>
            item.channel === preference.channel &&
            item.topic === preference.topic
        )

        return existing
          ? {
              channel: existing.channel,
              topic: existing.topic,
              enabled: existing.enabled,
            }
          : preference
      }
    ),
    responsibles: customer.responsibles.map((responsible) => ({
      fullName: responsible.fullName,
      cpf: responsible.cpf || "",
      rg: responsible.rg || "",
      nickname: responsible.nickname || "",
      birthDate: responsible.birthDate || "",
      gender: responsible.gender || "",
      familyRelationship: responsible.familyRelationship || "",
      role: responsible.role || "",
      profession: responsible.profession || "",
      driverLicenseExpiresAt: responsible.driverLicenseExpiresAt || "",
      active: toBooleanFieldValue(responsible.active ?? true),
      customerSince: responsible.customerSince || "",
      referralSource: responsible.referralSource || "",
      referralName: responsible.referralName || "",
      notes: responsible.notes || "",
      address: mapAddressValues(responsible.address),
      contacts: responsible.contacts.map((contact) => ({
        value: contact.value,
        type: contact.type,
        isWhatsapp: Boolean(contact.isWhatsapp),
        label: contact.label || "",
      })) || [createEmptyContact()],
      emails: responsible.emails.map((email) => ({
        email: email.email,
        label: email.label || "",
      })) || [createEmptyEmail()],
    })),
    computed: {
      customerAge:
        customer.computed.customerAge !== null &&
        customer.computed.customerAge !== undefined
          ? String(customer.computed.customerAge)
          : "",
      companyAge:
        customer.computed.companyAge !== null &&
        customer.computed.companyAge !== undefined
          ? String(customer.computed.companyAge)
          : "",
      profitabilityAmount:
        customer.computed.profitabilityAmount !== null &&
        customer.computed.profitabilityAmount !== undefined
          ? String(customer.computed.profitabilityAmount)
          : "",
      profitabilityPercentage:
        customer.computed.profitabilityPercentage !== null &&
        customer.computed.profitabilityPercentage !== undefined
          ? String(customer.computed.profitabilityPercentage)
          : "",
    },
  }
}

export const hasValue = (value: unknown) => {
  if (typeof value === "string") {
    return value.trim().length > 0
  }

  return value !== null && value !== undefined
}

const getFieldTone = (fieldConfig: FieldConfig) => {
  if (fieldConfig.required) {
    return "text-rose-700"
  }

  if (fieldConfig.importance === "HIGH") {
    return "text-emerald-700"
  }

  return "text-foreground"
}

export const getFieldClasses = (fieldConfig: FieldConfig) =>
  `text-sm font-medium ${getFieldTone(fieldConfig)}`

export const getFieldControlClasses = (fieldConfig: FieldConfig) => {
  if (fieldConfig.required) {
    return "border-rose-300 focus-visible:border-rose-500 focus-visible:ring-rose-100"
  }

  if (fieldConfig.importance === "HIGH") {
    return "border-emerald-300 focus-visible:border-emerald-500 focus-visible:ring-emerald-100"
  }

  return ""
}

const isRepeatedDigits = (value: string) => /^(\d)\1+$/.test(value)

const validateCpfDigits = (value: string) => {
  if (value.length !== 11 || isRepeatedDigits(value)) {
    return false
  }

  let sum = 0
  for (let index = 0; index < 9; index += 1) {
    sum += Number(value[index]) * (10 - index)
  }

  let remainder = (sum * 10) % 11
  if (remainder === 10) {
    remainder = 0
  }

  if (remainder !== Number(value[9])) {
    return false
  }

  sum = 0
  for (let index = 0; index < 10; index += 1) {
    sum += Number(value[index]) * (11 - index)
  }

  remainder = (sum * 10) % 11
  if (remainder === 10) {
    remainder = 0
  }

  return remainder === Number(value[10])
}

const validateCnpjDigits = (value: string) => {
  if (value.length !== 14 || isRepeatedDigits(value)) {
    return false
  }

  const calculateCheckDigit = (base: string) => {
    const weights =
      base.length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

    const sum = base
      .split("")
      .reduce(
        (total, digit, index) => total + Number(digit) * weights[index],
        0
      )

    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }

  const base = value.slice(0, 12)
  const firstDigit = calculateCheckDigit(base)
  const secondDigit = calculateCheckDigit(`${base}${firstDigit}`)

  return value === `${base}${firstDigit}${secondDigit}`
}

const getDocumentValidationType = (fieldConfig: FieldConfig) => {
  if (
    fieldConfig.mask === "cpf" ||
    fieldConfig.fieldKey.toLowerCase().includes("cpf")
  ) {
    return "cpf"
  }

  if (
    fieldConfig.mask === "cnpj" ||
    fieldConfig.fieldKey.toLowerCase().includes("cnpj")
  ) {
    return "cnpj"
  }

  return null
}

export const isPersonalFullNameField = (fieldConfig: FieldConfig) =>
  fieldConfig.fieldKey === "fullName" ||
  fieldConfig.fieldKey === "profile.fullName"

const NAME_CONNECTORS = new Set(["da", "das", "de", "do", "dos", "e"])

const isValidNameToken = (token: string) =>
  /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:['-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/.test(token)

export const getPersonalNameValidationMessage = (
  fieldConfig: FieldConfig,
  value: string
) => {
  if (!isPersonalFullNameField(fieldConfig)) {
    return true
  }

  const normalizedValue = value.trim().replace(/\s+/g, " ")

  if (!normalizedValue) {
    return true
  }

  const tokens = normalizedValue.split(" ")

  if (tokens.length < 2) {
    return "Informe nome e sobrenome válidos."
  }

  if (tokens.some((token) => !isValidNameToken(token))) {
    return "Informe nome e sobrenome válidos."
  }

  const lastToken = tokens.at(-1)?.toLowerCase()

  if (!lastToken || NAME_CONNECTORS.has(lastToken)) {
    return "Informe nome e sobrenome válidos."
  }

  const nonConnectorTokens = tokens.filter(
    (token) => !NAME_CONNECTORS.has(token.toLowerCase())
  )

  if (nonConnectorTokens.length < 2) {
    return "Informe nome e sobrenome válidos."
  }

  return true
}

export const getDocumentValidationMessage = (
  fieldConfig: FieldConfig,
  value: string
) => {
  const validationType = getDocumentValidationType(fieldConfig)

  if (!validationType) {
    return true
  }

  const digits = digitsOnly(value)

  if (digits.length === 0) {
    return true
  }

  if (validationType === "cpf") {
    return validateCpfDigits(digits) || "CPF inválido."
  }

  return validateCnpjDigits(digits) || "CNPJ inválido."
}

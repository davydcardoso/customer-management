import type { UseFormReturn } from "react-hook-form"

import type {
  CommunicationPreferenceInput,
  ContactType,
  FieldConfig,
  PersonType,
} from "@/shared/api/types"

export type BooleanFieldValue = "" | "true" | "false"

export type ContactFormValues = {
  id?: string
  value: string
  type: ContactType
  isWhatsapp: boolean
  label: string
}

export type EmailFormValues = {
  id?: string
  email: string
  label: string
}

export type AddressFormValues = {
  zipCode: string
  street: string
  number: string
  complement: string
  district: string
  city: string
  state: string
  cityCode: string
  stateCode: string
  reference: string
}

export type ResponsibleFormValues = {
  id?: string
  fullName: string
  cpf: string
  rg: string
  nickname: string
  birthDate: string
  gender: string
  familyRelationship: string
  role: string
  profession: string
  driverLicenseExpiresAt: string
  active: BooleanFieldValue
  customerSince: string
  referralSource: string
  referralName: string
  notes: string
  address: AddressFormValues
  contacts: ContactFormValues[]
  emails: EmailFormValues[]
}

export type CustomerProfileFormValues = {
  cpf: string
  rg: string
  fullName: string
  nickname: string
  birthDate: string
  gender: string
  familyRelationship: string
  profession: string
  driverLicenseExpiresAt: string
  cnpj: string
  stateRegistration: string
  corporateName: string
  tradeName: string
  municipalRegistration: string
  suframaRegistration: string
  taxpayerType: string
  openingDate: string
  companySegment: string
  issWithheld: BooleanFieldValue
}

export type CustomerFormValues = {
  personType: PersonType
  core: {
    active: BooleanFieldValue
    customerSince: string
    classification: string
    referralSource: string
    referralName: string
    allowsInvoice: BooleanFieldValue
    hasRestriction: BooleanFieldValue
    isFinalConsumer: BooleanFieldValue
    isRuralProducer: BooleanFieldValue
    notes: string
  }
  profile: CustomerProfileFormValues
  financial: {
    creditLimit: string
    amountSpent: string
    balance: string
    consumedAmount: string
    costAmount: string
    commissionPercentage: string
    paymentDay: string
    pixKeyOrDescription: string
  }
  address: AddressFormValues
  contacts: ContactFormValues[]
  emails: EmailFormValues[]
  communicationPreferences: CommunicationPreferenceInput[]
  responsibles: ResponsibleFormValues[]
  computed: {
    customerAge: string
    companyAge: string
    profitabilityAmount: string
    profitabilityPercentage: string
  }
}

export type CustomerFormPageProps = {
  mode: "create" | "edit"
}

export type FieldProps = {
  fieldConfig: FieldConfig
  form: UseFormReturn<CustomerFormValues>
  name: string
  disabled?: boolean
}

export type ContactEmailSectionProps = {
  form: UseFormReturn<CustomerFormValues>
  contactsFieldConfig?: FieldConfig
  emailsFieldConfig?: FieldConfig
  contactsName: string
  emailsName: string
}

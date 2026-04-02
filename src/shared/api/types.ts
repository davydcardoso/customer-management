export type PersonType = "INDIVIDUAL" | "COMPANY"
export type ContactType = "PHONE" | "MOBILE" | "MESSAGING"
export type CommunicationChannel = "PHONE" | "EMAIL"
export type CommunicationTopic =
  | "KM_UPDATE"
  | "CHARGING"
  | "MAINTENANCE_ALERT"
  | "CAMPAIGNS"
  | "NPS"
  | "INVOICE"
  | "NEXT_REVISIONS"
  | "SERVICE_ORDER_COMPLETED"
  | "BUDGET_APPROVAL"
  | "BIRTHDAY"

export type ImportanceLevel = "LOW" | "MEDIUM" | "HIGH"
export type InputType =
  | "text"
  | "textarea"
  | "select"
  | "date"
  | "document"
  | "currency"
  | "number"
  | "boolean"
  | "collection"
export type FieldDataType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "object"
  | "array"

export type Nullable<T> = T | null

export type ApiErrorPayload = {
  message?: string
  code?: string
  details?: unknown
}

export type AuthUser = {
  id: string
  username: string
  active?: boolean
}

export type LoginRequest = {
  username: string
  password: string
}

export type LoginResponse = {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export type RefreshSessionRequest = {
  refreshToken: string
}

export type RefreshSessionResponse = {
  accessToken: string
  refreshToken: string
}

export type Session = LoginResponse

export type CustomerCoreInput = {
  active?: boolean
  customerSince?: Nullable<string>
  classification?: Nullable<string>
  referralSource?: Nullable<string>
  referralName?: Nullable<string>
  allowsInvoice?: Nullable<boolean>
  hasRestriction?: Nullable<boolean>
  isFinalConsumer?: Nullable<boolean>
  isRuralProducer?: Nullable<boolean>
  notes?: Nullable<string>
}

export type CustomerFinancialInput = {
  creditLimit?: Nullable<number>
  amountSpent?: Nullable<number>
  balance?: Nullable<number>
  consumedAmount?: Nullable<number>
  costAmount?: Nullable<number>
  commissionPercentage?: Nullable<number>
  paymentDay?: Nullable<number>
  pixKeyOrDescription?: Nullable<string>
}

export type CustomerFinancialResponse = CustomerFinancialInput & {
  profitabilityAmount?: Nullable<number>
  profitabilityPercentage?: Nullable<number>
}

export type AddressInput = {
  zipCode?: Nullable<string>
  street?: Nullable<string>
  number?: Nullable<string>
  complement?: Nullable<string>
  district?: Nullable<string>
  city?: Nullable<string>
  state?: Nullable<string>
  cityCode?: Nullable<string>
  stateCode?: Nullable<string>
  reference?: Nullable<string>
}

export type ContactInput = {
  value: string
  type: ContactType
  isWhatsapp?: boolean
  label?: Nullable<string>
}

export type ContactResponse = ContactInput & {
  id: string
}

export type EmailInput = {
  email: string
  label?: Nullable<string>
}

export type EmailResponse = EmailInput & {
  id: string
}

export type CommunicationPreferenceInput = {
  channel: CommunicationChannel
  topic: CommunicationTopic
  enabled: boolean
}

export type CommunicationPreferenceResponse = CommunicationPreferenceInput & {
  id: string
}

export type IndividualProfileInput = {
  cpf: string
  rg?: Nullable<string>
  fullName: string
  nickname?: Nullable<string>
  birthDate?: Nullable<string>
  gender?: Nullable<string>
  familyRelationship?: Nullable<string>
  profession?: Nullable<string>
  driverLicenseExpiresAt?: Nullable<string>
}

export type CompanyProfileInput = {
  cnpj: string
  stateRegistration?: Nullable<string>
  corporateName: string
  tradeName: string
  municipalRegistration?: Nullable<string>
  suframaRegistration?: Nullable<string>
  taxpayerType?: Nullable<string>
  openingDate?: Nullable<string>
  companySegment?: Nullable<string>
  issWithheld?: Nullable<boolean>
}

export type ResponsibleInput = {
  fullName: string
  cpf?: Nullable<string>
  rg?: Nullable<string>
  nickname?: Nullable<string>
  birthDate?: Nullable<string>
  gender?: Nullable<string>
  familyRelationship?: Nullable<string>
  role?: Nullable<string>
  profession?: Nullable<string>
  driverLicenseExpiresAt?: Nullable<string>
  active?: Nullable<boolean>
  customerSince?: Nullable<string>
  referralSource?: Nullable<string>
  referralName?: Nullable<string>
  notes?: Nullable<string>
  address?: AddressInput
  contacts?: ContactInput[]
  emails?: EmailInput[]
}

export type ResponsibleResponse = Omit<ResponsibleInput, "address" | "contacts" | "emails"> & {
  id: string
  active: boolean
  address: Nullable<AddressInput>
  contacts: ContactResponse[]
  emails: EmailResponse[]
  computed: {
    age: Nullable<number>
  }
}

export type CustomerComputed = {
  customerAge?: Nullable<number>
  companyAge?: Nullable<number>
  profitabilityAmount?: Nullable<number>
  profitabilityPercentage?: Nullable<number>
}

export type CustomerResponse = {
  id: string
  personType: PersonType
  core: CustomerCoreInput
  profile: Record<string, unknown>
  financial: Nullable<CustomerFinancialResponse>
  address: Nullable<AddressInput>
  contacts: ContactResponse[]
  emails: EmailResponse[]
  communicationPreferences: CommunicationPreferenceResponse[]
  responsibles: ResponsibleResponse[]
  computed: CustomerComputed
  createdAt?: string
  updatedAt?: string
}

export type CustomerCreateInput =
  | {
      personType: "INDIVIDUAL"
      core?: CustomerCoreInput
      profile: IndividualProfileInput
      financial?: CustomerFinancialInput
      address?: AddressInput
      contacts?: ContactInput[]
      emails?: EmailInput[]
      communicationPreferences?: CommunicationPreferenceInput[]
      responsibles?: ResponsibleInput[]
    }
  | {
      personType: "COMPANY"
      core?: CustomerCoreInput
      profile: CompanyProfileInput
      financial?: CustomerFinancialInput
      address?: AddressInput
      contacts?: ContactInput[]
      emails?: EmailInput[]
      communicationPreferences?: CommunicationPreferenceInput[]
      responsibles: ResponsibleInput[]
    }

export type CustomerUpdateInput = {
  personType?: PersonType
  core?: CustomerCoreInput
  profile?: Partial<IndividualProfileInput> | Partial<CompanyProfileInput>
  financial?: CustomerFinancialInput
  address?: AddressInput
  contacts?: ContactInput[]
  emails?: EmailInput[]
  communicationPreferences?: CommunicationPreferenceInput[]
  responsibles?: ResponsibleInput[]
}

export type PaginatedCustomersResponse = {
  items: CustomerResponse[]
  total: number
  page: number
  limit: number
}

export type CustomerSearchResult = {
  id: string
  personType: PersonType
  document?: Nullable<string>
  name?: Nullable<string>
  tradeName?: Nullable<string>
}

export type SectionConfig = {
  key: string
  label: string
  description: string
  order: number
}

export type VisibleWhen = {
  personType?: PersonType[]
} | null

export type FieldConfig = {
  fieldKey: string
  label: string
  section: string
  required: boolean
  importance: ImportanceLevel
  inputType: InputType
  dataType: FieldDataType
  multiple: boolean
  computed: boolean
  readOnly: boolean
  order: number
  visibleWhen: VisibleWhen
  description: string
  businessImpact: string
  placeholder?: string | null
  mask?: string | null
  optionsSource?: string | null
}

export type GroupedFieldSection = {
  section: SectionConfig
  fields: FieldConfig[]
}

export type FormMetadataResponse = {
  formKey: string
  entity: string
  version: string
  scope?: {
    personType?: Nullable<PersonType>
  }
  sections: SectionConfig[]
  fields: FieldConfig[]
  groupedFields?: GroupedFieldSection[]
}

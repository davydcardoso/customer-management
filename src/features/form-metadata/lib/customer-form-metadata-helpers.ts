import type {
  FieldConfig,
  PersonType,
  UpdateFormFieldConfigInput,
  VisibleWhen,
} from "@/shared/api/types"
import { IMPORTANCE_OPTIONS, PERSON_TYPE_OPTIONS } from "@/shared/lib/options"
import type {
  EditableFieldDraft,
  PersonTypeFilter,
  VisibleWhenMode,
} from "@/features/form-metadata/types/customer-form-metadata-types"

export const ALL_SECTION_VALUE = "__all__"

export const CRITICAL_FIELD_KEYS = new Set([
  "profile.cpf",
  "profile.cnpj",
  "profile.fullName",
  "profile.corporateName",
  "profile.tradeName",
  "responsibles",
])

export const personTypeFilterOptions: Array<{
  value: PersonTypeFilter
  label: string
}> = [{ value: "ALL", label: "Todos" }, ...PERSON_TYPE_OPTIONS]

export const visibleWhenOptions: Array<{
  value: VisibleWhenMode
  label: string
}> = [
  { value: "ALL", label: "PF e PJ" },
  { value: "INDIVIDUAL", label: "Somente PF" },
  { value: "COMPANY", label: "Somente PJ" },
]

export const formatVisibleWhen = (visibleWhen: VisibleWhen) => {
  const personTypes = visibleWhen?.personType ?? []

  if (personTypes.length === 0 || personTypes.length === 2) {
    return "PF e PJ"
  }

  return personTypes[0] === "INDIVIDUAL" ? "Somente PF" : "Somente PJ"
}

export const getScopeLabel = (personType?: PersonType | null) => {
  if (!personType) {
    return "Todos os tipos de pessoa"
  }

  return personType === "INDIVIDUAL" ? "Pessoa Física" : "Pessoa Jurídica"
}

export const getVisibleWhenMode = (
  visibleWhen: VisibleWhen
): VisibleWhenMode => {
  const personTypes = visibleWhen?.personType ?? []

  if (personTypes.length === 1) {
    return personTypes[0]
  }

  return "ALL"
}

export const toVisibleWhen = (mode: VisibleWhenMode): VisibleWhen => {
  if (mode === "ALL") {
    return null
  }

  return { personType: [mode] }
}

export const normalizeNullableString = (value: string) => {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const normalizeRequiredString = (value: string) => value.trim()

export const visibleWhenEquals = (left: VisibleWhen, right: VisibleWhen) => {
  const leftValues = [...(left?.personType ?? [])].sort()
  const rightValues = [...(right?.personType ?? [])].sort()

  return JSON.stringify(leftValues) === JSON.stringify(rightValues)
}

export const createDraftFromField = (
  field: FieldConfig
): EditableFieldDraft => ({
  label: field.label,
  section: field.section,
  required: field.required,
  importance: field.importance,
  inputType: field.inputType,
  dataType: field.dataType,
  multiple: field.multiple,
  computed: field.computed,
  readOnly: field.readOnly,
  order: String(field.order),
  visibleWhenMode: getVisibleWhenMode(field.visibleWhen),
  description: field.description,
  businessImpact: field.businessImpact,
  placeholder: field.placeholder ?? "",
  mask: field.mask ?? "",
  optionsSource: field.optionsSource ?? "",
})

export const buildFieldPatch = (
  field: FieldConfig,
  draft: EditableFieldDraft
): UpdateFormFieldConfigInput => {
  const nextVisibleWhen = toVisibleWhen(draft.visibleWhenMode)
  const patch: UpdateFormFieldConfigInput = {}

  const nextLabel = normalizeRequiredString(draft.label)
  if (nextLabel !== field.label) {
    patch.label = nextLabel
  }

  const nextSection = normalizeRequiredString(draft.section)
  if (nextSection !== field.section) {
    patch.section = nextSection
  }

  if (draft.required !== field.required) {
    patch.required = draft.required
  }

  if (draft.importance !== field.importance) {
    patch.importance = draft.importance
  }

  if (draft.inputType !== field.inputType) {
    patch.inputType = draft.inputType
  }

  if (draft.dataType !== field.dataType) {
    patch.dataType = draft.dataType
  }

  if (draft.multiple !== field.multiple) {
    patch.multiple = draft.multiple
  }

  if (draft.computed !== field.computed) {
    patch.computed = draft.computed
  }

  if (draft.readOnly !== field.readOnly) {
    patch.readOnly = draft.readOnly
  }

  const nextOrder = Number(draft.order)
  if (nextOrder !== field.order) {
    patch.order = nextOrder
  }

  if (!visibleWhenEquals(nextVisibleWhen, field.visibleWhen)) {
    patch.visibleWhen = nextVisibleWhen
  }

  const nextDescription = normalizeRequiredString(draft.description)
  if (nextDescription !== field.description) {
    patch.description = nextDescription
  }

  const nextBusinessImpact = normalizeRequiredString(draft.businessImpact)
  if (nextBusinessImpact !== field.businessImpact) {
    patch.businessImpact = nextBusinessImpact
  }

  const nextPlaceholder = normalizeNullableString(draft.placeholder)
  if (nextPlaceholder !== (field.placeholder ?? null)) {
    patch.placeholder = nextPlaceholder
  }

  const nextMask = normalizeNullableString(draft.mask)
  if (nextMask !== (field.mask ?? null)) {
    patch.mask = nextMask
  }

  const nextOptionsSource = normalizeNullableString(draft.optionsSource)
  if (nextOptionsSource !== (field.optionsSource ?? null)) {
    patch.optionsSource = nextOptionsSource
  }

  return patch
}

export const getImportanceBadgeClass = (
  importance: FieldConfig["importance"]
) => {
  switch (importance) {
    case "HIGH":
      return "border border-amber-200 bg-amber-50 text-amber-800"
    case "MEDIUM":
      return "border border-sky-200 bg-sky-50 text-sky-800"
    default:
      return "border border-border bg-background text-muted-foreground"
  }
}

export const getImportanceLabel = (importance: FieldConfig["importance"]) =>
  IMPORTANCE_OPTIONS.find((option) => option.value === importance)?.label ??
  importance

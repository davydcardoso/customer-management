import type { FieldConfig, PersonType } from "@/shared/api/types"

export type PersonTypeFilter = "ALL" | PersonType
export type VisibleWhenMode = "ALL" | PersonType

export type EditableFieldDraft = {
  label: string
  section: string
  required: boolean
  importance: FieldConfig["importance"]
  inputType: FieldConfig["inputType"]
  dataType: FieldConfig["dataType"]
  multiple: boolean
  computed: boolean
  readOnly: boolean
  order: string
  visibleWhenMode: VisibleWhenMode
  description: string
  businessImpact: string
  placeholder: string
  mask: string
  optionsSource: string
}

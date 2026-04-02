import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangleIcon,
  FilterIcon,
  PencilIcon,
  SearchIcon,
  ShieldAlertIcon,
  SparklesIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useCustomerFormMetadata } from "@/features/form-metadata/use-customer-form-metadata"
import type {
  FieldConfig,
  PersonType,
  SectionConfig,
  UpdateFormFieldConfigInput,
  VisibleWhen,
} from "@/shared/api/types"
import {
  DATA_TYPE_OPTIONS,
  IMPORTANCE_OPTIONS,
  INPUT_TYPE_OPTIONS,
  PERSON_TYPE_OPTIONS,
} from "@/shared/lib/options"

type PersonTypeFilter = "ALL" | PersonType
type VisibleWhenMode = "ALL" | PersonType
type EditableFieldDraft = {
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

const ALL_SECTION_VALUE = "__all__"

const CRITICAL_FIELD_KEYS = new Set([
  "profile.cpf",
  "profile.cnpj",
  "profile.fullName",
  "profile.corporateName",
  "profile.tradeName",
  "responsibles",
])

const personTypeFilterOptions: Array<{
  value: PersonTypeFilter
  label: string
}> = [{ value: "ALL", label: "Todos" }, ...PERSON_TYPE_OPTIONS]

const visibleWhenOptions: Array<{ value: VisibleWhenMode; label: string }> = [
  { value: "ALL", label: "PF e PJ" },
  { value: "INDIVIDUAL", label: "Somente PF" },
  { value: "COMPANY", label: "Somente PJ" },
]

const formatVisibleWhen = (visibleWhen: VisibleWhen) => {
  const personTypes = visibleWhen?.personType ?? []

  if (personTypes.length === 0 || personTypes.length === 2) {
    return "PF e PJ"
  }

  return personTypes[0] === "INDIVIDUAL" ? "Somente PF" : "Somente PJ"
}

const getScopeLabel = (personType?: PersonType | null) => {
  if (!personType) {
    return "Todos os tipos de pessoa"
  }

  return personType === "INDIVIDUAL" ? "Pessoa Física" : "Pessoa Jurídica"
}

const getVisibleWhenMode = (visibleWhen: VisibleWhen): VisibleWhenMode => {
  const personTypes = visibleWhen?.personType ?? []

  if (personTypes.length === 1) {
    return personTypes[0]
  }

  return "ALL"
}

const toVisibleWhen = (mode: VisibleWhenMode): VisibleWhen => {
  if (mode === "ALL") {
    return null
  }

  return { personType: [mode] }
}

const normalizeNullableString = (value: string) => {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const normalizeRequiredString = (value: string) => value.trim()

const visibleWhenEquals = (left: VisibleWhen, right: VisibleWhen) => {
  const leftValues = [...(left?.personType ?? [])].sort()
  const rightValues = [...(right?.personType ?? [])].sort()

  return JSON.stringify(leftValues) === JSON.stringify(rightValues)
}

const createDraftFromField = (field: FieldConfig): EditableFieldDraft => ({
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

const buildFieldPatch = (
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

const getImportanceBadgeClass = (importance: FieldConfig["importance"]) => {
  switch (importance) {
    case "HIGH":
      return "border border-amber-200 bg-amber-50 text-amber-800"
    case "MEDIUM":
      return "border border-sky-200 bg-sky-50 text-sky-800"
    default:
      return "border border-border bg-background text-muted-foreground"
  }
}

const getImportanceLabel = (importance: FieldConfig["importance"]) =>
  IMPORTANCE_OPTIONS.find((option) => option.value === importance)?.label ??
  importance

const CustomerFormMetadataPage = () => {
  const [personTypeFilter, setPersonTypeFilter] =
    useState<PersonTypeFilter>("ALL")
  const [sectionFilter, setSectionFilter] = useState(ALL_SECTION_VALUE)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingField, setEditingField] = useState<FieldConfig | null>(null)
  const [draft, setDraft] = useState<EditableFieldDraft | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const { metadataQuery, updateFieldMutation } = useCustomerFormMetadata(
    personTypeFilter === "ALL" ? undefined : personTypeFilter
  )

  useEffect(() => {
    if (!editingField) {
      setDraft(null)
      setValidationError(null)
      return
    }

    setDraft(createDraftFromField(editingField))
    setValidationError(null)
  }, [editingField])

  const fields = metadataQuery.data?.fields ?? []
  const sectionOptions = useMemo(() => {
    const declaredSections = metadataQuery.data?.sections ?? []
    const declaredKeys = new Set(declaredSections.map((section) => section.key))
    const inferredSections: SectionConfig[] = []

    fields.forEach((field) => {
      if (!declaredKeys.has(field.section)) {
        inferredSections.push({
          key: field.section,
          label: field.section,
          description: "",
          order: Number.MAX_SAFE_INTEGER,
        })
      }
    })

    const uniqueInferredSections = inferredSections.filter(
      (section, index, collection) =>
        collection.findIndex((candidate) => candidate.key === section.key) ===
        index
    )

    return [...declaredSections, ...uniqueInferredSections].sort(
      (left, right) => left.order - right.order
    )
  }, [fields, metadataQuery.data?.sections])

  useEffect(() => {
    if (
      sectionFilter !== ALL_SECTION_VALUE &&
      !sectionOptions.some((section) => section.key === sectionFilter)
    ) {
      setSectionFilter(ALL_SECTION_VALUE)
    }
  }, [sectionFilter, sectionOptions])

  const filteredFields = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return fields
      .filter((field) => {
        const matchesSearch =
          term.length === 0 ||
          field.fieldKey.toLowerCase().includes(term) ||
          field.label.toLowerCase().includes(term)

        const matchesSection =
          sectionFilter === ALL_SECTION_VALUE || field.section === sectionFilter

        return matchesSearch && matchesSection
      })
      .sort((left, right) => left.order - right.order)
  }, [fields, searchTerm, sectionFilter])

  const groupedSections = useMemo(
    () =>
      sectionOptions
        .map((section) => ({
          section,
          fields: filteredFields.filter(
            (field) => field.section === section.key
          ),
        }))
        .filter((group) => group.fields.length > 0),
    [filteredFields, sectionOptions]
  )

  const activeScopeLabel = getScopeLabel(
    metadataQuery.data?.scope?.personType ??
      (personTypeFilter === "ALL" ? null : personTypeFilter)
  )

  const handleDraftChange = <K extends keyof EditableFieldDraft>(
    key: K,
    value: EditableFieldDraft[K]
  ) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current))
  }

  const handleSave = async () => {
    if (!editingField || !draft) {
      return
    }

    const label = normalizeRequiredString(draft.label)
    const section = normalizeRequiredString(draft.section)
    const description = normalizeRequiredString(draft.description)
    const businessImpact = normalizeRequiredString(draft.businessImpact)
    const parsedOrder = Number(draft.order)

    if (!label || !section || !description || !businessImpact) {
      setValidationError(
        "Preencha label, seção, descrição e impacto de negócio."
      )
      return
    }

    if (!Number.isInteger(parsedOrder) || parsedOrder < 0) {
      setValidationError(
        "A ordem deve ser um número inteiro maior ou igual a zero."
      )
      return
    }

    const patch = buildFieldPatch(editingField, draft)

    if (Object.keys(patch).length === 0) {
      toast.info("Nenhuma alteração para salvar.")
      setEditingField(null)
      return
    }

    try {
      await updateFieldMutation.mutateAsync({
        fieldKey: editingField.fieldKey,
        input: patch,
      })
      toast.success("Configuração do campo atualizada.")
      setEditingField(null)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a configuração."
      setValidationError(message)
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
        <Card>
          <CardHeader>
            <div className="inline-flex w-fit rounded-lg border border-primary bg-accent px-3 py-1 text-xs font-medium tracking-[0.18em] text-primary-foreground uppercase">
              Administração
            </div>
            <CardTitle className="text-3xl tracking-tight text-foreground">
              Padronização do cadastro de clientes
            </CardTitle>
            <CardDescription className="max-w-4xl text-base leading-7">
              Configure a estrutura dos campos do formulário de clientes,
              controlando obrigatoriedade, importância, visibilidade e
              comportamento de exibição sem alterar o código do cadastro em si.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Visão rápida</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                Escopo ativo
              </div>
              <div className="mt-2 text-lg font-semibold text-foreground">
                {activeScopeLabel}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                Campos visíveis
              </div>
              <div className="mt-2 text-lg font-semibold text-foreground">
                {filteredFields.length}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                Campos críticos
              </div>
              <div className="mt-2 text-lg font-semibold text-foreground">
                {
                  filteredFields.filter((field) =>
                    CRITICAL_FIELD_KEYS.has(field.fieldKey)
                  ).length
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <CardTitle className="text-xl">Configuração dos campos</CardTitle>
              <CardDescription className="mt-1">
                Busque por label ou chave técnica, filtre por seção e ajuste
                cada campo individualmente.
              </CardDescription>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,280px)_220px_220px]">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por chave ou label"
                  className="h-10 pl-9"
                />
              </div>

              <Select
                value={personTypeFilter}
                onValueChange={(value) =>
                  setPersonTypeFilter(value as PersonTypeFilter)
                }
              >
                <SelectTrigger className="h-10 w-full bg-background">
                  <SelectValue placeholder="Tipo de pessoa" />
                </SelectTrigger>
                <SelectContent>
                  {personTypeFilterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sectionFilter} onValueChange={setSectionFilter}>
                <SelectTrigger className="h-10 w-full bg-background">
                  <SelectValue placeholder="Filtrar por seção" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_SECTION_VALUE}>
                    Todas as seções
                  </SelectItem>
                  {sectionOptions.map((section) => (
                    <SelectItem key={section.key} value={section.key}>
                      {section.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {metadataQuery.data ? (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                formKey: {metadataQuery.data.formKey}
              </Badge>
              <Badge variant="outline">
                entity: {metadataQuery.data.entity}
              </Badge>
              <Badge variant="outline">
                version: {metadataQuery.data.version}
              </Badge>
              <Badge variant="outline">
                {metadataQuery.data.fields.length} campos retornados
              </Badge>
              {metadataQuery.isFetching ? (
                <Badge className="border border-sky-200 bg-sky-50 text-sky-700">
                  Atualizando
                </Badge>
              ) : null}
            </div>
          ) : null}
        </CardHeader>

        <CardContent>
          {metadataQuery.isLoading ? (
            <div className="flex min-h-72 items-center justify-center">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-2">
                <Spinner className="size-4" />
                <span className="text-sm text-muted-foreground">
                  Carregando metadados do formulário...
                </span>
              </div>
            </div>
          ) : metadataQuery.isError ? (
            <Empty className="min-h-72 border border-dashed border-red-200 bg-red-50/70">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <AlertTriangleIcon className="text-red-500" />
                </EmptyMedia>
                <EmptyTitle>Falha ao carregar as configurações</EmptyTitle>
                <EmptyDescription>
                  Verifique a autenticação e a disponibilidade de `GET
                  /form-metadata/customers/fields`.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : groupedSections.length === 0 ? (
            <Empty className="min-h-72 border border-dashed border-border bg-background">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FilterIcon />
                </EmptyMedia>
                <EmptyTitle>Nenhum campo encontrado</EmptyTitle>
                <EmptyDescription>
                  Ajuste a busca ou os filtros aplicados.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-5">
              {groupedSections.map(({ section, fields: sectionFields }) => (
                <MetadataSectionCard
                  key={section.key}
                  section={section}
                  fields={sectionFields}
                  onEdit={setEditingField}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={Boolean(editingField)}
        onOpenChange={(open) => !open && setEditingField(null)}
      >
        <SheetContent className="w-full gap-0 overflow-hidden p-0 data-[side=right]:sm:max-w-4xl">
          <SheetHeader className="border-b border-border bg-background">
            <SheetTitle>Editar configuração do campo</SheetTitle>
            <SheetDescription>
              Ajuste a definição persistida no backend e salve apenas as
              mudanças necessárias para este campo.
            </SheetDescription>
          </SheetHeader>

          {editingField && draft ? (
            <>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="mb-4 rounded-lg border border-border bg-background p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{editingField.fieldKey}</Badge>
                    <Badge variant="outline">{editingField.section}</Badge>
                    {CRITICAL_FIELD_KEYS.has(editingField.fieldKey) ? (
                      <Badge className="border border-red-200 bg-red-50 text-red-700">
                        Campo crítico
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <EditorField label="Label">
                    <Input
                      value={draft.label}
                      onChange={(event) =>
                        handleDraftChange("label", event.target.value)
                      }
                    />
                  </EditorField>

                  <EditorField label="Seção">
                    <Select
                      value={draft.section}
                      onValueChange={(value) =>
                        handleDraftChange("section", value)
                      }
                    >
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {!sectionOptions.some(
                          (section) => section.key === draft.section
                        ) ? (
                          <SelectItem value={draft.section}>
                            {draft.section}
                          </SelectItem>
                        ) : null}
                        {sectionOptions.map((section) => (
                          <SelectItem key={section.key} value={section.key}>
                            {section.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </EditorField>

                  <EditorField label="Importância">
                    <Select
                      value={draft.importance}
                      onValueChange={(value) =>
                        handleDraftChange(
                          "importance",
                          value as FieldConfig["importance"]
                        )
                      }
                    >
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {IMPORTANCE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </EditorField>

                  <EditorField label="Ordem">
                    <Input
                      type="number"
                      min={0}
                      value={draft.order}
                      onChange={(event) =>
                        handleDraftChange("order", event.target.value)
                      }
                    />
                  </EditorField>

                  <EditorField label="Tipo de input">
                    <Select
                      value={draft.inputType}
                      onValueChange={(value) =>
                        handleDraftChange(
                          "inputType",
                          value as FieldConfig["inputType"]
                        )
                      }
                    >
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INPUT_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </EditorField>

                  <EditorField label="Tipo de dado">
                    <Select
                      value={draft.dataType}
                      onValueChange={(value) =>
                        handleDraftChange(
                          "dataType",
                          value as FieldConfig["dataType"]
                        )
                      }
                    >
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DATA_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </EditorField>

                  <EditorField label="Regra de visibilidade">
                    <Select
                      value={draft.visibleWhenMode}
                      onValueChange={(value) =>
                        handleDraftChange(
                          "visibleWhenMode",
                          value as VisibleWhenMode
                        )
                      }
                    >
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {visibleWhenOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </EditorField>

                  <EditorField label="Placeholder">
                    <Input
                      value={draft.placeholder}
                      onChange={(event) =>
                        handleDraftChange("placeholder", event.target.value)
                      }
                    />
                  </EditorField>

                  <EditorField label="Máscara">
                    <Input
                      value={draft.mask}
                      onChange={(event) =>
                        handleDraftChange("mask", event.target.value)
                      }
                    />
                  </EditorField>

                  <EditorField label="Origem das opções">
                    <Input
                      value={draft.optionsSource}
                      onChange={(event) =>
                        handleDraftChange("optionsSource", event.target.value)
                      }
                    />
                  </EditorField>

                  <div className="grid gap-3 rounded-lg border border-border bg-background p-4 md:col-span-2 md:grid-cols-2 xl:grid-cols-4">
                    <ToggleItem
                      label="Obrigatório"
                      checked={draft.required}
                      onCheckedChange={(checked) =>
                        handleDraftChange("required", Boolean(checked))
                      }
                    />
                    <ToggleItem
                      label="Coleção"
                      checked={draft.multiple}
                      onCheckedChange={(checked) =>
                        handleDraftChange("multiple", Boolean(checked))
                      }
                    />
                    <ToggleItem
                      label="Calculado"
                      checked={draft.computed}
                      onCheckedChange={(checked) =>
                        handleDraftChange("computed", Boolean(checked))
                      }
                    />
                    <ToggleItem
                      label="Somente leitura"
                      checked={draft.readOnly}
                      onCheckedChange={(checked) =>
                        handleDraftChange("readOnly", Boolean(checked))
                      }
                    />
                  </div>

                  <EditorField label="Descrição" className="md:col-span-2">
                    <Textarea
                      value={draft.description}
                      onChange={(event) =>
                        handleDraftChange("description", event.target.value)
                      }
                      className="min-h-28 bg-background"
                    />
                  </EditorField>

                  <EditorField
                    label="Impacto de negócio"
                    className="md:col-span-2"
                  >
                    <Textarea
                      value={draft.businessImpact}
                      onChange={(event) =>
                        handleDraftChange("businessImpact", event.target.value)
                      }
                      className="min-h-28 bg-background"
                    />
                  </EditorField>
                </div>

                {validationError ? (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {validationError}
                  </div>
                ) : null}
              </div>

              <SheetFooter className="border-t border-border bg-background">
                <Button
                  variant="outline"
                  onClick={() => setEditingField(null)}
                  disabled={updateFieldMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateFieldMutation.isPending}
                >
                  {updateFieldMutation.isPending ? (
                    <>
                      <Spinner className="size-4" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <PencilIcon className="size-4" />
                      Salvar alterações
                    </>
                  )}
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}

const MetadataSectionCard = ({
  section,
  fields,
  onEdit,
}: {
  section: SectionConfig
  fields: FieldConfig[]
  onEdit: (field: FieldConfig) => void
}) => (
  <Card className="overflow-hidden">
    <CardHeader className="border-b border-border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="text-xl text-foreground">
            {section.label}
          </CardTitle>
          <CardDescription className="mt-1">
            {section.description
              ? `${section.description} · ${fields.length} campo(s) configurado(s).`
              : `${fields.length} campo(s) configurado(s) nesta seção.`}
          </CardDescription>
        </div>
        <Badge variant="outline">section: {section.key}</Badge>
      </div>
    </CardHeader>
    <CardContent className="divide-y divide-border px-0">
      {fields.map((field) => (
        <FieldListItem key={field.fieldKey} field={field} onEdit={onEdit} />
      ))}
    </CardContent>
  </Card>
)

const FieldListItem = ({
  field,
  onEdit,
}: {
  field: FieldConfig
  onEdit: (field: FieldConfig) => void
}) => {
  const isCritical = CRITICAL_FIELD_KEYS.has(field.fieldKey)

  return (
    <article
      className={`px-4 py-4 first:pt-0 last:pb-0 ${
        isCritical ? "border-l-2 border-l-red-200" : ""
      }`}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-base font-semibold text-foreground">
                  {field.label}
                </div>
                {isCritical ? (
                  <Badge className="border border-red-200 bg-red-50 text-red-700">
                    <ShieldAlertIcon className="size-3.5" />
                    Campo crítico
                  </Badge>
                ) : null}
              </div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">
                {field.fieldKey}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {field.required ? <Badge>Obrigatório</Badge> : null}
            <Badge className={getImportanceBadgeClass(field.importance)}>
              Importância {getImportanceLabel(field.importance).toLowerCase()}
            </Badge>
            {field.computed ? (
              <Badge className="border border-violet-200 bg-violet-50 text-violet-700">
                Calculado
              </Badge>
            ) : null}
            {field.readOnly ? (
              <Badge className="border border-slate-200 bg-slate-50 text-slate-700">
                Leitura
              </Badge>
            ) : null}
            {field.multiple ? <Badge variant="outline">Coleção</Badge> : null}
          </div>

          <div className="grid gap-x-6 gap-y-2 border-t border-border pt-3 text-sm sm:grid-cols-2 xl:grid-cols-5">
            <InlineMetaItem label="Seção" value={field.section} />
            <InlineMetaItem label="Ordem" value={String(field.order)} />
            <InlineMetaItem label="Input" value={field.inputType} />
            <InlineMetaItem label="Data type" value={field.dataType} />
            <InlineMetaItem
              label="Visibilidade"
              value={formatVisibleWhen(field.visibleWhen)}
            />
          </div>

          <div className="grid gap-4 border-t border-border pt-3 xl:grid-cols-2">
            <div className="space-y-1">
              <div className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                Descrição
              </div>
              <p className="text-sm leading-6 text-foreground">
                {field.description}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                <SparklesIcon className="size-3.5" />
                Impacto de negócio
              </div>
              <p
                className={
                  isCritical
                    ? "text-sm leading-6 text-red-800"
                    : "text-sm leading-6 text-foreground"
                }
              >
                {field.businessImpact}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-start justify-end">
          <Button variant="outline" onClick={() => onEdit(field)}>
            <PencilIcon className="size-4" />
            Editar
          </Button>
        </div>
      </div>
    </article>
  )
}

const EditorField = ({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) => (
  <div className={className}>
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  </div>
)

const ToggleItem = ({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) => (
  <label className="flex items-center gap-3 text-sm text-foreground">
    <Checkbox
      checked={checked}
      onCheckedChange={(checked) => onCheckedChange(Boolean(checked))}
    />
    {label}
  </label>
)

const InlineMetaItem = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0">
    <div className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
      {label}
    </div>
    <div className="mt-1 truncate font-medium text-foreground">{value}</div>
  </div>
)

export { CustomerFormMetadataPage }

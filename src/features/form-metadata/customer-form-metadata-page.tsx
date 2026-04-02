import { useEffect, useMemo, useState } from "react"
import { AlertTriangleIcon, FilterIcon, SearchIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Spinner } from "@/components/ui/spinner"
import { FieldEditorSheet } from "@/features/form-metadata/components/field-editor-sheet"
import { MetadataSectionCard } from "@/features/form-metadata/components/metadata-section-card"
import {
  ALL_SECTION_VALUE,
  CRITICAL_FIELD_KEYS,
  buildFieldPatch,
  createDraftFromField,
  getScopeLabel,
  normalizeRequiredString,
  personTypeFilterOptions,
} from "@/features/form-metadata/lib/customer-form-metadata-helpers"
import type {
  EditableFieldDraft,
  PersonTypeFilter,
} from "@/features/form-metadata/types/customer-form-metadata-types"
import { useCustomerFormMetadata } from "@/features/form-metadata/use-customer-form-metadata"
import type { FieldConfig, SectionConfig } from "@/shared/api/types"

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

      <FieldEditorSheet
        field={editingField}
        draft={draft}
        sectionOptions={sectionOptions}
        validationError={validationError}
        isSaving={updateFieldMutation.isPending}
        onDraftChange={handleDraftChange}
        onClose={() => setEditingField(null)}
        onSave={handleSave}
      />
    </div>
  )
}

export { CustomerFormMetadataPage }

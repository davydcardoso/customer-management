import { PencilIcon } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
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
import { visibleWhenOptions } from "@/features/form-metadata/lib/customer-form-metadata-helpers"
import type {
  EditableFieldDraft,
  VisibleWhenMode,
} from "@/features/form-metadata/types/customer-form-metadata-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CRITICAL_FIELD_KEYS } from "@/features/form-metadata/lib/customer-form-metadata-helpers"
import type { FieldConfig, SectionConfig } from "@/shared/api/types"
import {
  DATA_TYPE_OPTIONS,
  IMPORTANCE_OPTIONS,
  INPUT_TYPE_OPTIONS,
} from "@/shared/lib/options"

export const FieldEditorSheet = ({
  field,
  draft,
  sectionOptions,
  validationError,
  isSaving,
  onDraftChange,
  onClose,
  onSave,
}: {
  field: FieldConfig | null
  draft: EditableFieldDraft | null
  sectionOptions: SectionConfig[]
  validationError: string | null
  isSaving: boolean
  onDraftChange: <K extends keyof EditableFieldDraft>(
    key: K,
    value: EditableFieldDraft[K]
  ) => void
  onClose: () => void
  onSave: () => void
}) => (
  <Sheet open={Boolean(field)} onOpenChange={(open) => !open && onClose()}>
    <SheetContent className="w-full gap-0 overflow-hidden p-0 data-[side=right]:sm:max-w-4xl">
      <SheetHeader className="border-b border-border bg-background">
        <SheetTitle>Editar configuração do campo</SheetTitle>
        <SheetDescription>
          Ajuste a definição persistida no backend e salve apenas as mudanças
          necessárias para este campo.
        </SheetDescription>
      </SheetHeader>

      {field && draft ? (
        <>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4 rounded-lg border border-border bg-background p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{field.fieldKey}</Badge>
                <Badge variant="outline">{field.section}</Badge>
                {CRITICAL_FIELD_KEYS.has(field.fieldKey) ? (
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
                    onDraftChange("label", event.target.value)
                  }
                />
              </EditorField>

              <EditorField label="Seção">
                <Select
                  value={draft.section}
                  onValueChange={(value) => onDraftChange("section", value)}
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
                    onDraftChange(
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
                    onDraftChange("order", event.target.value)
                  }
                />
              </EditorField>

              <EditorField label="Tipo de input">
                <Select
                  value={draft.inputType}
                  onValueChange={(value) =>
                    onDraftChange(
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
                    onDraftChange("dataType", value as FieldConfig["dataType"])
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
                    onDraftChange("visibleWhenMode", value as VisibleWhenMode)
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
                    onDraftChange("placeholder", event.target.value)
                  }
                />
              </EditorField>

              <EditorField label="Máscara">
                <Input
                  value={draft.mask}
                  onChange={(event) =>
                    onDraftChange("mask", event.target.value)
                  }
                />
              </EditorField>

              <EditorField label="Origem das opções">
                <Input
                  value={draft.optionsSource}
                  onChange={(event) =>
                    onDraftChange("optionsSource", event.target.value)
                  }
                />
              </EditorField>

              <div className="grid gap-3 rounded-lg border border-border bg-background p-4 md:col-span-2 md:grid-cols-2 xl:grid-cols-4">
                <ToggleItem
                  label="Obrigatório"
                  checked={draft.required}
                  onCheckedChange={(checked) =>
                    onDraftChange("required", Boolean(checked))
                  }
                />
                <ToggleItem
                  label="Coleção"
                  checked={draft.multiple}
                  onCheckedChange={(checked) =>
                    onDraftChange("multiple", Boolean(checked))
                  }
                />
                <ToggleItem
                  label="Calculado"
                  checked={draft.computed}
                  onCheckedChange={(checked) =>
                    onDraftChange("computed", Boolean(checked))
                  }
                />
                <ToggleItem
                  label="Somente leitura"
                  checked={draft.readOnly}
                  onCheckedChange={(checked) =>
                    onDraftChange("readOnly", Boolean(checked))
                  }
                />
              </div>

              <EditorField label="Descrição" className="md:col-span-2">
                <Textarea
                  value={draft.description}
                  onChange={(event) =>
                    onDraftChange("description", event.target.value)
                  }
                  className="min-h-28 bg-background"
                />
              </EditorField>

              <EditorField label="Impacto de negócio" className="md:col-span-2">
                <Textarea
                  value={draft.businessImpact}
                  onChange={(event) =>
                    onDraftChange("businessImpact", event.target.value)
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
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={onSave} disabled={isSaving}>
              {isSaving ? (
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
)

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

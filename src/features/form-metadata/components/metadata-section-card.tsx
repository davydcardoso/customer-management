import { PencilIcon, ShieldAlertIcon, SparklesIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  CRITICAL_FIELD_KEYS,
  formatVisibleWhen,
  getImportanceBadgeClass,
  getImportanceLabel,
} from "@/features/form-metadata/lib/customer-form-metadata-helpers"
import type { FieldConfig, SectionConfig } from "@/shared/api/types"

export const MetadataSectionCard = ({
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

const InlineMetaItem = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0">
    <div className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
      {label}
    </div>
    <div className="mt-1 truncate font-medium text-foreground">{value}</div>
  </div>
)

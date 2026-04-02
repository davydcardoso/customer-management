import { useEffect, useMemo, useState } from "react"
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type UseFormReturn,
} from "react-hook-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeftIcon,
  Building2Icon,
  ChevronsUpDownIcon,
  PlusIcon,
  SaveIcon,
  SearchIcon,
  SparklesIcon,
  Trash2Icon,
  UserRoundIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  EMPTY_SELECT_VALUE,
  calculateYearsFromDate,
  createDefaultValues,
  createEmptyContact,
  createEmptyEmail,
  createEmptyResponsible,
  getFieldClasses,
  groupFields,
  hasValue,
  mapCustomerToFormValues,
  mergeResponsibleMetadata,
  toPayload,
} from "@/features/customers/lib/customer-form-helpers"
import { customerService } from "@/features/customers/customer-service"
import type {
  ContactEmailSectionProps,
  ContactFormValues,
  CustomerFormPageProps,
  CustomerFormValues,
  FieldProps,
} from "@/features/customers/types/customer-form-types"
import { formMetadataService } from "@/features/form-metadata/form-metadata-service"
import { ApiError } from "@/shared/api/http-client"
import type {
  CommunicationChannel,
  CommunicationPreferenceInput,
  CommunicationTopic,
  CustomerCreateInput,
  CustomerResponse,
  CustomerUpdateInput,
  FieldConfig,
  GroupedFieldSection,
} from "@/shared/api/types"
import {
  formatCurrency,
  formatPercent,
  getCommunicationChannelLabel,
  getCommunicationTopicLabel,
  getCustomerDisplayName,
  getPersonTypeLabel,
} from "@/shared/lib/format"
import { applyMask, applyPhoneMask } from "@/shared/lib/masks"
import {
  CITY_OPTIONS,
  COMMUNICATION_CHANNEL_OPTIONS,
  COMMUNICATION_TOPIC_OPTIONS,
  CONTACT_TYPE_OPTIONS,
  getStaticOptions,
  PERSON_TYPE_OPTIONS,
  STATE_OPTIONS,
} from "@/shared/lib/options"
import { getValueByPath } from "@/shared/lib/object-path"
import { useDebouncedValue } from "@/shared/lib/use-debounced-value"

const BooleanSelect = ({
  fieldConfig,
  value,
  onChange,
  disabled,
}: {
  fieldConfig: FieldConfig
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) => (
  <Select
    value={value || EMPTY_SELECT_VALUE}
    onValueChange={(nextValue) =>
      onChange(nextValue === EMPTY_SELECT_VALUE ? "" : nextValue)
    }
    disabled={disabled}
  >
    <SelectTrigger className="w-full">
      <SelectValue placeholder="Selecione" />
    </SelectTrigger>
    <SelectContent>
      {!fieldConfig.required && (
        <SelectItem value={EMPTY_SELECT_VALUE}>Não informado</SelectItem>
      )}
      <SelectItem value="true">Sim</SelectItem>
      <SelectItem value="false">Não</SelectItem>
    </SelectContent>
  </Select>
)

const ScalarField = ({ fieldConfig, form, name, disabled }: FieldProps) => {
  const options =
    fieldConfig.fieldKey === "personType"
      ? PERSON_TYPE_OPTIONS
      : getStaticOptions(fieldConfig.optionsSource)

  const error = getValueByPath(form.formState.errors, name) as
    | { message?: string }
    | undefined
  const isOptionalStateField =
    name.endsWith("address.state") || fieldConfig.fieldKey === "address.state"
  const isOptionalCityField =
    name.endsWith("address.city") || fieldConfig.fieldKey === "address.city"

  return (
    <Controller
      control={form.control}
      name={name as never}
      rules={{
        validate: (value) => {
          if (!fieldConfig.required || fieldConfig.readOnly) {
            return true
          }

          return hasValue(value) || `${fieldConfig.label} é obrigatório.`
        },
      }}
      render={({ field }) => {
        const value = typeof field.value === "string" ? field.value : ""

        if (fieldConfig.inputType === "textarea") {
          return (
            <div className="space-y-2">
              <Textarea
                value={value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={fieldConfig.placeholder || fieldConfig.label}
                aria-invalid={Boolean(error?.message)}
                readOnly={fieldConfig.readOnly}
                disabled={disabled}
                className={
                  fieldConfig.readOnly
                    ? "bg-background text-muted-foreground"
                    : undefined
                }
              />
              {error?.message ? (
                <p className="text-xs text-rose-600">{error.message}</p>
              ) : null}
            </div>
          )
        }

        if (fieldConfig.inputType === "select" && options.length > 0) {
          return (
            <div className="space-y-2">
              <Select
                value={value || EMPTY_SELECT_VALUE}
                onValueChange={(nextValue) =>
                  field.onChange(
                    nextValue === EMPTY_SELECT_VALUE ? "" : nextValue
                  )
                }
                disabled={disabled || fieldConfig.readOnly}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {!fieldConfig.required && (
                    <SelectItem value={EMPTY_SELECT_VALUE}>
                      Não informado
                    </SelectItem>
                  )}
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {error?.message ? (
                <p className="text-xs text-rose-600">{error.message}</p>
              ) : null}
            </div>
          )
        }

        if (fieldConfig.inputType === "boolean") {
          return (
            <div className="space-y-2">
              <BooleanSelect
                fieldConfig={fieldConfig}
                value={value}
                onChange={field.onChange}
                disabled={disabled || fieldConfig.readOnly}
              />
              {error?.message ? (
                <p className="text-xs text-rose-600">{error.message}</p>
              ) : null}
            </div>
          )
        }

        const inputType = fieldConfig.inputType === "date" ? "date" : "text"
        const inputMode =
          fieldConfig.inputType === "number" ||
          fieldConfig.inputType === "currency"
            ? "decimal"
            : fieldConfig.inputType === "document"
              ? "numeric"
              : undefined
        const listId = isOptionalStateField
          ? "state-suggestions"
          : isOptionalCityField
            ? "city-suggestions"
            : undefined

        return (
          <div className="space-y-2">
            <Input
              type={inputType}
              inputMode={inputMode}
              list={listId}
              value={value}
              onBlur={field.onBlur}
              onChange={(event) => {
                const nextValue =
                  fieldConfig.inputType === "document"
                    ? applyMask(fieldConfig.mask, event.target.value)
                    : event.target.value

                field.onChange(nextValue)
              }}
              placeholder={fieldConfig.placeholder || fieldConfig.label}
              aria-invalid={Boolean(error?.message)}
              readOnly={fieldConfig.readOnly}
              disabled={disabled}
              className={
                fieldConfig.readOnly
                  ? "bg-background text-muted-foreground"
                  : undefined
              }
            />
            {error?.message ? (
              <p className="text-xs text-rose-600">{error.message}</p>
            ) : null}
          </div>
        )
      }}
    />
  )
}

const SectionGrid = ({
  children,
  wide,
}: {
  children: React.ReactNode
  wide?: boolean
}) => (
  <div
    className={`grid gap-4 ${
      wide ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-4"
    }`}
  >
    {children}
  </div>
)

const ReferralSearchInput = ({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) => {
  const debouncedValue = useDebouncedValue(value.trim(), 300)
  const searchQuery = useQuery({
    queryKey: ["customer-referral-search", debouncedValue],
    queryFn: () => customerService.search(debouncedValue),
    enabled: debouncedValue.length >= 2,
    staleTime: 30_000,
  })

  return (
    <div className="space-y-2">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Busque por nome, CPF ou CNPJ"
          className="pl-9"
          disabled={disabled}
        />
      </div>

      {debouncedValue.length >= 2 && (
        <div className="rounded-lg border border-border bg-background p-2">
          {searchQuery.isLoading ? (
            <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
              <Spinner className="size-3.5" />
              Buscando indicação...
            </div>
          ) : searchQuery.data?.length ? (
            <div className="space-y-1">
              {searchQuery.data.map((item) => {
                const label =
                  item.name || item.tradeName || item.document || "Cliente"

                return (
                  <button
                    key={item.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm transition hover:bg-card"
                    onClick={() => onChange(label)}
                  >
                    <div>
                      <div className="font-medium text-foreground">{label}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.document || "Sem documento"} •{" "}
                        {getPersonTypeLabel(item.personType)}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="px-2 py-1 text-xs text-muted-foreground">
              Nenhum cliente encontrado para esta indicação.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const FieldBlock = ({ fieldConfig, form, name, disabled }: FieldProps) => {
  const label = `${fieldConfig.label}${fieldConfig.required ? " *" : ""}`

  return (
    <div className="min-w-0 space-y-2">
      <label className={getFieldClasses(fieldConfig)}>{label}</label>
      {fieldConfig.fieldKey.endsWith("referralName") ? (
        <Controller
          control={form.control}
          name={name as never}
          rules={{
            validate: (value) =>
              !fieldConfig.required ||
              hasValue(value) ||
              `${fieldConfig.label} é obrigatório.`,
          }}
          render={({ field }) => (
            <ReferralSearchInput
              value={field.value as string}
              onChange={field.onChange}
              disabled={disabled}
            />
          )}
        />
      ) : (
        <ScalarField
          fieldConfig={fieldConfig}
          form={form}
          name={name}
          disabled={disabled}
        />
      )}
    </div>
  )
}

const ContactsEditor = ({
  form,
  name,
  fieldConfig,
}: {
  form: UseFormReturn<CustomerFormValues>
  name: string
  fieldConfig: FieldConfig
}) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: name as never,
  })
  const watchedContacts = useWatch({
    control: form.control,
    name: name as never,
  }) as ContactFormValues[] | undefined

  return (
    <CollectionSection
      title={fieldConfig.label}
      actionLabel="Adicionar contato"
      onAdd={() => append(createEmptyContact() as never)}
    >
      <div className="space-y-4">
        {fields.map((row, index) => {
          const typeName = `${name}.${index}.type`
          const valueName = `${name}.${index}.value`
          const labelName = `${name}.${index}.label`
          const whatsappName = `${name}.${index}.isWhatsapp`
          const currentType = watchedContacts?.[index]?.type || "MOBILE"

          return (
            <div
              key={row.id}
              className="grid gap-3 border-b border-border/70 pb-4 last:border-b-0 last:pb-0 md:grid-cols-[minmax(0,1.4fr)_180px_140px_minmax(0,1fr)_auto] md:items-start"
            >
              <Controller
                control={form.control}
                name={valueName as never}
                render={({ field }) => (
                  <Input
                    value={(field.value as string) || ""}
                    onChange={(event) =>
                      field.onChange(
                        currentType === "MESSAGING"
                          ? event.target.value
                          : applyPhoneMask(event.target.value)
                      )
                    }
                    placeholder="Contato"
                  />
                )}
              />

              <Controller
                control={form.control}
                name={typeName as never}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTACT_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />

              <Controller
                control={form.control}
                name={whatsappName as never}
                render={({ field }) => (
                  <label className="flex h-8 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm text-foreground">
                    <Checkbox
                      checked={Boolean(field.value)}
                      onCheckedChange={(checked) =>
                        field.onChange(Boolean(checked))
                      }
                    />
                    WhatsApp
                  </label>
                )}
              />

              <Controller
                control={form.control}
                name={labelName as never}
                render={({ field }) => (
                  <Input
                    value={(field.value as string) || ""}
                    onChange={field.onChange}
                    placeholder="Rótulo"
                  />
                )}
              />

              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          )
        })}
      </div>
    </CollectionSection>
  )
}

const EmailsEditor = ({
  form,
  name,
  fieldConfig,
}: {
  form: UseFormReturn<CustomerFormValues>
  name: string
  fieldConfig: FieldConfig
}) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: name as never,
  })

  return (
    <CollectionSection
      title={fieldConfig.label}
      actionLabel="Adicionar e-mail"
      onAdd={() => append(createEmptyEmail() as never)}
    >
      <div className="space-y-4">
        {fields.map((row, index) => (
          <div
            key={row.id}
            className="grid gap-3 border-b border-border/70 pb-4 last:border-b-0 last:pb-0 md:grid-cols-[minmax(0,1.5fr)_220px_auto] md:items-start"
          >
            <Controller
              control={form.control}
              name={`${name}.${index}.email` as never}
              render={({ field }) => (
                <Input
                  type="email"
                  value={(field.value as string) || ""}
                  onChange={field.onChange}
                  placeholder="email@dominio.com"
                />
              )}
            />
            <Controller
              control={form.control}
              name={`${name}.${index}.label` as never}
              render={({ field }) => (
                <Input
                  value={(field.value as string) || ""}
                  onChange={field.onChange}
                  placeholder="Rótulo"
                />
              )}
            />
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              onClick={() => remove(index)}
              disabled={fields.length === 1}
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </CollectionSection>
  )
}

const CollectionSection = ({
  title,
  actionLabel,
  onAdd,
  children,
}: {
  title: string
  actionLabel?: string
  onAdd?: () => void
  children: React.ReactNode
}) => (
  <div className="space-y-4">
    <div className="flex items-start justify-between gap-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {onAdd && actionLabel ? (
        <Button type="button" size="sm" onClick={onAdd}>
          <PlusIcon className="size-4" />
          {actionLabel}
        </Button>
      ) : null}
    </div>
    {children}
  </div>
)

const FormSection = ({
  title,
  children,
  withDivider = false,
}: {
  title: string
  children: React.ReactNode
  withDivider?: boolean
}) => (
  <section
    className={`space-y-4 ${withDivider ? "border-t border-border pt-6" : ""}`}
  >
    <div className="text-lg font-semibold text-foreground">{title}</div>
    {children}
  </section>
)

const ComputedInputBlock = ({
  label,
  value,
}: {
  label: string
  value: string
}) => (
  <div className="min-w-0 space-y-2">
    <label className="text-sm font-medium text-foreground">{label}</label>
    <Input value={value} readOnly className="bg-background" />
  </div>
)

const ComputedAgeBlock = ({
  label,
  value,
}: {
  label: string
  value: string
}) => {
  const numericValue = Number(value)
  const progressValue = Number.isFinite(numericValue)
    ? Math.max(0, Math.min(100, numericValue))
    : 0

  return (
    <div className="min-w-0 space-y-3 md:col-span-2 xl:col-span-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <Input
        value={value ? `${value} anos` : "—"}
        readOnly
        className="bg-background"
      />
      <Progress value={progressValue} className="h-2 bg-secondary" />
    </div>
  )
}

const ContactEmailSection = ({
  form,
  contactsFieldConfig,
  emailsFieldConfig,
  contactsName,
  emailsName,
}: ContactEmailSectionProps) => (
  <div className="grid gap-6 xl:grid-cols-2">
    {contactsFieldConfig ? (
      <ContactsEditor
        form={form}
        name={contactsName}
        fieldConfig={contactsFieldConfig}
      />
    ) : null}
    {emailsFieldConfig ? (
      <EmailsEditor
        form={form}
        name={emailsName}
        fieldConfig={emailsFieldConfig}
      />
    ) : null}
  </div>
)

const CommunicationChannelSelect = ({
  channel,
  preferences,
  onToggle,
}: {
  channel: CommunicationChannel
  preferences: CommunicationPreferenceInput[] | undefined
  onToggle: (
    channel: CommunicationChannel,
    topic: CommunicationTopic,
    enabled: boolean
  ) => void
}) => {
  const [open, setOpen] = useState(false)

  const selectedTopics = COMMUNICATION_TOPIC_OPTIONS.filter((topic) =>
    preferences?.some(
      (preference) =>
        preference.channel === channel &&
        preference.topic === topic.value &&
        preference.enabled
    )
  )

  const availableTopics = COMMUNICATION_TOPIC_OPTIONS.filter(
    (topic) =>
      !selectedTopics.some(
        (selectedTopic) => selectedTopic.value === topic.value
      )
  )

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {getCommunicationChannelLabel(channel)}
      </label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            role="button"
            tabIndex={0}
            className="flex min-h-10 w-full items-start justify-between gap-3 rounded-lg border border-input bg-background px-3 py-2 text-left transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <div className="flex min-w-0 flex-1 flex-wrap gap-2">
              {selectedTopics.length > 0 ? (
                selectedTopics.map((topic) => (
                  <button
                    key={topic.value}
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-xs text-foreground"
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation()
                      onToggle(channel, topic.value, false)
                    }}
                  >
                    {getCommunicationTopicLabel(topic.value)}
                    <XIcon className="size-3" />
                  </button>
                ))
              ) : (
                <span className="pt-0.5 text-sm text-muted-foreground">
                  Selecione uma ou mais opções
                </span>
              )}
            </div>
            <ChevronsUpDownIcon className="mt-1 size-4 shrink-0 text-muted-foreground" />
          </div>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-[420px] max-w-[90vw] p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {availableTopics.length > 0 ? (
              availableTopics.map((topic) => (
                <button
                  key={topic.value}
                  type="button"
                  className="rounded-lg border border-border bg-background p-3 text-left text-sm text-foreground transition-colors hover:border-primary hover:bg-accent"
                  onClick={() => onToggle(channel, topic.value, true)}
                >
                  {getCommunicationTopicLabel(topic.value)}
                </button>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground sm:col-span-2">
                Todas as opções deste canal já foram selecionadas.
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

const CommunicationPreferencesEditor = ({
  form,
  fieldConfig,
}: {
  form: UseFormReturn<CustomerFormValues>
  fieldConfig: FieldConfig
}) => {
  const preferences = useWatch({
    control: form.control,
    name: "communicationPreferences",
  })

  const togglePreference = (
    channel: (typeof COMMUNICATION_CHANNEL_OPTIONS)[number]["value"],
    topic: CommunicationTopic,
    enabled: boolean
  ) => {
    const nextPreferences = (preferences || []).map((preference) =>
      preference.channel === channel && preference.topic === topic
        ? { ...preference, enabled }
        : preference
    )

    form.setValue("communicationPreferences", nextPreferences, {
      shouldDirty: true,
    })
  }

  return (
    <CollectionSection title={fieldConfig.label}>
      <div className="grid gap-4 lg:grid-cols-2">
        {COMMUNICATION_CHANNEL_OPTIONS.map((channel) => (
          <CommunicationChannelSelect
            key={channel.value}
            channel={channel.value}
            preferences={preferences}
            onToggle={togglePreference}
          />
        ))}
      </div>
    </CollectionSection>
  )
}

const ResponsiblesEditor = ({
  form,
  groupedFields,
}: {
  form: UseFormReturn<CustomerFormValues>
  groupedFields: GroupedFieldSection[]
}) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "responsibles",
  })
  const emailsGroup = groupedFields.find(
    (group) => group.section.key === "emails"
  )
  const contactsGroup = groupedFields.find(
    (group) => group.section.key === "contacts"
  )
  const visibleGroups = groupedFields.filter(
    (group) =>
      !(contactsGroup && group.section.key === "emails") &&
      group.section.key !== "communicationPreferences"
  )

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-foreground">Responsáveis</h3>
        <Button
          type="button"
          size="sm"
          onClick={() => append(createEmptyResponsible())}
        >
          <PlusIcon className="size-4" />
          Adicionar responsável
        </Button>
      </div>

      {fields.length === 0 ? (
        <Empty className="border border-dashed border-amber-200 bg-amber-50/70">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserRoundIcon className="text-amber-600" />
            </EmptyMedia>
            <EmptyTitle>Adicione um responsável</EmptyTitle>
            <EmptyDescription>
              A API exige pelo menos um responsável para cliente PJ.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        fields.map((row, index) => {
          const responsibleName =
            form.watch(`responsibles.${index}.fullName`) ||
            `Responsável ${index + 1}`

          return (
            <Card
              key={row.id}
              className="overflow-visible border border-border bg-card"
            >
              <CardHeader className="flex-row items-start justify-between gap-4">
                <CardTitle className="text-xl">{responsibleName}</CardTitle>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  <Trash2Icon className="size-4" />
                  Remover
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {visibleGroups.map((group) => (
                  <div
                    key={`${row.id}-${group.section.key}`}
                    className="space-y-4"
                  >
                    <div className="text-sm font-semibold text-foreground">
                      {group.section.label}
                    </div>
                    {group.section.key === "contacts" ? (
                      <ContactEmailSection
                        form={form}
                        contactsFieldConfig={contactsGroup?.fields[0]}
                        emailsFieldConfig={emailsGroup?.fields[0]}
                        contactsName={`responsibles.${index}.contacts`}
                        emailsName={`responsibles.${index}.emails`}
                      />
                    ) : group.section.key === "emails" ? (
                      <EmailsEditor
                        form={form}
                        name={`responsibles.${index}.emails`}
                        fieldConfig={group.fields[0]}
                      />
                    ) : (
                      <SectionGrid wide={group.section.key === "address"}>
                        {group.fields.map((fieldConfig) => (
                          <FieldBlock
                            key={`${row.id}-${fieldConfig.fieldKey}`}
                            fieldConfig={fieldConfig}
                            form={form}
                            name={`responsibles.${index}.${fieldConfig.fieldKey}`}
                          />
                        ))}
                      </SectionGrid>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}

const CustomerForm = ({
  mode,
  customer,
  onSubmit,
  isSubmitting,
}: {
  mode: "create" | "edit"
  customer?: CustomerResponse
  onSubmit: (
    payload: CustomerCreateInput | CustomerUpdateInput
  ) => Promise<void>
  isSubmitting: boolean
}) => {
  const form = useForm<CustomerFormValues>({
    defaultValues: createDefaultValues(),
  })
  const [activeTab, setActiveTab] = useState("main")
  const personType = useWatch({
    control: form.control,
    name: "personType",
  })

  const customerMetadataQuery = useQuery({
    queryKey: ["customer-form-metadata", personType],
    queryFn: () => formMetadataService.getCustomerFields(personType),
  })

  const responsibleMetadataQuery = useQuery({
    queryKey: ["responsible-form-metadata"],
    queryFn: () => formMetadataService.getResponsibles(),
  })

  useEffect(() => {
    if (customer) {
      form.reset(mapCustomerToFormValues(customer))
      return
    }

    form.reset(createDefaultValues())
  }, [customer, form])

  useEffect(() => {
    if (personType === "INDIVIDUAL") {
      form.setValue("responsibles", [], { shouldDirty: true })
      return
    }

    if (
      personType === "COMPANY" &&
      form.getValues("responsibles").length === 0
    ) {
      form.setValue("responsibles", [createEmptyResponsible()], {
        shouldDirty: true,
      })
    }
  }, [form, personType])

  useEffect(() => {
    if (personType === "INDIVIDUAL" && activeTab === "responsibles") {
      setActiveTab("main")
    }
  }, [activeTab, personType])

  const groupedCustomerFields = useMemo(
    () =>
      customerMetadataQuery.data ? groupFields(customerMetadataQuery.data) : [],
    [customerMetadataQuery.data]
  )
  const groupedResponsibleFields = useMemo(
    () => mergeResponsibleMetadata(responsibleMetadataQuery.data),
    [responsibleMetadataQuery.data]
  )
  const customerEmailsGroup = useMemo(
    () => groupedCustomerFields.find((group) => group.section.key === "emails"),
    [groupedCustomerFields]
  )
  const customerContactsGroup = useMemo(
    () =>
      groupedCustomerFields.find((group) => group.section.key === "contacts"),
    [groupedCustomerFields]
  )
  const customerResponsiblesGroup = useMemo(
    () =>
      groupedCustomerFields.find(
        (group) => group.section.key === "responsibles"
      ),
    [groupedCustomerFields]
  )
  const mainGroups = useMemo(
    () =>
      groupedCustomerFields.filter(
        (group) =>
          group.section.key !== "responsibles" &&
          !(customerContactsGroup && group.section.key === "emails")
      ),
    [customerContactsGroup, groupedCustomerFields]
  )

  const computedValues = useWatch({
    control: form.control,
    name: "computed",
  })
  const birthDate = useWatch({
    control: form.control,
    name: "profile.birthDate",
  })
  const openingDate = useWatch({
    control: form.control,
    name: "profile.openingDate",
  })
  const derivedCustomerAge = calculateYearsFromDate(birthDate)
  const derivedCompanyAge = calculateYearsFromDate(openingDate)

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload = toPayload(values)
    const companyResponsibles =
      values.personType === "COMPANY" && "responsibles" in payload
        ? (payload.responsibles ?? [])
        : []

    if (values.personType === "COMPANY" && companyResponsibles.length === 0) {
      toast.error("Cliente PJ precisa de ao menos um responsável.")
      return
    }

    await onSubmit(payload)
  })

  if (customerMetadataQuery.isLoading || responsibleMetadataQuery.isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-2">
          <Spinner className="size-4" />
          <span className="text-sm text-muted-foreground">
            Carregando metadados do formulário...
          </span>
        </div>
      </div>
    )
  }

  if (customerMetadataQuery.isError || responsibleMetadataQuery.isError) {
    return (
      <Empty className="min-h-96 border border-dashed border-red-200 bg-red-50/70">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SparklesIcon className="text-red-500" />
          </EmptyMedia>
          <EmptyTitle>Não foi possível montar o formulário</EmptyTitle>
          <EmptyDescription>
            Verifique `GET /form-metadata/customers/fields` e `GET
            /form-metadata/responsibles`.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <section>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border border-primary bg-accent text-primary-foreground">
                {mode === "create" ? "Novo cadastro" : "Edição"}
              </Badge>
              <Badge variant="outline">{getPersonTypeLabel(personType)}</Badge>
              {personType === "INDIVIDUAL" ? (
                <Badge className="border border-sky-200 bg-sky-50 text-sky-800">
                  <UserRoundIcon className="mr-1 size-3.5" />
                  PF
                </Badge>
              ) : (
                <Badge className="border border-blue-200 bg-blue-50 text-blue-800">
                  <Building2Icon className="mr-1 size-3.5" />
                  PJ
                </Badge>
              )}
            </div>
            <CardTitle className="text-3xl tracking-tight text-foreground">
              {mode === "create"
                ? "Cadastro de cliente"
                : getCustomerDisplayName(customer!)}
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList variant="line">
          <TabsTrigger value="main">Dados principais</TabsTrigger>
          {personType === "COMPANY" ? (
            <TabsTrigger value="responsibles">Responsáveis</TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="main">
          <Card className="overflow-visible">
            <CardContent className="space-y-6 pt-4">
              {mainGroups.map((group, index) => (
                <FormSection
                  key={group.section.key}
                  title={group.section.label}
                  withDivider={index > 0}
                >
                  {group.section.key === "contacts" ? (
                    <ContactEmailSection
                      form={form}
                      contactsFieldConfig={customerContactsGroup?.fields[0]}
                      emailsFieldConfig={customerEmailsGroup?.fields[0]}
                      contactsName="contacts"
                      emailsName="emails"
                    />
                  ) : group.section.key === "emails" ? (
                    <EmailsEditor
                      form={form}
                      name="emails"
                      fieldConfig={group.fields[0]}
                    />
                  ) : group.section.key === "communicationPreferences" ? (
                    <CommunicationPreferencesEditor
                      form={form}
                      fieldConfig={group.fields[0]}
                    />
                  ) : (
                    <SectionGrid wide={group.section.key === "address"}>
                      {group.fields
                        .filter((fieldConfig) => {
                          if (!fieldConfig.visibleWhen?.personType?.length) {
                            return true
                          }

                          return fieldConfig.visibleWhen.personType.includes(
                            personType
                          )
                        })
                        .map((fieldConfig) => (
                          <FieldBlock
                            key={fieldConfig.fieldKey}
                            fieldConfig={fieldConfig}
                            form={form}
                            name={fieldConfig.fieldKey}
                            disabled={
                              mode === "edit" &&
                              fieldConfig.fieldKey === "personType"
                            }
                          />
                        ))}
                      {group.section.key === "core" ? (
                        <ComputedAgeBlock
                          label={
                            personType === "COMPANY"
                              ? "Idade da empresa"
                              : "Idade do cliente"
                          }
                          value={
                            personType === "COMPANY"
                              ? derivedCompanyAge ||
                                computedValues?.companyAge ||
                                ""
                              : derivedCustomerAge ||
                                computedValues?.customerAge ||
                                ""
                          }
                        />
                      ) : null}
                      {group.section.key === "financial" ? (
                        <>
                          <ComputedInputBlock
                            label="Valor lucratividade"
                            value={formatCurrency(
                              computedValues?.profitabilityAmount
                                ? Number(computedValues.profitabilityAmount)
                                : null
                            )}
                          />
                          <ComputedInputBlock
                            label="Lucratividade %"
                            value={formatPercent(
                              computedValues?.profitabilityPercentage
                                ? Number(computedValues.profitabilityPercentage)
                                : null
                            )}
                          />
                        </>
                      ) : null}
                    </SectionGrid>
                  )}
                </FormSection>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {personType === "COMPANY" ? (
          <TabsContent value="responsibles">
            <Card className="overflow-visible">
              <CardContent className="pt-4">
                {customerResponsiblesGroup ? (
                  <ResponsiblesEditor
                    form={form}
                    groupedFields={groupedResponsibleFields}
                  />
                ) : (
                  <Empty className="border border-dashed border-border bg-background">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <UserRoundIcon />
                      </EmptyMedia>
                      <EmptyTitle>Responsáveis não disponíveis</EmptyTitle>
                      <EmptyDescription>
                        Os metadados de responsáveis não foram retornados para
                        este cadastro.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
      </Tabs>

      <datalist id="state-suggestions">
        {STATE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value} />
        ))}
      </datalist>
      <datalist id="city-suggestions">
        {CITY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value} />
        ))}
      </datalist>

      <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
        <div className="text-sm text-muted-foreground">
          Revise obrigatórios em vermelho e campos importantes em verde antes de
          salvar.
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/customers">
              <ArrowLeftIcon className="size-4" />
              Voltar
            </Link>
          </Button>
          <Button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner className="size-4" />
                Salvando...
              </>
            ) : (
              <>
                <SaveIcon className="size-4" />
                Salvar cliente
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}

export const CustomerFormPage = ({ mode }: CustomerFormPageProps) => {
  const navigate = useNavigate()
  const params = useParams()
  const queryClient = useQueryClient()
  const customerId = params.customerId

  const customerQuery = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => customerService.getById(customerId!),
    enabled: mode === "edit" && Boolean(customerId),
  })

  const createMutation = useMutation({
    mutationFn: (payload: CustomerCreateInput) =>
      customerService.create(payload),
    onSuccess: async (createdCustomer) => {
      toast.success("Cliente criado com sucesso.")
      await queryClient.invalidateQueries({ queryKey: ["customers"] })
      navigate(`/customers/${createdCustomer.id}/edit`, { replace: true })
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.payload?.message || error.message
          : "Não foi possível criar o cliente."
      toast.error(message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload: CustomerUpdateInput) =>
      customerService.update(customerId!, payload),
    onSuccess: async () => {
      toast.success("Cliente atualizado com sucesso.")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["customers"] }),
        queryClient.invalidateQueries({ queryKey: ["customer", customerId] }),
      ])
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.payload?.message || error.message
          : "Não foi possível atualizar o cliente."
      toast.error(message)
    },
  })

  const handleSubmit = async (
    payload: CustomerCreateInput | CustomerUpdateInput
  ) => {
    if (mode === "create") {
      await createMutation.mutateAsync(payload as CustomerCreateInput)
      return
    }

    await updateMutation.mutateAsync(payload as CustomerUpdateInput)
  }

  if (mode === "edit" && customerQuery.isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-2">
          <Spinner className="size-4" />
          <span className="text-sm text-muted-foreground">
            Carregando cadastro do cliente...
          </span>
        </div>
      </div>
    )
  }

  if (mode === "edit" && customerQuery.isError) {
    return (
      <Empty className="min-h-96 border border-dashed border-red-200 bg-red-50/70">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UserRoundIcon className="text-red-500" />
          </EmptyMedia>
          <EmptyTitle>Cliente não carregado</EmptyTitle>
          <EmptyDescription>
            Verifique o identificador informado ou a disponibilidade de `GET
            /customers/:customerId`.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="space-y-6">
      <CustomerForm
        mode={mode}
        customer={customerQuery.data}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}

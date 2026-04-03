import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react"
import { Link, useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  GripVerticalIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Settings2Icon,
  Trash2Icon,
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { customerService } from "@/features/customers/customer-service"
import { clearCustomerFormDrafts } from "@/features/customers/lib/customer-form-draft-storage"
import { ApiError } from "@/shared/api/http-client"
import type { CustomerResponse } from "@/shared/api/types"
import {
  formatDate,
  getCustomerDisplayName,
  getCustomerDocument,
} from "@/shared/lib/format"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10
const ACTIONS_COLUMN_WIDTH = 88
const COLUMN_STORAGE_KEY = "customer-list-columns-v2"

type DataColumnId =
  | "personType"
  | "customer"
  | "document"
  | "contact"
  | "email"
  | "address"
  | "location"
  | "customerSince"

type ColumnPreference = {
  id: DataColumnId
  visible: boolean
  width: number
}

type ColumnDefinition = {
  label: string
  defaultWidth: number
  minWidth: number
  render: (customer: CustomerResponse) => ReactNode
  getTextValue: (customer: CustomerResponse) => string
}

const formatCustomerAddress = (customer: CustomerResponse) => {
  const address = customer.address

  if (!address) {
    return "—"
  }

  const primaryLine = [
    address.street,
    address.number,
    address.complement,
    address.district,
  ]
    .filter(Boolean)
    .join(", ")

  const secondaryLine = [address.city, address.state, address.zipCode]
    .filter(Boolean)
    .join(" - ")

  return [primaryLine, secondaryLine].filter(Boolean).join(" | ") || "—"
}

const COLUMN_DEFINITIONS: Record<DataColumnId, ColumnDefinition> = {
  personType: {
    label: "Tipo",
    defaultWidth: 92,
    minWidth: 80,
    getTextValue: (customer) =>
      customer.personType === "INDIVIDUAL" ? "PF" : "PJ",
    render: (customer) => (
      <Badge
        className={
          customer.personType === "INDIVIDUAL"
            ? "border border-sky-200 bg-sky-50 text-sky-800"
            : "border border-blue-200 bg-blue-50 text-blue-800"
        }
      >
        {customer.personType === "INDIVIDUAL" ? "PF" : "PJ"}
      </Badge>
    ),
  },
  customer: {
    label: "Cliente",
    defaultWidth: 280,
    minWidth: 180,
    getTextValue: (customer) => getCustomerDisplayName(customer),
    render: (customer) => (
      <span className="font-medium text-foreground">
        {getCustomerDisplayName(customer)}
      </span>
    ),
  },
  document: {
    label: "Documento",
    defaultWidth: 180,
    minWidth: 140,
    getTextValue: (customer) => getCustomerDocument(customer),
    render: (customer) => getCustomerDocument(customer),
  },
  contact: {
    label: "Contato principal",
    defaultWidth: 180,
    minWidth: 150,
    getTextValue: (customer) => customer.contacts[0]?.value || "—",
    render: (customer) => customer.contacts[0]?.value || "—",
  },
  email: {
    label: "E-mail principal",
    defaultWidth: 230,
    minWidth: 170,
    getTextValue: (customer) => customer.emails[0]?.email || "—",
    render: (customer) => customer.emails[0]?.email || "—",
  },
  address: {
    label: "Endereço",
    defaultWidth: 360,
    minWidth: 260,
    getTextValue: (customer) => formatCustomerAddress(customer),
    render: (customer) => (
      <span className="block text-foreground">
        {formatCustomerAddress(customer)}
      </span>
    ),
  },
  location: {
    label: "Cidade / Estado",
    defaultWidth: 180,
    minWidth: 150,
    getTextValue: (customer) =>
      [customer.address?.city, customer.address?.state]
        .filter(Boolean)
        .join(" / ") || "—",
    render: (customer) =>
      [customer.address?.city, customer.address?.state]
        .filter(Boolean)
        .join(" / ") || "—",
  },
  customerSince: {
    label: "Cliente desde",
    defaultWidth: 150,
    minWidth: 130,
    getTextValue: (customer) => formatDate(customer.core.customerSince || null),
    render: (customer) => formatDate(customer.core.customerSince || null),
  },
}

const DEFAULT_COLUMNS: ColumnPreference[] = (
  Object.entries(COLUMN_DEFINITIONS) as [DataColumnId, ColumnDefinition][]
).map(([id, definition]) => ({
  id,
  visible: true,
  width: definition.defaultWidth,
}))

const isDataColumnId = (value: string): value is DataColumnId =>
  value in COLUMN_DEFINITIONS

const getDefaultColumns = () => DEFAULT_COLUMNS.map((column) => ({ ...column }))

const loadColumnPreferences = (): ColumnPreference[] => {
  if (typeof window === "undefined") {
    return getDefaultColumns()
  }

  try {
    const raw = window.localStorage.getItem(COLUMN_STORAGE_KEY)
    if (!raw) {
      return getDefaultColumns()
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return getDefaultColumns()
    }

    const normalized: ColumnPreference[] = []
    const seen = new Set<DataColumnId>()

    parsed.forEach((item) => {
      if (!item || typeof item !== "object" || !isDataColumnId(item.id)) {
        return
      }

      const columnId: DataColumnId = item.id

      if (seen.has(columnId)) {
        return
      }

      const definition = COLUMN_DEFINITIONS[columnId]
      normalized.push({
        id: columnId,
        visible: typeof item.visible === "boolean" ? item.visible : true,
        width:
          typeof item.width === "number" && Number.isFinite(item.width)
            ? Math.max(definition.minWidth, item.width)
            : definition.defaultWidth,
      })
      seen.add(columnId)
    })

    DEFAULT_COLUMNS.forEach((column) => {
      if (!seen.has(column.id)) {
        normalized.push({ ...column })
      }
    })

    return normalized
  } catch {
    return getDefaultColumns()
  }
}

const reorderColumns = (
  columns: ColumnPreference[],
  sourceId: DataColumnId,
  targetId: DataColumnId
) => {
  const sourceIndex = columns.findIndex((column) => column.id === sourceId)
  const targetIndex = columns.findIndex((column) => column.id === targetId)

  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
    return columns
  }

  const nextColumns = [...columns]
  const [moved] = nextColumns.splice(sourceIndex, 1)
  nextColumns.splice(targetIndex, 0, moved)
  return nextColumns
}

export const CustomerListPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const resizeRef = useRef<{
    id: DataColumnId
    startX: number
    startWidth: number
  } | null>(null)

  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [columnPreferences, setColumnPreferences] = useState<
    ColumnPreference[]
  >(() => loadColumnPreferences())
  const [draggingColumnId, setDraggingColumnId] = useState<DataColumnId | null>(
    null
  )
  const [dragTargetColumnId, setDragTargetColumnId] =
    useState<DataColumnId | null>(null)

  const customersQuery = useQuery({
    queryKey: ["customers", page],
    queryFn: () => customerService.list(page, PAGE_SIZE),
    staleTime: 0,
    refetchOnMount: "always",
  })

  const deleteMutation = useMutation({
    mutationFn: customerService.remove,
    onSuccess: () => {
      toast.success("Cliente removido.")
      void queryClient.invalidateQueries({ queryKey: ["customers"] })
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.payload?.message || error.message
          : "Não foi possível remover o cliente."
      toast.error(message)
    },
  })

  useEffect(() => {
    window.localStorage.setItem(
      COLUMN_STORAGE_KEY,
      JSON.stringify(columnPreferences)
    )
  }, [columnPreferences])

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const currentResize = resizeRef.current

      if (!currentResize) {
        return
      }

      const definition = COLUMN_DEFINITIONS[currentResize.id]
      const nextWidth = Math.max(
        definition.minWidth,
        currentResize.startWidth + event.clientX - currentResize.startX
      )

      setColumnPreferences((columns) =>
        columns.map((column) =>
          column.id === currentResize.id
            ? { ...column, width: nextWidth }
            : column
        )
      )
    }

    const handleMouseUp = () => {
      if (!resizeRef.current) {
        return
      }

      resizeRef.current = null
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const items = customersQuery.data?.items ?? []

    if (!term) {
      return items
    }

    return items.filter((customer) => {
      const haystack = [
        getCustomerDisplayName(customer),
        getCustomerDocument(customer),
        customer.address?.street,
        customer.address?.city,
        customer.address?.state,
        customer.emails.map((item) => item.email).join(" "),
        customer.contacts.map((item) => item.value).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return haystack.includes(term)
    })
  }, [customersQuery.data?.items, searchTerm])

  const visibleColumns = useMemo(
    () => columnPreferences.filter((column) => column.visible),
    [columnPreferences]
  )

  const totalPages = Math.max(
    1,
    Math.ceil((customersQuery.data?.total ?? 0) / PAGE_SIZE)
  )

  const handleDelete = (customerId: string) => {
    if (
      !window.confirm("Remover este cliente? Esta ação não pode ser desfeita.")
    ) {
      return
    }

    deleteMutation.mutate(customerId)
  }

  const handleResizeStart = (
    event: ReactMouseEvent<HTMLButtonElement>,
    id: DataColumnId,
    width: number
  ) => {
    event.preventDefault()
    event.stopPropagation()

    resizeRef.current = {
      id,
      startX: event.clientX,
      startWidth: width,
    }

    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }

  const handleColumnDragStart = (
    event: DragEvent<HTMLDivElement>,
    columnId: DataColumnId
  ) => {
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", columnId)
    setDraggingColumnId(columnId)
  }

  const handleColumnDrop = (targetId: DataColumnId) => {
    if (!draggingColumnId || draggingColumnId === targetId) {
      setDragTargetColumnId(null)
      return
    }

    setColumnPreferences((columns) =>
      reorderColumns(columns, draggingColumnId, targetId)
    )
    setDragTargetColumnId(null)
    setDraggingColumnId(null)
  }

  const toggleColumnVisibility = (columnId: DataColumnId, visible: boolean) => {
    setColumnPreferences((columns) =>
      columns.map((column) =>
        column.id === columnId ? { ...column, visible } : column
      )
    )
  }

  const resetColumns = () => {
    setColumnPreferences(getDefaultColumns())
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <div className="inline-flex w-fit rounded-lg border border-primary bg-accent px-3 py-1 text-xs font-medium tracking-[0.18em] text-primary-foreground uppercase">
              CRM de clientes
            </div>
            <CardTitle className="text-3xl tracking-tight text-foreground">
              Lista de clientes
            </CardTitle>
            <CardDescription className="max-w-4xl text-base leading-7">
              Consulte clientes cadastrados, acesse a edição completa e valide
              rapidamente documento, contatos e endereço principal.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-xl">Fluxo principal</CardTitle>
            <CardDescription>
              O cadastro usa um formulário único para PF e PJ, com responsáveis
              exigidos apenas para empresa.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              CRUD conectado à API real e metadados dinâmicos.
            </div>
            <Button asChild>
              <Link to="/customers/new">
                <PlusIcon className="size-4" />
                Novo cliente
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle className="text-xl text-foreground">
                Clientes cadastrados
              </CardTitle>
              <CardDescription className="mt-1">
                Arraste os cabeçalhos para reordenar, use a borda direita para
                redimensionar e escolha as colunas visíveis.
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <div className="relative w-full lg:w-[420px]">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por nome, documento, contato, cidade..."
                  className="h-10 pl-9"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10">
                    <Settings2Icon className="size-4" />
                    Colunas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
                  {columnPreferences.map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.visible}
                      disabled={column.visible && visibleColumns.length === 1}
                      onCheckedChange={(checked) =>
                        toggleColumnVisibility(column.id, Boolean(checked))
                      }
                      onSelect={(event) => event.preventDefault()}
                    >
                      {COLUMN_DEFINITIONS[column.id].label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={resetColumns}>
                    Restaurar padrão
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {customersQuery.isLoading ? (
            <div className="flex min-h-64 items-center justify-center">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-2">
                <Spinner className="size-4" />
                <span className="text-sm text-muted-foreground">
                  Carregando clientes...
                </span>
              </div>
            </div>
          ) : customersQuery.isError ? (
            <Empty className="min-h-72 border border-dashed border-red-200 bg-red-50/70">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Trash2Icon className="text-red-500" />
                </EmptyMedia>
                <EmptyTitle>Falha ao carregar os clientes</EmptyTitle>
                <EmptyDescription>
                  Não foi possível consumir `GET /customers` no momento.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : filteredItems.length === 0 ? (
            <Empty className="min-h-72 border border-dashed border-border bg-background">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchIcon />
                </EmptyMedia>
                <EmptyTitle>Nenhum cliente encontrado</EmptyTitle>
                <EmptyDescription>
                  Ajuste o filtro local ou crie um novo cadastro.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-4">
              <Table className="min-w-max table-fixed">
                <colgroup>
                  <col style={{ width: ACTIONS_COLUMN_WIDTH }} />
                  {visibleColumns.map((column) => (
                    <col
                      key={column.id}
                      style={{ width: `${column.width}px` }}
                    />
                  ))}
                </colgroup>

                <TableHeader>
                  <TableRow>
                    <TableHead>Ações</TableHead>
                    {visibleColumns.map((column) => (
                      <TableHead
                        key={column.id}
                        className={cn(
                          "relative pr-4",
                          dragTargetColumnId === column.id && "bg-accent/50"
                        )}
                      >
                        <div
                          draggable
                          onDragStart={(event) =>
                            handleColumnDragStart(event, column.id)
                          }
                          onDragOver={(event) => {
                            event.preventDefault()
                            if (
                              draggingColumnId &&
                              draggingColumnId !== column.id
                            ) {
                              setDragTargetColumnId(column.id)
                            }
                          }}
                          onDrop={() => handleColumnDrop(column.id)}
                          onDragEnd={() => {
                            setDraggingColumnId(null)
                            setDragTargetColumnId(null)
                          }}
                          className="group flex min-w-0 cursor-grab items-center gap-2 pr-3 active:cursor-grabbing"
                        >
                          <span className="truncate">
                            {COLUMN_DEFINITIONS[column.id].label}
                          </span>
                          <GripVerticalIcon className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                        <button
                          type="button"
                          aria-label={`Redimensionar coluna ${COLUMN_DEFINITIONS[column.id].label}`}
                          className="absolute top-0 right-0 h-full w-3 cursor-col-resize after:absolute after:top-1 after:bottom-1 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-border after:transition-colors hover:after:bg-primary"
                          onMouseDown={(event) =>
                            handleResizeStart(event, column.id, column.width)
                          }
                        />
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredItems.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              aria-label={`Ações de ${getCustomerDisplayName(customer)}`}
                            >
                              <MoreHorizontalIcon className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-44">
                            <DropdownMenuItem
                              onSelect={() => {
                                clearCustomerFormDrafts({
                                  preserveMode: "edit",
                                  preserveCustomerId: customer.id,
                                })
                                navigate(`/customers/${customer.id}/edit`)
                              }}
                            >
                              <PencilIcon className="size-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              disabled={deleteMutation.isPending}
                              onSelect={() => handleDelete(customer.id)}
                            >
                              <Trash2Icon className="size-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>

                      {visibleColumns.map((column) => (
                        <TableCell
                          key={`${customer.id}-${column.id}`}
                          className="overflow-hidden"
                        >
                          <div
                            className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
                            title={COLUMN_DEFINITIONS[column.id].getTextValue(
                              customer
                            )}
                          >
                            {COLUMN_DEFINITIONS[column.id].render(customer)}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
                <div className="text-sm text-muted-foreground">
                  Página {page} de {totalPages} •{" "}
                  {customersQuery.data?.total ?? 0} registros
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    disabled={page <= 1}
                  >
                    <ChevronLeftIcon className="size-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                    disabled={page >= totalPages}
                  >
                    Próxima
                    <ChevronRightIcon className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

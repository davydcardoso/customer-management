import { useEffect, useState, type FormEvent } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { KeyRoundIcon, LogInIcon, ShieldCheckIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/features/auth/auth-context"
import { ApiError } from "@/shared/api/http-client"

type LocationState = {
  from?: {
    pathname?: string
  }
}

export const LoginPage = () => {
  const { login, status } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("admin123")
  const [submitting, setSubmitting] = useState(false)

  const from =
    (location.state as LocationState | null)?.from?.pathname || "/customers"

  useEffect(() => {
    if (status === "authenticated") {
      navigate(from, { replace: true })
    }
  }, [from, navigate, status])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      await login({ username, password })
      navigate(from, { replace: true })
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.payload?.message || error.message
          : "Não foi possível autenticar."

      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (status === "authenticated") {
    return <Navigate replace to={from} />
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-8">
      <div className="grid w-full max-w-[1280px] gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="hidden border border-border bg-card p-8 lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-6">
            <div className="inline-flex w-fit rounded-lg border border-primary bg-accent px-4 py-2 text-sm font-semibold text-primary-foreground">
              Frontend integrado ao backend real
            </div>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-foreground">
                Cadastro de clientes com PF, PJ e responsáveis vinculados.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Autentique para consumir a API existente, montar o formulário
                pelos metadados e operar o CRUD completo.
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground">
                <ShieldCheckIcon className="size-4" />
                Sessão protegida com refresh token
              </div>
              <p className="text-sm text-muted-foreground">
                O cliente HTTP renova `accessToken` automaticamente ao receber
                `401`.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="mb-1 flex items-center gap-2 text-sm font-medium text-foreground">
                <KeyRoundIcon className="size-4" />
                Contrato guiado por OpenAPI e form metadata
              </div>
              <p className="text-sm text-muted-foreground">
                PF e PJ compartilham a mesma estrutura base, com campos
                alternados por `personType`.
              </p>
            </div>
          </div>
        </div>

        <Card className="bg-card">
          <CardHeader className="space-y-3">
            <div className="inline-flex w-fit rounded-lg border border-primary bg-accent px-3 py-1 text-xs font-medium tracking-[0.18em] text-primary-foreground uppercase">
              Acesso
            </div>
            <CardTitle className="text-3xl tracking-tight text-foreground">
              Entrar no ZR System
            </CardTitle>
            <CardDescription className="text-base leading-7">
              Use o usuário seedado pelo backend. O login inicial já vem
              preenchido com o padrão descrito no `.env.example`.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="text-sm font-medium text-foreground"
                >
                  Usuário
                </label>
                <Input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                className="h-10 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Spinner className="size-4" />
                    Autenticando...
                  </>
                ) : (
                  <>
                    <LogInIcon className="size-4" />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
              <div className="font-medium text-foreground">Dica rápida</div>
              <p className="mt-1">
                A documentação da API está disponível em `GET /docs` e o schema
                OpenAPI em `GET /openapi.json`.
              </p>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              <Link className="underline underline-offset-4" to="/customers">
                Ir para a aplicação
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

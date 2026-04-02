import { Link, Navigate, NavLink, Outlet, useLocation } from "react-router-dom"
import { LogOutIcon, PlusIcon, UsersIcon } from "lucide-react"

import { useAuth } from "@/features/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export const AppShell = () => {
  const { logout, status, user } = useAuth()
  const location = useLocation()

  if (status === "loading") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2">
          <Spinner className="size-4" />
          <span className="text-sm text-muted-foreground">
            Carregando sessão...
          </span>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return <Navigate replace to="/login" state={{ from: location }} />
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95">
        <div className="mx-auto flex w-full max-w-[1720px] items-center justify-between gap-4 px-4 py-4 sm:w-[88vw] sm:px-0">
          <div className="flex items-center gap-4">
            <Link
              to="/customers"
              className=" px-4 py-2 text-lg font-semibold tracking-tight text-primary-foreground"
            >
              ZR System
            </Link>
            <nav className="hidden items-center gap-2 md:flex">
              <NavLink to="/customers">
                {({ isActive }) => (
                  <span
                    className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm transition ${
                      isActive
                        ? "border border-primary bg-primary text-primary-foreground"
                        : "border border-border bg-card text-foreground"
                    }`}
                  >
                    <UsersIcon className="mr-2 size-4" />
                    Clientes
                  </span>
                )}
              </NavLink>
              <Button asChild size="sm">
                <Link to="/customers/new">
                  <PlusIcon className="size-4" />
                  Novo cliente
                </Link>
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium text-foreground">
                {user?.username}
              </div>
              <div className="text-xs text-muted-foreground">
                Sessão autenticada
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOutIcon className="size-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1720px] px-4 py-6 sm:w-[88vw] sm:px-0">
        <Outlet />
      </main>
    </div>
  )
}

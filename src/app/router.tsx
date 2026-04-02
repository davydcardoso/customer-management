import { createBrowserRouter, Navigate } from "react-router-dom"

import { AppShell } from "@/app/app-shell"
import { LoginPage } from "@/features/auth/login-page"
import { CustomerFormPage } from "@/features/customers/customer-form-page"
import { CustomerListPage } from "@/features/customers/customer-list-page"

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <Navigate replace to="/customers" />,
      },
      {
        path: "customers",
        element: <CustomerListPage />,
      },
      {
        path: "customers/new",
        element: <CustomerFormPage mode="create" />,
      },
      {
        path: "customers/:customerId/edit",
        element: <CustomerFormPage mode="edit" />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate replace to="/customers" />,
  },
])

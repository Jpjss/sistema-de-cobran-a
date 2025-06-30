"use client"

import type { ReactNode } from "react"
import { useAuth } from "@/hooks/use-auth"
import { hasPermission } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield } from "lucide-react"

interface ProtectedRouteProps {
  children: ReactNode
  permission?: string
  fallback?: ReactNode
}

export function ProtectedRoute({ children, permission, fallback }: ProtectedRouteProps) {
  const { user } = useAuth()

  if (!user) {
    return null // O AuthProvider já vai redirecionar para login
  }

  if (permission && !hasPermission(user.role, permission as any)) {
    return (
      fallback || (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>Você não tem permissão para acessar esta funcionalidade.</AlertDescription>
        </Alert>
      )
    )
  }

  return <>{children}</>
}

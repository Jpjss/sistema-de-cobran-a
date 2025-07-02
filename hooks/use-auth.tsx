"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { authService, type AuthUser, type LoginCredentials } from "@/lib/auth"

interface AuthContextType {
  user: AuthUser | null
  login: (credentials: LoginCredentials) => Promise<string | true>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar se há token salvo
    const token = localStorage.getItem("auth-token")
    if (token) {
      const userData = authService.verifyToken(token)
      if (userData) {
        setUser(userData)
      } else {
        localStorage.removeItem("auth-token")
      }
    }
    setLoading(false)
  }, [])

  const login = async (credentials: LoginCredentials): Promise<string | true> => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      })
      const result = await response.json()
      if (!response.ok) {
        return result.error || "Erro ao fazer login. Tente novamente."
      }
      if (result && result.user && result.token) {
        setUser(result.user)
        localStorage.setItem("auth-token", result.token)
        return true
      }
      return "Erro ao fazer login. Tente novamente."
    } catch (error) {
      console.error("Login error:", error)
      return "Erro ao fazer login. Tente novamente."
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("auth-token")
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

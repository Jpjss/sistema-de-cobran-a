import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: "admin" | "financeiro" | "suporte"
  createdAt: string
  lastLogin?: string
  isActive: boolean
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: "admin" | "financeiro" | "suporte"
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  role: "admin" | "financeiro" | "suporte"
}

// Simulação de banco de dados de usuários
const users: User[] = [
  {
    id: "1",
    name: "Admin Sistema",
    email: "admin@sistema.com",
    password: "$2b$10$mw3aekRlbOrDqyiqXVF.CuEfizHq8Fnx47QyhVvJ9KhBzKtL8Im7a", // jp22032006
    role: "admin",
    createdAt: "2024-01-01",
    isActive: true,
  },
  {
    id: "2",
    name: "João Financeiro",
    email: "financeiro@sistema.com",
    password: "$2b$10$mw3aekRlbOrDqyiqXVF.CuEfizHq8Fnx47QyhVvJ9KhBzKtL8Im7a", // jp22032006
    role: "financeiro",
    createdAt: "2024-01-01",
    isActive: true,
  },
  {
    id: "3",
    name: "Maria Suporte",
    email: "suporte@sistema.com",
    password: "$2b$10$mw3aekRlbOrDqyiqXVF.CuEfizHq8Fnx47QyhVvJ9KhBzKtL8Im7a", // jp22032006
    role: "suporte",
    createdAt: "2024-01-01",
    isActive: true,
  },
  {
    id: "4",
    name: "Conta Suporte",
    email: "jp0886230@gmail.com",
    password: "$2b$10$mw3aekRlbOrDqyiqXVF.CuEfizHq8Fnx47QyhVvJ9KhBzKtL8Im7a", // jp22032006
    role: "suporte",
    createdAt: "2025-06-29",
    isActive: true,
  },
]

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; token: string } | null> {
    const user = users.find((u) => u.email === credentials.email && u.isActive)

    if (!user) {
      return null
    }

    const isValidPassword = await bcrypt.compare(credentials.password, user.password)

    if (!isValidPassword) {
      return null
    }

    // Atualizar último login
    user.lastLogin = new Date().toISOString()

    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }

    const token = jwt.sign(authUser, JWT_SECRET, { expiresIn: "24h" })

    return { user: authUser, token }
  },

  async register(data: RegisterData): Promise<AuthUser | null> {
    // Verificar se email já existe
    if (users.find((u) => u.email === data.email)) {
      return null
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)

    const newUser: User = {
      id: Date.now().toString(),
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      createdAt: new Date().toISOString(),
      isActive: true,
    }

    users.push(newUser)

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    }
  },

  verifyToken(token: string): AuthUser | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser
      return decoded
    } catch {
      return null
    }
  },

  getAllUsers(): Omit<User, "password">[] {
    return users.map(({ password, ...user }) => user)
  },

  updateUser(id: string, updates: Partial<Omit<User, "id" | "password">>): boolean {
    const userIndex = users.findIndex((u) => u.id === id)
    if (userIndex === -1) return false

    users[userIndex] = { ...users[userIndex], ...updates }
    return true
  },

  deleteUser(id: string): boolean {
    const userIndex = users.findIndex((u) => u.id === id)
    if (userIndex === -1) return false

    users.splice(userIndex, 1)
    return true
  },
}

export const permissions = {
  admin: {
    canViewDashboard: true,
    canManageBillings: true,
    canManageCustomers: true,
    canViewReports: true,
    canManageNotifications: true,
    canManageUsers: true,
    canViewAudit: true,
    canManageSettings: true,
  },
  financeiro: {
    canViewDashboard: true,
    canManageBillings: true,
    canManageCustomers: true,
    canViewReports: true,
    canManageNotifications: true,
    canManageUsers: false,
    canViewAudit: false,
    canManageSettings: false,
  },
  suporte: {
    canViewDashboard: true,
    canManageBillings: false,
    canManageCustomers: true,
    canViewReports: false,
    canManageNotifications: false,
    canManageUsers: false,
    canViewAudit: false,
    canManageSettings: false,
  },
}

export function hasPermission(userRole: string, permission: keyof typeof permissions.admin): boolean {
  const rolePermissions = permissions[userRole as keyof typeof permissions]
  return rolePermissions ? rolePermissions[permission] : false
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Edit, Trash2, Users, Shield, UserCheck } from "lucide-react"
import { authService, type User } from "@/lib/auth"
import { useAuth } from "@/hooks/use-auth"
import { auditService } from "@/lib/audit"
import { useNotifyDataChange } from "@/contexts/DataSyncContext"

export function UserManagement() {
  const { user: currentUser } = useAuth()
  const { onUserCreated, onUserUpdated, onUserDeleted } = useNotifyDataChange()
  const [users, setUsers] = useState<Omit<User, "password">[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<Omit<User, "password"> | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "suporte" as "admin" | "financeiro" | "suporte",
    isActive: true,
  })

  // Estado para feedback visual do botão de status
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null)

  // Feedback visual para loading do botão de status
  // Removido duplicata: já existe no topo do componente

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = () => {
    const allUsers = authService.getAllUsers()
    setUsers(allUsers)
  }

  const resetForm = () => {
    setFormData({ name: "", email: "", role: "suporte", isActive: true })
    setShowForm(false)
    setEditingUser(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingUser) {
      // Atualizar usuário
      const success = authService.updateUser(editingUser.id, formData)
      if (success) {
        auditService.log({
          userId: currentUser!.id,
          userName: currentUser!.name,
          action: "UPDATE",
          resource: "USER",
          resourceId: editingUser.id,
          details: `Atualizou dados do usuário ${formData.name}`,
        })
        onUserUpdated(editingUser.id) // Notifica que o usuário foi atualizado
        loadUsers()
        resetForm()
      }
    } else {
      // Criar novo usuário
      const newUser = await authService.register({
        ...formData,
        password: "password123", // Senha padrão
      })

      if (newUser) {
        auditService.log({
          userId: currentUser!.id,
          userName: currentUser!.name,
          action: "CREATE",
          resource: "USER",
          resourceId: newUser.id,
          details: `Criou novo usuário ${newUser.name} com perfil ${newUser.role}`,
        })
        onUserCreated(newUser.id) // Notifica que um novo usuário foi criado
        loadUsers()
        resetForm()
      }
    }
  }

  const handleEdit = (user: Omit<User, "password">) => {
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    })
    setEditingUser(user)
    setShowForm(true)
  }

  const handleDelete = (user: Omit<User, "password">) => {
    if (user.id === currentUser?.id) {
      alert("Você não pode excluir sua própria conta")
      return
    }

    if (confirm(`Tem certeza que deseja excluir o usuário ${user.name}?`)) {
      const success = authService.deleteUser(user.id)
      if (success) {
        auditService.log({
          userId: currentUser!.id,
          userName: currentUser!.name,
          action: "DELETE",
          resource: "USER",
          resourceId: user.id,
          details: `Excluiu usuário ${user.name}`,
        })
        onUserDeleted(user.id) // Notifica que o usuário foi deletado
        loadUsers()
      }
    }
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: "destructive",
      financeiro: "default",
      suporte: "secondary",
    } as const

    const labels = {
      admin: "Administrador",
      financeiro: "Financeiro",
      suporte: "Suporte",
    }

    return <Badge variant={variants[role as keyof typeof variants]}>{labels[role as keyof typeof labels]}</Badge>
  }



  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Gerenciamento de Usuários
          </h2>
          <p className="text-muted-foreground">Gerencie usuários e suas permissões</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Formulário */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</CardTitle>
            <CardDescription>
              {editingUser ? "Atualize os dados do usuário" : "Preencha os dados para criar um novo usuário"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="usuario@email.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Perfil</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: "admin" | "financeiro" | "suporte") =>
                      setFormData((prev) => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Administrador
                        </div>
                      </SelectItem>
                      <SelectItem value="financeiro">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          Financeiro
                        </div>
                      </SelectItem>
                      <SelectItem value="suporte">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Suporte
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.isActive ? "active" : "inactive"}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, isActive: value === "active" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingUser ? "Atualizar" : "Criar"} Usuário
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Usuários */}
      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(user.role)}
                    <Button
                      size="sm"
                      style={{
                        backgroundColor: user.isActive ? '#22c55e' : '#ef4444',
                        color: 'white',
                        fontWeight: 600,
                        borderRadius: '9999px',
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.75rem',
                        transition: 'background 0.2s',
                        opacity: !user.isActive ? 0.6 : (loadingUserId === user.id ? 0.7 : 1),
                        cursor: currentUser?.role === 'admin' ? (loadingUserId === user.id ? 'not-allowed' : 'pointer') : 'default',
                      }}
                      disabled={currentUser?.role !== 'admin' || loadingUserId === user.id}
                      title={
                        currentUser?.role !== 'admin'
                          ? 'Apenas administradores podem alterar o status'
                          : user.isActive
                            ? 'Clique para desativar'
                            : 'Clique para ativar'
                      }
                      onClick={async () => {
                        if (currentUser?.role !== 'admin') return;
                        setLoadingUserId(user.id)
                        const res = await fetch(`/api/users/${user.id}/toggle-active`, { method: 'PATCH' })
                        if (res.ok) {
                          setTimeout(() => {
                            loadUsers()
                            setLoadingUserId(null)
                          }, 200)
                        } else {
                          setLoadingUserId(null)
                        }
                      }}
                    >
                      {loadingUserId === user.id
                        ? '...'
                        : user.isActive
                          ? (<><span style={{verticalAlign:'middle'}}>✔️</span> Ativo</>)
                          : (<><span style={{verticalAlign:'middle'}}>🔒</span> Inativo</>)}
                    </Button>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(user)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    {user.id !== currentUser?.id && (
                      <DropdownMenuItem onClick={() => handleDelete(user)} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Criado em: {new Date(user.createdAt).toLocaleDateString("pt-BR")}</p>
                {user.lastLogin && <p>Último acesso: {new Date(user.lastLogin).toLocaleString("pt-BR")}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

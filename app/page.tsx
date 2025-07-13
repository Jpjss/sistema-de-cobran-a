"use client"

import { useState, useEffect } from "react"
import { Plus, DollarSign, Users, FileText, TrendingUp, Bell, Settings, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BillingForm } from "@/components/billing-form"
import { BillingList } from "@/components/billing-list"
import { CustomerList } from "@/components/customer-list"
import { Dashboard } from "@/components/dashboard"
import { NotificationSystem } from "@/components/notification-system"
import { ThemeToggle } from "@/components/theme-toggle"
import { ThemeSettings } from "@/components/theme-settings"
import { UserManagement } from "@/components/user-management"
import { AuditLogComponent } from "@/components/audit-log"
import { LoginForm } from "@/components/login-form"
import { UserProfile } from "@/components/user-profile"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/hooks/use-auth"
import { auditService } from "@/lib/audit"

export interface Billing {
  id: string
  customerName: string
  customerEmail: string
  description: string
  amount: number
  dueDate: string
  status: "pending" | "paid" | "overdue"
  createdAt: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  createdAt: string
}

export default function BillingSystem() {
  const { user, loading } = useAuth()
  const [billings, setBillings] = useState<Billing[]>([
    {
      id: "1",
      customerName: "João Silva",
      customerEmail: "joao@email.com",
      description: "Desenvolvimento de website",
      amount: 2500.0,
      dueDate: "2024-01-15",
      status: "pending",
      createdAt: "2024-01-01",
    },
    {
      id: "2",
      customerName: "Maria Santos",
      customerEmail: "maria@email.com",
      description: "Consultoria em marketing digital",
      amount: 1800.0,
      dueDate: "2024-01-10",
      status: "paid",
      createdAt: "2023-12-28",
    },
    {
      id: "3",
      customerName: "Pedro Costa",
      customerEmail: "pedro@email.com",
      description: "Manutenção de sistema",
      amount: 800.0,
      dueDate: "2023-12-30",
      status: "overdue",
      createdAt: "2023-12-15",
    },
  ])

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)

  // Carregar clientes do banco ao abrir a aba
  useEffect(() => {
    async function fetchCustomers() {
      setLoadingCustomers(true)
      try {
        const res = await fetch("/api/clientes")
        const data = await res.json()
        // Adaptar para o formato esperado
        setCustomers(
          data.map((c: any) => ({
            id: c._id || c.id,
            name: c.nome || c.name,
            email: c.email,
            phone: c.phone || "",
            address: c.address || "",
            createdAt: c.createdAt || new Date().toISOString(),
          }))
        )
      } catch (e) {
        setCustomers([])
      } finally {
        setLoadingCustomers(false)
      }
    }
    fetchCustomers()
  }, [])

  // Carregar cobranças do banco ao inicializar
  useEffect(() => {
    const fetchBillings = async () => {
      try {
        const response = await fetch('/api/cobrancas')
        if (response.ok) {
          const data = await response.json()
          // Converter os dados do MongoDB para o formato do frontend
          const formattedBillings = data.map((cobranca: any) => ({
            id: cobranca._id,
            customerName: cobranca.clienteId, // temporário, pode ser melhorado
            customerEmail: cobranca.clienteId,
            description: cobranca.descricao,
            amount: cobranca.valor,
            dueDate: cobranca.vencimento,
            status: cobranca.status,
            createdAt: new Date(cobranca.criadoEm).toISOString().split("T")[0],
          }))
          setBillings(formattedBillings)
        } else {
          console.error('Erro ao carregar cobranças')
        }
      } catch (error) {
        console.error('Erro de conexão:', error)
      }
    }
    fetchBillings()
  }, [])

  const [showBillingForm, setShowBillingForm] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  const addBilling = async (billing: Omit<Billing, "id" | "createdAt">) => {
    try {
      const response = await fetch('/api/cobrancas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clienteId: billing.customerEmail, // usando email como identificador
          descricao: billing.description,
          valor: billing.amount,
          vencimento: billing.dueDate,
          status: billing.status,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const newBilling: Billing = {
          ...billing,
          id: result.cobrancaId,
          createdAt: new Date().toISOString().split("T")[0],
        }
        setBillings([newBilling, ...billings])
        setShowBillingForm(false)

        // Log da auditoria
        auditService.log({
          userId: user.id,
          userName: user.name,
          action: "CREATE",
          resource: "BILLING",
          resourceId: newBilling.id,
          details: `Criou cobrança para ${billing.customerName} - ${billing.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
        })
      } else {
        console.error('Erro ao salvar cobrança:', await response.text())
      }
    } catch (error) {
      console.error('Erro de conexão:', error)
    }
  }

  const updateBilling = (id: string, updates: Partial<Billing>) => {
    const billing = billings.find((b) => b.id === id)
    setBillings(billings.map((billing) => (billing.id === id ? { ...billing, ...updates } : billing)))

    if (billing) {
      auditService.log({
        userId: user.id,
        userName: user.name,
        action: "UPDATE",
        resource: "BILLING",
        resourceId: id,
        details: `Atualizou cobrança de ${billing.customerName}${updates.status ? ` - Status: ${updates.status}` : ""}`,
      })
    }
  }

  const deleteBilling = (id: string) => {
    const billing = billings.find((b) => b.id === id)
    setBillings(billings.filter((billing) => billing.id !== id))

    if (billing) {
      auditService.log({
        userId: user.id,
        userName: user.name,
        action: "DELETE",
        resource: "BILLING",
        resourceId: id,
        details: `Excluiu cobrança de ${billing.customerName}`,
      })
    }
  }

  const sendEmailCobranca = async (billing: Billing) => {
    try {
      const response = await fetch('/api/enviar-email-cobranca', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: billing.customerName,
          customerEmail: billing.customerEmail,
          description: billing.description,
          amount: billing.amount,
          dueDate: billing.dueDate,
          provider: 'gmail', // pode ser configurável
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        alert('E-mail de cobrança enviado com sucesso!')
        
        // Log da auditoria
        auditService.log({
          userId: user.id,
          userName: user.name,
          action: "EMAIL_SENT",
          resource: "BILLING",
          resourceId: billing.id,
          details: `Enviou e-mail de cobrança para ${billing.customerName}`,
        })
      } else {
        alert(`Erro ao enviar e-mail: ${result.error}`)
      }
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error)
      alert('Erro de conexão ao enviar e-mail')
    }
  }

  const addCustomer = async (customer: Omit<Customer, "id" | "createdAt">) => {
    // Envia para o backend
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: customer.name, email: customer.email }),
      })
      const data = await res.json()
      if (data.success) {
        // Atualiza lista
        const novoCliente = {
          id: data.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone || "",
          address: customer.address || "",
          createdAt: new Date().toISOString(),
        }
        setCustomers([novoCliente, ...customers])
        auditService.log({
          userId: user.id,
          userName: user.name,
          action: "CREATE",
          resource: "CUSTOMER",
          resourceId: data.id,
          details: `Cadastrou novo cliente ${customer.name}`,
        })
      }
    } catch (e) {
      // erro silencioso
    }
  }

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    const customer = customers.find((c) => c.id === id)
    try {
      await fetch(`/api/clientes?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      setCustomers(customers.map((customer) => (customer.id === id ? { ...customer, ...updates } : customer)))
      if (customer) {
        auditService.log({
          userId: user.id,
          userName: user.name,
          action: "UPDATE",
          resource: "CUSTOMER",
          resourceId: id,
          details: `Atualizou dados do cliente ${updates.name || customer.name}`,
        })
      }
    } catch (e) {}
  }

  const deleteCustomer = async (id: string) => {
    const customer = customers.find((c) => c.id === id)
    try {
      await fetch(`/api/clientes?id=${id}`, { method: "DELETE" })
      setCustomers(customers.filter((customer) => customer.id !== id))
      if (customer) {
        auditService.log({
          userId: user.id,
          userName: user.name,
          action: "DELETE",
          resource: "CUSTOMER",
          resourceId: id,
          details: `Excluiu cliente ${customer.name}`,
        })
      }
    } catch (e) {}
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.FynApp.png" alt="Logo FynApp" style={{ width: 64, height: 64 }} />
          </div>
          <div className="flex-1 flex flex-col items-center">
            <h1 className="text-3xl font-bold text-foreground">FynApp</h1>
            <p className="text-muted-foreground mt-2 text-center">Gerencie suas cobranças e clientes de forma eficiente com o FynApp</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserProfile />
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="billings" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Cobranças
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Auditoria
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <ProtectedRoute permission="canViewDashboard">
              <Dashboard billings={billings} customers={customers} />
            </ProtectedRoute>
          </TabsContent>

          <TabsContent value="billings" className="space-y-6">
            <ProtectedRoute permission="canManageBillings">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Cobranças</h2>
                <Button onClick={() => setShowBillingForm(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Cobrança
                </Button>
              </div>

              {showBillingForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>Nova Cobrança</CardTitle>
                    <CardDescription>Preencha os dados para criar uma nova cobrança</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BillingForm
                      customers={customers}
                      onSubmit={addBilling}
                      onCancel={() => setShowBillingForm(false)}
                    />
                  </CardContent>
                </Card>
              )}

              <BillingList billings={billings} onUpdate={updateBilling} onDelete={deleteBilling} onSendEmail={sendEmailCobranca} />
            </ProtectedRoute>
          </TabsContent>

          <TabsContent value="customers">
            <ProtectedRoute permission="canManageCustomers">
          {loadingCustomers ? (
            <div className="text-center py-8 text-muted-foreground">Carregando clientes...</div>
          ) : (
            <CustomerList
              customers={customers}
              onAdd={addCustomer}
              onUpdate={updateCustomer}
              onDelete={deleteCustomer}
            />
          )}
            </ProtectedRoute>
          </TabsContent>

          <TabsContent value="reports">
            <ProtectedRoute permission="canViewReports">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Relatórios Financeiros</CardTitle>
                    <CardDescription>Análise detalhada das suas cobranças</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Funcionalidade de relatórios em desenvolvimento...</p>
                  </CardContent>
                </Card>
              </div>
            </ProtectedRoute>
          </TabsContent>

          <TabsContent value="notifications">
            <ProtectedRoute permission="canManageNotifications">
              <NotificationSystem billings={billings} />
            </ProtectedRoute>
          </TabsContent>

          <TabsContent value="users">
            <ProtectedRoute permission="canManageUsers">
              <UserManagement />
            </ProtectedRoute>
          </TabsContent>

          <TabsContent value="audit">
            <ProtectedRoute permission="canViewAudit">
              <AuditLogComponent />
            </ProtectedRoute>
          </TabsContent>

          <TabsContent value="settings">
            <ProtectedRoute permission="canManageSettings">
              <ThemeSettings />
            </ProtectedRoute>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

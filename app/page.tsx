"use client"

import { useState, useEffect } from "react"
import { Plus, DollarSign, Users, FileText, TrendingUp, Bell, Settings, Shield, Menu, CreditCard, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
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
import { PaymentMethodsConfig } from "@/components/payment-methods-config"
import { DataSyncProvider } from "@/contexts/DataSyncContext"
import { useAuth } from "@/hooks/use-auth"
import { useBillings } from "@/hooks/use-billings"
import { auditService } from "@/lib/audit"
import dynamic from "next/dynamic"

// Importação dinâmica do componente Reports para evitar problemas de SSR
const Reports = dynamic(() => import("@/components/reports-wrapper"), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      <p className="mt-2 text-muted-foreground">Carregando relatórios...</p>
    </div>
  </div>
})

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
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [showBillingForm, setShowBillingForm] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const { billings, loadingBillings, addBilling: addBillingToDb, updateBilling: updateBillingInDb, deleteBilling: deleteBillingFromDb } = useBillings(user)

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

  const handleSubmitBilling = async (billing: Omit<Billing, "id" | "createdAt">) => {
    if (await addBillingToDb(billing)) {
      setShowBillingForm(false)
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
    <DataSyncProvider>
      <SidebarProvider>
      <div className="min-h-screen bg-background flex">
        <Sidebar className="border-r">
          <SidebarContent>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-6">
                <img src="/logo.FynApp.png" alt="Logo FynApp" style={{ width: 32, height: 32 }} />
                <h1 className="text-xl font-bold text-foreground">FynApp</h1>
              </div>
            </div>
            
            <SidebarGroup>
              <SidebarGroupLabel>Sistema</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setActiveTab("dashboard")} isActive={activeTab === "dashboard"}>
                      <TrendingUp className="h-4 w-4" />
                      <span>Dashboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setActiveTab("billings")} isActive={activeTab === "billings"}>
                      <FileText className="h-4 w-4" />
                      <span>Cobranças</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setActiveTab("customers")} isActive={activeTab === "customers"}>
                      <Users className="h-4 w-4" />
                      <span>Clientes</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setActiveTab("reports")} isActive={activeTab === "reports"}>
                      <DollarSign className="h-4 w-4" />
                      <span>Relatórios</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => window.location.href = "/atendimentos"} 
                      isActive={false}
                    >
                      <Clock className="h-4 w-4" />
                      <span>⏱️ Atendimentos</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setActiveTab("payments")} isActive={activeTab === "payments"}>
                      <CreditCard className="h-4 w-4" />
                      <span>Pagamentos</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Administração</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setActiveTab("notifications")} isActive={activeTab === "notifications"}>
                      <Bell className="h-4 w-4" />
                      <span>Notificações</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setActiveTab("users")} isActive={activeTab === "users"}>
                      <Shield className="h-4 w-4" />
                      <span>Usuários</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setActiveTab("audit")} isActive={activeTab === "audit"}>
                      <FileText className="h-4 w-4" />
                      <span>Auditoria</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setActiveTab("settings")} isActive={activeTab === "settings"}>
                      <Settings className="h-4 w-4" />
                      <span>Configurações</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h2 className="text-2xl font-semibold capitalize">{activeTab}</h2>
                  <p className="text-muted-foreground text-sm">Gerencie suas cobranças e clientes de forma eficiente</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <UserProfile />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              {activeTab === "dashboard" && (
                <ProtectedRoute permission="canViewDashboard">
                  <Dashboard billings={billings} customers={customers} />
                </ProtectedRoute>
              )}

              {activeTab === "billings" && (
                <ProtectedRoute permission="canManageBillings">
                  <div className="space-y-6">
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
                            onSubmit={handleSubmitBilling}
                            onCancel={() => setShowBillingForm(false)}
                          />
                        </CardContent>
                      </Card>
                    )}

                    {loadingBillings ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-muted-foreground">Carregando cobranças...</p>
                      </div>
                    ) : (
                      <BillingList
                        billings={billings}
                        onUpdate={updateBillingInDb}
                        onDelete={deleteBillingFromDb}
                        onSendEmail={sendEmailCobranca}
                      />
                    )}
                  </div>
                </ProtectedRoute>
              )}

              {activeTab === "customers" && (
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
              )}

              {activeTab === "reports" && (
                <ProtectedRoute permission="canViewReports">
                  <Reports />
                </ProtectedRoute>
              )}

              {activeTab === "payments" && (
                <ProtectedRoute permission="canManageSettings">
                  <PaymentMethodsConfig />
                </ProtectedRoute>
              )}

              {activeTab === "notifications" && (
                <ProtectedRoute permission="canManageNotifications">
                  <NotificationSystem billings={billings} />
                </ProtectedRoute>
              )}

              {activeTab === "users" && (
                <ProtectedRoute permission="canManageUsers">
                  <UserManagement />
                </ProtectedRoute>
              )}

              {activeTab === "audit" && (
                <ProtectedRoute permission="canViewAudit">
                  <AuditLogComponent />
                </ProtectedRoute>
              )}

              {activeTab === "settings" && (
                <ProtectedRoute permission="canManageSettings">
                  <ThemeSettings />
                </ProtectedRoute>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
    </DataSyncProvider>
  )
}

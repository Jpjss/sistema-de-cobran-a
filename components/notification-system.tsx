"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Mail, Clock, AlertTriangle, Send, Settings, History } from "lucide-react"
import type { Billing } from "@/app/page"
import { EmailSettings } from "@/components/email-settings"

interface NotificationRule {
  id: string
  name: string
  type: "due_reminder" | "overdue_alert" | "payment_confirmation"
  daysBeforeDue?: number
  daysAfterDue?: number
  enabled: boolean
  emailTemplate: string
  subject: string
}

interface NotificationLog {
  id: string
  billingId: string
  customerName: string
  customerEmail: string
  type: string
  subject: string
  sentAt: string
  status: "sent" | "failed" | "pending"
}

interface NotificationSystemProps {
  billings: Billing[]
}

export function NotificationSystem({ billings }: NotificationSystemProps) {
  const [rules, setRules] = useState<NotificationRule[]>([
    {
      id: "1",
      name: "Lembrete 3 dias antes",
      type: "due_reminder",
      daysBeforeDue: 3,
      enabled: true,
      subject: "Lembrete: Cobrança vence em 3 dias",
      emailTemplate: `Olá {{customerName}},

Esperamos que esteja bem! Este é um lembrete amigável de que sua cobrança vencerá em breve.

Detalhes da cobrança:
- Descrição: {{description}}
- Valor: {{amount}}
- Data de vencimento: {{dueDate}}

Para evitar atrasos, por favor efetue o pagamento até a data de vencimento.

Atenciosamente,
Equipe de Cobrança`,
    },
    {
      id: "2",
      name: "Aviso de vencimento",
      type: "overdue_alert",
      daysAfterDue: 1,
      enabled: true,
      subject: "URGENTE: Cobrança em atraso",
      emailTemplate: `Olá {{customerName}},

Identificamos que sua cobrança está em atraso. Por favor, regularize sua situação o quanto antes.

Detalhes da cobrança:
- Descrição: {{description}}
- Valor: {{amount}}
- Data de vencimento: {{dueDate}}
- Dias em atraso: {{daysOverdue}}

Entre em contato conosco se houver alguma dúvida.

Atenciosamente,
Equipe de Cobrança`,
    },
    {
      id: "3",
      name: "Confirmação de pagamento",
      type: "payment_confirmation",
      enabled: true,
      subject: "Pagamento confirmado - Obrigado!",
      emailTemplate: `Olá {{customerName}},

Confirmamos o recebimento do seu pagamento. Obrigado!

Detalhes da cobrança:
- Descrição: {{description}}
- Valor: {{amount}}
- Data do pagamento: {{paymentDate}}

Sua conta está em dia. Agradecemos pela confiança!

Atenciosamente,
Equipe Financeira`,
    },
  ])

  const [logs, setLogs] = useState<NotificationLog[]>([
    {
      id: "1",
      billingId: "1",
      customerName: "João Silva",
      customerEmail: "joao@email.com",
      type: "Lembrete 3 dias antes",
      subject: "Lembrete: Cobrança vence em 3 dias",
      sentAt: "2024-01-12T10:30:00",
      status: "sent",
    },
    {
      id: "2",
      billingId: "3",
      customerName: "Pedro Costa",
      customerEmail: "pedro@email.com",
      type: "Aviso de vencimento",
      subject: "URGENTE: Cobrança em atraso",
      sentAt: "2024-01-02T09:15:00",
      status: "sent",
    },
  ])

  const [selectedRule, setSelectedRule] = useState<NotificationRule | null>(null)
  const [showRuleForm, setShowRuleForm] = useState(false)

  // Simular verificação automática de notificações
  useEffect(() => {
    const checkNotifications = () => {
      const today = new Date()

      billings.forEach((billing) => {
        const dueDate = new Date(billing.dueDate)
        const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24))

        rules.forEach((rule) => {
          if (!rule.enabled) return

          // Lembrete antes do vencimento
          if (rule.type === "due_reminder" && rule.daysBeforeDue === daysDiff && billing.status === "pending") {
            console.log(`Enviando lembrete para ${billing.customerName}`)
            // Aqui seria feita a chamada real para envio do e-mail
          }

          // Aviso após vencimento
          if (rule.type === "overdue_alert" && daysDiff === -(rule.daysAfterDue || 0) && billing.status === "overdue") {
            console.log(`Enviando aviso de atraso para ${billing.customerName}`)
            // Aqui seria feita a chamada real para envio do e-mail
          }
        })
      })
    }

    // Verificar a cada hora (em produção seria configurável)
    const interval = setInterval(checkNotifications, 3600000)
    return () => clearInterval(interval)
  }, [billings, rules])

  const sendManualNotification = async (billingId: string, ruleId: string) => {
    const billing = billings.find((b) => b.id === billingId)
    const rule = rules.find((r) => r.id === ruleId)

    if (!billing || !rule) return

    // Simular envio de e-mail
    const newLog: NotificationLog = {
      id: Date.now().toString(),
      billingId: billing.id,
      customerName: billing.customerName,
      customerEmail: billing.customerEmail,
      type: rule.name,
      subject: rule.subject,
      sentAt: new Date().toISOString(),
      status: "sent",
    }

    setLogs((prev) => [newLog, ...prev])

    // Simular delay de envio
    setTimeout(() => {
      alert(`E-mail enviado para ${billing.customerName}!`)
    }, 1000)
  }

  const updateRule = (ruleId: string, updates: Partial<NotificationRule>) => {
    setRules((prev) => prev.map((rule) => (rule.id === ruleId ? { ...rule, ...updates } : rule)))
  }

  const getPendingNotifications = () => {
    const today = new Date()
    const pending: Array<{ billing: Billing; rule: NotificationRule; action: string }> = []

    billings.forEach((billing) => {
      const dueDate = new Date(billing.dueDate)
      const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24))

      rules.forEach((rule) => {
        if (!rule.enabled) return

        if (rule.type === "due_reminder" && rule.daysBeforeDue === daysDiff && billing.status === "pending") {
          pending.push({ billing, rule, action: "Lembrete de vencimento" })
        }

        if (rule.type === "overdue_alert" && daysDiff === -(rule.daysAfterDue || 0) && billing.status === "overdue") {
          pending.push({ billing, rule, action: "Aviso de atraso" })
        }
      })
    })

    return pending
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "default"
      case "failed":
        return "destructive"
      case "pending":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "sent":
        return "Enviado"
      case "failed":
        return "Falhou"
      case "pending":
        return "Pendente"
      default:
        return "Desconhecido"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="h-6 w-6" />
        <h2 className="text-2xl font-semibold">Sistema de Notificações</h2>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="rules">Regras</TabsTrigger>
          <TabsTrigger value="manual">Envio Manual</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Cards de Resumo */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium dark:text-gray-200">Notificações Ativas</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold dark:text-white">{rules.filter((r) => r.enabled).length}</div>
                <p className="text-xs text-muted-foreground">de {rules.length} regras</p>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium dark:text-gray-200">E-mails Enviados</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold dark:text-white">
                  {logs.filter((l) => l.status === "sent").length}
                </div>
                <p className="text-xs text-muted-foreground">últimos 30 dias</p>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium dark:text-gray-200">Pendentes Hoje</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold dark:text-white">{getPendingNotifications().length}</div>
                <p className="text-xs text-muted-foreground">notificações</p>
              </CardContent>
            </Card>
          </div>

          {/* Notificações Pendentes */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Notificações Pendentes
              </CardTitle>
              <CardDescription>Notificações que serão enviadas automaticamente</CardDescription>
            </CardHeader>
            <CardContent>
              {getPendingNotifications().length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma notificação pendente</p>
              ) : (
                <div className="space-y-3">
                  {getPendingNotifications().map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div>
                        <p className="font-medium dark:text-gray-100">{item.billing.customerName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.action}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">{item.rule.subject}</p>
                      </div>
                      <Button size="sm" onClick={() => sendManualNotification(item.billing.id, item.rule.id)}>
                        <Send className="h-4 w-4 mr-1" />
                        Enviar Agora
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Regras de Notificação</h3>
            <Button onClick={() => setShowRuleForm(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </div>

          <div className="grid gap-4">
            {rules.map((rule) => (
              <Card key={rule.id} className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg dark:text-gray-200">{rule.name}</CardTitle>
                      <CardDescription className="dark:text-gray-400">
                        {rule.type === "due_reminder" && `${rule.daysBeforeDue} dias antes do vencimento`}
                        {rule.type === "overdue_alert" && `${rule.daysAfterDue} dias após vencimento`}
                        {rule.type === "payment_confirmation" && "Quando pagamento for confirmado"}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={rule.enabled} onCheckedChange={(enabled) => updateRule(rule.id, { enabled })} />
                      <Button variant="outline" size="sm" onClick={() => setSelectedRule(rule)}>
                        Editar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm dark:text-gray-100">
                      <strong>Assunto:</strong> {rule.subject}
                    </p>
                    <div className="text-sm dark:text-gray-100">
                      <strong>Template:</strong>
                      <div className="mt-1 p-2 bg-gray-50 rounded text-xs max-h-20 overflow-y-auto dark:bg-gray-700 dark:text-gray-300">
                        {rule.emailTemplate.substring(0, 200)}...
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-200">Envio Manual de Notificações</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Envie notificações específicas para clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {billings
                  .filter((b) => b.status !== "paid")
                  .map((billing) => (
                    <div
                      key={billing.id}
                      className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div>
                        <p className="font-medium dark:text-gray-100">{billing.customerName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{billing.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Vencimento: {new Date(billing.dueDate).toLocaleDateString("pt-BR")} - Status:{" "}
                          {billing.status === "pending" ? "Pendente" : "Atrasado"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {rules
                          .filter((r) => r.enabled)
                          .map((rule) => (
                            <Button
                              key={rule.id}
                              size="sm"
                              variant="outline"
                              onClick={() => sendManualNotification(billing.id, rule.id)}
                            >
                              {rule.name}
                            </Button>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-200">
                <History className="h-5 w-5" />
                Histórico de Notificações
              </CardTitle>
              <CardDescription className="dark:text-gray-400">Todas as notificações enviadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div>
                      <p className="font-medium dark:text-gray-100">{log.customerName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{log.subject}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(log.sentAt).toLocaleString("pt-BR")} - {log.customerEmail}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={getStatusColor(log.status)}>{getStatusText(log.status)}</Badge>
                      <p className="text-xs text-gray-500 mt-1 dark:text-gray-500">{log.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <EmailSettings />
        </TabsContent>
      </Tabs>

      {/* Modal de Edição de Regra */}
      {selectedRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-200">Editar Regra: {selectedRule.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject" className="dark:text-gray-100">
                  Assunto do E-mail
                </Label>
                <Input
                  id="subject"
                  value={selectedRule.subject}
                  onChange={(e) => setSelectedRule({ ...selectedRule, subject: e.target.value })}
                  className="dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template" className="dark:text-gray-100">
                  Template do E-mail
                </Label>
                <Textarea
                  id="template"
                  value={selectedRule.emailTemplate}
                  onChange={(e) => setSelectedRule({ ...selectedRule, emailTemplate: e.target.value })}
                  rows={10}
                  placeholder="Use {{customerName}}, {{description}}, {{amount}}, {{dueDate}} como variáveis"
                  className="dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    updateRule(selectedRule.id, selectedRule)
                    setSelectedRule(null)
                  }}
                  className="flex-1"
                >
                  Salvar Alterações
                </Button>
                <Button variant="outline" onClick={() => setSelectedRule(null)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

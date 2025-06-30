"use client"

import { useState, useEffect, useCallback } from "react"
import { emailService } from "@/lib/email-service"
import type { Billing } from "@/app/page"

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

export function useNotifications(billings: Billing[]) {
  const [rules, setRules] = useState<NotificationRule[]>([
    {
      id: "1",
      name: "Lembrete 3 dias antes",
      type: "due_reminder",
      daysBeforeDue: 3,
      enabled: true,
      subject: "Lembrete: Cobrança vence em 3 dias",
      emailTemplate: "Template padrão de lembrete...",
    },
    {
      id: "2",
      name: "Aviso de vencimento",
      type: "overdue_alert",
      daysAfterDue: 1,
      enabled: true,
      subject: "URGENTE: Cobrança em atraso",
      emailTemplate: "Template padrão de atraso...",
    },
  ])

  const [logs, setLogs] = useState<NotificationLog[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Verificar notificações automáticas
  const checkAutomaticNotifications = useCallback(async () => {
    if (isProcessing) return

    setIsProcessing(true)
    const today = new Date()
    const newLogs: NotificationLog[] = []

    for (const billing of billings) {
      const dueDate = new Date(billing.dueDate)
      const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24))

      for (const rule of rules) {
        if (!rule.enabled) continue

        let shouldSend = false

        // Verificar se deve enviar lembrete
        if (rule.type === "due_reminder" && rule.daysBeforeDue === daysDiff && billing.status === "pending") {
          shouldSend = true
        }

        // Verificar se deve enviar aviso de atraso
        if (rule.type === "overdue_alert" && daysDiff === -(rule.daysAfterDue || 0) && billing.status === "overdue") {
          shouldSend = true
        }

        if (shouldSend) {
          // Verificar se já foi enviado hoje
          const alreadySent = logs.some(
            (log) =>
              log.billingId === billing.id &&
              log.type === rule.name &&
              new Date(log.sentAt).toDateString() === today.toDateString(),
          )

          if (!alreadySent) {
            try {
              let success = false

              if (rule.type === "due_reminder") {
                success = await emailService.sendDueReminder(billing.customerEmail, billing.customerName, billing)
              } else if (rule.type === "overdue_alert") {
                success = await emailService.sendOverdueAlert(billing.customerEmail, billing.customerName, billing)
              }

              const newLog: NotificationLog = {
                id: Date.now().toString() + Math.random(),
                billingId: billing.id,
                customerName: billing.customerName,
                customerEmail: billing.customerEmail,
                type: rule.name,
                subject: rule.subject,
                sentAt: new Date().toISOString(),
                status: success ? "sent" : "failed",
              }

              newLogs.push(newLog)
            } catch (error) {
              console.error("Erro ao enviar notificação:", error)
            }
          }
        }
      }
    }

    if (newLogs.length > 0) {
      setLogs((prev) => [...newLogs, ...prev])
    }

    setIsProcessing(false)
  }, [billings, rules, logs, isProcessing])

  // Enviar notificação manual
  const sendManualNotification = async (billingId: string, ruleId: string) => {
    const billing = billings.find((b) => b.id === billingId)
    const rule = rules.find((r) => r.id === ruleId)

    if (!billing || !rule) return false

    try {
      let success = false

      if (rule.type === "due_reminder") {
        success = await emailService.sendDueReminder(billing.customerEmail, billing.customerName, billing)
      } else if (rule.type === "overdue_alert") {
        success = await emailService.sendOverdueAlert(billing.customerEmail, billing.customerName, billing)
      } else if (rule.type === "payment_confirmation") {
        success = await emailService.sendPaymentConfirmation(billing.customerEmail, billing.customerName, billing)
      }

      const newLog: NotificationLog = {
        id: Date.now().toString(),
        billingId: billing.id,
        customerName: billing.customerName,
        customerEmail: billing.customerEmail,
        type: rule.name,
        subject: rule.subject,
        sentAt: new Date().toISOString(),
        status: success ? "sent" : "failed",
      }

      setLogs((prev) => [newLog, ...prev])
      return success
    } catch (error) {
      console.error("Erro ao enviar notificação manual:", error)
      return false
    }
  }

  // Executar verificação automática periodicamente
  useEffect(() => {
    // Verificar imediatamente
    checkAutomaticNotifications()

    // Verificar a cada hora
    const interval = setInterval(checkAutomaticNotifications, 3600000)
    return () => clearInterval(interval)
  }, [checkAutomaticNotifications])

  return {
    rules,
    setRules,
    logs,
    sendManualNotification,
    checkAutomaticNotifications,
    isProcessing,
  }
}

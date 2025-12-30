"use client"

import { formatDateBR } from "@/lib/date-utils"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Search, Check, X, Mail, CreditCard, QrCode, ExternalLink, Clock } from "lucide-react"
import { useNotifyDataChange } from "@/contexts/DataSyncContext"
import type { Billing } from "@/app/page"

interface BillingListProps {
  billings: Billing[]
  onUpdate: (id: string, updates: Partial<Billing>) => void
  onDelete: (id: string) => void
  onSendEmail?: (billing: Billing) => void
}

export function BillingList({ billings, onUpdate, onDelete, onSendEmail }: BillingListProps) {
  const { onBillingPaid, onBillingDeleted, onBillingUpdated } = useNotifyDataChange()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [origemFilter, setOrigemFilter] = useState<string>("all")

  const filteredBillings = billings.filter((billing) => {
    const matchesSearch =
      billing.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      billing.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || billing.status === statusFilter
    const matchesOrigem = origemFilter === "all" || 
      (origemFilter === "atendimento" && (billing as any).origem === "ATENDIMENTO_TEMPO") ||
      (origemFilter === "manual" && !(billing as any).origem)
    return matchesSearch && matchesStatus && matchesOrigem
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "default"
      case "overdue":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Pago"
      case "overdue":
        return "Atrasado"
      default:
        return "Pendente"
    }
  }

  const generatePaymentLink = (billing: Billing) => {
    // Gerar link de pagamento único
    const baseUrl = window.location.origin;
    const paymentUrl = `${baseUrl}/checkout/${billing.id}`;
    
    // Copiar para clipboard
    navigator.clipboard.writeText(paymentUrl).then(() => {
      // TODO: Mostrar toast de sucesso
      console.log('Link de pagamento copiado!');
    });
  }

  const openPaymentCheckout = (billing: Billing) => {
    // Abrir checkout em nova aba
    const paymentUrl = `/checkout/${billing.id}`;
    window.open(paymentUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por cliente ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="all">Todos os Status</option>
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
          <option value="overdue">Atrasado</option>
        </select>
        <select
          value={origemFilter}
          onChange={(e) => setOrigemFilter(e.target.value)}
          className="px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="all">Todas as Origens</option>
          <option value="atendimento">⏱️ Atendimento por Tempo</option>
          <option value="manual">📝 Manual</option>
        </select>
      </div>

      {/* Lista de Cobranças */}
      <div className="grid gap-4">
        {filteredBillings.map((billing) => (
          <Card key={billing.id} className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg dark:text-gray-100">{billing.customerName}</CardTitle>
                  <CardDescription className="dark:text-gray-400">{billing.customerEmail}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {(billing as any).origem === "ATENDIMENTO_TEMPO" && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                      ⏱️ Atendimento
                    </Badge>
                  )}
                  <Badge variant={getStatusColor(billing.status)}>{getStatusText(billing.status)}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {billing.status !== "paid" && (
                        <>
                          <DropdownMenuItem onClick={() => openPaymentCheckout(billing)}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Receber Pagamento
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => generatePaymentLink(billing)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Copiar Link de Pagamento
                          </DropdownMenuItem>
                        </>
                      )}
                      {onSendEmail && (billing.status === "overdue" || billing.status === "pending") && (
                        <DropdownMenuItem onClick={() => onSendEmail(billing)}>
                          <Mail className="h-4 w-4 mr-2" />
                          Enviar E-mail de Cobrança
                        </DropdownMenuItem>
                      )}
                      {billing.status === "pending" && (
                        <DropdownMenuItem onClick={() => {
                          onBillingPaid(billing.id)
                          onUpdate(billing.id, { status: "paid" })
                        }}>
                          <Check className="h-4 w-4 mr-2" />
                          Marcar como Pago
                        </DropdownMenuItem>
                      )}
                      {billing.status === "paid" && (
                        <DropdownMenuItem onClick={() => {
                          onBillingUpdated(billing.id)
                          onUpdate(billing.id, { status: "pending" })
                        }}>
                          <X className="h-4 w-4 mr-2" />
                          Marcar como Pendente
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => {
                        onBillingDeleted(billing.id)
                        onDelete(billing.id)
                      }} className="text-red-600">
                        <X className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">{billing.description}</p>
                {(billing as any).origem === "ATENDIMENTO_TEMPO" && (billing as any).referenciaId && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <Clock className="h-3 w-3" />
                    <span>Gerada automaticamente pelo atendimento</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      {billing.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                    <p className="text-xs text-gray-500">
                      Vencimento: {formatDateBR(billing.dueDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      Criado em: {formatDateBR(billing.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBillings.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Nenhuma cobrança encontrada</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

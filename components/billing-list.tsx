"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Search, Check, X } from "lucide-react"
import type { Billing } from "@/app/page"

interface BillingListProps {
  billings: Billing[]
  onUpdate: (id: string, updates: Partial<Billing>) => void
  onDelete: (id: string) => void
}

export function BillingList({ billings, onUpdate, onDelete }: BillingListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredBillings = billings.filter((billing) => {
    const matchesSearch =
      billing.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      billing.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || billing.status === statusFilter
    return matchesSearch && matchesStatus
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

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
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
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">Todos os Status</option>
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
          <option value="overdue">Atrasado</option>
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
                  <Badge variant={getStatusColor(billing.status)}>{getStatusText(billing.status)}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {billing.status === "pending" && (
                        <DropdownMenuItem onClick={() => onUpdate(billing.id, { status: "paid" })}>
                          <Check className="h-4 w-4 mr-2" />
                          Marcar como Pago
                        </DropdownMenuItem>
                      )}
                      {billing.status === "paid" && (
                        <DropdownMenuItem onClick={() => onUpdate(billing.id, { status: "pending" })}>
                          <X className="h-4 w-4 mr-2" />
                          Marcar como Pendente
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onDelete(billing.id)} className="text-red-600">
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
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      {billing.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                    <p className="text-xs text-gray-500">
                      Vencimento: {new Date(billing.dueDate).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      Criado em: {new Date(billing.createdAt).toLocaleDateString("pt-BR")}
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

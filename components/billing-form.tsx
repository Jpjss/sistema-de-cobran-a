"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Billing, Customer } from "@/app/page"

interface BillingFormProps {
  customers: Customer[]
  billing?: Billing
  onSubmit: (billing: Omit<Billing, "id" | "createdAt">) => void
  onCancel: () => void
}

export function BillingForm({ customers, billing, onSubmit, onCancel }: BillingFormProps) {
  const [formData, setFormData] = useState({
    customerName: billing?.customerName || "",
    customerEmail: billing?.customerEmail || "",
    description: billing?.description || "",
    amount: billing?.amount?.toString() || "",
    dueDate: billing?.dueDate || "",
    status: billing?.status || ("pending" as const),
  })

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId)
    if (customer) {
      setFormData((prev) => ({
        ...prev,
        customerName: customer.name,
        customerEmail: customer.email,
      }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      description: formData.description,
      amount: Number.parseFloat(formData.amount),
      dueDate: formData.dueDate,
      status: formData.status,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer">Cliente</Label>
          <Select onValueChange={handleCustomerSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerEmail">Email do Cliente</Label>
          <Input
            id="customerEmail"
            type="email"
            value={formData.customerEmail}
            onChange={(e) => setFormData((prev) => ({ ...prev, customerEmail: e.target.value }))}
            placeholder="cliente@email.com"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customerName">Nome do Cliente</Label>
        <Input
          id="customerName"
          value={formData.customerName}
          onChange={(e) => setFormData((prev) => ({ ...prev, customerName: e.target.value }))}
          placeholder="Nome completo do cliente"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Descreva o serviço ou produto"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Valor (R$)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
            placeholder="0,00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueDate">Data de Vencimento</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value: "pending" | "paid" | "overdue") => setFormData((prev) => ({ ...prev, status: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="overdue">Atrasado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {billing ? "Atualizar" : "Criar"} Cobrança
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, DollarSign, Calendar, FileText, User, Mail, Phone } from "lucide-react"
import { formatDateBR } from "@/lib/date-utils"

interface Billing {
  _id: string
  customerId: string
  amount: number
  dueDate: string
  status: string
  description: string
  paymentMethod?: string
  origem?: string
  referenciaId?: string
  createdAt: string
  customer?: {
    name: string
    email: string
    phone?: string
  }
}

export default function CobrancaDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const cobrancaId = params.id as string

  const [billing, setBilling] = useState<Billing | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cobrancaId) {
      carregarCobranca()
    }
  }, [cobrancaId])

  const carregarCobranca = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/cobrancas/${cobrancaId}`)
      
      if (!response.ok) {
        throw new Error("Cobrança não encontrada")
      }

      const data = await response.json()
      setBilling(data)
    } catch (err) {
      console.error("Erro ao carregar cobrança:", err)
      setError(err instanceof Error ? err.message : "Erro ao carregar cobrança")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      paid: { label: "Pago", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
      pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
      overdue: { label: "Atrasado", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
      cancelled: { label: "Cancelado", className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" }
    }

    const config = variants[status] || { label: status, className: "" }
    return <Badge className={config.className}>{config.label}</Badge>
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Carregando cobrança...</p>
        </div>
      </div>
    )
  }

  if (error || !billing) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Erro</CardTitle>
            <CardDescription>{error || "Cobrança não encontrada"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.back()} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold dark:text-white">Detalhes da Cobrança</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">ID: {billing._id}</p>
          </div>
        </div>
        {getStatusBadge(billing.status)}
      </div>

      {/* Origem (se for de atendimento) */}
      {billing.origem === "ATENDIMENTO_TEMPO" && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Cobrança de Atendimento por Tempo
            </CardTitle>
            <CardDescription>
              Esta cobrança foi gerada automaticamente pelo sistema de atendimento por tempo.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card de Informações da Cobrança */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-gray-200">
              <FileText className="h-5 w-5" />
              Informações da Cobrança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Valor</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {billing.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Vencimento</p>
                <p className="font-medium dark:text-white">{formatDateBR(billing.dueDate)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-slate-600 mt-1" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Descrição</p>
                <p className="dark:text-white">{billing.description}</p>
              </div>
            </div>

            {billing.paymentMethod && (
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-slate-600 mt-1" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Método de Pagamento</p>
                  <p className="dark:text-white capitalize">{billing.paymentMethod}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-slate-600 mt-1" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Criada em</p>
                <p className="dark:text-white">{formatDateBR(billing.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Informações do Cliente */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-gray-200">
              <User className="h-5 w-5" />
              Informações do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {billing.customer ? (
              <>
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Nome</p>
                    <p className="font-medium dark:text-white">{billing.customer.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">E-mail</p>
                    <p className="dark:text-white">{billing.customer.email}</p>
                  </div>
                </div>

                {billing.customer.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Telefone</p>
                      <p className="dark:text-white">{billing.customer.phone}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-slate-400">Informações do cliente não disponíveis</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Button onClick={() => router.push("/")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
            {billing.origem === "ATENDIMENTO_TEMPO" && (
              <Button onClick={() => router.push("/atendimentos?tab=historico")} variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Ver Atendimento
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

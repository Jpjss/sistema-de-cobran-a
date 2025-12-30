import { formatDateBR } from "@/lib/date-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, FileText, Users, AlertCircle, Calendar, Clock } from "lucide-react"
import type { Billing, Customer } from "@/app/page"

interface DashboardProps {
  billings: Billing[]
  customers: Customer[]
}

export function Dashboard({ billings, customers }: DashboardProps) {
  const totalRevenue = billings.filter((b) => b.status === "paid").reduce((sum, b) => sum + b.amount, 0)

  const pendingAmount = billings.filter((b) => b.status === "pending").reduce((sum, b) => sum + b.amount, 0)

  const overdueAmount = billings.filter((b) => b.status === "overdue").reduce((sum, b) => sum + b.amount, 0)

  const overdueCount = billings.filter((b) => b.status === "overdue").length
  const pendingCount = billings.filter((b) => b.status === "pending").length

  // Estatísticas de atendimentos
  const cobrancasAtendimento = billings.filter((b) => (b as any).origem === "ATENDIMENTO_TEMPO")
  const valorAtendimentos = cobrancasAtendimento.reduce((sum, b) => sum + b.amount, 0)
  const atendimentosPagos = cobrancasAtendimento.filter((b) => b.status === "paid").length

  const recentBillings = billings.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-200">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">
              {totalRevenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-muted-foreground">Cobranças pagas</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-200">Pendente</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">
              {pendingAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-muted-foreground">{pendingCount} cobranças</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-200">Em Atraso</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {overdueAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-muted-foreground"> {overdueCount} cobranças</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-200">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{customers.length}</div>
            <p className="text-xs text-muted-foreground">Clientes cadastrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Atendimentos (se houver) */}
      {cobrancasAtendimento.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="dark:bg-gray-800 dark:border-gray-700 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-200">⏱️ Atendimentos</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{cobrancasAtendimento.length}</div>
              <p className="text-xs text-muted-foreground">Cobranças de atendimento</p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-200">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {valorAtendimentos.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
              <p className="text-xs text-muted-foreground">Gerado por atendimentos</p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-200">Pagos</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{atendimentosPagos}</div>
              <p className="text-xs text-muted-foreground">de {cobrancasAtendimento.length} atendimentos</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cobranças Recentes */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-gray-200">
            <FileText className="h-5 w-5" />
            Cobranças Recentes
          </CardTitle>
          <CardDescription className="dark:text-gray-400">Últimas cobranças criadas no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentBillings.map((billing) => (
              <div
                key={billing.id}
                className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium dark:text-gray-200">{billing.customerName}</p>
                    {(billing as any).origem === "ATENDIMENTO_TEMPO" && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 text-xs">
                        ⏱️ Atendimento
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{billing.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Vencimento: {formatDateBR(billing.dueDate)}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-semibold dark:text-gray-200">
                    {billing.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                  <Badge
                    variant={
                      billing.status === "paid" ? "default" : billing.status === "overdue" ? "destructive" : "secondary"
                    }
                  >
                    {billing.status === "paid" ? "Pago" : billing.status === "overdue" ? "Atrasado" : "Pendente"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

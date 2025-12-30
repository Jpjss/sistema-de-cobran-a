"use client"

import { useState, useEffect } from "react"
import { useAtendimentos } from "@/hooks/use-atendimentos"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, DollarSign, User, Calendar, FileText, RefreshCw, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ListagemAtendimentosProps {
  analistaId?: string // Filtro opcional por analista
}

/**
 * Componente para visualizar o histórico de atendimentos
 * 
 * Funcionalidades:
 * - Listar todos os atendimentos
 * - Filtrar por status
 * - Exibir tempo total e valor
 * - Link para a cobrança gerada
 */
export function ListagemAtendimentos({ analistaId }: ListagemAtendimentosProps) {
  const { atendimentos, isLoading, listarAtendimentos } = useAtendimentos()
  const [filtroStatus, setFiltroStatus] = useState<string>("todos")

  useEffect(() => {
    carregarAtendimentos()
  }, [filtroStatus, analistaId])

  const carregarAtendimentos = () => {
    const filtros: any = {}
    
    if (analistaId) {
      filtros.analistaId = analistaId
    }
    
    if (filtroStatus !== "todos") {
      filtros.status = filtroStatus
    }

    listarAtendimentos(filtros)
  }

  const formatarTempo = (minutos?: number): string => {
    if (!minutos) return "-"
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    return `${horas}h${mins.toString().padStart(2, '0')}min`
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: any, label: string }> = {
      em_andamento: { variant: "default", label: "Em andamento" },
      pausado: { variant: "secondary", label: "Pausado" },
      finalizado: { variant: "success", label: "Finalizado" },
      cancelado: { variant: "destructive", label: "Cancelado" }
    }

    const config = badges[status] || { variant: "default", label: status }
    
    return (
      <Badge variant={config.variant as any}>
        {config.label}
      </Badge>
    )
  }

  const formatarData = (data: string) => {
    try {
      return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    } catch {
      return data
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Histórico de Atendimentos
              </CardTitle>
              <CardDescription>
                Visualize todos os atendimentos realizados e as cobranças geradas
              </CardDescription>
            </div>
            <Button onClick={carregarAtendimentos} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtro de status */}
          <div className="flex items-center gap-4">
            <div className="w-48">
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="em_andamento">Em andamento</SelectItem>
                  <SelectItem value="pausado">Pausado</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-slate-600">
              {atendimentos.length} atendimento(s) encontrado(s)
            </div>
          </div>

          {/* Tabela de atendimentos */}
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : atendimentos.length === 0 ? (
            <div className="text-center p-8 text-slate-500">
              Nenhum atendimento encontrado
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Analista</TableHead>
                    <TableHead>Data/Hora Início</TableHead>
                    <TableHead>Tempo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cobrança</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atendimentos.map((atendimento) => (
                    <TableRow key={atendimento._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <div>
                            <div className="font-medium">{atendimento.cliente?.name}</div>
                            <div className="text-sm text-slate-500">{atendimento.cliente?.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{atendimento.analista?.name}</div>
                        <div className="text-sm text-slate-500">
                          R$ {atendimento.valorHora.toFixed(2)}/h
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {formatarData(atendimento.inicio)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span className="font-mono">
                            {formatarTempo(atendimento.tempoMinutos)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {atendimento.valorTotal ? (
                          <div className="flex items-center gap-2 font-semibold text-green-600">
                            <DollarSign className="h-4 w-4" />
                            R$ {atendimento.valorTotal.toFixed(2)}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(atendimento.status)}
                      </TableCell>
                      <TableCell>
                        {atendimento.cobrancaId ? (
                          <div className="space-y-1">
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-blue-600"
                              asChild
                            >
                              <a href={`/cobrancas/${atendimento.cobrancaId}`} target="_blank">
                                <FileText className="h-4 w-4 mr-1" />
                                Ver Cobrança
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </Button>
                            {atendimento.cobranca && (
                              <div className="text-xs text-slate-500">
                                {atendimento.cobranca.status === "pending" ? "Pendente" : 
                                 atendimento.cobranca.status === "paid" ? "Pago" : 
                                 atendimento.cobranca.status}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Resumo estatístico */}
          {atendimentos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-slate-600">Total de Atendimentos</div>
                  <div className="text-2xl font-bold">{atendimentos.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-slate-600">Finalizados</div>
                  <div className="text-2xl font-bold text-green-600">
                    {atendimentos.filter(a => a.status === "finalizado").length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-slate-600">Tempo Total</div>
                  <div className="text-2xl font-bold">
                    {formatarTempo(
                      atendimentos
                        .filter(a => a.tempoMinutos)
                        .reduce((acc, a) => acc + (a.tempoMinutos || 0), 0)
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-slate-600">Valor Total</div>
                  <div className="text-2xl font-bold text-green-600">
                    R$ {atendimentos
                      .filter(a => a.valorTotal)
                      .reduce((acc, a) => acc + (a.valorTotal || 0), 0)
                      .toFixed(2)
                    }
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

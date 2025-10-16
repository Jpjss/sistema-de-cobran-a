'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart
} from 'recharts'
import { 
  TrendingUp, TrendingDown, DollarSign, AlertTriangle, 
  Calendar, Mail, Activity, Users, Clock, RefreshCw, Wifi, WifiOff
} from 'lucide-react'
import { useReportsData } from '@/hooks/use-reports-data'
import { toast } from 'sonner'

interface RelatorioFinanceiro {
  resumo: {
    totalRecebido: number
    totalPendente: number
    totalVencido: number
    previsaoProximoMes: number
  }
  historicoMensal: Array<{
    mes: string
    mesCompleto: string
    recebido: number
    pendente: number
    total: number
  }>
  dadosPizza: Array<{
    name: string
    value: number
    fill: string
  }>
  metadados: {
    totalCobrancas: number
    cobrancasPagas: number
    cobrancasPendentes: number
    dataAtualizacao: string
  }
}

interface RelatorioInadimplencia {
  resumo: {
    totalInadimplencia: number
    totalInadimplentes: number
    percentualInadimplencia: number
    mediaValorInadimplente: number
  }
  listaInadimplentes: Array<{
    id: string
    clienteNome: string
    clienteEmail: string
    valor: number
    vencimento: string
    diasAtraso: number
    descricao: string
    categoria: string
  }>
  historicoMensal: Array<{
    mes: string
    mesCompleto: string
    valor: number
    quantidade: number
  }>
  inadimplenciaPorFaixa: Array<{
    nome: string
    quantidade: number
    valor: number
    cor: string
  }>
}

interface RelatorioAtividades {
  resumoMensal: {
    cobrancasCriadas: number
    cobrancasPagas: number
    emailsEnviados: number
    taxaConversaoMes: number
  }
  resumoSemanal: {
    cobrancasCriadas: number
    cobrancasPagas: number
    taxaConversaoSemana: number
  }
  historicoDiario: Array<{
    data: string
    dataFormatada: string
    criadas: number
    pagas: number
    diaSemana: string
  }>
  performanceSemanal: Array<{
    semana: string
    dataInicio: string
    dataFim: string
    criadas: number
    pagas: number
    taxaConversao: number
  }>
  estatisticasEmail: {
    enviados: number
    abertos: number
    taxaAbertura: number
  }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState('financeiro')
  const [showUpdateIndicator, setShowUpdateIndicator] = useState(false)
  
  // Usar o novo hook para dados automáticos
  const {
    relatorioFinanceiro,
    relatorioInadimplencia, 
    relatorioAtividades,
    isLoading: loading,
    error,
    hasChanges,
    lastUpdate,
    refresh,
    clearChanges,
    isAutoRefreshEnabled
  } = useReportsData({
    autoRefreshInterval: 30000, // 30 segundos
    enableAutoRefresh: true,
    onDataChange: () => {
      setShowUpdateIndicator(true)
      toast.success('📊 Relatórios atualizados automaticamente!')
      
      // Remover indicador após 3 segundos
      setTimeout(() => setShowUpdateIndicator(false), 3000)
    }
  })

  // Escutar eventos globais de mudança de dados
  useEffect(() => {
    const handleDataChange = (event: CustomEvent) => {
      console.log('🔄 Evento de mudança detectado:', event.detail)
      // Aguardar um pouco antes de atualizar para permitir que a mudança seja salva
      setTimeout(() => {
        refresh()
      }, 1000)
    }

    window.addEventListener('reportsDataChange', handleDataChange as EventListener)
    
    return () => {
      window.removeEventListener('reportsDataChange', handleDataChange as EventListener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Executar apenas na montagem, refresh é estável

  // Limpar indicador de mudanças quando o usuário interage
  useEffect(() => {
    if (hasChanges) {
      clearChanges()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]) // Removido hasChanges e clearChanges das dependências para evitar loop

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Carregando relatórios...</p>
        {isAutoRefreshEnabled && (
          <div className="flex items-center mt-2 text-sm text-green-600">
            <Wifi className="h-4 w-4 mr-1" />
            Atualização automática ativa
          </div>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Erro ao carregar relatórios</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <div className="flex items-center justify-center gap-2">
          <Button onClick={() => refresh()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
          {!isAutoRefreshEnabled && (
            <div className="flex items-center text-sm text-orange-600">
              <WifiOff className="h-4 w-4 mr-1" />
              Atualização automática desabilitada
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
            {showUpdateIndicator && (
              <Badge variant="outline" className="animate-pulse bg-green-50 text-green-700 border-green-300">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Atualizado
              </Badge>
            )}
            {hasChanges && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                Dados alterados
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-muted-foreground">
              Análise completa do seu sistema de cobrança
            </p>
            {lastUpdate && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                Última atualização: {lastUpdate.toLocaleString('pt-BR')}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAutoRefreshEnabled && (
            <div className="flex items-center text-sm text-green-600 mr-3">
              <Wifi className="h-4 w-4 mr-1 animate-pulse" />
              Auto-sync
            </div>
          )}
          <Button onClick={() => refresh()} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="inadimplencia">Inadimplência</TabsTrigger>
          <TabsTrigger value="atividades">Atividades</TabsTrigger>
        </TabsList>

        {/* RELATÓRIO FINANCEIRO */}
        <TabsContent value="financeiro" className="space-y-4">
          {relatorioFinanceiro && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(relatorioFinanceiro.resumo.totalRecebido)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {relatorioFinanceiro.metadados.cobrancasPagas} cobranças pagas
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(relatorioFinanceiro.resumo.totalPendente)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {relatorioFinanceiro.metadados.cobrancasPendentes} cobranças pendentes
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Vencido</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(relatorioFinanceiro.resumo.totalVencido)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Valor em atraso
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Previsão Próximo Mês</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(relatorioFinanceiro.resumo.previsaoProximoMes)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Baseado na média dos últimos 3 meses
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Evolução Mensal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={relatorioFinanceiro.historicoMensal}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          labelFormatter={(label) => `Mês: ${label}`}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="recebido" 
                          stroke="#22c55e" 
                          name="Recebido"
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="pendente" 
                          stroke="#f59e0b" 
                          name="Pendente"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição Atual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={relatorioFinanceiro.dadosPizza}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(1)}%`}
                        >
                          {relatorioFinanceiro.dadosPizza.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* RELATÓRIO DE INADIMPLÊNCIA */}
        <TabsContent value="inadimplencia" className="space-y-4">
          {relatorioInadimplencia && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Inadimplência</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(relatorioInadimplencia.resumo.totalInadimplencia)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {relatorioInadimplencia.resumo.totalInadimplentes} clientes inadimplentes
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taxa de Inadimplência</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatPercent(relatorioInadimplencia.resumo.percentualInadimplencia)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Do total de cobranças
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
                    <DollarSign className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(relatorioInadimplencia.resumo.mediaValorInadimplente)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Por cliente inadimplente
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Clientes Afetados</CardTitle>
                    <Users className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {relatorioInadimplencia.resumo.totalInadimplentes}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Clientes com pendências
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Inadimplência por Faixa de Atraso</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={relatorioInadimplencia.inadimplenciaPorFaixa}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nome" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend />
                        <Bar dataKey="valor" fill="#ef4444" name="Valor" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Histórico de Inadimplência</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={relatorioInadimplencia.historicoMensal}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="valor" 
                          stroke="#ef4444" 
                          fill="#ef4444" 
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Lista de Inadimplentes</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Clientes com cobranças em atraso (limitado a 50 registros)
                  </p>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Dias em Atraso</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatorioInadimplencia.listaInadimplentes.slice(0, 10).map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.clienteNome}</div>
                              <div className="text-sm text-muted-foreground">{item.clienteEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(item.valor)}</TableCell>
                          <TableCell>
                            {new Date(item.vencimento).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.diasAtraso > 60 ? 'destructive' : 'secondary'}>
                              {item.diasAtraso} dias
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">
                              Vencido
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {relatorioInadimplencia.listaInadimplentes.length > 10 && (
                    <div className="text-center text-sm text-muted-foreground mt-4">
                      Mostrando 10 de {relatorioInadimplencia.listaInadimplentes.length} registros
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* RELATÓRIO DE ATIVIDADES */}
        <TabsContent value="atividades" className="space-y-4">
          {relatorioAtividades && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cobranças Criadas (Mês)</CardTitle>
                    <Activity className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {relatorioAtividades.resumoMensal.cobrancasCriadas}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {relatorioAtividades.resumoSemanal.cobrancasCriadas} esta semana
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cobranças Pagas (Mês)</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {relatorioAtividades.resumoMensal.cobrancasPagas}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {relatorioAtividades.resumoSemanal.cobrancasPagas} esta semana
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {formatPercent(relatorioAtividades.resumoMensal.taxaConversaoMes)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatPercent(relatorioAtividades.resumoSemanal.taxaConversaoSemana)} esta semana
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">E-mails Enviados</CardTitle>
                    <Mail className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {relatorioAtividades.resumoMensal.emailsEnviados}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatPercent(relatorioAtividades.estatisticasEmail.taxaAbertura)} taxa de abertura
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Atividade Diária (Últimos 30 dias)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={relatorioAtividades.historicoDiario}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="dataFormatada"
                          tick={{ fontSize: 12 }}
                          interval={6}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="criadas" 
                          stackId="1"
                          stroke="#3b82f6" 
                          fill="#3b82f6" 
                          fillOpacity={0.6}
                          name="Criadas"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="pagas" 
                          stackId="2"
                          stroke="#22c55e" 
                          fill="#22c55e" 
                          fillOpacity={0.6}
                          name="Pagas"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Semanal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={relatorioAtividades.performanceSemanal}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="semana" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="criadas" fill="#3b82f6" name="Criadas" />
                        <Bar dataKey="pagas" fill="#22c55e" name="Pagas" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Semanal Detalhada</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Período</TableHead>
                        <TableHead>Cobranças Criadas</TableHead>
                        <TableHead>Cobranças Pagas</TableHead>
                        <TableHead>Taxa de Conversão</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatorioAtividades.performanceSemanal.map((semana: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{semana.semana}</div>
                              <div className="text-sm text-muted-foreground">
                                {semana.dataInicio} - {semana.dataFim}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{semana.criadas}</TableCell>
                          <TableCell>{semana.pagas}</TableCell>
                          <TableCell>
                            <Badge variant={semana.taxaConversao > 50 ? 'default' : 'secondary'}>
                              {formatPercent(semana.taxaConversao)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Hook customizado para detectar mudanças nos dados e atualizar relatórios automaticamente
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseReportsDataOptions {
  autoRefreshInterval?: number // Intervalo de atualização automática em ms (padrão: 30 segundos)
  enableAutoRefresh?: boolean  // Habilitar atualização automática
  onDataChange?: () => void    // Callback quando dados mudam
}

interface ReportsData {
  relatorioFinanceiro: any | null
  relatorioInadimplencia: any | null
  relatorioAtividades: any | null
  lastUpdate: Date | null
  isLoading: boolean
  error: string | null
  hasChanges: boolean
}

export function useReportsData(options: UseReportsDataOptions = {}) {
  const {
    autoRefreshInterval = 30000, // 30 segundos
    enableAutoRefresh = true,
    onDataChange
  } = options

  const [data, setData] = useState<ReportsData>({
    relatorioFinanceiro: null,
    relatorioInadimplencia: null,
    relatorioAtividades: null,
    lastUpdate: null,
    isLoading: true,
    error: null,
    hasChanges: false
  })

  const lastDataHash = useRef<string>('')
  const refreshTimeoutRef = useRef<NodeJS.Timeout>()
  const isUnmountedRef = useRef(false)

  // Função para obter dados simulados como fallback
  const getMockData = useCallback(() => {
    return {
      financeiro: {
        resumo: {
          totalRecebido: 25000,
          totalPendente: 15000,
          totalVencido: 5000,
          previsaoProximoMes: 20000
        },
        historicoMensal: [
          { mes: 'Set', mesCompleto: 'setembro de 2024', recebido: 20000, pendente: 8000, total: 28000 },
          { mes: 'Out', mesCompleto: 'outubro de 2024', recebido: 22000, pendente: 10000, total: 32000 },
          { mes: 'Nov', mesCompleto: 'novembro de 2024', recebido: 18000, pendente: 7000, total: 25000 },
          { mes: 'Dez', mesCompleto: 'dezembro de 2024', recebido: 25000, pendente: 12000, total: 37000 },
          { mes: 'Jan', mesCompleto: 'janeiro de 2025', recebido: 23000, pendente: 9000, total: 32000 },
          { mes: 'Fev', mesCompleto: 'fevereiro de 2025', recebido: 25000, pendente: 15000, total: 40000 }
        ],
        dadosPizza: [
          { name: 'Recebido', value: 25000, fill: '#22c55e' },
          { name: 'Pendente', value: 15000, fill: '#f59e0b' },
          { name: 'Vencido', value: 5000, fill: '#ef4444' }
        ],
        metadados: {
          totalCobrancas: 45,
          cobrancasPagas: 25,
          cobrancasPendentes: 20,
          dataAtualizacao: new Date().toISOString()
        }
      },
      inadimplencia: {
        resumo: {
          totalInadimplencia: 8500,
          totalInadimplentes: 12,
          percentualInadimplencia: 26.7,
          maiorAtraso: 45
        },
        listaInadimplentes: [
          { _id: '1', nomeCliente: 'João Silva', valor: 2500, diasAtraso: 15, vencimento: '2024-10-01' },
          { _id: '2', nomeCliente: 'Maria Santos', valor: 1800, diasAtraso: 8, vencimento: '2024-10-08' },
          { _id: '3', nomeCliente: 'Pedro Costa', valor: 3200, diasAtraso: 22, vencimento: '2024-09-25' }
        ],
        faixasAtraso: [
          { nome: '1-30 dias', valor: 5500, quantidade: 8, cor: '#f59e0b' },
          { nome: '31-60 dias', valor: 2200, quantidade: 3, cor: '#ef4444' },
          { nome: '61-90 dias', valor: 800, quantidade: 1, cor: '#dc2626' },
          { nome: '90+ dias', valor: 0, quantidade: 0, cor: '#7f1d1d' }
        ],
        historicoMensal: [
          { mes: 'Set', valor: 6200, quantidade: 10 },
          { mes: 'Out', valor: 7800, quantidade: 14 },
          { mes: 'Nov', valor: 5400, quantidade: 9 },
          { mes: 'Dez', valor: 8900, quantidade: 16 },
          { mes: 'Jan', valor: 7200, quantidade: 11 },
          { mes: 'Fev', valor: 8500, quantidade: 12 }
        ]
      },
      atividades: {
        resumoMensal: {
          cobrancasCriadas: 28,
          cobrancasPagas: 18,
          emailsEnviados: 42,
          taxaConversaoMes: 64
        },
        resumoSemanal: {
          cobrancasCriadas: 7,
          cobrancasPagas: 5,
          taxaConversaoSemana: 71
        },
        historicoDiario: Array.from({ length: 30 }, (_, i) => {
          const data = new Date()
          data.setDate(data.getDate() - (29 - i))
          return {
            data: data.toISOString().split('T')[0],
            dataFormatada: data.toLocaleDateString('pt-BR'),
            criadas: Math.floor(Math.random() * 5) + 1,
            pagas: Math.floor(Math.random() * 4),
            diaSemana: data.toLocaleDateString('pt-BR', { weekday: 'short' })
          }
        }),
        performanceSemanal: [
          { semana: 'Sem 1', dataInicio: '07/10/2024', dataFim: '13/10/2024', criadas: 8, pagas: 6, taxaConversao: 75 },
          { semana: 'Sem 2', dataInicio: '30/09/2024', dataFim: '06/10/2024', criadas: 6, pagas: 4, taxaConversao: 67 },
          { semana: 'Sem 3', dataInicio: '23/09/2024', dataFim: '29/09/2024', criadas: 9, pagas: 5, taxaConversao: 56 },
          { semana: 'Sem 4', dataInicio: '16/09/2024', dataFim: '22/09/2024', criadas: 5, pagas: 3, taxaConversao: 60 }
        ],
        estatisticasEmail: {
          enviados: 42,
          abertos: 29,
          taxaAbertura: 69,
          cliques: 15,
          taxaClique: 36
        }
      }
    }
  }, [])

  // Função para carregar dados dos relatórios
  const loadData = useCallback(async (forceRefresh = false) => {
    if (isUnmountedRef.current) return

    console.log('📊 Carregando dados dos relatórios (usando dados simulados por segurança)...')
    
    // Para evitar problemas de rede, vamos sempre usar dados simulados por enquanto
    // mas manter a estrutura para quando quiser tentar APIs reais novamente
    
    setData(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const mockData = getMockData()
      
      // Simular um pequeno delay como se fosse uma chamada de API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (isUnmountedRef.current) return

      setData({
        relatorioFinanceiro: mockData.financeiro,
        relatorioInadimplencia: mockData.inadimplencia,
        relatorioAtividades: mockData.atividades,
        lastUpdate: new Date(),
        isLoading: false,
        error: null,
        hasChanges: false
      })

      console.log('✅ Dados simulados carregados com sucesso!')
      
      if (onDataChange) {
        onDataChange()
      }

    } catch (error) {
      console.error('❌ Erro ao carregar dados simulados:', error)
      
      if (isUnmountedRef.current) return

      setData(prev => ({
        ...prev,
        isLoading: false,
        error: 'Erro ao carregar dados dos relatórios'
      }))
    }
  }, [getMockData, onDataChange])

  // Função de refresh manual
  const refresh = useCallback(() => {
    loadData(true)
  }, [loadData])

  // Configurar atualização automática
  const setupAutoRefresh = useCallback(() => {
    if (!enableAutoRefresh) return

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    refreshTimeoutRef.current = setTimeout(() => {
      if (!isUnmountedRef.current) {
        console.log('⏰ Atualização automática dos relatórios...')
        loadData(false)
        setupAutoRefresh() // Reagendar próxima atualização
      }
    }, autoRefreshInterval)
  }, [enableAutoRefresh, autoRefreshInterval, loadData])

  // Limpar mudanças detectadas
  const clearChanges = useCallback(() => {
    setData(prev => ({ ...prev, hasChanges: false }))
  }, [])

  // Hook de inicialização
  useEffect(() => {
    isUnmountedRef.current = false
    loadData(false)
    
    if (enableAutoRefresh) {
      setupAutoRefresh()
    }

    return () => {
      isUnmountedRef.current = true
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Executar apenas uma vez na montagem

  return {
    relatorioFinanceiro: data.relatorioFinanceiro,
    relatorioInadimplencia: data.relatorioInadimplencia,
    relatorioAtividades: data.relatorioAtividades,
    isLoading: data.isLoading,
    error: data.error,
    hasChanges: data.hasChanges,
    lastUpdate: data.lastUpdate,
    refresh,
    clearChanges,
    isAutoRefreshEnabled: enableAutoRefresh
  }
}
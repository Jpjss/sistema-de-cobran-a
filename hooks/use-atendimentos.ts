import { useState, useEffect, useCallback } from "react"

interface Atendimento {
  _id: string
  customerId: string
  analistaId: string
  inicio: string
  fim?: string
  tempoMinutos?: number
  valorHora: number
  valorTotal?: number
  status: "em_andamento" | "pausado" | "finalizado" | "cancelado"
  descricao?: string
  cobrancaId?: string
  cliente?: {
    _id: string
    name: string
    email: string
  }
  analista?: {
    _id: string
    name: string
    email: string
  }
  cobranca?: {
    _id: string
    amount: number
    status: string
    dueDate: string
  }
}

interface UseAtendimentosReturn {
  atendimentos: Atendimento[]
  atendimentoAtual: Atendimento | null
  tempoDecorrido: number
  isLoading: boolean
  error: string | null
  iniciarAtendimento: (customerId: string, analistaId: string, descricao?: string) => Promise<void>
  pausarAtendimento: (atendimentoId: string) => Promise<void>
  retomarAtendimento: (atendimentoId: string) => Promise<void>
  finalizarAtendimento: (atendimentoId: string, diasParaVencimento?: number) => Promise<void>
  cancelarAtendimento: (atendimentoId: string) => Promise<void>
  listarAtendimentos: (filtros?: { analistaId?: string, customerId?: string, status?: string }) => Promise<void>
  buscarAtendimentoEmAndamento: (analistaId: string) => Promise<void>
}

/**
 * Hook customizado para gerenciar atendimentos por tempo
 * 
 * @example
 * const { 
 *   iniciarAtendimento, 
 *   finalizarAtendimento, 
 *   atendimentoAtual,
 *   tempoDecorrido 
 * } = useAtendimentos()
 */
export function useAtendimentos(): UseAtendimentosReturn {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([])
  const [atendimentoAtual, setAtendimentoAtual] = useState<Atendimento | null>(null)
  const [tempoDecorrido, setTempoDecorrido] = useState<number>(0) // em segundos
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Cronômetro em tempo real
  useEffect(() => {
    if (!atendimentoAtual || atendimentoAtual.status !== "em_andamento") {
      return
    }

    const interval = setInterval(() => {
      const inicio = new Date(atendimentoAtual.inicio).getTime()
      const agora = new Date().getTime()
      const decorrido = Math.floor((agora - inicio) / 1000) // em segundos
      setTempoDecorrido(decorrido)
    }, 1000)

    return () => clearInterval(interval)
  }, [atendimentoAtual])

  // Iniciar atendimento
  const iniciarAtendimento = useCallback(async (
    customerId: string, 
    analistaId: string, 
    descricao?: string
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/atendimentos/iniciar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, analistaId, descricao })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao iniciar atendimento")
      }

      setAtendimentoAtual(data.atendimento)
      setTempoDecorrido(0)

      console.log("✅ Atendimento iniciado:", data.atendimentoId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Pausar atendimento
  const pausarAtendimento = useCallback(async (atendimentoId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/atendimentos/pausar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ atendimentoId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao pausar atendimento")
      }

      if (atendimentoAtual) {
        setAtendimentoAtual({ ...atendimentoAtual, status: "pausado" })
      }

      console.log("⏸️ Atendimento pausado")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [atendimentoAtual])

  // Retomar atendimento
  const retomarAtendimento = useCallback(async (atendimentoId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/atendimentos/retomar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ atendimentoId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao retomar atendimento")
      }

      if (atendimentoAtual) {
        setAtendimentoAtual({ ...atendimentoAtual, status: "em_andamento" })
      }

      console.log("▶️ Atendimento retomado")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [atendimentoAtual])

  // Finalizar atendimento (cria cobrança automaticamente)
  const finalizarAtendimento = useCallback(async (
    atendimentoId: string, 
    diasParaVencimento: number = 7
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/atendimentos/finalizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ atendimentoId, diasParaVencimento })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao finalizar atendimento")
      }

      setAtendimentoAtual(null)
      setTempoDecorrido(0)

      console.log("✅ Atendimento finalizado e cobrança criada:", data.cobranca._id)
      
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Cancelar atendimento
  const cancelarAtendimento = useCallback(async (atendimentoId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/atendimentos/cancelar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ atendimentoId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao cancelar atendimento")
      }

      setAtendimentoAtual(null)
      setTempoDecorrido(0)

      console.log("❌ Atendimento cancelado")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Listar atendimentos
  const listarAtendimentos = useCallback(async (filtros?: { 
    analistaId?: string
    customerId?: string
    status?: string
  }) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filtros?.analistaId) params.append("analistaId", filtros.analistaId)
      if (filtros?.customerId) params.append("customerId", filtros.customerId)
      if (filtros?.status) params.append("status", filtros.status)

      const response = await fetch(`/api/atendimentos?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao listar atendimentos")
      }

      setAtendimentos(data.atendimentos || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Buscar atendimento em andamento
  const buscarAtendimentoEmAndamento = useCallback(async (analistaId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/atendimentos?analistaId=${analistaId}&status=em_andamento`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar atendimento")
      }

      if (data.atendimentos && data.atendimentos.length > 0) {
        setAtendimentoAtual(data.atendimentos[0])
      } else {
        setAtendimentoAtual(null)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    atendimentos,
    atendimentoAtual,
    tempoDecorrido,
    isLoading,
    error,
    iniciarAtendimento,
    pausarAtendimento,
    retomarAtendimento,
    finalizarAtendimento,
    cancelarAtendimento,
    listarAtendimentos,
    buscarAtendimentoEmAndamento
  }
}

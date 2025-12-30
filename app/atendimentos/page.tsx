"use client"

import { useEffect, useState } from "react"
import { CronometroAtendimento } from "@/components/cronometro-atendimento"
import { ListagemAtendimentos } from "@/components/listagem-atendimentos"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, List, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Cliente {
  _id: string
  name: string
  email: string
}

interface Analista {
  _id: string
  name: string
  email: string
  valorHora: number
  ativo: boolean
}

/**
 * Página principal do sistema de atendimento por tempo
 * 
 * Integra:
 * - Cronômetro de atendimento
 * - Histórico de atendimentos
 * - Criação automática de cobranças
 */
export default function AtendimentosPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [analistas, setAnalistas] = useState<Analista[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analistaLogadoId, setAnalistaLogadoId] = useState<string>("")

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Carregar clientes
      const resClientes = await fetch("/api/clientes")
      const dataClientes = await resClientes.json()

      if (!resClientes.ok) {
        throw new Error("Erro ao carregar clientes")
      }

      setClientes(dataClientes.clientes || dataClientes || [])

      // Carregar analistas (usuários)
      const resAnalistas = await fetch("/api/users")
      const dataAnalistas = await resAnalistas.json()

      if (!resAnalistas.ok) {
        throw new Error("Erro ao carregar analistas")
      }

      // Filtrar apenas analistas ativos
      const analistasAtivos = (dataAnalistas.users || dataAnalistas || [])
        .filter((u: Analista) => u.ativo)
      
      setAnalistas(analistasAtivos)

      // TODO: Buscar usuário logado do contexto/session
      // Por enquanto, pegar o primeiro analista
      if (analistasAtivos.length > 0) {
        setAnalistaLogadoId(analistasAtivos[0]._id)
      }

    } catch (err) {
      console.error("Erro ao carregar dados:", err)
      setError(err instanceof Error ? err.message : "Erro ao carregar dados")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-slate-600">Carregando...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Atendimento por Tempo</h1>
        <p className="text-slate-600">
          Controle o tempo de atendimento aos clientes. Ao finalizar, uma cobrança é criada automaticamente.
        </p>
      </div>

      {/* Abas */}
      <Tabs defaultValue="cronometro" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cronometro" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Cronômetro
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cronometro" className="mt-6">
          <CronometroAtendimento
            clientes={clientes}
            analistas={analistas}
            analistaLogadoId={analistaLogadoId}
          />
        </TabsContent>

        <TabsContent value="historico" className="mt-6">
          <ListagemAtendimentos analistaId={analistaLogadoId} />
        </TabsContent>
      </Tabs>

      {/* Informações importantes */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Como funciona?</AlertTitle>
        <AlertDescription className="space-y-2">
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Selecione o cliente e inicie o cronômetro</li>
            <li>O tempo será contado automaticamente</li>
            <li>Você pode pausar e retomar o atendimento</li>
            <li>Ao finalizar, o sistema:
              <ul className="list-disc list-inside ml-6 mt-1">
                <li>Calcula o tempo total e o valor</li>
                <li>Cria uma cobrança automaticamente</li>
                <li>Envia e-mail para o cliente</li>
                <li>Atualiza os relatórios e dashboard</li>
              </ul>
            </li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useAtendimentos } from "@/hooks/use-atendimentos"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { AlertCircle, Clock, Pause, Play, Square, CheckCircle, XCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

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
}

interface CronometroAtendimentoProps {
  clientes: Cliente[]
  analistas: Analista[]
  analistaLogadoId?: string // Se fornecido, pré-seleciona o analista
}

/**
 * Componente de cronômetro para controle de atendimentos
 * 
 * Funcionalidades:
 * - Iniciar novo atendimento
 * - Pausar/Retomar atendimento
 * - Finalizar atendimento (cria cobrança automaticamente)
 * - Cancelar atendimento
 * - Exibir tempo decorrido em tempo real
 */
export function CronometroAtendimento({ 
  clientes, 
  analistas,
  analistaLogadoId 
}: CronometroAtendimentoProps) {
  const {
    atendimentoAtual,
    tempoDecorrido,
    isLoading,
    error,
    iniciarAtendimento,
    pausarAtendimento,
    retomarAtendimento,
    finalizarAtendimento,
    cancelarAtendimento,
    buscarAtendimentoEmAndamento
  } = useAtendimentos()

  const { toast } = useToast()

  // Estado do formulário
  const [clienteSelecionado, setClienteSelecionado] = useState<string>("")
  const [analistaSelecionado, setAnalistaSelecionado] = useState<string>(analistaLogadoId || "")
  const [descricao, setDescricao] = useState<string>("")
  const [diasVencimento, setDiasVencimento] = useState<number>(7)

  // Buscar atendimento em andamento ao carregar
  useEffect(() => {
    if (analistaLogadoId) {
      buscarAtendimentoEmAndamento(analistaLogadoId)
    }
  }, [analistaLogadoId, buscarAtendimentoEmAndamento])

  // Formatar tempo (segundos -> HH:MM:SS)
  const formatarTempo = (segundos: number): string => {
    const horas = Math.floor(segundos / 3600)
    const minutos = Math.floor((segundos % 3600) / 60)
    const segs = segundos % 60
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`
  }

  // Calcular valor estimado
  const calcularValorEstimado = (): number => {
    if (!atendimentoAtual) return 0
    const minutos = tempoDecorrido / 60
    return (minutos * (atendimentoAtual.valorHora / 60))
  }

  // Handlers
  const handleIniciar = async () => {
    if (!clienteSelecionado || !analistaSelecionado) {
      toast({
        title: "Erro",
        description: "Selecione um cliente e um analista",
        variant: "destructive"
      })
      return
    }

    try {
      await iniciarAtendimento(clienteSelecionado, analistaSelecionado, descricao)
      
      toast({
        title: "✅ Atendimento iniciado!",
        description: "O cronômetro está rodando."
      })

      // Limpar formulário
      setDescricao("")
    } catch (err) {
      toast({
        title: "❌ Erro",
        description: error || "Não foi possível iniciar o atendimento",
        variant: "destructive"
      })
    }
  }

  const handlePausar = async () => {
    if (!atendimentoAtual) return

    try {
      await pausarAtendimento(atendimentoAtual._id)
      
      toast({
        title: "⏸️ Atendimento pausado",
        description: "O cronômetro foi pausado."
      })
    } catch (err) {
      toast({
        title: "❌ Erro",
        description: error || "Não foi possível pausar",
        variant: "destructive"
      })
    }
  }

  const handleRetomar = async () => {
    if (!atendimentoAtual) return

    try {
      await retomarAtendimento(atendimentoAtual._id)
      
      toast({
        title: "▶️ Atendimento retomado",
        description: "O cronômetro voltou a rodar."
      })
    } catch (err) {
      toast({
        title: "❌ Erro",
        description: error || "Não foi possível retomar",
        variant: "destructive"
      })
    }
  }

  const handleFinalizar = async () => {
    if (!atendimentoAtual) return

    if (!confirm("Deseja finalizar o atendimento? Uma cobrança será criada automaticamente.")) {
      return
    }

    try {
      const resultado = await finalizarAtendimento(atendimentoAtual._id, diasVencimento)
      
      toast({
        title: "✅ Atendimento finalizado!",
        description: `Cobrança de R$ ${resultado.cobranca.amount.toFixed(2)} criada com sucesso.`,
        duration: 5000
      })

      // Reset
      setClienteSelecionado("")
      setDescricao("")
    } catch (err) {
      toast({
        title: "❌ Erro",
        description: error || "Não foi possível finalizar",
        variant: "destructive"
      })
    }
  }

  const handleCancelar = async () => {
    if (!atendimentoAtual) return

    if (!confirm("Deseja realmente cancelar este atendimento?")) {
      return
    }

    try {
      await cancelarAtendimento(atendimentoAtual._id)
      
      toast({
        title: "❌ Atendimento cancelado",
        description: "O atendimento foi cancelado."
      })

      // Reset
      setClienteSelecionado("")
      setDescricao("")
    } catch (err) {
      toast({
        title: "❌ Erro",
        description: error || "Não foi possível cancelar",
        variant: "destructive"
      })
    }
  }

  const analistaSelecionadoObj = analistas.find(a => a._id === analistaSelecionado)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Cronômetro de Atendimento
          </CardTitle>
          <CardDescription>
            Controle o tempo de atendimento ao cliente. Ao finalizar, uma cobrança será criada automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Status do atendimento atual */}
          {atendimentoAtual ? (
            <div className="space-y-4">
              {/* Timer Display */}
              <div className="bg-slate-900 text-white p-8 rounded-lg text-center">
                <div className="text-6xl font-mono font-bold mb-2">
                  {formatarTempo(tempoDecorrido)}
                </div>
                <div className="text-sm text-slate-400">
                  {atendimentoAtual.status === "em_andamento" ? "⏱️ Em andamento" : "⏸️ Pausado"}
                </div>
              </div>

              {/* Informações do atendimento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <div className="text-sm text-slate-600">Cliente</div>
                  <div className="font-semibold">{atendimentoAtual.cliente?.name}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Analista</div>
                  <div className="font-semibold">{atendimentoAtual.analista?.name}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Valor/Hora</div>
                  <div className="font-semibold">R$ {atendimentoAtual.valorHora.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Valor Estimado</div>
                  <div className="font-semibold text-green-600">
                    R$ {calcularValorEstimado().toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Configuração de vencimento */}
              <div className="space-y-2">
                <Label htmlFor="diasVencimento">Dias para vencimento da cobrança</Label>
                <Input
                  id="diasVencimento"
                  type="number"
                  value={diasVencimento}
                  onChange={(e) => setDiasVencimento(parseInt(e.target.value))}
                  min={1}
                  max={90}
                  className="w-32"
                />
              </div>

              {/* Botões de controle */}
              <div className="flex gap-2 flex-wrap">
                {atendimentoAtual.status === "em_andamento" ? (
                  <Button 
                    onClick={handlePausar} 
                    variant="outline"
                    disabled={isLoading}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar
                  </Button>
                ) : (
                  <Button 
                    onClick={handleRetomar}
                    disabled={isLoading}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Retomar
                  </Button>
                )}

                <Button 
                  onClick={handleFinalizar}
                  variant="default"
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalizar e Gerar Cobrança
                </Button>

                <Button 
                  onClick={handleCancelar}
                  variant="destructive"
                  disabled={isLoading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            /* Formulário para iniciar novo atendimento */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente *</Label>
                <Select value={clienteSelecionado} onValueChange={setClienteSelecionado}>
                  <SelectTrigger id="cliente">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente._id} value={cliente._id}>
                        {cliente.name} ({cliente.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="analista">Analista *</Label>
                <Select 
                  value={analistaSelecionado} 
                  onValueChange={setAnalistaSelecionado}
                  disabled={!!analistaLogadoId}
                >
                  <SelectTrigger id="analista">
                    <SelectValue placeholder="Selecione um analista" />
                  </SelectTrigger>
                  <SelectContent>
                    {analistas.map((analista) => (
                      <SelectItem key={analista._id} value={analista._id}>
                        {analista.name} - R$ {analista.valorHora.toFixed(2)}/hora
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {analistaSelecionadoObj && (
                  <p className="text-sm text-slate-600">
                    Valor por hora: R$ {analistaSelecionadoObj.valorHora.toFixed(2)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição do atendimento (opcional)</Label>
                <Textarea
                  id="descricao"
                  placeholder="Ex: Suporte técnico - Problema no login"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleIniciar}
                disabled={isLoading || !clienteSelecionado || !analistaSelecionado}
                className="w-full"
                size="lg"
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar Atendimento
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

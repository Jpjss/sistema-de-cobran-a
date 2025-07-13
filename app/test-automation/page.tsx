"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, AlertCircle, Mail, Clock, Zap } from "lucide-react"

export default function TestAutomationPage() {
  const [email, setEmail] = useState("teste@email.com")
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState("")
  const [results, setResults] = useState<any[]>([])

  const runTest = async (action: string, testData?: any) => {
    setLoading(action)
    try {
      const response = await fetch("/api/test-automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, testData: { email, ...testData } })
      })
      
      const result = await response.json()
      setResults(prev => [{
        time: new Date().toLocaleTimeString(),
        action,
        ...result
      }, ...prev])
      
    } catch (error) {
      setResults(prev => [{
        time: new Date().toLocaleTimeString(),
        action,
        message: `Erro: ${error}`,
        error: true
      }, ...prev])
    } finally {
      setLoading("")
    }
  }

  const checkStatus = async () => {
    setLoading("status")
    try {
      const response = await fetch("/api/test-automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status" })
      })
      
      const result = await response.json()
      setStatus(result)
    } catch (error) {
      console.error("Erro ao verificar status:", error)
    } finally {
      setLoading("")
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🧪 Teste de Automação de E-mails</h1>
        <p className="text-muted-foreground">
          Teste todos os recursos do sistema automático de e-mails
        </p>
      </div>

      {/* Configuração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Configuração de Teste
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">E-mail para Teste</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu-email@example.com"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Use seu e-mail real para receber os testes
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={checkStatus} 
            disabled={loading === "status"}
            className="mb-4"
          >
            {loading === "status" ? "Verificando..." : "Verificar Status"}
          </Button>
          
          {status && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={status.scheduler.running ? "default" : "secondary"}>
                  Agendador: {status.scheduler.running ? "Ativo" : "Inativo"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {status.scheduler.message}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">
                  Fila: {status.queue.pending} pendentes
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {status.queue.message}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Testes */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Testes Básicos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Testes Rápidos
            </CardTitle>
            <CardDescription>
              Testes imediatos para verificar funcionamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => runTest("send-test-email")}
              disabled={loading === "send-test-email"}
              className="w-full"
            >
              {loading === "send-test-email" ? "Enviando..." : "📧 Enviar E-mail Teste"}
            </Button>

            <Button 
              onClick={() => runTest("force-check")}
              disabled={loading === "force-check"}
              variant="outline"
              className="w-full"
            >
              {loading === "force-check" ? "Verificando..." : "🔍 Forçar Verificação"}
            </Button>

            <Button 
              onClick={() => runTest("queue-status")}
              disabled={loading === "queue-status"}
              variant="secondary"
              className="w-full"
            >
              {loading === "queue-status" ? "Carregando..." : "📊 Status da Fila"}
            </Button>
          </CardContent>
        </Card>

        {/* Testes de Cenários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Testes de Cenários
            </CardTitle>
            <CardDescription>
              Simular situações reais do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => runTest("create-test-cobranca")}
              disabled={loading === "create-test-cobranca"}
              className="w-full"
            >
              {loading === "create-test-cobranca" ? "Criando..." : "📋 Criar Cobrança (Vence Amanhã)"}
            </Button>

            <Button 
              onClick={() => runTest("create-overdue-test")}
              disabled={loading === "create-overdue-test"}
              variant="destructive"
              className="w-full"
            >
              {loading === "create-overdue-test" ? "Criando..." : "⚠️ Criar Cobrança Atrasada"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Resultados */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Resultados dos Testes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="border rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={result.error ? "destructive" : "default"}>
                      {result.action}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {result.time}
                    </span>
                  </div>
                  
                  <p className="text-sm">{result.message}</p>
                  
                  {result.nextStep && (
                    <p className="text-sm text-blue-600">
                      <strong>Próximo passo:</strong> {result.nextStep}
                    </p>
                  )}
                  
                  {result.tip && (
                    <p className="text-sm text-amber-600">
                      <strong>Dica:</strong> {result.tip}
                    </p>
                  )}

                  {result.cobranca && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground">
                        Ver detalhes da cobrança
                      </summary>
                      <pre className="mt-2 bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.cobranca, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>📚 Como Testar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">🚀 Testes Imediatos:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <strong>E-mail Teste:</strong> Envia imediatamente</li>
                <li>• <strong>Forçar Verificação:</strong> Executa agendador agora</li>
                <li>• <strong>Status da Fila:</strong> Mostra e-mails pendentes</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">⏰ Testes com Tempo:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <strong>Cobrança Amanhã:</strong> Lembrete automático</li>
                <li>• <strong>Cobrança Atrasada:</strong> Alerta na próxima verificação</li>
                <li>• <strong>Webhook:</strong> E-mail ao criar cobrança</li>
              </ul>
            </div>
          </div>
          
          <Separator />
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Dicas de Teste:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use seu e-mail real para receber os testes</li>
              <li>• Verifique o console do servidor para logs detalhados</li>
              <li>• O agendador roda automaticamente a cada hora</li>
              <li>• E-mails podem demorar alguns segundos para serem enviados</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

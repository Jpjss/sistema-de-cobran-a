"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Mail, CheckCircle, XCircle, Send } from "lucide-react"

export function EmailSettings() {
  const [config, setConfig] = useState({
    smtpHost: "smtp.gmail.com",
    smtpPort: "587",
    smtpSecure: false,
    smtpUser: "",
    smtpPassword: "",
    fromEmail: "",
    fromName: "Sistema de Cobrança",
  })

  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [testEmail, setTestEmail] = useState("")
  const [isSendingTest, setIsSendingTest] = useState(false)

  const testConnection = async () => {
    setConnectionStatus("testing")

    try {
      // Simular teste de conexão (em produção, chamaria emailService.verifyConnection())
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simular sucesso na maioria dos casos
      if (config.smtpUser && config.smtpPassword) {
        setConnectionStatus("success")
      } else {
        setConnectionStatus("error")
      }
    } catch (error) {
      setConnectionStatus("error")
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail) return

    setIsSendingTest(true)

    try {
      // Simular envio de e-mail de teste
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Em produção, chamaria: await emailService.sendTestEmail(testEmail)
      alert(`E-mail de teste enviado para ${testEmail}!`)
    } catch (error) {
      alert("Erro ao enviar e-mail de teste")
    } finally {
      setIsSendingTest(false)
    }
  }

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case "testing":
        return <Badge variant="secondary">Testando...</Badge>
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Conectado
          </Badge>
        )
      case "error":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Erro
          </Badge>
        )
      default:
        return <Badge variant="outline">Não testado</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h2 className="text-2xl font-semibold">Configurações de E-mail</h2>
      </div>

      {/* Status da Conexão */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                <Mail className="h-5 w-5" />
                Status da Conexão SMTP
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Verifique se a configuração está funcionando
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={testConnection} disabled={connectionStatus === "testing"}>
              {connectionStatus === "testing" ? "Testando..." : "Testar Conexão"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configurações SMTP */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Configuração SMTP</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Configure seu provedor de e-mail para envio automático
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtpHost">Servidor SMTP</Label>
              <Input
                id="smtpHost"
                value={config.smtpHost}
                onChange={(e) => setConfig((prev) => ({ ...prev, smtpHost: e.target.value }))}
                placeholder="smtp.gmail.com"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPort">Porta</Label>
              <Input
                id="smtpPort"
                value={config.smtpPort}
                onChange={(e) => setConfig((prev) => ({ ...prev, smtpPort: e.target.value }))}
                placeholder="587"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="smtpSecure"
              checked={config.smtpSecure}
              onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, smtpSecure: checked }))}
            />
            <Label htmlFor="smtpSecure">Conexão segura (SSL/TLS)</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtpUser">Usuário SMTP</Label>
              <Input
                id="smtpUser"
                type="email"
                value={config.smtpUser}
                onChange={(e) => setConfig((prev) => ({ ...prev, smtpUser: e.target.value }))}
                placeholder="seu-email@dominio.com"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPassword">Senha SMTP</Label>
              <Input
                id="smtpPassword"
                type="password"
                value={config.smtpPassword}
                onChange={(e) => setConfig((prev) => ({ ...prev, smtpPassword: e.target.value }))}
                placeholder="sua-senha-do-email"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromEmail">E-mail do Remetente</Label>
              <Input
                id="fromEmail"
                type="email"
                value={config.fromEmail}
                onChange={(e) => setConfig((prev) => ({ ...prev, fromEmail: e.target.value }))}
                placeholder="noreply@seudominio.com"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromName">Nome do Remetente</Label>
              <Input
                id="fromName"
                value={config.fromName}
                onChange={(e) => setConfig((prev) => ({ ...prev, fromName: e.target.value }))}
                placeholder="Sistema de Cobrança"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teste de E-mail */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Teste de Envio</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Envie um e-mail de teste para verificar se tudo está funcionando
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Digite um e-mail para teste"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
            <Button onClick={sendTestEmail} disabled={!testEmail || isSendingTest}>
              <Send className="h-4 w-4 mr-2" />
              {isSendingTest ? "Enviando..." : "Enviar Teste"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Guia de Configuração */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Guia de Configuração</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Configurações comuns para provedores populares
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                <strong>Gmail:</strong> smtp.gmail.com, porta 587, use senha de app (não a senha normal)
              </AlertDescription>
            </Alert>

            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                <strong>Outlook/Hotmail:</strong> smtp-mail.outlook.com, porta 587
              </AlertDescription>
            </Alert>

            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                <strong>Yahoo:</strong> smtp.mail.yahoo.com, porta 587 ou 465
              </AlertDescription>
            </Alert>

            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                <strong>SendGrid:</strong> smtp.sendgrid.net, porta 587, usuário: "apikey"
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

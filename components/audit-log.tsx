"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, FileText, RefreshCw, Filter } from "lucide-react"
import { auditService, type AuditLog } from "@/lib/audit"

export function AuditLogComponent() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = () => {
    setLoading(true)
    const auditLogs = auditService.getLogs(100)
    setLogs(auditLogs)
    setLoading(false)
  }

  const handleSearch = () => {
    if (searchTerm.trim()) {
      const searchResults = auditService.searchLogs(searchTerm)
      setLogs(searchResults)
    } else {
      loadLogs()
    }
  }

  const getActionBadge = (action: string) => {
    const variants = {
      CREATE: "default",
      UPDATE: "secondary",
      DELETE: "destructive",
      LOGIN: "outline",
      LOGOUT: "outline",
    } as const

    return <Badge variant={variants[action as keyof typeof variants] || "outline"}>{action}</Badge>
  }

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case "BILLING":
        return "💰"
      case "CUSTOMER":
        return "👤"
      case "USER":
        return "👥"
      case "NOTIFICATION":
        return "🔔"
      default:
        return "📄"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Log de Auditoria
          </h2>
          <p className="text-muted-foreground">Histórico de ações realizadas no sistema</p>
        </div>
        <Button onClick={loadLogs} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por usuário, ação ou detalhes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Logs */}
      <div className="space-y-4">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{getResourceIcon(log.resource)}</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{log.userName}</span>
                      {getActionBadge(log.action)}
                      <span className="text-sm text-muted-foreground">{log.resource}</span>
                    </div>
                    <p className="text-sm">{log.details}</p>
                    <p className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {logs.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm ? "Nenhum log encontrado para a busca" : "Nenhum log de auditoria disponível"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

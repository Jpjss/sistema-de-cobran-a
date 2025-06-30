export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  resource: string
  resourceId?: string
  details: string
  timestamp: string
  ipAddress?: string
  userAgent?: string
}

// Simulação de banco de dados de auditoria
let auditLogs: AuditLog[] = [
  {
    id: "1",
    userId: "1",
    userName: "Admin Sistema",
    action: "CREATE",
    resource: "BILLING",
    resourceId: "1",
    details: "Criou cobrança para João Silva - R$ 2.500,00",
    timestamp: "2024-01-01T10:00:00Z",
  },
  {
    id: "2",
    userId: "2",
    userName: "João Financeiro",
    action: "UPDATE",
    resource: "BILLING",
    resourceId: "2",
    details: "Marcou cobrança como paga - Maria Santos",
    timestamp: "2024-01-01T11:30:00Z",
  },
  {
    id: "3",
    userId: "3",
    userName: "Maria Suporte",
    action: "CREATE",
    resource: "CUSTOMER",
    resourceId: "3",
    details: "Cadastrou novo cliente - Pedro Costa",
    timestamp: "2024-01-01T14:15:00Z",
  },
]

export const auditService = {
  log(entry: Omit<AuditLog, "id" | "timestamp">): void {
    const auditEntry: AuditLog = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    }

    auditLogs.unshift(auditEntry)

    // Manter apenas os últimos 1000 logs
    if (auditLogs.length > 1000) {
      auditLogs = auditLogs.slice(0, 1000)
    }
  },

  getLogs(limit = 50, offset = 0): AuditLog[] {
    return auditLogs.slice(offset, offset + limit)
  },

  getLogsByUser(userId: string, limit = 50): AuditLog[] {
    return auditLogs.filter((log) => log.userId === userId).slice(0, limit)
  },

  getLogsByResource(resource: string, resourceId?: string, limit = 50): AuditLog[] {
    return auditLogs
      .filter((log) => {
        if (resourceId) {
          return log.resource === resource && log.resourceId === resourceId
        }
        return log.resource === resource
      })
      .slice(0, limit)
  },

  searchLogs(query: string, limit = 50): AuditLog[] {
    const searchTerm = query.toLowerCase()
    return auditLogs
      .filter(
        (log) =>
          log.userName.toLowerCase().includes(searchTerm) ||
          log.action.toLowerCase().includes(searchTerm) ||
          log.resource.toLowerCase().includes(searchTerm) ||
          log.details.toLowerCase().includes(searchTerm),
      )
      .slice(0, limit)
  },
}

// Inicializador que roda na primeira requisição de API
import { emailScheduler } from "@/lib/email-scheduler"
import { emailQueue } from "@/lib/email-queue"

let initialized = false

export function ensureServicesRunning() {
  if (initialized) {
    return true
  }

  try {
    console.log("🚀 Garantindo que serviços estejam rodando...")
    
    // Verificar se agendador está rodando
    const schedulerRunning = (emailScheduler as any).isRunning
    if (!schedulerRunning) {
      console.log("📅 Iniciando agendador...")
      emailScheduler.start()
    }
    
    // Verificar se fila está rodando
    console.log("📬 Garantindo que fila esteja ativa...")
    emailQueue.start()
    
    initialized = true
    console.log("✅ Todos os serviços estão rodando!")
    
    return true
  } catch (error) {
    console.error("❌ Erro ao garantir serviços:", error)
    return false
  }
}

// Auto-execução quando módulo é carregado
if (typeof window === 'undefined') {
  setTimeout(() => {
    ensureServicesRunning()
  }, 1000)
}

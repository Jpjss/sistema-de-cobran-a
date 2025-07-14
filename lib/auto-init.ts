// Arquivo para inicializar serviços automáticos quando o servidor iniciar
import { emailScheduler } from "./email-scheduler"
import { emailQueue } from "./email-queue"
import { dailyReminderScheduler } from "./daily-reminder-scheduler"

let servicesInitialized = false

// Função para inicializar todos os serviços automáticos
export function initializeAutomatedServices() {
  if (servicesInitialized) {
    console.log("🔄 Serviços já foram inicializados, pulando...")
    return true
  }

  console.log("🚀 Inicializando serviços automáticos...")
  
  try {
    // Iniciar fila de e-mails
    emailQueue.start()
    console.log("✅ Fila de e-mails iniciada")
    
    // Iniciar agendador
    emailScheduler.start()
    console.log("✅ Agendador de e-mails iniciado")

    // Iniciar agendador de lembretes diários
    dailyReminderScheduler.start()
    console.log("✅ Agendador de lembretes diários iniciado")
    
    servicesInitialized = true
    console.log("🎉 Todos os serviços automáticos foram iniciados com sucesso!")
    
    return true
  } catch (error) {
    console.error("❌ Erro ao inicializar serviços automáticos:", error)
    return false
  }
}

// Função para parar todos os serviços
export function stopAutomatedServices() {
  console.log("⏹️ Parando serviços automáticos...")
  
  try {
    emailQueue.stop()
    emailScheduler.stop()
    dailyReminderScheduler.stop()
    
    servicesInitialized = false
    console.log("✅ Todos os serviços automáticos foram parados")
    return true
  } catch (error) {
    console.error("❌ Erro ao parar serviços automáticos:", error)
    return false
  }
}

// Função para verificar status
export function getServicesStatus() {
  return {
    initialized: servicesInitialized,
    timestamp: new Date().toISOString(),
    services: {
      emailQueue: emailQueue.getStatus(),
      dailyReminders: dailyReminderScheduler.getStatus()
    }
  }
}

// Inicializar automaticamente quando o módulo for carregado (apenas no servidor)
if (typeof window === 'undefined') {
  console.log("🔧 Módulo auto-init carregado no servidor")
  
  // Delay para garantir que tudo esteja carregado
  setTimeout(() => {
    console.log("⏰ Iniciando auto-inicialização após delay...")
    initializeAutomatedServices()
  }, 3000) // 3 segundos após inicialização
}

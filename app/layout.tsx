import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/hooks/use-auth"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FynApp",
  description: "FynApp - Sistema completo de gerenciamento de cobranças e clientes",
  generator: "v0.dev",
}

// Inicializar serviços automáticos no servidor
if (typeof window === 'undefined') {
  // Importar dinâmico para evitar problemas
  setTimeout(async () => {
    try {
      console.log("🔧 Layout: Iniciando serviços automáticos...")
      const autoInit = await import('@/lib/auto-init')
      await autoInit.initializeAutomatedServices()
      console.log("✅ Layout: Serviços iniciados com sucesso!")
    } catch (error) {
      console.error("❌ Layout: Erro ao iniciar serviços:", error)
    }
  }, 2000) // 2 segundos de delay
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/placeholder-logo.png" />
        <link rel="shortcut icon" href="/placeholder-logo.png" />
        <link rel="apple-touch-icon" href="/placeholder-logo.png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange={false}>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}


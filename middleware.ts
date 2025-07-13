import { NextRequest, NextResponse } from "next/server"

// Esta função roda antes de cada requisição de API
export function middleware(request: NextRequest) {
  // Só executar no servidor
  if (typeof window === 'undefined') {
    // Garantir que os serviços estejam rodando em toda requisição
    import('@/lib/ensure-services').then(module => {
      module.ensureServicesRunning()
    }).catch(error => {
      console.error("❌ Erro no middleware ensure-services:", error)
    })
  }

  return NextResponse.next()
}

// Configurar para rodar em todas as rotas de API
export const config = {
  matcher: '/api/:path*',
}

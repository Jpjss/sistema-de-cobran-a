import { NextRequest, NextResponse } from "next/server"

// Middleware simples que não causa conflitos com Edge Runtime
export function middleware(request: NextRequest) {
  // Simplesmente continuar sem executar nenhuma lógica complexa
  return NextResponse.next()
}

// Configurar para não interferir em rotas importantes
export const config = {
  matcher: [
    /*
     * Não aplicar middleware em:
     * - api routes (para evitar conflitos)
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagem)
     * - favicon.ico (ícone)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

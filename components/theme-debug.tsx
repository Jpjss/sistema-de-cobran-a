"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function ThemeDebug() {
  const { theme, setTheme, resolvedTheme, themes } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div>Carregando debug do tema...</div>
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Debug do Tema</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <strong>Tema atual:</strong> {theme}
        </div>
        <div>
          <strong>Tema resolvido:</strong> {resolvedTheme}
        </div>
        <div>
          <strong>Temas disponíveis:</strong> {themes.join(", ")}
        </div>
        <div>
          <strong>Mounted:</strong> {mounted ? "Sim" : "Não"}
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setTheme("light")} variant="outline" size="sm">
            Forçar Claro
          </Button>
          <Button onClick={() => setTheme("dark")} variant="outline" size="sm">
            Forçar Escuro
          </Button>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="text-sm">
            <div>Classe HTML: {document.documentElement.className}</div>
            <div>Data-theme: {document.documentElement.getAttribute("data-theme")}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

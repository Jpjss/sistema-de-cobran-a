"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTheme } from "next-themes"
import { Moon, Sun, Palette } from "lucide-react"
import { useEffect, useState } from "react"

export function ThemeSettings() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Palette className="h-6 w-6" />
          <h2 className="text-2xl font-semibold">Configurações de Tema</h2>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const themeOptions = [
    {
      value: "light",
      label: "Tema Claro",
      description: "Interface clara e limpa, ideal para ambientes bem iluminados",
      icon: Sun,
    },
    {
      value: "dark",
      label: "Tema Escuro",
      description: "Interface escura para reduzir cansaço visual e economizar bateria",
      icon: Moon,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Palette className="h-6 w-6" />
        <h2 className="text-2xl font-semibold">Configurações de Tema</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
          <CardDescription>Escolha entre o tema claro ou escuro para personalizar sua experiência</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={theme} onValueChange={setTheme} className="space-y-4">
            {themeOptions.map((option) => {
              const IconComponent = option.icon
              return (
                <div key={option.value} className="flex items-center space-x-3">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label
                    htmlFor={option.value}
                    className="flex items-center gap-3 cursor-pointer flex-1 p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <IconComponent className="h-6 w-6" />
                    <div>
                      <div className="font-medium text-base">{option.label}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{option.description}</div>
                    </div>
                  </Label>
                </div>
              )
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Preview do Tema */}
      <Card>
        <CardHeader>
          <CardTitle>Pré-visualização</CardTitle>
          <CardDescription>Veja como o tema selecionado aparece nos componentes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Card de exemplo */}
          <div className="p-4 border rounded-lg bg-card">
            <h3 className="font-semibold mb-2">Card de Exemplo</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Este é um exemplo de como os cards aparecem com o tema atual.
            </p>
            <div className="flex gap-2">
              <Button size="sm">Botão Primário</Button>
              <Button size="sm" variant="outline">
                Botão Secundário
              </Button>
            </div>
          </div>

          {/* Métricas de exemplo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="text-2xl font-bold">R$ 12.500</div>
              <div className="text-xs text-muted-foreground">Receita Total</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-2xl font-bold">24</div>
              <div className="text-xs text-muted-foreground">Cobranças Ativas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dicas de Uso */}
      <Card>
        <CardHeader>
          <CardTitle>Dicas de Uso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <Sun className="h-5 w-5 mt-0.5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <div className="font-medium text-yellow-800 dark:text-yellow-200">Tema Claro</div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                Perfeito para trabalhar durante o dia e em ambientes bem iluminados. Oferece melhor legibilidade em
                telas com muito brilho.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Moon className="h-5 w-5 mt-0.5 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="font-medium text-blue-800 dark:text-blue-200">Tema Escuro</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                Ideal para trabalhar à noite ou em ambientes com pouca luz. Reduz o cansaço visual e pode economizar
                bateria em dispositivos com tela OLED.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões de Ação Rápida */}
      <Card>
        <CardHeader>
          <CardTitle>Ação Rápida</CardTitle>
          <CardDescription>Alterne rapidamente entre os temas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              onClick={() => setTheme("light")}
              variant={theme === "light" ? "default" : "outline"}
              className="flex-1"
            >
              <Sun className="h-4 w-4 mr-2" />
              Ativar Tema Claro
            </Button>
            <Button
              onClick={() => setTheme("dark")}
              variant={theme === "dark" ? "default" : "outline"}
              className="flex-1"
            >
              <Moon className="h-4 w-4 mr-2" />
              Ativar Tema Escuro
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

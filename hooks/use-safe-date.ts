import { useState, useEffect } from 'react'

export function useIsClient() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}

export function useSafeDate(dateString?: string) {
  const isClient = useIsClient()
  const [formattedDate, setFormattedDate] = useState<string>('')

  useEffect(() => {
    if (isClient && dateString) {
      try {
        const date = new Date(dateString)
        setFormattedDate(date.toLocaleDateString('pt-BR'))
      } catch (error) {
        setFormattedDate('Data inválida')
      }
    }
  }, [isClient, dateString])

  if (!isClient) {
    return 'Carregando...'
  }

  return formattedDate || 'Data não disponível'
}

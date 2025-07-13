/**
 * Funções utilitárias para manipulação de datas no fuso horário de Brasília
 */

// Constantes
const BRASILIA_OFFSET = -3 * 60 // UTC-3 em minutos

/**
 * Converte uma data para o fuso horário de Brasília
 */
export function toBrasiliaTime(date: Date | string): Date {
  if (typeof date === 'string' && !date.includes('T')) {
    return new Date(`${date}T00:00:00-03:00`)
  }
  const d = new Date(date)
  // Se a data já inclui informação de timezone (T), apenas converte para Brasília
  if (date.toString().includes('T')) {
    d.setHours(d.getHours() - 3)
    return d
  }
  // Para outras datas, ajusta o offset
  const userOffset = d.getTimezoneOffset()
  const offsetDiff = BRASILIA_OFFSET - userOffset
  d.setMinutes(d.getMinutes() + offsetDiff)
  return d
}

/**
 * Formata uma data e hora no fuso horário de Brasília
 */
export function formatDateTime(date: Date | string): string {
  return toBrasiliaTime(date).toISOString()
}

/**
 * Formata apenas a data no fuso horário de Brasília
 */
export function formatDate(date: Date | string): string {
  // Para datas sem hora (como em inputs type="date"), retorna a data como está
  if (typeof date === 'string' && !date.includes('T')) {
    return date
  }
  return toBrasiliaTime(date).toISOString().split('T')[0]
}

/**
 * Retorna a data e hora atual no fuso horário de Brasília
 */
export function getCurrentBrasiliaDateTime(): Date {
  return toBrasiliaTime(new Date())
}

/**
 * Formata uma data para exibição no formato brasileiro
 */
export function formatDateBR(date: Date | string): string {
  // Se a data não tem hora (formato YYYY-MM-DD), cria uma data às 12:00 para evitar problemas de timezone
  if (typeof date === 'string' && !date.includes('T')) {
    const [year, month, day] = date.split('-').map(Number)
    return new Date(year, month - 1, day).toLocaleDateString('pt-BR')
  }
  return new Date(date).toLocaleDateString('pt-BR')
}

/**
 * Formata uma data e hora para exibição no formato brasileiro
 */
export function formatDateTimeBR(date: Date | string): string {
  return toBrasiliaTime(date).toLocaleString('pt-BR')
}

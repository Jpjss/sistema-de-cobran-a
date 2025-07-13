/**
 * Funções utilitárias para manipulação de datas no fuso horário de Brasília
 */

// Constantes
const BRASILIA_OFFSET = -3 * 60 // UTC-3 em minutos

/**
 * Converte uma data para o fuso horário de Brasília
 */
export function toBrasiliaTime(date: Date | string): Date {
  const d = new Date(date)
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
  return formatDateTime(date).split('T')[0]
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
  return toBrasiliaTime(date).toLocaleDateString('pt-BR')
}

/**
 * Formata uma data e hora para exibição no formato brasileiro
 */
export function formatDateTimeBR(date: Date | string): string {
  return toBrasiliaTime(date).toLocaleString('pt-BR')
}

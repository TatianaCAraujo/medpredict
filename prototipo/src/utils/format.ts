import type { AppointmentStatus, RiskLevel, WaitlistStatus } from '../types'

export const formatDate = (date: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))
export const formatDateTime = (date: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
export const formatProbability = (value: number) => `${Math.round(value * 100)}%`

export const statusLabels: Record<AppointmentStatus, string> = {
  AWAITING: 'Aguardando confirmação', CONFIRMED: 'Confirmada', CANCELLED: 'Cancelada', RESCHEDULE_REQUESTED: 'Reagendamento solicitado', COMPLETED: 'Realizada',
}
export const riskLabels: Record<RiskLevel, string> = { HIGH: 'Alta', MEDIUM: 'Intermediária', LOW: 'Baixa' }
export const waitlistLabels: Record<WaitlistStatus, string> = { AGUARDANDO: 'Aguardando', OFERTA_ENVIADA: 'Oferta enviada', ACEITA: 'Aceita', RECUSADA: 'Recusada', EXPIRADA: 'Expirada', AGENDADA: 'Agendada' }

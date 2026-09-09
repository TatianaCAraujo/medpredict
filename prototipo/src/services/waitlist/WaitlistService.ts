import type { AppState, Appointment, Recovery, VacancyOffer, WaitlistEntry } from '../../types'

const periodFor = (time: string) => Number(time.slice(0, 2)) < 12 ? 'morning' : 'afternoon'

export class WaitlistService {
  static findNextEligible(state: AppState, appointment: Appointment, excludedIds: string[] = []): WaitlistEntry | undefined {
    const period = periodFor(appointment.time)
    return state.waitlist
      .filter(entry => !excludedIds.includes(entry.id))
      .filter(entry => ['AGUARDANDO', 'RECUSADA', 'EXPIRADA'].includes(entry.status))
      .filter(entry => entry.specialty === appointment.specialty && entry.unit === appointment.unit)
      .filter(entry => entry.availablePeriods.includes(period))
      .sort((a, b) => a.queuePriority - b.queuePriority || a.enteredAt.localeCompare(b.enteredAt))[0]
  }

  static createOffer(entry: WaitlistEntry): VacancyOffer {
    return { id: crypto.randomUUID(), waitlistEntryId: entry.id, patientId: entry.patientId, channel: entry.preferredContact, status: 'PENDING', createdAt: new Date().toISOString() }
  }
}

export function advanceRecovery(input: AppState, recoveryId: string): AppState {
  const state = structuredClone(input)
  const recovery = state.recoveries.find(item => item.id === recoveryId)
  if (!recovery || recovery.status === 'RECOVERED' || recovery.offers.some(offer => offer.status === 'PENDING')) return state
  const appointment = state.appointments.find(item => item.id === recovery.appointmentId)
  if (!appointment) return state
  const next = WaitlistService.findNextEligible(state, appointment, recovery.offers.map(offer => offer.waitlistEntryId))
  if (!next) {
    recovery.status = 'NO_ELIGIBLE'
    return state
  }
  const offer = WaitlistService.createOffer(next)
  recovery.status = 'OFFERING'
  recovery.offers.push(offer)
  next.status = 'OFERTA_ENVIADA'
  const patient = state.patients.find(item => item.id === next.patientId)
  const message = `Olá, ${patient?.name.split(' ')[0]}. Surgiu uma vaga antecipada para ${appointment.specialty} na ${appointment.unit} em ${appointment.date} às ${appointment.time}. Deseja antecipar sua consulta?`
  state.communications.unshift({ id: crypto.randomUUID(), patientId: next.patientId, appointmentId: appointment.id, channel: next.preferredContact, eventType: 'Oferta de vaga', origin: 'Sistema', responsible: 'MedPredict demonstrativo', message, status: 'Aguardando resposta (simulação)', createdAt: new Date().toISOString(), note: `Elegível por ${appointment.specialty}, ${appointment.unit}, período ${periodFor(appointment.time) === 'morning' ? 'da manhã' : 'da tarde'} e posição ${next.queuePriority} da fila.` })
  state.notifications.unshift({ id: crypto.randomUUID(), patientId: next.patientId, title: 'Vaga antecipada disponível', message, createdAt: new Date().toISOString(), read: false, channel: next.preferredContact, status: 'Aguardando resposta (simulação)', recipient: patient?.name })
  return state
}

export function createRecovery(appointment: Appointment): Recovery {
  return { id: crypto.randomUUID(), appointmentId: appointment.id, originalPatientId: appointment.patientId, status: 'OPEN', releasedAt: new Date().toISOString(), offers: [] }
}

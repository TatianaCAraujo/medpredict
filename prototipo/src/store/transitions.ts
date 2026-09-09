import { createInitialState } from '../data/mockData'
import { advanceRecovery, createRecovery } from '../services/waitlist/WaitlistService'
import type { AppState, AppointmentStatus, CommunicationEvent, ContactChannel, ContactPreferences } from '../types'

const now = () => new Date().toISOString()
const note = (state: AppState, patientId: string, title: string, message: string) => state.notifications.unshift({ id: crypto.randomUUID(), patientId, title, message, createdAt: now(), read: false, channel: 'Aplicativo MedPredict', status: 'Exibida', recipient: state.patients.find(item => item.id === patientId)?.name })
const event = (state: AppState, data: Omit<CommunicationEvent, 'id' | 'createdAt'>) => state.communications.unshift({ id: crypto.randomUUID(), createdAt: now(), ...data })

export function confirmAppointment(input: AppState, appointmentId: string): AppState {
  const state = structuredClone(input)
  const appointment = state.appointments.find(item => item.id === appointmentId)
  if (!appointment || appointment.status !== 'AWAITING') return state
  appointment.status = 'CONFIRMED'
  appointment.confirmedAt = now()
  appointment.confirmationSource = 'Aplicativo MedPredict'
  event(state, { patientId: appointment.patientId, appointmentId, channel: 'Aplicativo MedPredict', eventType: 'Confirmação de consulta', origin: 'Paciente', responsible: 'Paciente', message: 'Presença confirmada pelo paciente.', status: 'Confirmada' })
  note(state, appointment.patientId, 'Consulta confirmada', `Sua consulta de ${appointment.specialty} foi confirmada.`)
  return state
}

export function cancelAppointment(input: AppState, appointmentId: string, reason: string): AppState {
  const state = structuredClone(input)
  const appointment = state.appointments.find(item => item.id === appointmentId)
  if (!appointment || ['CANCELLED', 'COMPLETED'].includes(appointment.status)) return state
  appointment.status = 'CANCELLED'
  appointment.cancelledAt = now()
  appointment.cancellationReason = reason
  state.rescheduleRequests
    .filter(request => request.appointmentId === appointmentId && request.status === 'PENDING')
    .forEach(request => { request.status = 'CANCELLED' })
  appointment.cancellationProtocol = `MP-${new Date().getFullYear()}-${appointment.id.toUpperCase()}`
  const existingRecovery = state.recoveries.find(item => item.appointmentId === appointmentId)
  const recovery = existingRecovery || createRecovery(appointment)
  if (!existingRecovery) state.recoveries.unshift(recovery)
  event(state, { patientId: appointment.patientId, appointmentId, channel: 'Aplicativo MedPredict', eventType: 'Cancelamento de consulta', origin: 'Paciente', responsible: 'Paciente', message: `Consulta cancelada. Motivo: ${reason}.`, status: 'Cancelada', note: reason })
  note(state, appointment.patientId, 'Consulta cancelada', 'O horário foi liberado e poderá ser oferecido a outra pessoa.')
  return advanceRecovery(state, recovery.id)
}

export function requestReschedule(input: AppState, appointmentId: string, date: string, time: string): AppState {
  const state = structuredClone(input)
  const appointment = state.appointments.find(item => item.id === appointmentId)
  const hasPendingRequest = state.rescheduleRequests.some(request => request.appointmentId === appointmentId && request.status === 'PENDING')
  if (!appointment || !['AWAITING', 'CONFIRMED'].includes(appointment.status) || hasPendingRequest) return state
  const previous = `${appointment.date} às ${appointment.time}`
  appointment.date = date
  appointment.time = time
  appointment.status = 'AWAITING'
  delete appointment.confirmedAt
  delete appointment.confirmationSource
  state.rescheduleRequests.unshift({ id: crypto.randomUUID(), appointmentId, patientId: appointment.patientId, requestedDate: date, requestedTime: time, status: 'APPROVED', createdAt: now() })
  event(state, { patientId: appointment.patientId, appointmentId, channel: 'Aplicativo MedPredict', eventType: 'Reagendamento de consulta', origin: 'Paciente', responsible: 'Paciente', message: `Consulta reagendada de ${previous} para ${date} às ${time}.`, status: 'Reagendada' })
  note(state, appointment.patientId, 'Consulta reagendada', `Novo horário: ${date} às ${time}. Confirme sua presença.`)
  return state
}

export function approveReschedule(input: AppState, requestId: string): AppState {
  const state = structuredClone(input)
  const request = state.rescheduleRequests.find(item => item.id === requestId)
  if (!request || request.status !== 'PENDING') return state
  const appointment = state.appointments.find(item => item.id === request.appointmentId)
  if (!appointment || appointment.status !== 'RESCHEDULE_REQUESTED') return state
  request.status = 'APPROVED'
  appointment.date = request.requestedDate
  appointment.time = request.requestedTime
  appointment.status = 'AWAITING'
  delete appointment.confirmedAt
  delete appointment.confirmationSource
  note(state, request.patientId, 'Reagendamento aprovado', `Novo horário: ${request.requestedDate} às ${request.requestedTime}. Confirme sua presença.`)
  return state
}

function finishOffer(input: AppState, recoveryId: string, result: 'ACCEPTED' | 'DECLINED' | 'EXPIRED'): AppState {
  const state = structuredClone(input)
  const recovery = state.recoveries.find(item => item.id === recoveryId)
  const offer = recovery ? [...recovery.offers].reverse().find(item => item.status === 'PENDING') : undefined
  const appointment = recovery ? state.appointments.find(item => item.id === recovery.appointmentId) : undefined
  if (!recovery || recovery.status !== 'OFFERING' || !offer || !appointment || appointment.status !== 'CANCELLED') return state
  offer.status = result
  const entry = state.waitlist.find(item => item.id === offer.waitlistEntryId)
  if (entry) entry.status = result === 'ACCEPTED' ? 'AGENDADA' : result === 'DECLINED' ? 'RECUSADA' : 'EXPIRADA'
  const communication = state.communications.find(item => item.appointmentId === appointment.id && item.patientId === offer.patientId && item.eventType === 'Oferta de vaga' && item.status.startsWith('Aguardando'))
  if (communication) communication.status = `${result === 'ACCEPTED' ? 'Aceita' : result === 'DECLINED' ? 'Recusada' : 'Expirada'} (simulação)`
  event(state, { patientId: offer.patientId, appointmentId: appointment.id, channel: offer.channel, eventType: result === 'ACCEPTED' ? 'Aceite de oferta' : result === 'DECLINED' ? 'Recusa de oferta' : 'Expiração de oferta', origin: 'Paciente', responsible: 'Paciente', message: result === 'ACCEPTED' ? 'Oferta de vaga aceita.' : result === 'DECLINED' ? 'Oferta de vaga recusada.' : 'Oferta de vaga expirada.', status: result === 'ACCEPTED' ? 'Aceita' : result === 'DECLINED' ? 'Recusada' : 'Expirada' })
  if (result === 'ACCEPTED') {
    recovery.status = 'RECOVERED'
    recovery.recoveredAt = now()
    appointment.originalPatientId = recovery.originalPatientId
    appointment.patientId = offer.patientId
    appointment.status = 'CONFIRMED'
    appointment.recovered = true
    appointment.confirmedAt = now()
    appointment.confirmationSource = 'oferta simulada da fila'
    delete appointment.cancelledAt
    delete appointment.cancellationReason
    note(state, offer.patientId, 'Vaga confirmada', 'Você aceitou a vaga antecipada. A agenda demonstrativa foi atualizada.')
    return state
  }
  note(state, offer.patientId, result === 'DECLINED' ? 'Oferta recusada' : 'Oferta expirada', 'Sua posição geral na fila demonstrativa foi preservada.')
  return advanceRecovery(state, recoveryId)
}

export const acceptOffer = (state: AppState, recoveryId: string) => finishOffer(state, recoveryId, 'ACCEPTED')
export const declineOffer = (state: AppState, recoveryId: string) => finishOffer(state, recoveryId, 'DECLINED')
export const expireOffer = (state: AppState, recoveryId: string) => finishOffer(state, recoveryId, 'EXPIRED')

export function updatePreferences(input: AppState, patientId: string, preferences: ContactPreferences): AppState {
  const state = structuredClone(input)
  const patient = state.patients.find(item => item.id === patientId)
  if (patient) patient.preferences = preferences
  note(state, patientId, 'Preferências atualizadas', 'Suas preferências demonstrativas de contato foram salvas localmente.')
  return state
}

export function registerCommunication(input: AppState, patientId: string, channel: ContactChannel, appointmentId?: string, details: Partial<Pick<CommunicationEvent, 'contactedPerson' | 'relationship' | 'note' | 'messageLeft' | 'messageRecipient' | 'status'>> = {}): AppState {
  const state = structuredClone(input)
  const patient = state.patients.find(item => item.id === patientId)
  event(state, { patientId, appointmentId, channel, eventType: 'Contato de confirmação', origin: 'ADM', responsible: 'Equipe da unidade', message: `${channel} simulado registrado pela unidade.`, status: details.status || 'Aguardando resposta (simulação)', ...(channel === 'Ligação' ? { contactedPerson: details.contactedPerson || patient?.name, relationship: details.relationship || 'Paciente' } : {}), ...details })
  note(state, patientId, 'Contato da unidade', `A unidade registrou um contato por ${channel} (simulação).`)
  return state
}

export function updateAppointmentStatus(input: AppState, appointmentId: string, status: AppointmentStatus): AppState {
  const state = structuredClone(input)
  const appointment = state.appointments.find(item => item.id === appointmentId)
  if (appointment) appointment.status = status
  return state
}

export function createSchedulingRequest(input: AppState, patientId: string, specialty: string, unit: string, date: string, time: string): AppState {
  const state = structuredClone(input)
  if (!patientId || !specialty || !unit || !date || !time) return state
  const appointmentId = crypto.randomUUID()
  state.appointments.push({ id: appointmentId, patientId, specialty, unit, address: 'Endereço demonstrativo da unidade', date, time, status: 'AWAITING', riskProbability: .52, riskLevel: 'MEDIUM', waitingDays: 10, smsReceived: false })
  event(state, { patientId, appointmentId, channel: 'Aplicativo MedPredict', eventType: 'Agendamento de consulta', origin: 'Paciente', responsible: 'Paciente', message: `Consulta de ${specialty} agendada para ${date} às ${time}, em ${unit}.`, status: 'Agendada' })
  note(state, patientId, 'Consulta agendada', 'Novo agendamento demonstrativo criado. Confirme sua presença quando puder.')
  return state
}

export const resetDemo = () => createInitialState()

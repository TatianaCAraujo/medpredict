export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW'
export type AppointmentStatus = 'AWAITING' | 'CONFIRMED' | 'CANCELLED' | 'RESCHEDULE_REQUESTED' | 'COMPLETED'
export type ContactChannel = 'WhatsApp' | 'E-mail' | 'Ligação' | 'Push'
export type WaitlistStatus = 'AGUARDANDO' | 'OFERTA_ENVIADA' | 'ACEITA' | 'RECUSADA' | 'EXPIRADA' | 'AGENDADA'

export interface ContactPreferences {
  channels: ContactChannel[]
  phone: string
  email: string
}

export interface Patient {
  id: string
  name: string
  age: number
  neighbourhood: string
  gender: string
  comorbidities: string[]
  preferences: ContactPreferences
}

export interface Appointment {
  id: string
  patientId: string
  specialty: string
  unit: string
  address: string
  date: string
  time: string
  status: AppointmentStatus
  riskProbability: number
  riskLevel: RiskLevel
  waitingDays: number
  smsReceived: boolean
  confirmedAt?: string
  confirmationSource?: string
  cancellationReason?: string
  cancelledAt?: string
  recovered?: boolean
  originalPatientId?: string
  cancellationProtocol?: string
}

export interface WaitlistEntry {
  id: string
  patientId: string
  specialty: string
  unit: string
  availablePeriods: ('morning' | 'afternoon')[]
  queuePriority: number
  enteredAt: string
  preferredContact: ContactChannel
  status: WaitlistStatus
}

export interface CommunicationEvent {
  id: string
  patientId: string
  appointmentId?: string
  channel: ContactChannel | 'Aplicativo MedPredict' | 'Sistema'
  message: string
  status: string
  createdAt: string
  eventType: string
  origin: 'Paciente' | 'ADM' | 'Sistema'
  responsible?: string
  contactedPerson?: string
  relationship?: 'Paciente' | 'Familiar' | 'Responsável' | 'Terceiro' | 'Não atendeu'
  note?: string
  messageLeft?: boolean
  messageRecipient?: string
}

export interface Notification {
  id: string
  patientId: string
  title: string
  message: string
  createdAt: string
  read: boolean
  channel?: ContactChannel | 'Aplicativo MedPredict' | 'Sistema'
  status?: string
  recipient?: string
  contactedPerson?: string
  note?: string
}

export interface VacancyOffer {
  id: string
  waitlistEntryId: string
  patientId: string
  channel: ContactChannel
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'
  createdAt: string
}

export interface Recovery {
  id: string
  appointmentId: string
  originalPatientId: string
  status: 'OPEN' | 'OFFERING' | 'RECOVERED' | 'NO_ELIGIBLE'
  releasedAt: string
  offers: VacancyOffer[]
  recoveredAt?: string
}

export interface RescheduleRequest {
  id: string
  appointmentId: string
  patientId: string
  requestedDate: string
  requestedTime: string
  status: 'PENDING' | 'APPROVED' | 'CANCELLED'
  createdAt: string
}

export interface AppState {
  patients: Patient[]
  appointments: Appointment[]
  waitlist: WaitlistEntry[]
  communications: CommunicationEvent[]
  notifications: Notification[]
  recoveries: Recovery[]
  rescheduleRequests: RescheduleRequest[]
  demoPatientId: string
}

import type { CommunicationEvent, ContactChannel } from '../../types'

export interface CommunicationService {
  send(patientId: string, channel: ContactChannel, message: string, appointmentId?: string): CommunicationEvent
}

export class MockCommunicationService implements CommunicationService {
  send(patientId: string, channel: ContactChannel, message: string, appointmentId?: string): CommunicationEvent {
    return { id: crypto.randomUUID(), patientId, appointmentId, channel, eventType: 'Comunicação demonstrativa', origin: 'Sistema', message, status: 'Simulado - aguardando resposta', createdAt: new Date().toISOString() }
  }
}

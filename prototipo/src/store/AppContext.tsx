import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createInitialState } from '../data/mockData'
import type { AppState, AppointmentStatus, CommunicationEvent, ContactChannel, ContactPreferences } from '../types'
import * as transitions from './transitions'

const STORAGE_KEY = 'medpredict-mvp-state-v2'
const STATE_ENDPOINT = '/api/demo-state'
type Updater = (state: AppState) => AppState
interface StateEnvelope { revision: number; state: AppState | null }

interface Actions {
  selectPatient(id: string): void
  confirmAppointment(id: string): void
  cancelAppointment(id: string, reason: string): void
  requestReschedule(id: string, date: string, time: string): void
  approveReschedule(id: string): void
  acceptOffer(id: string): void
  declineOffer(id: string): void
  expireOffer(id: string): void
  updatePreferences(patientId: string, preferences: ContactPreferences): void
  registerCommunication(patientId: string, channel: ContactChannel, appointmentId?: string, details?: Partial<Pick<CommunicationEvent, 'contactedPerson' | 'relationship' | 'note' | 'messageLeft' | 'messageRecipient' | 'status'>>): void
  updateAppointmentStatus(id: string, status: AppointmentStatus): void
  createSchedulingRequest(patientId: string, specialty: string, unit: string, date: string, time: string): void
  resetDemo(): void
}

const AppContext = createContext<{ state: AppState; actions: Actions } | null>(null)

const load = (): AppState => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '') as AppState } catch { return createInitialState() }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load)
  const stateRef = useRef(state)
  const channelRef = useRef<BroadcastChannel | null>(null)
  const revisionRef = useRef(-1)
  const syncQueueRef = useRef(Promise.resolve())

  useEffect(() => {
    const channel = 'BroadcastChannel' in window ? new BroadcastChannel(STORAGE_KEY) : null
    channelRef.current = channel
    const receive = (next: AppState) => { stateRef.current = next; setState(next) }
    if (channel) channel.onmessage = event => receive(event.data as AppState)
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return
      try { receive(JSON.parse(event.newValue) as AppState) } catch { /* Ignora estado local inválido. */ }
    }
    window.addEventListener('storage', onStorage)
    const pull = async () => {
      try {
        const response = await fetch(STATE_ENDPOINT, { cache: 'no-store' })
        if (!response.ok) return
        let envelope = await response.json() as StateEnvelope
        if (!envelope.state) {
          const initialize = await fetch(STATE_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ baseRevision: envelope.revision, state: stateRef.current }) })
          if (!initialize.ok) return
          envelope = await initialize.json() as StateEnvelope
        }
        if (!envelope.state) return
        if (envelope.revision > revisionRef.current) {
          revisionRef.current = envelope.revision
          localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope.state))
          receive(envelope.state)
        }
      } catch { /* O fallback local mantém o preview estático utilizável. */ }
    }
    void pull()
    const poll = window.setInterval(pull, 750)
    return () => { channel?.close(); window.clearInterval(poll); window.removeEventListener('storage', onStorage) }
  }, [])

  const commit = useCallback((updater: Updater) => {
    const next = updater(stateRef.current)
    stateRef.current = next
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    channelRef.current?.postMessage(next)
    setState(next)
    syncQueueRef.current = syncQueueRef.current.then(async () => {
      try {
        for (let attempt = 0; attempt < 3; attempt += 1) {
          const latestResponse = await fetch(STATE_ENDPOINT, { cache: 'no-store' })
          if (!latestResponse.ok) return
          const latest = await latestResponse.json() as StateEnvelope
          if (!latest.state) return
          const sharedNext = updater(latest.state)
          const response = await fetch(STATE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ baseRevision: latest.revision, state: sharedNext }),
          })
          if (response.status === 409) continue
          if (!response.ok) return
          const saved = await response.json() as StateEnvelope
          if (!saved.state) return
          revisionRef.current = saved.revision
          stateRef.current = saved.state
          localStorage.setItem(STORAGE_KEY, JSON.stringify(saved.state))
          channelRef.current?.postMessage(saved.state)
          setState(saved.state)
          return
        }
      } catch { /* Sem o servidor local, a persistência continua no navegador. */ }
    })
  }, [])

  const actions: Actions = {
    selectPatient: id => commit(s => ({ ...s, demoPatientId: id })),
    confirmAppointment: id => commit(s => transitions.confirmAppointment(s, id)),
    cancelAppointment: (id, reason) => commit(s => transitions.cancelAppointment(s, id, reason)),
    requestReschedule: (id, date, time) => commit(s => transitions.requestReschedule(s, id, date, time)),
    approveReschedule: id => commit(s => transitions.approveReschedule(s, id)),
    acceptOffer: id => commit(s => transitions.acceptOffer(s, id)),
    declineOffer: id => commit(s => transitions.declineOffer(s, id)),
    expireOffer: id => commit(s => transitions.expireOffer(s, id)),
    updatePreferences: (id, preferences) => commit(s => transitions.updatePreferences(s, id, preferences)),
    registerCommunication: (id, channel, appointmentId, details) => commit(s => transitions.registerCommunication(s, id, channel, appointmentId, details)),
    updateAppointmentStatus: (id, status) => commit(s => transitions.updateAppointmentStatus(s, id, status)),
    createSchedulingRequest: (id, specialty, unit, date, time) => commit(s => transitions.createSchedulingRequest(s, id, specialty, unit, date, time)),
    resetDemo: () => commit(transitions.resetDemo),
  }

  return <AppContext.Provider value={{ state, actions }}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp deve ser usado dentro de AppProvider')
  return context
}

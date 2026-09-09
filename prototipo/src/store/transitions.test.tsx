import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RiskBadge } from '../components/ui'
import { createInitialState } from '../data/mockData'
import { advanceRecovery, WaitlistService } from '../services/waitlist/WaitlistService'
import { riskLabels } from '../utils/format'
import { acceptOffer, approveReschedule, cancelAppointment, confirmAppointment, createSchedulingRequest, declineOffer, registerCommunication, requestReschedule, resetDemo, updatePreferences } from './transitions'

describe('fluxos de consulta', () => {
  it('confirma a consulta com data, origem e histórico compartilhado', () => {
    const state = confirmAppointment(createInitialState(), 'a1')
    const appointment = state.appointments.find(item => item.id === 'a1')!
    expect(appointment.status).toBe('CONFIRMED')
    expect(appointment.confirmedAt).toBeTruthy()
    expect(appointment.confirmationSource).toBe('Aplicativo MedPredict')
    expect(state.communications[0]).toMatchObject({ eventType: 'Confirmação de consulta', channel: 'Aplicativo MedPredict', origin: 'Paciente', status: 'Confirmada' })
  })

  it('sincroniza a alteração para a visão administrativa no mesmo estado', () => {
    const sharedState = confirmAppointment(createInitialState(), 'a1')
    const patientView = sharedState.appointments.find(item => item.patientId === 'p1')
    const adminRow = sharedState.appointments.find(item => item.id === 'a1')
    expect(patientView?.status).toBe('CONFIRMED')
    expect(adminRow?.status).toBe(patientView?.status)
  })

  it('reagenda, preserva o horário anterior no histórico e aguarda nova confirmação', () => {
    const state = requestReschedule(createInitialState(), 'a1', '2026-09-12', '09:30')
    expect(state.appointments.find(item => item.id === 'a1')).toMatchObject({ date: '2026-09-12', time: '09:30', status: 'AWAITING' })
    expect(state.rescheduleRequests[0]).toMatchObject({ appointmentId: 'a1', requestedDate: '2026-09-12', status: 'APPROVED' })
    expect(state.communications[0].message).toContain('2026-09-05 às 10:20')
  })

  it('permite confirmar o novo horário depois do reagendamento', () => {
    const requested = requestReschedule(createInitialState(), 'a1', '2026-09-12', '09:30')
    const state = confirmAppointment(requested, 'a1')
    expect(state.appointments.find(item => item.id === 'a1')?.status).toBe('CONFIRMED')
    expect(state.rescheduleRequests[0].status).toBe('APPROVED')
  })

  it('preserva cada reagendamento concluído e permite cancelamento posterior', () => {
    let state = requestReschedule(createInitialState(), 'a1', '2026-09-12', '09:30')
    state = requestReschedule(state, 'a1', '2026-09-14', '14:00')
    expect(state.rescheduleRequests.filter(item => item.appointmentId === 'a1')).toHaveLength(2)
    state = cancelAppointment(state, 'a1', 'Não poderei comparecer')
    expect(state.appointments.find(item => item.id === 'a1')?.status).toBe('CANCELLED')
    expect(state.communications.some(item => item.eventType === 'Cancelamento de consulta')).toBe(true)
  })

  it('aprova o novo horário sem presumir a confirmação do paciente', () => {
    let state = requestReschedule(createInitialState(), 'a1', '2026-09-12', '09:30')
    state = approveReschedule(state, state.rescheduleRequests[0].id)
    expect(state.rescheduleRequests[0].status).toBe('APPROVED')
    expect(state.appointments.find(item => item.id === 'a1')).toMatchObject({ date: '2026-09-12', time: '09:30', status: 'AWAITING' })
  })

  it('salva preferências fictícias de contato', () => {
    const state = updatePreferences(createInitialState(), 'p1', { channels: ['Push'], phone: '000', email: 'demo@exemplo.test' })
    expect(state.patients.find(item => item.id === 'p1')?.preferences.channels).toEqual(['Push'])
  })

  it('cria agendamento e evento rastreável para paciente e ADM', () => {
    const state = createSchedulingRequest(createInitialState(), 'w1', 'Clínica Geral', 'UBS Central', '2026-09-18', '08:30')
    const created = state.appointments.find(item => item.patientId === 'w1')!
    expect(created).toMatchObject({ specialty: 'Clínica Geral', unit: 'UBS Central', status: 'AWAITING' })
    expect(state.communications[0]).toMatchObject({ patientId: 'w1', appointmentId: created.id, eventType: 'Agendamento de consulta', status: 'Agendada' })
  })

  it('registra detalhes demonstrativos de uma ligação', () => {
    const state = registerCommunication(createInitialState(), 'p2', 'Ligação', 'a2', { contactedPerson: 'Maria Alves', relationship: 'Familiar', messageLeft: true, messageRecipient: 'Marina', note: 'Solicitada confirmação.', status: 'Recado deixado' })
    expect(state.communications[0]).toMatchObject({ channel: 'Ligação', contactedPerson: 'Maria Alves', relationship: 'Familiar', messageLeft: true, messageRecipient: 'Marina', status: 'Recado deixado' })
  })
})

describe('prioridade estimada', () => {
  it('apresenta texto e classe visual sem afirmar certeza', () => {
    const html = renderToStaticMarkup(<RiskBadge level="HIGH" />)
    expect(riskLabels.HIGH).toBe('Alta')
    expect(html).toContain('risk-high')
    expect(html).toContain('Prioridade alta')
    expect(html).not.toContain('vai faltar')
  })
})

describe('recuperação de vagas', () => {
  it('cancela, libera a vaga e inicia oferta ao primeiro elegível', () => {
    const state = cancelAppointment(createInitialState(), 'a2', 'Problema de horário')
    expect(state.appointments.find(item => item.id === 'a2')?.status).toBe('CANCELLED')
    expect(state.recoveries).toHaveLength(1)
    expect(state.recoveries[0].status).toBe('OFFERING')
    expect(state.recoveries[0].offers[0].patientId).toBe('w1')
  })

  it('seleciona por regras transparentes e posição da fila', () => {
    const state = createInitialState()
    const appointment = state.appointments.find(item => item.id === 'a2')!
    expect(WaitlistService.findNextEligible(state, appointment)?.id).toBe('q1')
  })

  it('ao recusar chama automaticamente o próximo elegível', () => {
    let state = cancelAppointment(createInitialState(), 'a2', 'Trabalho')
    state = declineOffer(state, state.recoveries[0].id)
    expect(state.recoveries[0].offers).toHaveLength(2)
    expect(state.recoveries[0].offers[0].status).toBe('DECLINED')
    expect(state.recoveries[0].offers[1].patientId).toBe('w2')
  })

  it('não cria ofertas simultâneas para a mesma vaga', () => {
    const state = cancelAppointment(createInitialState(), 'a2', 'Trabalho')
    const unchanged = advanceRecovery(state, state.recoveries[0].id)
    expect(unchanged.recoveries[0].offers).toHaveLength(1)
    expect(unchanged.recoveries[0].offers.filter(offer => offer.status === 'PENDING')).toHaveLength(1)
    expect(unchanged.waitlist.find(item => item.id === 'q2')?.status).toBe('AGUARDANDO')
  })

  it('executa recusa e aceite em sequência mantendo uma única oferta ativa', () => {
    let state = cancelAppointment(createInitialState(), 'a2', 'Trabalho')
    state = declineOffer(state, state.recoveries[0].id)
    expect(state.recoveries[0].offers.filter(offer => offer.status === 'PENDING').map(offer => offer.patientId)).toEqual(['w2'])
    state = acceptOffer(state, state.recoveries[0].id)
    expect(state.recoveries[0].status).toBe('RECOVERED')
    expect(state.recoveries[0].offers.filter(offer => offer.status === 'PENDING')).toHaveLength(0)
    expect(state.appointments.find(item => item.id === 'a2')).toMatchObject({ patientId: 'w2', status: 'CONFIRMED', recovered: true })
    expect(state.communications.find(item => item.patientId === 'w2' && item.eventType === 'Aceite de oferta')?.status).toBe('Aceita')
    const acceptedAgain = acceptOffer(state, state.recoveries[0].id)
    expect(acceptedAgain.recoveries[0].offers).toHaveLength(2)
    expect(acceptedAgain.appointments.filter(item => item.id === 'a2')).toHaveLength(1)
  })

  it('ao aceitar ocupa novamente a agenda e incrementa recuperação', () => {
    let state = cancelAppointment(createInitialState(), 'a2', 'Trabalho')
    state = acceptOffer(state, state.recoveries[0].id)
    const appointment = state.appointments.find(item => item.id === 'a2')!
    expect(state.recoveries[0].status).toBe('RECOVERED')
    expect(appointment).toMatchObject({ patientId: 'w1', originalPatientId: 'p2', status: 'CONFIRMED', recovered: true })
    expect(state.waitlist.find(item => item.id === 'q1')?.status).toBe('AGENDADA')
  })

  it('mantém vaga disponível quando não existe paciente elegível', () => {
    const initial = createInitialState()
    initial.waitlist = []
    const state = cancelAppointment(initial, 'a2', 'Outro')
    expect(state.recoveries[0].status).toBe('NO_ELIGIBLE')
    expect(state.appointments.find(item => item.id === 'a2')?.status).toBe('CANCELLED')
  })
})

describe('modo demonstração', () => {
  it('restaura integralmente os cenários iniciais', () => {
    const changed = cancelAppointment(createInitialState(), 'a2', 'Outro')
    expect(changed.recoveries).toHaveLength(1)
    const restored = resetDemo()
    expect(restored.recoveries).toHaveLength(0)
    expect(restored.appointments.find(item => item.id === 'a2')?.status).toBe('AWAITING')
    expect(restored.demoPatientId).toBe('p1')
  })
})

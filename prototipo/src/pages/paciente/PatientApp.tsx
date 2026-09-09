import { useEffect, useState, type FormEvent } from 'react'
import { Activity, Bell, CalendarDays, Check, ChevronRight, Clock3, Home, LogOut, MapPin, RotateCcw, Settings2, Stethoscope, UserRound, X } from 'lucide-react'
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { DemoBanner, EmptyState, Modal, StatusBadge } from '../../components/ui'
import { useApp } from '../../store/AppContext'
import type { ContactChannel } from '../../types'
import { formatDate, formatDateTime, statusLabels } from '../../utils/format'

const demoIds = ['p1', 'p2', 'w1', 'w2']

function PatientShell() {
  const { state, actions } = useApp()
  const patient = state.patients.find(item => item.id === state.demoPatientId)!
  const unread = state.notifications.filter(item => item.patientId === patient.id && !item.read).length
  return <div className="patient-page">
    <DemoBanner />
    <header className="patient-header">
      <Link to="/" className="patient-brand" aria-label="Voltar ao início"><Activity aria-hidden="true" /><span>MedPredict<small>Grupo TRAMA</small></span></Link>
      <label className="demo-profile"><span>Perfil demonstrativo</span><select value={patient.id} onChange={event => actions.selectPatient(event.target.value)}>{state.patients.filter(p => demoIds.includes(p.id)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    </header>
    <main className="patient-content"><Routes>
      <Route index element={<PatientHome />} />
      <Route path="consultas" element={<PatientAppointments />} />
      <Route path="notificacoes" element={<PatientNotifications />} />
      <Route path="preferencias" element={<PatientPreferences />} />
      <Route path="agendar" element={<PatientScheduling />} />
      <Route path="*" element={<Navigate to="/paciente" replace />} />
    </Routes></main>
    <nav className="patient-nav" aria-label="Navegação do paciente">
      <NavLink end to="/paciente"><Home aria-hidden="true" /><span>Início</span></NavLink>
      <NavLink to="/paciente/consultas"><CalendarDays aria-hidden="true" /><span>Consultas</span></NavLink>
      <NavLink to="/paciente/notificacoes"><span className="nav-icon"><Bell aria-hidden="true" />{unread > 0 && <i>{unread}</i>}</span><span>Avisos</span></NavLink>
      <NavLink to="/paciente/preferencias"><Settings2 aria-hidden="true" /><span>Preferências</span></NavLink>
    </nav>
  </div>
}

function PatientHome() {
  const { state, actions } = useApp()
  const patient = state.patients.find(item => item.id === state.demoPatientId)!
  const appointment = state.appointments.filter(item => item.patientId === patient.id && item.status !== 'CANCELLED' && item.status !== 'COMPLETED').sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0]
  const recovery = state.recoveries.find(item => item.offers.some(offer => offer.patientId === patient.id && offer.status === 'PENDING'))
  const [modal, setModal] = useState<'confirm' | 'cancel' | 'reschedule' | null>(null)
  const [reason, setReason] = useState('Não poderei comparecer')
  const [success, setSuccess] = useState('')
  const [protocol, setProtocol] = useState('')
  const [rescheduleSlot, setRescheduleSlot] = useState<[string, string] | null>(null)

  const close = () => setModal(null)
  const cancel = () => {
    if (!appointment) return
    actions.cancelAppointment(appointment.id, reason)
    setProtocol(`MP-${new Date().getFullYear()}-${appointment.id.toUpperCase()}`)
    setSuccess('Consulta cancelada com sucesso.')
    close()
  }

  return <>
    <section className="patient-welcome"><div><p>Olá,</p><h1>{patient.name.split(' ')[0]}!</h1></div><div className="avatar"><UserRound aria-hidden="true" /></div></section>
    {success && <div className="success-panel" role="status"><Check aria-hidden="true" /><div><strong>{success}</strong>{protocol && <><p>Este horário poderá ser disponibilizado para outro paciente.</p><small>Protocolo demonstrativo: {protocol}</small></>}</div></div>}
    {recovery && <section className="offer-card"><p className="eyebrow">Oferta simulada da fila</p><h2>Vaga antecipada disponível</h2><p>Uma vaga compatível foi liberada. Deseja antecipar seu atendimento?</p><div className="offer-details"><CalendarDays /> <span>{formatDate(state.appointments.find(a => a.id === recovery.appointmentId)!.date)} às {state.appointments.find(a => a.id === recovery.appointmentId)!.time}</span></div><div className="button-row"><button className="button primary" onClick={() => { actions.acceptOffer(recovery.id); setSuccess('Vaga aceita e agendada com sucesso.') }}>Aceitar vaga</button><button className="button secondary" onClick={() => { actions.declineOffer(recovery.id); setSuccess('Oferta recusada. Sua posição geral foi preservada.') }}>Não tenho interesse</button></div></section>}
    {appointment ? <section className="next-appointment">
      <div className="section-heading"><div><p className="eyebrow">Sua próxima consulta</p><h2>{appointment.specialty}</h2></div><StatusBadge status={appointment.status} /></div>
      <div className="appointment-date"><div className="date-tile"><strong>{appointment.date.slice(-2)}</strong><span>SET</span></div><div><strong>{formatDate(appointment.date)}</strong><span><Clock3 /> {appointment.time}</span></div></div>
      <div className="appointment-location"><MapPin aria-hidden="true" /><div><strong>{appointment.unit}</strong><span>{appointment.address}</span></div></div>
       <div className="patient-actions"><button className="button primary large" onClick={() => setModal('confirm')} disabled={appointment.status !== 'AWAITING'} title={appointment.status !== 'AWAITING' ? 'A consulta só pode ser confirmada quando estiver aguardando confirmação.' : undefined}><Check />{appointment.status === 'CONFIRMED' ? 'Presença confirmada' : appointment.status === 'RESCHEDULE_REQUESTED' ? 'Reagendamento solicitado' : 'Confirmar presença'}</button>{appointment.status !== 'AWAITING' && <small className="action-help">{appointment.status === 'CONFIRMED' ? 'Esta consulta já está confirmada.' : 'A confirmação ficará disponível quando a consulta voltar a aguardar confirmação.'}</small>}<button className="button secondary large" onClick={() => { setRescheduleSlot(null); setModal('reschedule') }} disabled={appointment.status === 'RESCHEDULE_REQUESTED'}><RotateCcw />{appointment.status === 'RESCHEDULE_REQUESTED' ? 'Solicitação em análise' : 'Preciso reagendar'}</button><button className="button danger-ghost large" onClick={() => setModal('cancel')}><X />Cancelar consulta</button></div>
    </section> : <EmptyState title="Nenhuma consulta futura"><Link className="button primary" to="/paciente/agendar">Solicitar agendamento</Link></EmptyState>}
    <Link className="care-quote" to="/paciente/consultas"><span>“Quando uma vaga é liberada, o cuidado pode chegar mais cedo a quem está esperando.”</span><ChevronRight /></Link>
    {modal === 'confirm' && appointment && <Modal title="Confirmar presença" onClose={close}><p>Deseja confirmar sua presença nesta consulta?</p><div className="modal-summary"><strong>{appointment.specialty}</strong><span>{formatDate(appointment.date)} às {appointment.time}</span></div><div className="button-row"><button className="button primary" onClick={() => { actions.confirmAppointment(appointment.id); setSuccess('Consulta confirmada.'); close() }}>Confirmar</button><button className="button secondary" onClick={close}>Voltar</button></div></Modal>}
    {modal === 'cancel' && appointment && <Modal title="Cancelar consulta" onClose={close}><p>Você realmente deseja cancelar esta consulta?</p><label>Motivo (opcional)<select value={reason} onChange={event => setReason(event.target.value)}><option>Não poderei comparecer</option><option>Problema de horário</option><option>Transporte</option><option>Trabalho</option><option>Questão familiar</option><option>Outro</option><option>Prefiro não informar</option></select></label><div className="button-row"><button className="button danger" onClick={cancel}>Confirmar cancelamento</button><button className="button secondary" onClick={close}>Voltar</button></div></Modal>}
    {modal === 'reschedule' && appointment && <Modal title={rescheduleSlot ? 'Revisar reagendamento' : 'Escolha uma nova opção'} onClose={close}>{rescheduleSlot ? <><p>Confirme a substituição do horário atual. O agendamento anterior continuará no histórico.</p><div className="modal-summary"><strong>{appointment.specialty} · {appointment.unit}</strong><span>De {formatDate(appointment.date)} às {appointment.time}</span><span>Para {formatDate(rescheduleSlot[0])} às {rescheduleSlot[1]}</span></div><div className="button-row"><button className="button primary" onClick={() => { actions.requestReschedule(appointment.id, rescheduleSlot[0], rescheduleSlot[1]); setSuccess('Consulta reagendada. Confirme sua presença no novo horário.'); close() }}>Confirmar reagendamento</button><button className="button secondary" onClick={() => setRescheduleSlot(null)}>Escolher outro</button></div></> : <><p>Horários fictícios disponíveis:</p><div className="slot-grid">{[['2026-09-12', '09:30'], ['2026-09-14', '14:00'], ['2026-09-16', '10:40']].map(([date, time]) => <button key={`${date}-${time}`} onClick={() => setRescheduleSlot([date, time])}><CalendarDays /><strong>{formatDate(date)}</strong><span>{time}</span></button>)}</div><button className="button secondary full" onClick={close}>Voltar</button></>}</Modal>}
  </>
}

function PatientAppointments() {
  const { state } = useApp()
  const [tab, setTab] = useState('Próximas')
  const all = state.appointments.filter(item => item.patientId === state.demoPatientId)
  const recoveredCancellations = state.recoveries.filter(recovery => recovery.originalPatientId === state.demoPatientId && recovery.status === 'RECOVERED').map(recovery => state.appointments.find(item => item.id === recovery.appointmentId)!).filter(Boolean)
  const shown = tab === 'Canceladas' ? [...all.filter(item => item.status === 'CANCELLED'), ...recoveredCancellations] : all.filter(item => tab === 'Próximas' ? ['AWAITING', 'RESCHEDULE_REQUESTED'].includes(item.status) : tab === 'Confirmadas' ? item.status === 'CONFIRMED' : false)
  const history = state.communications.filter(item => item.patientId === state.demoPatientId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return <section><div className="page-title"><p className="eyebrow">Acompanhamento</p><h1>Minhas consultas</h1></div><div className="tabs" role="tablist">{['Próximas', 'Confirmadas', 'Canceladas', 'Histórico'].map(item => <button role="tab" aria-selected={tab === item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)} key={item}>{item}</button>)}</div>{tab === 'Histórico' ? <div className="timeline history-timeline">{history.map(item => <article key={item.id}><span className="timeline-dot" /><div><strong>{item.eventType}</strong><p>{item.message}</p><small>{formatDateTime(item.createdAt)} · Canal: {item.channel} · Resultado: {item.status}</small>{item.contactedPerson && <small>Pessoa contatada: {item.contactedPerson}{item.relationship ? ` (${item.relationship})` : ''}</small>}{item.note && <small>Observação: {item.note}</small>}</div></article>)}{history.length === 0 && <EmptyState title="Nenhum evento registrado" />}</div> : <div className="card-list">{shown.map(item => <article className="mini-appointment" key={`${tab}-${item.id}`}><div className="date-tile small"><strong>{item.date.slice(-2)}</strong><span>SET</span></div><div><h2>{item.specialty}</h2><p>{item.unit} · {item.time}</p><StatusBadge status={tab === 'Canceladas' ? 'CANCELLED' : item.status} />{tab === 'Canceladas' && item.cancellationReason && <small>Motivo: {item.cancellationReason}</small>}</div></article>)}{shown.length === 0 && <EmptyState title="Nenhuma consulta nesta categoria" />}</div>}<Link to="/paciente/agendar" className="button primary full"><CalendarDays /> Solicitar novo agendamento</Link></section>
}

function PatientNotifications() {
  const { state } = useApp()
  const items = state.notifications.filter(item => item.patientId === state.demoPatientId)
  return <section><div className="page-title"><p className="eyebrow">Comunicação simulada</p><h1>Notificações</h1><p>Lembretes de 7, 3 e 1 dia, respostas e ofertas ficam registrados aqui.</p></div><div className="timeline">{items.map(item => <article key={item.id} className={!item.read ? 'unread' : ''}><span className="timeline-dot" /><div><strong>{item.title}</strong><p>{item.message}</p><small>{formatDateTime(item.createdAt)}{item.channel ? ` · Canal: ${item.channel}` : ''}{item.status ? ` · Resultado: ${item.status}` : ''}</small>{item.recipient && <small>Destinatário: {item.recipient}</small>}{item.contactedPerson && <small>Pessoa contatada: {item.contactedPerson}</small>}{item.note && <small>Observação: {item.note}</small>}</div></article>)}{items.length === 0 && <EmptyState title="Nenhuma notificação" />}</div></section>
}

function PatientPreferences() {
  const { state, actions } = useApp()
  const patient = state.patients.find(item => item.id === state.demoPatientId)!
  const [phone, setPhone] = useState(patient.preferences.phone)
  const [email, setEmail] = useState(patient.preferences.email)
  const [channels, setChannels] = useState<ContactChannel[]>(patient.preferences.channels)
  useEffect(() => { setPhone(patient.preferences.phone); setEmail(patient.preferences.email); setChannels(patient.preferences.channels) }, [patient.id, patient.preferences])
  const options: ContactChannel[] = ['WhatsApp', 'E-mail', 'Ligação', 'Push']
  const toggle = (channel: ContactChannel) => setChannels(list => list.includes(channel) ? list.filter(item => item !== channel) : [...list, channel])
  return <section><div className="page-title"><p className="eyebrow">Seus canais</p><h1>Preferências de contato</h1></div><form className="settings-card" onSubmit={event => { event.preventDefault(); actions.updatePreferences(patient.id, { phone, email, channels }) }}><fieldset><legend>Como você prefere receber contatos?</legend>{options.map(channel => <label className="check-row" key={channel}><input type="checkbox" checked={channels.includes(channel)} onChange={() => toggle(channel)} /><span>{channel === 'Push' ? 'Notificação no aplicativo' : channel}</span></label>)}</fieldset><label>Telefone demonstrativo<input value={phone} onChange={event => setPhone(event.target.value)} /></label><label>E-mail demonstrativo<input type="email" value={email} onChange={event => setEmail(event.target.value)} /></label><button className="button primary full">Salvar preferências</button></form><p className="info-box">Estas preferências fictícias são compartilhadas pela instância local da demonstração. Nenhuma mensagem é enviada.</p></section>
}

function PatientScheduling() {
  const { state, actions } = useApp()
  const [sent, setSent] = useState(false)
  const [review, setReview] = useState<{ specialty: string; unit: string; date: string; time: string } | null>(null)
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setReview({ specialty: String(data.get('specialty')), unit: String(data.get('unit')), date: String(data.get('date')), time: String(data.get('time')) })
  }
  const confirm = () => {
    if (!review) return
    actions.createSchedulingRequest(state.demoPatientId, review.specialty, review.unit, review.date, review.time)
    setSent(true)
    setReview(null)
  }
  return <section><div className="page-title"><p className="eyebrow">Fluxo demonstrativo</p><h1>Solicitar agendamento</h1><p>As opções abaixo são fictícias e não estão conectadas à agenda real de uma UBS.</p></div>{sent ? <div className="success-panel"><Check /><div><strong>Consulta criada.</strong><p>Ela já está disponível na página inicial, em Minhas consultas e na agenda administrativa.</p><Link to="/paciente" className="button secondary">Ver consulta</Link></div></div> : review ? <div className="settings-card"><h2>Revisar agendamento</h2><div className="modal-summary"><strong>{review.specialty}</strong><span>{review.unit}</span><span>{formatDate(review.date)} às {review.time}</span></div><div className="button-row"><button className="button primary" onClick={confirm}>Confirmar agendamento</button><button className="button secondary" onClick={() => setReview(null)}>Alterar opções</button></div></div> : <form className="settings-card" onSubmit={submit}><label>Especialidade<select name="specialty"><option>Clínica Geral</option><option>Cardiologia</option><option>Dermatologia</option><option>Pediatria</option></select></label><label>Unidade<select name="unit"><option>UBS Central</option><option>UBS Norte</option><option>UBS Sul</option><option>Centro de Especialidades</option></select></label><label>Data<input required name="date" type="date" defaultValue="2026-09-18" /></label><label>Horário<select name="time"><option>08:30</option><option>10:00</option><option>14:20</option></select></label><button className="button primary full">Revisar agendamento</button></form>}</section>
}

export function PatientApp() { return <PatientShell /> }

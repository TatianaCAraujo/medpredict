import { useState } from 'react'
import { Activity, AlertTriangle, ArrowDown, BellRing, Building2, CalendarClock, CalendarDays, Check, ChevronRight, CircleGauge, ClipboardCheck, Clock3, ExternalLink, FileClock, Filter, HeartHandshake, History, Info, Link2, ListOrdered, Mail, Menu, MessageCircle, Phone, RefreshCcw, Search, Settings, ShieldCheck, Users, X } from 'lucide-react'
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { DemoBanner, EmptyState, Modal, RiskBadge, StatusBadge } from '../../components/ui'
import { useApp } from '../../store/AppContext'
import type { Appointment, AppointmentStatus, ContactChannel, Patient, RiskLevel } from '../../types'
import { formatDate, formatDateTime, formatProbability, riskLabels, statusLabels, waitlistLabels } from '../../utils/format'

const navItems = [
  ['/admin', 'Visão geral', CircleGauge], ['/admin/agenda', 'Agenda inteligente', CalendarDays], ['/admin/confirmacoes', 'Confirmações', ClipboardCheck], ['/admin/recuperacao', 'Recuperação de vagas', HeartHandshake], ['/admin/fila', 'Fila de espera', ListOrdered], ['/admin/integracoes', 'Integrações', Link2], ['/admin/sobre', 'Configurações e sobre', Settings],
] as const

function AdminShell() {
  const [menu, setMenu] = useState(false)
  return <div className="admin-page">
    <aside className={menu ? 'admin-sidebar open' : 'admin-sidebar'}>
      <div className="admin-brand"><Activity /><span>MedPredict<small>Grupo TRAMA</small></span><button onClick={() => setMenu(false)} aria-label="Fechar menu"><X /></button></div>
      <nav aria-label="Navegação administrativa">{navItems.map(([to, label, Icon]) => <NavLink end={to === '/admin'} to={to} key={to} onClick={() => setMenu(false)}><Icon aria-hidden="true" /><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-note"><ShieldCheck /><span><strong>Ambiente acadêmico</strong>Todos os dados são fictícios</span></div>
      <Link className="back-link" to="/">Sair da demonstração</Link>
    </aside>
    <div className="admin-main">
      <DemoBanner />
      <header className="admin-topbar"><button className="menu-button" onClick={() => setMenu(true)} aria-label="Abrir menu"><Menu /></button><div><strong>Unidade demonstrativa</strong><span>Equipe de gestão</span></div><div className="admin-user"><BellRing /><span>GT</span></div></header>
      <main className="admin-content"><Routes>
        <Route index element={<Dashboard />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="confirmacoes" element={<Confirmations />} />
        <Route path="recuperacao" element={<Recoveries />} />
        <Route path="fila" element={<Waitlist />} />
        <Route path="integracoes" element={<Integrations />} />
        <Route path="sobre" element={<About />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes></main>
    </div>
  </div>
}

function PageHeading({ eyebrow, title, text, action }: { eyebrow: string; title: string; text?: string; action?: React.ReactNode }) {
  return <div className="admin-page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{text && <p>{text}</p>}</div>{action}</div>
}

function Dashboard() {
  const { state, actions } = useApp()
  const [reset, setReset] = useState(false)
  const day = state.appointments.filter(item => item.date === '2026-09-03')
  const count = (status: AppointmentStatus) => state.appointments.filter(item => item.status === status).length
  const metrics = [
    ['Consultas do dia', day.length, CalendarDays, 'blue'], ['Confirmadas', count('CONFIRMED'), Check, 'green'], ['Aguardando confirmação', count('AWAITING'), Clock3, 'amber'], ['Canceladas', count('CANCELLED'), X, 'red'], ['Reagendamentos', count('RESCHEDULE_REQUESTED'), CalendarClock, 'purple'], ['Vagas liberadas', state.recoveries.filter(item => item.status !== 'RECOVERED').length, FileClock, 'amber'], ['Vagas recuperadas', state.recoveries.filter(item => item.status === 'RECOVERED').length, HeartHandshake, 'green'], ['Prioridade alta', state.appointments.filter(item => item.riskLevel === 'HIGH' && item.status === 'AWAITING').length, AlertTriangle, 'red'], ['Na fila de espera', state.waitlist.filter(item => item.status !== 'AGENDADA').length, Users, 'blue'],
  ] as const
  const levels: RiskLevel[] = ['HIGH', 'MEDIUM', 'LOW']
  const pendingByLevel = (level: RiskLevel) => state.appointments.filter(a => a.riskLevel === level && a.status === 'AWAITING').length
  const max = Math.max(1, ...levels.map(pendingByLevel))
  const recent = state.communications.slice(0, 5)
  return <>
    <PageHeading eyebrow="Visão geral · 03 de setembro" title="A agenda em um só olhar" text="Priorize confirmações e acompanhe oportunidades de cuidado." action={<button className="button secondary" onClick={() => setReset(true)}><RefreshCcw /> Reiniciar demonstração</button>} />
    <div className="metrics-grid">{metrics.map(([label, value, Icon, tone]) => <article className={`metric-card ${tone}`} key={label}><div><span>{label}</span><strong>{value}</strong></div><Icon aria-hidden="true" /></article>)}</div>
    <div className="dashboard-grid">
      <section className="panel"><div className="panel-title"><div><p className="eyebrow">Distribuição demonstrativa</p><h2>Prioridade de confirmação</h2></div><Link to="/admin/confirmacoes">Ver fila <ChevronRight /></Link></div><div className="bar-chart">{levels.map(level => { const total = pendingByLevel(level); return <div className="bar-row" key={level}><span><RiskBadge level={level} /></span><div><i className={`bar ${level.toLowerCase()}`} style={{ width: `${total / max * 100}%` }} /></div><strong>{total}</strong></div> })}</div><p className="chart-note">Apenas confirmações pendentes. Probabilidades simuladas, sem certeza de ausência.</p></section>
      <section className="panel"><div className="panel-title"><div><p className="eyebrow">Atualizações sincronizadas</p><h2>Atividade recente</h2></div></div><div className="activity-list">{recent.map(event => { const patient = state.patients.find(p => p.id === event.patientId); return <div key={event.id}><span className="activity-icon"><History /></span><div><strong>{patient?.name}</strong><p>{event.message}</p><small>{formatDateTime(event.createdAt)} · {event.channel}</small></div></div> })}</div></section>
    </div>
    <section className="scenario-strip"><div><p className="eyebrow">Roteiros preparados</p><h2>Cenários de demonstração</h2></div><button onClick={() => { actions.selectPatient('p1'); window.open('/paciente', '_blank') }}><strong>A</strong><span>Juliana confirma consulta<small>Abrir em nova aba</small></span><ExternalLink /></button><button onClick={() => { actions.selectPatient('p2'); window.open('/paciente', '_blank') }}><strong>B</strong><span>Marina cancela e libera vaga<small>Abrir em nova aba</small></span><ExternalLink /></button></section>
    {reset && <Modal title="Reiniciar demonstração?" onClose={() => setReset(false)}><p>Todos os dados e cenários fictícios voltarão ao estado inicial.</p><div className="button-row"><button className="button danger" onClick={() => { actions.resetDemo(); setReset(false) }}>Reiniciar agora</button><button className="button secondary" onClick={() => setReset(false)}>Voltar</button></div></Modal>}
  </>
}

function Agenda() {
  const { state } = useApp()
  const [filters, setFilters] = useState({ search: '', unit: '', specialty: '', status: '', risk: '' })
  const [selected, setSelected] = useState<Appointment | null>(null)
  const rows = state.appointments.filter(a => {
    const patient = state.patients.find(p => p.id === a.patientId)!
    return patient.name.toLowerCase().includes(filters.search.toLowerCase()) && (!filters.unit || a.unit === filters.unit) && (!filters.specialty || a.specialty === filters.specialty) && (!filters.status || a.status === filters.status) && (!filters.risk || a.riskLevel === filters.risk)
  }).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  return <>
    <PageHeading eyebrow="Agenda inteligente" title="Consultas e prioridades" text="Filtros apoiam a organização da equipe; a decisão final permanece humana." />
    <div className="filters"><label className="search"><Search /><span className="sr-only">Buscar paciente</span><input placeholder="Buscar paciente" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} /></label><Filter aria-hidden="true" />{[
      ['unit', 'Todas as unidades', [...new Set(state.appointments.map(a => a.unit))]], ['specialty', 'Especialidades', [...new Set(state.appointments.map(a => a.specialty))]], ['status', 'Todos os status', Object.keys(statusLabels)], ['risk', 'Prioridades', ['HIGH', 'MEDIUM', 'LOW']],
    ].map(([key, label, options]) => <select aria-label={String(label)} key={String(key)} value={filters[key as keyof typeof filters]} onChange={e => setFilters({ ...filters, [String(key)]: e.target.value })}><option value="">{String(label)}</option>{(options as string[]).map(value => <option value={value} key={value}>{key === 'status' ? statusLabels[value as AppointmentStatus] : key === 'risk' ? riskLabels[value as RiskLevel] : value}</option>)}</select>)}</div>
    <div className="table-wrap"><table><thead><tr><th>Paciente</th><th>Especialidade</th><th>Data e horário</th><th>Unidade</th><th>Status</th><th>Prioridade</th><th>Último contato</th></tr></thead><tbody>{rows.map(a => { const patient = state.patients.find(p => p.id === a.patientId)!; const contact = state.communications.find(c => c.patientId === patient.id); return <tr key={a.id} tabIndex={0} onClick={() => setSelected(a)} onKeyDown={e => { if (e.key === 'Enter') setSelected(a) }}><td><strong>{patient.name}</strong><small>{patient.age} anos</small></td><td>{a.specialty}</td><td>{formatDate(a.date)}<small>{a.time}</small></td><td>{a.unit}</td><td><StatusBadge status={a.status} /></td><td><RiskBadge level={a.riskLevel} /></td><td>{contact ? <>{contact.channel}<small>{formatDateTime(contact.createdAt)}</small></> : 'Sem contato'}</td></tr> })}</tbody></table></div>
    {selected && <PatientDetail appointment={selected} patient={state.patients.find(p => p.id === selected.patientId)!} onClose={() => setSelected(null)} />}
  </>
}

function PatientDetail({ appointment, patient, onClose }: { appointment: Appointment; patient: Patient; onClose(): void }) {
  const { state } = useApp()
  const contacts = state.communications.filter(c => c.patientId === patient.id)
  return <Modal title="Detalhe do paciente" onClose={onClose}>
    <div className="patient-detail-head"><span className="avatar"><Users /></span><div><h3>{patient.name}</h3><p>{patient.age} anos · {patient.neighbourhood}</p></div><RiskBadge level={appointment.riskLevel} /></div>
    <div className="detail-grid"><div><span>Consulta</span><strong>{appointment.specialty}</strong><small>{formatDate(appointment.date)} · {appointment.time}</small></div><div><span>Status</span><StatusBadge status={appointment.status} /></div><div><span>Probabilidade estimada</span><strong>{formatProbability(appointment.riskProbability)}</strong><small>Valor demonstrativo</small></div><div><span>Preferências</span><strong>{patient.preferences.channels.join(', ')}</strong></div></div>
    <section className="factors"><h3>Fatores associados utilizados pelo modelo</h3><p>Estes fatores apoiam a estimativa e não representam causas individuais.</p><div><span>Tempo de espera <strong>{appointment.waitingDays} dias</strong></span><span>Idade <strong>{patient.age} anos</strong></span><span>Bairro <strong>{patient.neighbourhood}</strong></span><span>SMS recebido <strong>{appointment.smsReceived ? 'Sim' : 'Não'}</strong></span><span>Gênero <strong>{patient.gender}</strong></span><span>Comorbidades <strong>{patient.comorbidities.length ? 'Registro fictício' : 'Não informado'}</strong></span></div></section>
    <section><h3>Histórico de contatos e eventos</h3><div className="compact-history">{contacts.length ? contacts.map(c => <article key={c.id}><strong>{formatDateTime(c.createdAt)} · {c.eventType}</strong><span>Canal: {c.channel} · Origem: {c.origin} · Resultado: {c.status}</span><p>{c.message}</p>{c.responsible && <small>Responsável: {c.responsible}</small>}{c.contactedPerson && <small>Pessoa contatada: {c.contactedPerson}{c.relationship ? ` · ${c.relationship}` : ''}</small>}{c.messageLeft && <small>Recado para: {c.messageRecipient || 'não informado'}</small>}{c.note && <small>Observação: {c.note}</small>}</article>) : <p>Nenhum contato registrado.</p>}</div></section>
  </Modal>
}

function Confirmations() {
  const { state, actions } = useApp()
  const priorityOrder: Record<RiskLevel, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }
  const queue = state.appointments.filter(a => a.status === 'AWAITING').sort((a, b) => priorityOrder[a.riskLevel] - priorityOrder[b.riskLevel])
  const rescheduleRequests = state.rescheduleRequests.filter(request => request.status === 'PENDING')
  const channels: Array<[ContactChannel, typeof MessageCircle]> = [['WhatsApp', MessageCircle], ['E-mail', Mail], ['Ligação', Phone]]
  return <><PageHeading eyebrow="Fila de confirmação" title="Prioridade para contato" text="A lista ordena prioridades estimadas. A equipe decide qual ação adotar." /><div className="warning-note"><Info /><span><strong>Estimativas demonstrativas.</strong> A integração com o modelo oficial ocorrerá após a consolidação da etapa de Machine Learning.</span></div>{rescheduleRequests.length > 0 && <><div className="panel-title"><div><p className="eyebrow">Análise da unidade</p><h2>Solicitações de reagendamento</h2></div></div><div className="confirmation-list">{rescheduleRequests.map(request => { const appointment = state.appointments.find(a => a.id === request.appointmentId)!; const patient = state.patients.find(p => p.id === request.patientId)!; return <article key={request.id}><div className="priority-stripe" data-level="MEDIUM" /><div className="confirmation-main"><div><h2>{patient.name}</h2><p>{appointment.specialty} · atual: {formatDate(appointment.date)} às {appointment.time}</p><p>Solicitado: {formatDate(request.requestedDate)} às {request.requestedTime}</p></div><StatusBadge status={appointment.status} /></div><div className="response-actions"><span>Decisão da equipe:</span><button onClick={() => actions.approveReschedule(request.id)}>Aprovar reagendamento</button></div></article> })}</div></>}<div className="panel-title"><div><p className="eyebrow">Apoio à equipe</p><h2>Confirmações pendentes</h2></div></div><div className="confirmation-list">{queue.map(a => { const patient = state.patients.find(p => p.id === a.patientId)!; return <article key={a.id}><div className="priority-stripe" data-level={a.riskLevel} /><div className="confirmation-main"><div><h2>{patient.name}</h2><p>{a.specialty} · {formatDate(a.date)} às {a.time}</p></div><RiskBadge level={a.riskLevel} /><div className="probability"><span>Probabilidade estimada</span><strong>{formatProbability(a.riskProbability)}</strong></div></div><div className="confirmation-actions">{channels.map(([channel, Icon]) => <button key={channel} onClick={() => actions.registerCommunication(patient.id, channel, a.id)}><Icon /> {channel === 'Ligação' ? 'Registrar ligação' : `Simular ${channel}`}</button>)}<button onClick={() => actions.registerCommunication(patient.id, 'Push', a.id)}><Check /> Marcar como contatado</button></div><div className="response-actions"><span>Simular resposta:</span><button onClick={() => actions.confirmAppointment(a.id)}>Confirmar</button><button onClick={() => actions.cancelAppointment(a.id, 'Não poderei comparecer')}>Não comparecerei</button></div></article> })}</div></>
}

function Recoveries() {
  const { state, actions } = useApp()
  const released = state.recoveries.filter(r => r.status !== 'RECOVERED').length
  const sent = state.recoveries.flatMap(r => r.offers).length
  const recovered = state.recoveries.filter(r => r.status === 'RECOVERED').length
  const declined = state.recoveries.flatMap(r => r.offers).filter(o => o.status === 'DECLINED').length
  const open = state.recoveries.filter(r => r.status !== 'RECOVERED').length
  return <><PageHeading eyebrow="Recuperação de vagas" title="Do cancelamento ao novo cuidado" text="Quando uma vaga é liberada, o cuidado pode chegar mais cedo a quem está esperando." /><p className="data-disclaimer">Indicadores demonstrativos do MVP com dados fictícios.</p><div className="compact-metrics">{[['Vagas liberadas', released], ['Ofertas enviadas', sent], ['Vagas recuperadas', recovered], ['Ofertas recusadas', declined], ['Ainda abertas', open]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className="recovery-list">{state.recoveries.map(recovery => { const a = state.appointments.find(item => item.id === recovery.appointmentId)!; const original = state.patients.find(p => p.id === recovery.originalPatientId)!; const current = [...recovery.offers].reverse().find(o => o.status === 'PENDING'); return <article className="recovery-card" key={recovery.id}><header><div><span>{a.time}</span><div><h2>{a.specialty}</h2><p>{formatDate(a.date)} · {a.unit}</p></div></div><span className={`recovery-status ${recovery.status.toLowerCase()}`}>{recovery.status === 'RECOVERED' ? 'Vaga recuperada' : recovery.status === 'NO_ELIGIBLE' ? 'Sem paciente elegível' : 'Recuperação em andamento'}</span></header><div className="recovery-flow"><div className="flow-step"><X /><span><small>Paciente original</small><strong>{original.name}</strong><p>Cancelou em {formatDateTime(recovery.releasedAt)}</p></span></div><ArrowDown />{recovery.offers.map((offer, index) => { const patient = state.patients.find(p => p.id === offer.patientId)!; return <div className="flow-step offer" key={offer.id}><span className="step-number">{index + 1}</span><span><small>Oferta {index + 1} · {offer.channel} simulado</small><strong>{patient.name}</strong><p>{offer.status === 'PENDING' ? 'Aguardando resposta' : offer.status === 'ACCEPTED' ? 'Aceitou · horário ocupado novamente' : offer.status === 'DECLINED' ? 'Recusou a oferta' : 'Oferta expirada'}</p></span>{offer.status === 'ACCEPTED' && <Check className="green-icon" />}</div>})}{recovery.status === 'NO_ELIGIBLE' && <div className="flow-step no-match"><AlertTriangle /><span><strong>Vaga liberada - sem paciente elegível</strong><p>Nenhum paciente fictício atende às regras de compatibilidade.</p></span></div>}</div>{current && <footer><span>Resposta demonstrativa de {state.patients.find(p => p.id === current.patientId)?.name}</span><div><button className="button secondary" onClick={() => actions.declineOffer(recovery.id)}>Recusar</button><button className="button secondary" onClick={() => actions.expireOffer(recovery.id)}>Simular expiração</button><button className="button primary" onClick={() => actions.acceptOffer(recovery.id)}>Aceitar vaga</button></div></footer>}</article> })}{state.recoveries.length === 0 && <EmptyState title="Nenhuma vaga liberada nesta demonstração">Cancele a consulta de Marina no aplicativo do paciente para iniciar o fluxo.</EmptyState>}</div></>
}

function Waitlist() {
  const { state } = useApp()
  const sorted = [...state.waitlist].sort((a, b) => a.queuePriority - b.queuePriority || a.enteredAt.localeCompare(b.enteredAt))
  return <><PageHeading eyebrow="Regras transparentes" title="Fila de espera" text="A seleção considera especialidade, unidade, disponibilidade e posição da fila. Machine Learning não é utilizado nesta decisão." /><div className="rules-row"><span>1. Compatibilidade da especialidade</span><ChevronRight /><span>2. Unidade e período</span><ChevronRight /><span>3. Posição/prioridade da fila</span></div><div className="table-wrap"><table><thead><tr><th>Posição</th><th>Paciente</th><th>Especialidade</th><th>Unidade</th><th>Disponibilidade</th><th>Desde</th><th>Contato</th><th>Status</th></tr></thead><tbody>{sorted.map((entry, index) => { const patient = state.patients.find(p => p.id === entry.patientId)!; return <tr key={entry.id}><td><span className="position">{index + 1}</span></td><td><strong>{patient.name}</strong></td><td>{entry.specialty}</td><td>{entry.unit}</td><td>{entry.availablePeriods.map(period => period === 'morning' ? 'Manhã' : 'Tarde').join(', ')}</td><td>{formatDate(entry.enteredAt)}</td><td>{entry.preferredContact}</td><td><span className={`wait-status ${entry.status.toLowerCase()}`}>{waitlistLabels[entry.status]}</span></td></tr> })}</tbody></table></div></>
}

function Integrations() {
  return <><PageHeading eyebrow="Arquitetura futura" title="Integrações preparadas por adapters" text="Nenhuma integração externa real está ativa neste MVP." /><section className="integration-diagram"><div><Building2 /><strong>Sistema da rede de saúde</strong><small>Fonte futura</small></div><ArrowDown /><div className="adapter-layer"><Link2 /><strong>Camada de integração</strong><small>IntegrationAdapter</small></div><ArrowDown /><div><Activity /><strong>MedPredict</strong><small>Orquestração central</small></div><ArrowDown /><div className="diagram-end"><span><Users /> Paciente</span><span><Building2 /> Unidade</span></div></section><div className="integration-cards"><article><span className="mock-dot" /><h2>Sistema Central da Rede</h2><p>MockHealthSystemAdapter</p><strong>Status: Simulação</strong></article><article><span className="future-dot" /><h2>Sistema Regional A</h2><p>FutureRegionalAdapter</p><strong>Status: Adapter disponível para implementação</strong></article><article><span className="future-dot" /><h2>Sistema Regional B</h2><p>FutureRegionalAdapter</p><strong>Status: Adapter disponível para implementação</strong></article></div><blockquote className="integration-quote">O MedPredict foi concebido para futuramente integrar-se aos sistemas de gestão e agendamento das redes de saúde, oferecendo uma experiência centralizada para paciente e unidade.</blockquote></>
}

function About() {
  const { actions } = useApp()
  const [reset, setReset] = useState(false)
  return <><PageHeading eyebrow="Configurações e sobre" title="MVP acadêmico MedPredict" text="Projeto de TCC do Grupo TRAMA." action={<button className="button danger-ghost" onClick={() => setReset(true)}><RefreshCcw /> Reiniciar demonstração</button>} /><div className="about-grid"><section className="panel"><h2>Princípio do produto</h2><p>O sistema apresenta <strong>risco estimado de No-Show</strong> e <strong>prioridade de confirmação</strong>, nunca uma certeza sobre o comportamento do paciente.</p><p>A decisão final permanece humana.</p></section><section className="panel"><h2>Machine Learning</h2><p>O MVP usa <code>MockRiskService</code>. Nenhum algoritmo final ou threshold foi definido nesta aplicação.</p><div className="warning-note"><Info /><span>Probabilidades simuladas para demonstração do MVP. A integração com o modelo oficial será realizada após consolidação da etapa de Machine Learning.</span></div></section><section className="panel code-panel"><h2>Contrato futuro · POST /predict</h2><pre>{`{
  "age": 32,
  "dias_espera": 18,
  "sms_received": 1,
  "neighbourhood": "..."
}

{
  "probability": 0.68,
  "priority": "high"
}`}</pre></section><section className="panel"><h2>Serviços simulados</h2><p><code>MockCommunicationService</code>: WhatsApp, e-mail, ligação e push.</p><p><code>MockHealthSystemAdapter</code>: troca de dados com agenda.</p><p><code>WaitlistService</code>: regras locais e transparentes para a fila.</p><p>Nenhuma credencial, dado real ou serviço pago é utilizado.</p></section></div>{reset && <Modal title="Restaurar cenários iniciais?" onClose={() => setReset(false)}><p>Consultas, ofertas, comunicações e preferências locais serão restauradas.</p><div className="button-row"><button className="button danger" onClick={() => { actions.resetDemo(); setReset(false) }}>Restaurar dados fictícios</button><button className="button secondary" onClick={() => setReset(false)}>Cancelar</button></div></Modal>}</>
}

export function AdminApp() { return <AdminShell /> }

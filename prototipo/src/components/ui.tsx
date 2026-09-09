import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Clock3 } from 'lucide-react'
import type { AppointmentStatus, RiskLevel } from '../types'
import { riskLabels, statusLabels } from '../utils/format'

export function RiskBadge({ level }: { level: RiskLevel }) {
  const Icon = level === 'HIGH' ? AlertCircle : level === 'MEDIUM' ? Clock3 : CheckCircle2
  return <span className={`badge risk-${level.toLowerCase()}`}><Icon size={14} aria-hidden="true" /> Prioridade {riskLabels[level].toLowerCase()}</span>
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <span className={`badge status-${status.toLowerCase()}`}>{statusLabels[status]}</span>
}

export function DemoBanner() {
  return <div className="demo-banner" role="note">Ambiente demonstrativo - dados fictícios utilizados para fins acadêmicos.</div>
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="empty-state"><CheckCircle2 size={32} aria-hidden="true" /><strong>{title}</strong>{children && <p>{children}</p>}</div>
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose(): void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-heading"><h2 id="modal-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="Fechar janela">×</button></div>
      {children}
    </section>
  </div>
}

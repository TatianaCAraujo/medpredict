import { Activity, ArrowRight, Building2, HeartPulse, Smartphone } from 'lucide-react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { DemoBanner } from './components/ui'
import { AdminApp } from './pages/admin/AdminApp'
import { PatientApp } from './pages/paciente/PatientApp'

function Landing() {
  return <main className="landing">
    <DemoBanner />
    <section className="landing-hero">
      <div className="brand-mark"><Activity aria-hidden="true" /><span>MedPredict</span></div>
      <p className="eyebrow">Grupo TRAMA apresenta</p>
      <h1>Presença que se transforma em <em>cuidado.</em></h1>
      <p className="lead">O MedPredict conecta paciente, agenda e inteligência para transformar risco de ausência em oportunidade de ação.</p>
      <div className="entry-grid">
        <Link className="entry-card patient-entry" to="/paciente"><Smartphone aria-hidden="true" /><span><strong>Entrar como paciente</strong><small>Consulte, confirme ou reagende</small></span><ArrowRight aria-hidden="true" /></Link>
        <Link className="entry-card admin-entry" to="/admin"><Building2 aria-hidden="true" /><span><strong>Entrar como equipe da unidade</strong><small>Acompanhe agenda e prioridades</small></span><ArrowRight aria-hidden="true" /></Link>
      </div>
      <blockquote><HeartPulse aria-hidden="true" /> “Uma falta prevista e evitada é uma vaga que pode atender alguém.”</blockquote>
    </section>
    <footer>MedPredict · Projeto acadêmico do Grupo TRAMA · MVP demonstrativo</footer>
  </main>
}

export default function App() {
  return <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/paciente/*" element={<PatientApp />} />
    <Route path="/admin/*" element={<AdminApp />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}

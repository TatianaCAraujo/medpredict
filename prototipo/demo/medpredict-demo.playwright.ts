import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import {
  demoStep,
  hideDemoPanel,
  highlightDemoTargets,
  installDemoControls,
  setDemoContext,
  setDemoPanel,
  showDemoModule,
  showDemoOverlay,
  waitForDemoDuration,
} from './demo-utils'

const baseURL = 'http://127.0.0.1:5173'
const outputDirectory = fileURLToPath(new URL('./output', import.meta.url))
const outputPath = path.join(outputDirectory, 'medpredict-demo-final-v3.webm')

const compactMetric = (page: Page, label: string) => page.locator('.compact-metrics > div').filter({ hasText: label })
const dashboardMetric = (page: Page, label: string) => page.locator('.metric-card').filter({ hasText: label })
const offerFor = (page: Page, patient: string) => page.locator('.recovery-card .flow-step.offer').filter({ hasText: patient })

async function resetDemo(page: Page) {
  await page.goto(`${baseURL}/admin`, { waitUntil: 'domcontentloaded', timeout: 10_000 })
  await expect(page.getByRole('heading', { name: 'A agenda em um só olhar' })).toBeVisible({ timeout: 7_000 })
  await page.getByRole('button', { name: 'Reiniciar demonstração' }).click({ timeout: 5_000 })
  await expect(page.getByRole('dialog', { name: 'Reiniciar demonstração?' })).toBeVisible({ timeout: 5_000 })
  await page.getByRole('button', { name: 'Reiniciar agora' }).click({ timeout: 5_000 })
  await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 5_000 })
  await expect(dashboardMetric(page, 'Vagas liberadas').locator('strong')).toHaveText('0', { timeout: 7_000 })
  await page.waitForTimeout(1_000)
}

async function runDemo(page: Page) {
  await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 10_000 })
  await setDemoContext(page, 'AMBIENTE MVP')
  const patientEntry = page.getByRole('link', { name: /^Entrar como paciente\b/ })
  const adminEntry = page.getByRole('link', { name: /^Entrar como equipe da unidade\b/ })
  await expect(patientEntry).toBeVisible({ timeout: 7_000 })
  await expect(adminEntry).toBeVisible({ timeout: 7_000 })
  await setDemoPanel(
    page,
    'Ambiente demonstrativo do MVP',
    'Paciente e equipe administrativa compartilham este ambiente apenas para testes e demonstração.',
    'ABERTURA',
    [patientEntry, adminEntry],
  )
  await highlightDemoTargets(page, [patientEntry, adminEntry], 'PACIENTE · ADMINISTRATIVO', 4_000)
  await hideDemoPanel(page)
  await patientEntry.click({ timeout: 5_000 })

  await showDemoModule(page, 'ACESSO PACIENTE', 900)
  await demoStep(page, 'abertura do perfil de Marina', async () => {
    const profiles = page.getByLabel('Perfil demonstrativo')
    await profiles.selectOption({ label: 'Marina Alves' })
    await expect(profiles).toHaveValue('p2', { timeout: 7_000 })
    await expect(page.getByRole('heading', { name: 'Marina!' })).toBeVisible({ timeout: 7_000 })
    await expect(page.getByRole('heading', { name: 'Clínica Geral' })).toBeVisible({ timeout: 7_000 })
  })

  const patientNav = page.getByRole('navigation', { name: 'Navegação do paciente' })
  const patientLinks = [
    ['Início', patientNav.getByRole('link', { name: 'Início', exact: true }), 'Marina!'],
    ['Consultas', patientNav.getByRole('link', { name: 'Consultas', exact: true }), 'Minhas consultas'],
    ['Avisos', patientNav.getByRole('link', { name: 'Avisos', exact: true }), 'Notificações'],
    ['Preferências', patientNav.getByRole('link', { name: 'Preferências', exact: true }), 'Preferências de contato'],
  ] as const
  await setDemoPanel(page, 'Acesso do paciente', 'Marina acompanha sua consulta e pode confirmar, reagendar ou cancelar.', '1/16', patientLinks.map(([, link]) => link))
  for (const [label, link, heading] of patientLinks) {
    await link.click({ timeout: 5_000 })
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible({ timeout: 7_000 })
    if (label === 'Preferências') {
      await expect(page.getByRole('button', { name: 'Salvar preferências', exact: true })).toBeVisible({ timeout: 7_000 })
      await expect(page.getByLabel('Telefone demonstrativo')).toHaveValue('(11) 90000-1001', { timeout: 7_000 })
    }
    await highlightDemoTargets(page, [link, page.getByRole('heading', { name: heading, exact: true })], label, 750)
  }
  await patientLinks[0][1].click({ timeout: 5_000 })
  await expect(page.getByRole('heading', { name: 'Marina!' })).toBeVisible({ timeout: 7_000 })
  await hideDemoPanel(page)

  await patientLinks[1][1].click({ timeout: 5_000 })
  await expect(page.getByRole('heading', { name: 'Minhas consultas' })).toBeVisible({ timeout: 7_000 })
  const consultationTabs = ['Próximas', 'Confirmadas', 'Canceladas', 'Histórico'] as const
  await setDemoPanel(page, 'Jornada organizada', 'As consultas são organizadas por status e todo o histórico permanece disponível.', '2/16', consultationTabs.map(name => page.getByRole('tab', { name, exact: true })))
  for (const tabName of consultationTabs) {
    const tab = page.getByRole('tab', { name: tabName, exact: true })
    await tab.click({ timeout: 5_000 })
    await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 5_000 })
    if (tabName === 'Próximas') await expect(page.locator('.mini-appointment').filter({ hasText: 'UBS Central · 09:00' })).toBeVisible({ timeout: 7_000 })
    if (tabName === 'Confirmadas' || tabName === 'Canceladas') await expect(page.getByText('Nenhuma consulta nesta categoria')).toBeVisible({ timeout: 7_000 })
    if (tabName === 'Histórico') await expect(page.locator('.history-timeline article').first()).toBeVisible({ timeout: 7_000 })
    await highlightDemoTargets(page, [tab], tabName.toUpperCase(), 750)
  }
  await hideDemoPanel(page)
  await patientLinks[0][1].click({ timeout: 5_000 })
  await expect(page.getByRole('heading', { name: 'Marina!' })).toBeVisible({ timeout: 7_000 })

  const appointment = page.locator('.next-appointment')
  const cancelButton = page.getByRole('button', { name: 'Cancelar consulta' })
  await setDemoPanel(page, 'Cancelar consulta', 'Marina informa que não poderá comparecer.', '3/16', [appointment, cancelButton])
  await highlightDemoTargets(page, [cancelButton], 'CANCELAR CONSULTA', 800)
  await cancelButton.click({ timeout: 5_000 })

  await demoStep(page, 'cancelamento da consulta de Marina', async () => {
    const dialog = page.getByRole('dialog', { name: 'Cancelar consulta' })
    await expect(dialog).toBeVisible({ timeout: 5_000 })
    const reason = dialog.getByLabel('Motivo (opcional)')
    await reason.evaluate((element: HTMLSelectElement) => { element.size = element.options.length })
    await setDemoPanel(page, 'Motivo do cancelamento', 'O paciente também informa o motivo do cancelamento.', '4/16', [dialog, reason])
    await highlightDemoTargets(page, [reason], 'MOTIVOS DISPONÍVEIS', 2_000)
    await reason.evaluate((element: HTMLSelectElement) => { element.size = 1 })
    await reason.selectOption({ label: 'Problema de horário' })
    const confirm = dialog.getByRole('button', { name: 'Confirmar cancelamento' })
    await highlightDemoTargets(page, [confirm], 'CONFIRMAR CANCELAMENTO', 700)
    await confirm.click({ timeout: 5_000 })
    await expect(page.getByText('Consulta cancelada com sucesso.')).toBeVisible({ timeout: 7_000 })
    await expect(page.getByText(/MP-\d{4}-A2/)).toBeVisible({ timeout: 7_000 })
  })
  const cancellationResult = page.locator('.success-panel')
  await setDemoPanel(page, 'Resultado no paciente', 'Consulta cancelada com sucesso.', '5/16', [cancellationResult])
  await highlightDemoTargets(page, [cancellationResult], 'CONSULTA CANCELADA', 1_500)
  await hideDemoPanel(page)

  await patientLinks[1][1].click({ timeout: 5_000 })
  const marinaCancelledTab = page.getByRole('tab', { name: 'Canceladas' })
  await marinaCancelledTab.click({ timeout: 5_000 })
  const marinaCancelled = page.locator('.mini-appointment').filter({ hasText: 'UBS Central · 09:00' }).filter({ hasText: 'Cancelada' })
  await expect(marinaCancelled).toContainText('Motivo: Problema de horário', { timeout: 7_000 })
  await setDemoPanel(page, 'Consultas canceladas', 'A consulta passa para Canceladas no acesso da Marina.', '5/16', [marinaCancelledTab, marinaCancelled])
  await highlightDemoTargets(page, [marinaCancelledTab, marinaCancelled], 'CANCELADAS · MARINA', 2_200)

  const marinaHistoryTab = page.getByRole('tab', { name: 'Histórico' })
  await marinaHistoryTab.click({ timeout: 5_000 })
  const marinaCancellation = page.locator('.history-timeline article').filter({ hasText: 'Cancelamento de consulta' })
  await expect(marinaCancellation).toContainText('Canal: Aplicativo MedPredict', { timeout: 7_000 })
  await expect(marinaCancellation).toContainText('Resultado: Cancelada', { timeout: 7_000 })
  await setDemoPanel(page, 'Histórico da Marina', 'A alteração também fica registrada no histórico do paciente.', '5/16', [marinaHistoryTab, marinaCancellation])
  await highlightDemoTargets(page, [marinaHistoryTab, marinaCancellation], 'EVENTO · DATA/HORA · CANAL · RESULTADO', 2_800)
  await hideDemoPanel(page)

  await page.goto(`${baseURL}/admin/agenda`, { waitUntil: 'domcontentloaded', timeout: 10_000 })
  await showDemoModule(page, 'ACESSO ADM', 900)
  const agendaTable = page.getByRole('table')
  await expect(page.getByRole('heading', { name: 'Consultas e prioridades' })).toBeVisible({ timeout: 7_000 })
  const priorityHeader = agendaTable.getByRole('columnheader', { name: 'Prioridade', exact: true })
  const lowPriority = agendaTable.getByText('Prioridade baixa', { exact: true }).first()
  const mediumPriority = agendaTable.getByText('Prioridade intermediária', { exact: true }).first()
  const highPriority = agendaTable.getByText('Prioridade alta', { exact: true }).first()
  await setDemoPanel(page, 'Predição aplicada à agenda', 'O modelo estima o risco de No-Show e apoia a priorização dos contatos. A decisão permanece com a equipe.', 'MODELO', [priorityHeader, highPriority])
  await highlightDemoTargets(page, [priorityHeader, lowPriority, mediumPriority, highPriority], 'PRIORIDADE · BAIXA · INTERMEDIÁRIA · ALTA', 5_000)
  await hideDemoPanel(page)

  const highPriorityRow = agendaTable.getByRole('row').filter({ has: page.getByText('Lívia Rocha', { exact: true }) }).filter({ has: page.getByText('Prioridade alta', { exact: true }) })
  await highPriorityRow.click({ timeout: 5_000 })
  const patientDetail = page.getByRole('dialog', { name: 'Detalhe do paciente' })
  await expect(patientDetail).toBeVisible({ timeout: 7_000 })
  const estimatedProbability = patientDetail.getByText('Probabilidade estimada', { exact: true }).locator('..')
  const associatedFactors = patientDetail.locator('.factors')
  await expect(patientDetail.getByText('Prioridade alta', { exact: true })).toBeVisible({ timeout: 7_000 })
  await setDemoPanel(page, 'Risco estimado', 'O risco estimado considera os fatores disponíveis no histórico do paciente. Esses fatores apoiam a estimativa e não representam causas individuais.', 'MODELO', [estimatedProbability, associatedFactors])
  await highlightDemoTargets(page, [estimatedProbability, associatedFactors], 'PROBABILIDADE ESTIMADA · FATORES ASSOCIADOS', 4_000)
  await hideDemoPanel(page)
  await patientDetail.getByRole('button', { name: 'Fechar janela' }).click({ timeout: 5_000 })
  await expect(patientDetail).toHaveCount(0, { timeout: 5_000 })

  const marinaAgendaRow = agendaTable.getByRole('row').filter({ has: page.getByText('Marina Alves', { exact: true }) }).filter({ hasText: '09:00' })
  await expect(marinaAgendaRow.getByText('Cancelada', { exact: true })).toBeVisible({ timeout: 7_000 })
  await setDemoPanel(page, 'Agenda atualizada', 'A equipe acompanha as alterações da agenda pelo painel administrativo.', '6/16', [marinaAgendaRow])
  await highlightDemoTargets(page, [marinaAgendaRow], 'MARINA · CANCELADA · 05 SET · 09:00', 2_400)
  await hideDemoPanel(page)

  await page.getByRole('link', { name: 'Recuperação de vagas', exact: true }).click({ timeout: 5_000 })
  await demoStep(page, 'vaga liberada na recuperação', async () => {
    await expect(page.getByRole('heading', { name: 'Do cancelamento ao novo cuidado' })).toBeVisible({ timeout: 7_000 })
    await expect(compactMetric(page, 'Vagas liberadas').locator('strong')).toHaveText('1', { timeout: 7_000 })
    await expect(page.locator('.recovery-card')).toContainText('Marina Alves', { timeout: 7_000 })
  })
  const releasedMetric = compactMetric(page, 'Vagas liberadas')
  const recoveryCard = page.locator('.recovery-card')
  const marinaReleased = recoveryCard.getByText('Marina Alves', { exact: true })
  const anaOffer = offerFor(page, 'Ana Lima')
  await setDemoPanel(page, 'Vaga liberada', 'O cancelamento libera o horário e inicia a recuperação da vaga.', '7/16', [releasedMetric, marinaReleased, anaOffer])
  await highlightDemoTargets(page, [releasedMetric, marinaReleased, recoveryCard.getByText('05 de set. de 2026 · UBS Central'), anaOffer], 'LIBERADAS 1 · MARINA · CLÍNICA GERAL · 09:00', 3_000)
  await hideDemoPanel(page)

  const anaName = anaOffer.getByText('Ana Lima', { exact: true })
  const anaChannel = anaOffer.getByText(/Oferta 1 · WhatsApp simulado/)
  const anaPending = anaOffer.getByText('Aguardando resposta', { exact: true })
  await setDemoPanel(page, 'Primeira oferta', 'Ana é a primeira paciente elegível e recebe a oportunidade.', '8/16', [anaOffer])
  await highlightDemoTargets(page, [anaName, anaChannel, anaPending], 'ANA LIMA · CANAL · AGUARDANDO', 2_000)
  await hideDemoPanel(page)

  await page.goto(`${baseURL}/paciente`, { waitUntil: 'domcontentloaded', timeout: 10_000 })
  await showDemoModule(page, 'ACESSO PACIENTE', 900)
  const anaProfiles = page.getByLabel('Perfil demonstrativo')
  await anaProfiles.selectOption({ label: 'Ana Lima' })
  await expect(anaProfiles).toHaveValue('w1', { timeout: 7_000 })
  await expect(page.getByRole('heading', { name: 'Ana!' })).toBeVisible({ timeout: 7_000 })
  const anaPatientOffer = page.locator('.offer-card')
  const declineButton = anaPatientOffer.getByRole('button', { name: 'Não tenho interesse', exact: true })
  await expect(anaPatientOffer.getByRole('heading', { name: 'Vaga antecipada disponível' })).toBeVisible({ timeout: 7_000 })
  await setDemoPanel(page, 'Oferta para Ana', 'Ana recebe a oferta e decide não aceitar o novo horário.', '8/16', [anaPatientOffer])
  await highlightDemoTargets(page, [anaPatientOffer, declineButton], 'RECUSAR', 1_200)
  await declineButton.click({ timeout: 5_000 })

  await demoStep(page, 'recusa visível da Ana', async () => {
    await expect(page.getByText('Oferta recusada. Sua posição geral foi preservada.')).toBeVisible({ timeout: 7_000 })
    await expect(anaPatientOffer).toHaveCount(0, { timeout: 7_000 })
  })
  const anaPatientResult = page.locator('.success-panel').filter({ hasText: 'Oferta recusada' })
  await setDemoPanel(page, 'Resposta da Ana', 'A recusa fica registrada no próprio acesso da paciente.', '9/16', [anaPatientResult])
  await highlightDemoTargets(page, [anaPatientResult], 'OFERTA RECUSADA', 2_000)
  await hideDemoPanel(page)

  await page.goto(`${baseURL}/admin/recuperacao`, { waitUntil: 'domcontentloaded', timeout: 10_000 })
  await showDemoModule(page, 'ACESSO ADM', 900)
  await expect(anaOffer).toContainText('Ana Lima', { timeout: 7_000 })
  await expect(anaOffer).toContainText('Recusou a oferta', { timeout: 7_000 })
  await expect(compactMetric(page, 'Ofertas recusadas').locator('strong')).toHaveText('1', { timeout: 7_000 })
  const anaDeclined = anaOffer.getByText('Recusou a oferta', { exact: true })
  await setDemoPanel(page, 'Ana recusou', 'A resposta é registrada automaticamente no painel administrativo.', '9/16', [anaOffer, anaDeclined])
  await highlightDemoTargets(page, [anaName, anaDeclined], 'ANA LIMA · RECUSOU', 2_300)
  await hideDemoPanel(page)

  const carlaOffer = offerFor(page, 'Carla Souza')
  const carlaName = carlaOffer.getByText('Carla Souza', { exact: true })
  const carlaChannel = carlaOffer.getByText(/Oferta 2 · Push simulado/)
  const carlaPending = carlaOffer.getByText('Aguardando resposta', { exact: true })
  await setDemoPanel(page, 'Nova oferta', 'Com a recusa da Ana, a oportunidade segue para Carla.', '10/16', [carlaOffer])
  await highlightDemoTargets(page, [carlaName, carlaChannel, carlaPending], 'CARLA SOUZA · NOVA OFERTA · AGUARDANDO', 2_000)
  await hideDemoPanel(page)

  await page.goto(`${baseURL}/paciente`, { waitUntil: 'domcontentloaded', timeout: 10_000 })
  await showDemoModule(page, 'ACESSO PACIENTE', 900)
  const carlaProfiles = page.getByLabel('Perfil demonstrativo')
  await carlaProfiles.selectOption({ label: 'Carla Souza' })
  await expect(carlaProfiles).toHaveValue('w2', { timeout: 7_000 })
  await expect(page.getByRole('heading', { name: 'Carla!' })).toBeVisible({ timeout: 7_000 })
  const carlaPatientOffer = page.locator('.offer-card')
  const acceptButton = carlaPatientOffer.getByRole('button', { name: 'Aceitar vaga', exact: true })
  await expect(carlaPatientOffer.getByRole('heading', { name: 'Vaga antecipada disponível' })).toBeVisible({ timeout: 7_000 })
  await setDemoPanel(page, 'Oferta para Carla', 'Carla recebe a oportunidade e decide aceitar.', '10/16', [carlaPatientOffer])
  await highlightDemoTargets(page, [carlaPatientOffer, acceptButton], 'ACEITAR VAGA', 1_200)
  await acceptButton.click({ timeout: 5_000 })

  await demoStep(page, 'aceite visível da Carla', async () => {
    await expect(page.getByText('Vaga aceita e agendada com sucesso.')).toBeVisible({ timeout: 7_000 })
    await expect(carlaPatientOffer).toHaveCount(0, { timeout: 7_000 })
  })
  const carlaPatientResult = page.locator('.success-panel').filter({ hasText: 'Vaga aceita' })
  await setDemoPanel(page, 'Resposta da Carla', 'O aceite fica registrado no próprio acesso da paciente.', '11/16', [carlaPatientResult])
  await highlightDemoTargets(page, [carlaPatientResult], 'VAGA ACEITA E AGENDADA', 2_000)
  await hideDemoPanel(page)

  await demoStep(page, 'consulta sincronizada no perfil da Carla', async () => {
    await page.getByRole('link', { name: 'Consultas', exact: true }).click({ timeout: 5_000 })
    const confirmedTab = page.getByRole('tab', { name: 'Confirmadas' })
    await highlightDemoTargets(page, [confirmedTab], 'Consultas · Confirmadas', 900)
    await confirmedTab.click({ timeout: 5_000 })
    await expect(page.locator('.mini-appointment').filter({ hasText: 'Clínica Geral' })).toBeVisible({ timeout: 7_000 })
  })
  const confirmedAppointment = page.locator('.mini-appointment').filter({ hasText: 'Clínica Geral' })
  await expect(confirmedAppointment).toContainText('UBS Central · 09:00', { timeout: 7_000 })
  await setDemoPanel(page, 'Confirmadas da Carla', 'A consulta recuperada agora aparece para Carla.', '12/16', [confirmedAppointment])
  await highlightDemoTargets(page, [confirmedAppointment, confirmedAppointment.getByText('Confirmada', { exact: true })], 'CLÍNICA GERAL · 05 SET · 09:00 · CONFIRMADA', 3_000)
  await hideDemoPanel(page)

  const carlaHistoryTab = page.getByRole('tab', { name: 'Histórico' })
  await carlaHistoryTab.click({ timeout: 5_000 })
  const carlaOfferHistory = page.locator('.history-timeline article').filter({ has: page.getByText('Oferta de vaga', { exact: true }) })
  const carlaAcceptanceHistory = page.locator('.history-timeline article').filter({ has: page.getByText('Aceite de oferta', { exact: true }) })
  await expect(carlaOfferHistory).toContainText('Canal: Push', { timeout: 7_000 })
  await expect(carlaOfferHistory).toContainText('Resultado: Aceita (simulação)', { timeout: 7_000 })
  await expect(carlaAcceptanceHistory).toContainText('Resultado: Aceita', { timeout: 7_000 })
  await setDemoPanel(page, 'Histórico da Carla', 'Oferta e aceite permanecem registrados no histórico.', '13/16', [carlaHistoryTab, carlaOfferHistory, carlaAcceptanceHistory])
  await highlightDemoTargets(page, [carlaOfferHistory, carlaAcceptanceHistory], 'OFERTA RECEBIDA · ACEITE · CANAL · RESULTADO', 3_000)
  await hideDemoPanel(page)

  await page.goto(`${baseURL}/admin/agenda`, { waitUntil: 'domcontentloaded', timeout: 10_000 })
  await showDemoModule(page, 'ACESSO ADM', 900)
  const finalAgendaTable = page.getByRole('table')
  const carlaAgendaRow = finalAgendaTable.getByRole('row').filter({ has: page.getByText('Carla Souza', { exact: true }) }).filter({ hasText: '09:00' })
  await expect(carlaAgendaRow.getByText('Confirmada', { exact: true })).toBeVisible({ timeout: 7_000 })
  await setDemoPanel(page, 'Novo estado na agenda', 'O painel administrativo também recebe o novo estado da consulta.', '14/16', [carlaAgendaRow])
  await highlightDemoTargets(page, [carlaAgendaRow], 'CARLA SOUZA · CLÍNICA GERAL · 09:00 · CONFIRMADA', 3_000)
  await hideDemoPanel(page)

  await page.getByRole('link', { name: 'Recuperação de vagas', exact: true }).click({ timeout: 5_000 })
  await expect(page.getByRole('heading', { name: 'Do cancelamento ao novo cuidado' })).toBeVisible({ timeout: 7_000 })
  const finalRecoveryCard = page.locator('.recovery-card')
  const finalAna = offerFor(page, 'Ana Lima')
  const finalCarla = offerFor(page, 'Carla Souza')
  const recoveredStatus = finalRecoveryCard.getByText('Vaga recuperada', { exact: true })
  const recoveredMetric = compactMetric(page, 'Vagas recuperadas')
  const openMetric = compactMetric(page, 'Ainda abertas')
  await expect(finalAna).toContainText('Recusou a oferta', { timeout: 7_000 })
  await expect(finalCarla).toContainText('Aceitou · horário ocupado novamente', { timeout: 7_000 })
  await expect(recoveredMetric.locator('strong')).toHaveText('1', { timeout: 7_000 })
  await expect(openMetric.locator('strong')).toHaveText('0', { timeout: 7_000 })
  await setDemoPanel(page, 'Vaga recuperada', 'O painel administrativo recebe as respostas e registra a recuperação da vaga.', '15/16', [finalAna, finalCarla, recoveredMetric, openMetric])
  await highlightDemoTargets(page, [finalAna, finalCarla, recoveredMetric, openMetric], 'ANA RECUSOU · CARLA ACEITOU · RECUPERADAS 1 · ABERTAS 0', 3_200)
  await hideDemoPanel(page)

  await page.getByRole('link', { name: 'Visão geral', exact: true }).click({ timeout: 5_000 })
  await demoStep(page, 'dashboard atualizado', async () => {
    await expect(page.getByRole('heading', { name: 'A agenda em um só olhar' })).toBeVisible({ timeout: 7_000 })
    await expect(dashboardMetric(page, 'Vagas recuperadas').locator('strong')).toHaveText('1', { timeout: 7_000 })
    await expect(page.locator('.activity-list')).toContainText('Carla Souza', { timeout: 7_000 })
  })
  const recentCarla = page.locator('.activity-list > div').filter({ hasText: 'Carla Souza' })
  const dashboardRecovered = dashboardMetric(page, 'Vagas recuperadas')
  const dashboardReleased = dashboardMetric(page, 'Vagas liberadas')
  await setDemoPanel(page, 'Resultado mensurável', 'O resultado permanece registrado e mensurável no painel administrativo.', '16/16', [dashboardRecovered, dashboardReleased, recentCarla])
  await highlightDemoTargets(page, [dashboardRecovered, dashboardReleased, recentCarla], 'VAGAS RECUPERADAS = 1 · INDICADORES · ATIVIDADE RECENTE', 3_500)
  await hideDemoPanel(page)

  await showDemoOverlay(
    page,
    'MEDPREDICT',
    'Duas experiências. Uma jornada integrada.',
    5_000,
    'Modelo prioriza · Equipe decide · Paciente no centro\nGrupo TRAMA',
    'No MVP, Paciente e ADM compartilham o mesmo ambiente para facilitar testes e demonstração.\n\nNa evolução do produto:\nPaciente → acesso exclusivo ao aplicativo do paciente\nClínica/equipe → acesso exclusivo ao painel administrativo',
  )
}

test('demonstração gravada do cenário de recuperação', async ({ browser }) => {
  test.setTimeout(150_000)
  await mkdir(outputDirectory, { recursive: true })
  await rm(outputPath, { force: true })

  const preparationContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const preparationPage = await preparationContext.newPage()
  await resetDemo(preparationPage)
  await preparationContext.close()

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: outputDirectory, size: { width: 1440, height: 900 } },
  })
  const page = await context.newPage()
  await installDemoControls(page)
  const pageErrors: string[] = []
  const consoleErrors: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  const startedAt = Date.now()

  try {
    await runDemo(page)
    expect(pageErrors, `Erros JavaScript encontrados no navegador: ${pageErrors.join(' | ')}`).toEqual([])
    expect(consoleErrors, `Erros de console encontrados no navegador: ${consoleErrors.join(' | ')}`).toEqual([])
    const duration = Math.round((Date.now() - startedAt) / 1000)
    expect(duration, 'A demonstração deve durar pelo menos 75 segundos.').toBeGreaterThanOrEqual(75)
    expect(duration, 'A demonstração deve durar no máximo 95 segundos.').toBeLessThanOrEqual(95)
    const video = page.video()
    if (!video) throw new Error('O Playwright não iniciou a gravação do vídeo.')
    const saveVideo = video.saveAs(outputPath)
    await page.close()
    await saveVideo
    console.log(`[MedPredict Demo] Vídeo concluído em ${duration} segundos: ${outputPath}`)
  } finally {
    await context.close()
  }
})

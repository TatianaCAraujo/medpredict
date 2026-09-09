import { expect, type Locator, type Page } from '@playwright/test'

type DemoControl = 'running' | 'paused' | 'skip' | 'restart' | 'stopped'

export class DemoRestart extends Error {
  constructor() { super('Reinício solicitado pelo apresentador.') }
}

export class DemoStopped extends Error {
  constructor() { super('Demonstração interrompida pelo apresentador.') }
}

export async function installDemoControls(page: Page) {
  await page.addInitScript(() => {
    const demoWindow = window as typeof window & { __medPredictDemoControl?: DemoControl }
    demoWindow.__medPredictDemoControl = 'running'

    window.addEventListener('keydown', event => {
      if (event.code === 'Space') {
        event.preventDefault()
        demoWindow.__medPredictDemoControl = demoWindow.__medPredictDemoControl === 'paused' ? 'running' : 'paused'
      } else if (event.key.toLowerCase() === 'r') {
        demoWindow.__medPredictDemoControl = 'restart'
      } else if (event.key === 'Escape') {
        demoWindow.__medPredictDemoControl = 'stopped'
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        demoWindow.__medPredictDemoControl = 'skip'
      }

      const status = document.querySelector<HTMLElement>('#medpredict-demo-control-status')
      if (status) status.textContent = demoWindow.__medPredictDemoControl === 'paused' ? 'PAUSADA' : 'EM EXECUÇÃO'
    }, true)

  })
}

async function readControl(page: Page): Promise<DemoControl> {
  return page.evaluate(() => (window as typeof window & { __medPredictDemoControl?: DemoControl }).__medPredictDemoControl || 'running')
}

export async function waitForDemoControl(page: Page) {
  for (;;) {
    const control = await readControl(page)
    if (control === 'restart') throw new DemoRestart()
    if (control === 'stopped') throw new DemoStopped()
    if (control !== 'paused') return control
    await page.waitForTimeout(100)
  }
}

export async function waitForDemoDuration(page: Page, duration: number) {
  const control = await page.evaluate(async duration => {
    const demoWindow = window as typeof window & { __medPredictDemoControl?: DemoControl }
    let elapsed = 0
    let lastTick = performance.now()
    return new Promise<DemoControl>(resolve => {
      const tick = () => {
        const now = performance.now()
        const state = demoWindow.__medPredictDemoControl || 'running'
        if (state === 'restart' || state === 'stopped') return resolve(state)
        if (state === 'skip') {
          demoWindow.__medPredictDemoControl = 'running'
          return resolve('skip')
        }
        if (state === 'running') elapsed += now - lastTick
        lastTick = now
        if (elapsed >= duration) return resolve('running')
        window.setTimeout(tick, 50)
      }
      tick()
    })
  }, duration)
  if (control === 'restart') throw new DemoRestart()
  if (control === 'stopped') throw new DemoStopped()
}

async function visibleBoxes(locators: Locator[]) {
  const boxes = await Promise.all(locators.map(async locator => {
    const item = locator.first()
    return await item.isVisible().catch(() => false) ? item.boundingBox() : null
  }))
  return boxes.filter(box => box !== null)
}

export async function setDemoPanel(page: Page, title: string, text: string, step: string, avoid: Locator[] = []) {
  await waitForDemoControl(page)
  const boxes = await visibleBoxes(avoid)
  await page.evaluate(({ title, text, step, protectedBoxes }) => {
    document.querySelector('#medpredict-demo-panel')?.remove()
    const panel = document.createElement('aside')
    panel.id = 'medpredict-demo-panel'
    panel.setAttribute('role', 'status')
    panel.setAttribute('aria-live', 'polite')
    panel.setAttribute('aria-label', `${title}. ${text}`)
    panel.innerHTML = '<div class="demo-step"></div><h2></h2><p></p>'
    panel.querySelector<HTMLElement>('.demo-step')!.textContent = step
    panel.querySelector('h2')!.textContent = title
    panel.querySelector('p')!.textContent = text
    Object.assign(panel.style, {
      position: 'fixed', zIndex: '2147483645', boxSizing: 'border-box', width: 'min(340px, calc(25vw - 18px))',
      maxHeight: '42vh', overflow: 'auto', padding: '18px 20px', border: '1px solid rgba(141, 240, 218, .42)',
      borderRadius: '16px', color: '#f4fffc', background: 'rgba(7, 48, 53, .91)',
      boxShadow: '0 18px 50px rgba(0, 0, 0, .24)', backdropFilter: 'blur(9px)',
      fontFamily: 'system-ui, sans-serif', pointerEvents: 'none', transition: 'opacity .2s ease',
    })
    Object.assign(panel.querySelector<HTMLElement>('.demo-step')!.style, {
      marginBottom: '8px', color: '#8df0da', fontSize: '11px', fontWeight: '800', letterSpacing: '.13em', textTransform: 'uppercase',
    })
    Object.assign(panel.querySelector('h2')!.style, { margin: '0 0 9px', fontSize: '20px', lineHeight: '1.2' })
    Object.assign(panel.querySelector('p')!.style, { margin: '0', color: '#e4f6f2', fontSize: '14px', lineHeight: '1.55' })
    document.body.appendChild(panel)

    const panelRect = panel.getBoundingClientRect()
    const gap = 18
    const bottom = 68
    const candidates = [
      { right: gap, top: gap },
      { right: gap, top: window.innerHeight - bottom - panelRect.height },
      { right: window.innerWidth - gap - panelRect.width, top: gap },
      { right: window.innerWidth - gap - panelRect.width, top: window.innerHeight - bottom - panelRect.height },
    ]
    const overlap = (candidate: { right: number, top: number }) => protectedBoxes.reduce((total, box) => {
      const width = Math.max(0, Math.min(candidate.right + panelRect.width, box.x + box.width) - Math.max(candidate.right, box.x))
      const height = Math.max(0, Math.min(candidate.top + panelRect.height, box.y + box.height) - Math.max(candidate.top, box.y))
      return total + width * height
    }, 0)
    const chosen = candidates.reduce((best, candidate) => overlap(candidate) < overlap(best) ? candidate : best)
    if (overlap(chosen) > 0) throw new Error(`O painel da demo cobriria um elemento protegido em "${title}".`)
    panel.style.left = `${chosen.right}px`
    panel.style.top = `${Math.max(gap, chosen.top)}px`
  }, { title, text, step, protectedBoxes: boxes })
  await expect(page.locator('#medpredict-demo-panel')).toBeVisible()
}

export async function hideDemoPanel(page: Page) {
  await page.evaluate(() => document.querySelector('#medpredict-demo-panel')?.remove())
}

export async function showDemoPanel(page: Page, title: string, text: string, duration: number, step: string, avoid: Locator[] = []) {
  await setDemoPanel(page, title, text, step, avoid)
  await waitForDemoDuration(page, duration)
  await hideDemoPanel(page)
}

export async function setDemoContext(page: Page, label: string) {
  await page.evaluate(label => {
    document.querySelector('#medpredict-demo-context')?.remove()
    const badge = document.createElement('div')
    badge.id = 'medpredict-demo-context'
    badge.textContent = label
    Object.assign(badge.style, {
      position: 'fixed', top: '8px', right: '10px', zIndex: '2147483646',
      padding: '6px 10px', borderRadius: '999px', color: '#eafffa', background: 'rgba(7, 48, 53, .92)',
      border: '1px solid rgba(141, 240, 218, .6)', boxShadow: '0 10px 30px rgba(0,0,0,.2)',
      font: '800 10px/1.2 system-ui, sans-serif', letterSpacing: '.12em', pointerEvents: 'none',
    })
    document.body.appendChild(badge)
  }, label)
  await expect(page.locator('#medpredict-demo-context')).toBeVisible()
}

export async function showDemoModule(page: Page, label: string, duration = 1_000) {
  await setDemoContext(page, label)
  await page.evaluate(label => {
    document.querySelector('#medpredict-demo-module')?.remove()
    const transition = document.createElement('div')
    transition.id = 'medpredict-demo-module'
    transition.textContent = label
    Object.assign(transition.style, {
      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: '2147483647',
      padding: '14px 22px', borderRadius: '999px', color: '#eafffa', background: 'rgba(7, 48, 53, .95)',
      border: '1px solid rgba(141, 240, 218, .65)', boxShadow: '0 18px 50px rgba(0,0,0,.3)',
      font: '800 14px/1.2 system-ui, sans-serif', letterSpacing: '.14em', pointerEvents: 'none',
    })
    document.body.appendChild(transition)
  }, label)
  await expect(page.locator('#medpredict-demo-module')).toBeVisible()
  await waitForDemoDuration(page, duration)
  await page.locator('#medpredict-demo-module').evaluate(element => element.remove())
}

export async function highlightDemoTargets(page: Page, targets: Locator[], label: string, duration = 2_000) {
  await waitForDemoControl(page)
  const visibleTargets: Locator[] = []
  for (const target of targets) {
    const item = target.first()
    await item.scrollIntoViewIfNeeded()
    await expect(item).toBeVisible()
    visibleTargets.push(item)
  }
  const handles = await Promise.all(visibleTargets.map(target => target.elementHandle()))
  await page.evaluate(({ elements, label }) => {
    document.querySelector('#medpredict-demo-highlight-style')?.remove()
    document.querySelector('#medpredict-demo-callout')?.remove()
    const style = document.createElement('style')
    style.id = 'medpredict-demo-highlight-style'
    style.textContent = `
      @keyframes medpredict-demo-pulse { 0%, 100% { box-shadow: 0 0 0 4px rgba(17, 180, 154, .32), 0 0 20px rgba(17, 180, 154, .55); } 50% { box-shadow: 0 0 0 9px rgba(17, 180, 154, .14), 0 0 34px rgba(17, 180, 154, .9); } }
      .medpredict-demo-highlight { position: relative !important; z-index: 2147483643 !important; outline: 3px solid #18d5b4 !important; outline-offset: 4px !important; border-radius: 8px !important; animation: medpredict-demo-pulse .9s ease-in-out infinite !important; }
    `
    document.head.appendChild(style)
    elements.forEach(element => element?.classList.add('medpredict-demo-highlight'))
    const first = elements[0]
    if (!first) return
    const rect = first.getBoundingClientRect()
    const callout = document.createElement('div')
    callout.id = 'medpredict-demo-callout'
    callout.textContent = label
    Object.assign(callout.style, {
      position: 'fixed', zIndex: '2147483647', maxWidth: '250px', padding: '8px 11px', borderRadius: '8px',
      color: '#062d30', background: '#8df0da', boxShadow: '0 8px 24px rgba(0,0,0,.2)',
      font: '800 12px/1.3 system-ui, sans-serif', pointerEvents: 'none',
    })
    document.body.appendChild(callout)
    const calloutRect = callout.getBoundingClientRect()
    const gap = 10
    const clamp = (value: number, max: number) => Math.max(8, Math.min(value, max - 8))
    const candidates = [
      { left: rect.left, top: rect.top - calloutRect.height - gap },
      { left: rect.left, top: rect.bottom + gap },
      { left: rect.right + gap, top: rect.top },
      { left: rect.left - calloutRect.width - gap, top: rect.top },
      { left: 8, top: 8 },
      { left: window.innerWidth - calloutRect.width - 8, top: 8 },
      { left: 8, top: window.innerHeight - calloutRect.height - 8 },
      { left: window.innerWidth - calloutRect.width - 8, top: window.innerHeight - calloutRect.height - 8 },
    ].map(candidate => ({
      left: clamp(candidate.left, window.innerWidth - calloutRect.width),
      top: clamp(candidate.top, window.innerHeight - calloutRect.height),
    }))
    const protectedRects = [
      ...elements.filter(Boolean).map(element => element!.getBoundingClientRect()),
      ...Array.from(document.querySelectorAll<HTMLElement>('#medpredict-demo-panel')).map(element => element.getBoundingClientRect()),
    ]
    const overlap = (candidate: { left: number, top: number }) => protectedRects.reduce((total, protectedRect) => {
      const width = Math.max(0, Math.min(candidate.left + calloutRect.width, protectedRect.right) - Math.max(candidate.left, protectedRect.left))
      const height = Math.max(0, Math.min(candidate.top + calloutRect.height, protectedRect.bottom) - Math.max(candidate.top, protectedRect.top))
      return total + width * height
    }, 0)
    const chosen = candidates.reduce((best, candidate) => overlap(candidate) < overlap(best) ? candidate : best)
    if (overlap(chosen) > 0) throw new Error(`O destaque "${label}" cobriria um elemento importante.`)
    callout.style.top = `${chosen.top}px`
    callout.style.left = `${chosen.left}px`
  }, { elements: handles, label })
  await expect(page.locator('.medpredict-demo-highlight')).toHaveCount(handles.length)
  await waitForDemoDuration(page, duration)
  await page.evaluate(() => {
    document.querySelectorAll('.medpredict-demo-highlight').forEach(element => element.classList.remove('medpredict-demo-highlight'))
    document.querySelector('#medpredict-demo-highlight-style')?.remove()
    document.querySelector('#medpredict-demo-callout')?.remove()
  })
}

export async function showDemoOverlay(page: Page, title: string, text: string, duration: number, footer?: string, subtext?: string) {
  await hideDemoPanel(page)
  await page.evaluate(({ title, text, footer, subtext }) => {
    document.querySelector('#medpredict-demo-overlay')?.remove()
    const overlay = document.createElement('section')
    overlay.id = 'medpredict-demo-overlay'
    overlay.setAttribute('role', 'status')
    overlay.setAttribute('aria-live', 'polite')
    overlay.setAttribute('aria-label', `${title}. ${text}`)
    overlay.innerHTML = `<div><h1></h1><p></p>${subtext ? '<span></span>' : ''}${footer ? '<footer></footer>' : ''}</div>`
    overlay.querySelector('h1')!.textContent = title
    overlay.querySelector('p')!.textContent = text
    if (subtext) overlay.querySelector('span')!.textContent = subtext
    if (footer) overlay.querySelector('footer')!.textContent = footer
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', zIndex: '2147483647', display: 'grid', placeItems: 'center',
      padding: 'clamp(24px, 6vw, 80px)', color: '#fff', background: 'rgba(3, 25, 31, .78)',
      backdropFilter: 'blur(5px)', textAlign: 'center', fontFamily: 'system-ui, sans-serif',
    })
    const card = overlay.firstElementChild as HTMLElement
    Object.assign(card.style, {
      width: 'min(860px, 100%)', padding: 'clamp(28px, 6vw, 64px)', border: '1px solid rgba(255,255,255,.24)',
      borderRadius: '28px', background: 'linear-gradient(145deg, rgba(9,65,72,.95), rgba(10,91,83,.92))',
      boxShadow: '0 28px 90px rgba(0,0,0,.35)',
    })
    Object.assign(card.querySelector('h1')!.style, { margin: '0', fontSize: 'clamp(36px, 6vw, 68px)', lineHeight: '1.05', letterSpacing: '-.035em' })
    Object.assign(card.querySelector('p')!.style, { whiteSpace: 'pre-line', margin: '22px auto 0', maxWidth: '700px', fontSize: 'clamp(18px, 2.5vw, 27px)', lineHeight: '1.45', color: '#eafffa' })
    const sub = card.querySelector('span') as HTMLElement | null
    if (sub) Object.assign(sub.style, { display: 'block', whiteSpace: 'pre-line', marginTop: '24px', color: '#bce9df', fontSize: '18px', lineHeight: '1.6' })
    const foot = card.querySelector('footer') as HTMLElement | null
    if (foot) Object.assign(foot.style, { marginTop: '32px', color: '#8df0da', fontSize: '16px', fontWeight: '800', letterSpacing: '.12em' })
    document.body.appendChild(overlay)
  }, { title, text, footer, subtext })
  await expect(page.locator('#medpredict-demo-overlay')).toBeVisible()
  await waitForDemoDuration(page, duration)
  await page.locator('#medpredict-demo-overlay').evaluate(element => element.remove())
}

export async function demoStep(page: Page, name: string, action: () => Promise<void>) {
  await waitForDemoControl(page)
  try {
    await action()
  } catch (error) {
    if (error instanceof DemoRestart || error instanceof DemoStopped) throw error
    throw new Error(`Etapa "${name}" falhou: ${error instanceof Error ? error.message : String(error)}`)
  }
}

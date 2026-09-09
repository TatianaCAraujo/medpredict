import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

interface StateEnvelope {
  revision: number
  state: DemoState | null
}

type DemoState = Record<string, unknown> & { demoPatientId: string }

const stateFile = resolve(process.cwd(), '.medpredict-demo-state.json')

function validState(value: unknown): value is DemoState {
  if (!value || typeof value !== 'object') return false
  const state = value as Record<string, unknown>
  return ['patients', 'appointments', 'waitlist', 'communications', 'notifications', 'recoveries', 'rescheduleRequests']
    .every(key => Array.isArray(state[key])) && typeof state.demoPatientId === 'string'
}

function load(): StateEnvelope {
  if (existsSync(stateFile)) {
    try {
      const saved = JSON.parse(readFileSync(stateFile, 'utf8')) as StateEnvelope
      if (Number.isInteger(saved.revision) && validState(saved.state)) return saved
    } catch { /* Um arquivo incompleto é substituído pela massa inicial. */ }
  }
  return { revision: 0, state: null }
}

let current = load()

function persist(envelope: StateEnvelope) {
  const temporary = `${stateFile}.tmp`
  writeFileSync(temporary, JSON.stringify(envelope), 'utf8')
  renameSync(temporary, stateFile)
}

function send(response: ServerResponse, status: number, body: unknown) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.end(JSON.stringify(body))
}

async function body(request: IncomingMessage): Promise<unknown> {
  let raw = ''
  for await (const chunk of request) {
    raw += chunk
    if (raw.length > 2_000_000) throw new Error('Estado demonstrativo excedeu o limite permitido.')
  }
  return JSON.parse(raw)
}

function middleware(request: IncomingMessage, response: ServerResponse, next: () => void) {
  if (request.url !== '/api/demo-state') return next()
  if (request.method === 'GET') return send(response, 200, current)
  if (request.method !== 'POST') return send(response, 405, { error: 'Método não permitido.' })

  void body(request).then(payload => {
    const candidate = payload as { baseRevision?: number; state?: unknown }
    if (!validState(candidate.state)) return send(response, 400, { error: 'Estado demonstrativo inválido.' })
    if (candidate.baseRevision !== current.revision) return send(response, 409, current)
    current = { revision: current.revision + 1, state: candidate.state }
    persist(current)
    return send(response, 200, current)
  }).catch(error => send(response, 400, { error: error instanceof Error ? error.message : 'Requisição inválida.' }))
}

export function demoStatePlugin(): Plugin {
  return {
    name: 'medpredict-shared-demo-state',
    configureServer(server) { server.middlewares.use(middleware) },
    configurePreviewServer(server) { server.middlewares.use(middleware) },
  }
}

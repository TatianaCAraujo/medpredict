export interface IntegrationAdapter {
  readonly name: string
  readonly status: string
  sync(): Promise<never>
}

export class MockHealthSystemAdapter implements IntegrationAdapter {
  readonly name = 'Sistema Central da Rede'
  readonly status = 'Simulação'
  async sync(): Promise<never> { throw new Error('Sincronização apenas demonstrativa.') }
}

export class FutureRegionalAdapter implements IntegrationAdapter {
  constructor(readonly name: string) {}
  readonly status = 'Adapter disponível para implementação'
  async sync(): Promise<never> { throw new Error('Integração futura ainda não configurada.') }
}

import type { RiskLevel } from '../../types'

export interface RiskInput { age: number; dias_espera: number; sms_received: number; neighbourhood: string }
export interface RiskOutput { probability: number; priority: RiskLevel }
export interface RiskService { predict(input: RiskInput): Promise<RiskOutput> }

export class MockRiskService implements RiskService {
  async predict(): Promise<RiskOutput> {
    return { probability: .52, priority: 'MEDIUM' }
  }
}

export class FutureModelRiskService implements RiskService {
  async predict(_input: RiskInput): Promise<RiskOutput> {
    throw new Error('Adapter futuro: POST /predict ainda não integrado ao modelo oficial.')
  }
}

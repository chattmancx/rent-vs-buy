import { computeScenario } from '../engine'
import type { ScenarioInput, ScenarioResult } from '../engine'

export function deflate(nominalValue: number, inflationRate: number, years: number): number {
  return nominalValue / Math.pow(1 + inflationRate, years)
}

export function deflateIfEnabled(
  nominalValue: number,
  realDollars: boolean,
  inflationRate: number,
  years: number,
): number {
  return realDollars ? deflate(nominalValue, inflationRate, years) : nominalValue
}

// Converts a real (inflation-adjusted) annual rate to its nominal equivalent via the Fisher equation.
export function deriveNominalRate(realRate: number, inflationRate: number): number {
  return (1 + realRate) * (1 + inflationRate) - 1
}

// When real_dollars is enabled, investment_return_rate is interpreted as a real rate; convert it to
// its nominal equivalent before running the engine, which always compounds nominally. Deflation of
// the resulting dollar figures for display is unchanged from Stage 13 (deflateIfEnabled at render
// time) — this only changes which rate the engine compounds at, not display formatting. A no-op when
// real_dollars is false, so every existing nominal-mode scenario (including the hand-derived
// SCENARIO_SIMPLE regression test) is byte-identical to before.
export function computeScenarioForDisplay(input: ScenarioInput): ScenarioResult {
  if (!input.shared.real_dollars) return computeScenario(input)
  const nominalRate = deriveNominalRate(
    input.shared.investment_return_rate,
    input.shared.inflation_rate,
  )
  return computeScenario({
    ...input,
    shared: { ...input.shared, investment_return_rate: nominalRate },
  })
}

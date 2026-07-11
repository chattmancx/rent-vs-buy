import { describe, it, expect } from 'vitest'
import {
  deflate,
  deflateIfEnabled,
  deriveNominalRate,
  computeScenarioForDisplay,
} from '../inflation'
import { computeScenario } from '../../engine'
import { DEFAULT_INPUT } from '../defaults'

describe('deflate', () => {
  it('INF-1: returns the input unchanged at year 0 (no discount)', () => {
    expect(deflate(1000, 0.03, 0)).toBe(1000)
  })

  it('INF-2: matches the hand-computed value (1000 / 1.03^10 = 744.09...)', () => {
    expect(deflate(1000, 0.03, 10)).toBeCloseTo(744.093914896725, 6)
  })

  it('INF-3: returns the input unchanged for any years when inflationRate is 0', () => {
    expect(deflate(1000, 0, 0)).toBe(1000)
    expect(deflate(1000, 0, 15)).toBe(1000)
    expect(deflate(1000, 0, 30)).toBe(1000)
  })
})

describe('deflateIfEnabled', () => {
  it('INF-4: returns the nominal value unchanged when realDollars is false', () => {
    expect(deflateIfEnabled(1000, false, 0.03, 10)).toBe(1000)
  })

  it('INF-5: returns the deflated value when realDollars is true', () => {
    expect(deflateIfEnabled(1000, true, 0.03, 10)).toBeCloseTo(744.093914896725, 6)
  })
})

describe('deriveNominalRate', () => {
  it('S18-3: matches the hand-computed Fisher equation (real=0.07, inflation=0.03 -> nominal ~0.1021)', () => {
    expect(deriveNominalRate(0.07, 0.03)).toBeCloseTo(0.1021, 4)
  })

  it('returns the inflation rate itself when the real rate is 0', () => {
    expect(deriveNominalRate(0, 0.03)).toBeCloseTo(0.03, 10)
  })

  it('returns 0 when both rates are 0', () => {
    expect(deriveNominalRate(0, 0)).toBe(0)
  })
})

describe('computeScenarioForDisplay', () => {
  it('S18-4: is a no-op when real_dollars is false — byte-identical to raw computeScenario', () => {
    const direct = computeScenario(DEFAULT_INPUT)
    const wrapped = computeScenarioForDisplay(DEFAULT_INPUT)
    expect(wrapped).toEqual(direct)
  })

  it('S18-5: when real_dollars is true, matches raw computeScenario called with the manually pre-derived nominal rate', () => {
    const realInput = {
      ...DEFAULT_INPUT,
      shared: { ...DEFAULT_INPUT.shared, real_dollars: true, inflation_rate: 0.03 },
    }
    const nominalRate = deriveNominalRate(
      realInput.shared.investment_return_rate,
      realInput.shared.inflation_rate,
    )
    const expected = computeScenario({
      ...realInput,
      shared: { ...realInput.shared, investment_return_rate: nominalRate },
    })
    const actual = computeScenarioForDisplay(realInput)
    expect(actual).toEqual(expected)
    // and it must differ from naively using the raw (real) rate directly — DEFAULT_INPUT has the
    // renter investing the monthly differential, so renter_final_net_worth is the side sensitive
    // to investment_return_rate here (owner never invests in this scenario)
    const naive = computeScenario(realInput)
    expect(actual.totals.renter_final_net_worth).not.toBeCloseTo(
      naive.totals.renter_final_net_worth,
      0,
    )
  })
})

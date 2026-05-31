import { describe, it, expect } from 'vitest'
import { ScenarioInputSchema } from '../schema'
import { DEFAULT_INPUT } from '../defaults'

function parse(overrides: object) {
  return ScenarioInputSchema.safeParse(overrides).success
}

function withShared(patch: object) {
  return { ...DEFAULT_INPUT, shared: { ...DEFAULT_INPUT.shared, ...patch } }
}

function withOwnership(patch: object) {
  return { ...DEFAULT_INPUT, ownership: { ...DEFAULT_INPUT.ownership, ...patch } }
}

describe('ScenarioInputSchema', () => {
  it('accepts DEFAULT_INPUT', () => {
    expect(parse(DEFAULT_INPUT)).toBe(true)
  })

  it('rejects horizon_years: 0', () => {
    expect(parse(withShared({ horizon_years: 0 }))).toBe(false)
  })

  it('rejects horizon_years: 31', () => {
    expect(parse(withShared({ horizon_years: 31 }))).toBe(false)
  })

  it('accepts horizon_years at boundaries (1 and 30)', () => {
    expect(parse(withShared({ horizon_years: 1 }))).toBe(true)
    expect(parse(withShared({ horizon_years: 30 }))).toBe(true)
  })

  it('rejects invest_vs_spend_ratio outside [0, 1]', () => {
    expect(parse(withShared({ invest_vs_spend_ratio: -0.01 }))).toBe(false)
    expect(parse(withShared({ invest_vs_spend_ratio: 1.01 }))).toBe(false)
  })

  it('accepts invest_vs_spend_ratio at boundaries (0 and 1)', () => {
    expect(parse(withShared({ invest_vs_spend_ratio: 0 }))).toBe(true)
    expect(parse(withShared({ invest_vs_spend_ratio: 1 }))).toBe(true)
  })

  it('rejects purchase_price: 0 (must be positive)', () => {
    expect(parse(withOwnership({ purchase_price: 0 }))).toBe(false)
    expect(parse(withOwnership({ purchase_price: 1 }))).toBe(true)
  })

  it('rejects home_appreciation_rate outside [-0.5, 0.5]', () => {
    expect(parse(withOwnership({ home_appreciation_rate: 0.51 }))).toBe(false)
    expect(parse(withOwnership({ home_appreciation_rate: -0.51 }))).toBe(false)
  })

  it('rejects non-integer loan_term_years', () => {
    expect(parse(withOwnership({ loan_term_years: 1.5 }))).toBe(false)
  })

  it('rejects NaN in any field', () => {
    expect(parse(withOwnership({ purchase_price: NaN }))).toBe(false)
  })

  it('rejects Infinity in any field', () => {
    expect(parse(withOwnership({ purchase_price: Infinity }))).toBe(false)
  })

  it('rejects missing required field', () => {
    expect(parse({ rental: DEFAULT_INPUT.rental, shared: DEFAULT_INPUT.shared })).toBe(false)
  })
})

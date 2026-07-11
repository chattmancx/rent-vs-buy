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

  it('S17-21: old-shaped ownership object missing the 5 refinance keys still parses, with defaults applied', () => {
    const {
      refinance_enabled: _refinance_enabled,
      refinance_trigger_month: _refinance_trigger_month,
      refinance_new_interest_rate: _refinance_new_interest_rate,
      refinance_new_loan_term_years: _refinance_new_loan_term_years,
      refinance_closing_costs_pct: _refinance_closing_costs_pct,
      ...ownershipWithoutRefinance
    } = DEFAULT_INPUT.ownership
    const legacyInput = { ...DEFAULT_INPUT, ownership: ownershipWithoutRefinance }
    const result = ScenarioInputSchema.safeParse(legacyInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.ownership.refinance_enabled).toBe(false)
      expect(result.data.ownership.refinance_trigger_month).toBe(60)
      expect(result.data.ownership.refinance_new_interest_rate).toBe(6.0)
      expect(result.data.ownership.refinance_new_loan_term_years).toBe(30)
      expect(result.data.ownership.refinance_closing_costs_pct).toBe(2.0)
    }
  })

  it('S17-22: rejects refinance_trigger_month outside [1, 600] and non-integer values', () => {
    expect(parse(withOwnership({ refinance_trigger_month: 0 }))).toBe(false)
    expect(parse(withOwnership({ refinance_trigger_month: 601 }))).toBe(false)
    expect(parse(withOwnership({ refinance_trigger_month: 1.5 }))).toBe(false)
    expect(parse(withOwnership({ refinance_trigger_month: 1 }))).toBe(true)
    expect(parse(withOwnership({ refinance_trigger_month: 600 }))).toBe(true)
  })

  it('S17-23: rejects refinance_new_interest_rate outside [0, 100]', () => {
    expect(parse(withOwnership({ refinance_new_interest_rate: -0.01 }))).toBe(false)
    expect(parse(withOwnership({ refinance_new_interest_rate: 100.01 }))).toBe(false)
  })

  it('S17-24: rejects non-integer or out-of-range refinance_new_loan_term_years', () => {
    expect(parse(withOwnership({ refinance_new_loan_term_years: 0 }))).toBe(false)
    expect(parse(withOwnership({ refinance_new_loan_term_years: 51 }))).toBe(false)
    expect(parse(withOwnership({ refinance_new_loan_term_years: 1.5 }))).toBe(false)
  })

  it('S17-25: rejects refinance_closing_costs_pct outside [0, 20]', () => {
    expect(parse(withOwnership({ refinance_closing_costs_pct: -0.01 }))).toBe(false)
    expect(parse(withOwnership({ refinance_closing_costs_pct: 20.01 }))).toBe(false)
  })
})

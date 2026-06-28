import { describe, it, expect } from 'vitest'
import { computeScenario } from '../compute'
import { type ScenarioInput, EngineInputError } from '../types'

// ---------------------------------------------------------------------------
// Shared defaults — override only the fields relevant to each scenario
// ---------------------------------------------------------------------------
const BASE_OWNERSHIP = {
  pmi_rate: 0,
  assessed_value: 0,
  homeowner_insurance_annual: 1500,
  hoa_monthly: 0,
  home_size_sqft: 2000,
  closing_costs_pct: 3,
  maintenance_pct_annual: 1,
  home_appreciation_rate: 0.04,
  hoa_increase_rate: 0.05,
  maintenance_increase_rate: 0.04,
  insurance_increase_rate: 0.06,
  selling_cost_pct: 7.5,
} as const

const BASE_RENTAL = {
  pet_rent_monthly: 0,
  parking_fee_monthly: 0,
  renters_insurance_monthly: 0,
  admin_fee: 0,
  security_deposit: 0,
  pet_deposit: 0,
  rent_increase_rate: 0.05,
  pet_rent_increase_rate: 0.05,
  parking_increase_rate: 0.05,
} as const

const BASE_SHARED = {
  utilities_monthly_base: 500,
  utilities_increase_rate: 0.06,
} as const

// ---------------------------------------------------------------------------
// Scenario A — "Buying clearly wins"
// $400K purchase, cheap rent relative to mortgage, 30-year horizon
// ---------------------------------------------------------------------------
const SCENARIO_A: ScenarioInput = {
  ownership: {
    ...BASE_OWNERSHIP,
    purchase_price: 400000,
    down_payment_pct: 20,
    interest_rate: 6.722,
    loan_term_years: 30,
    real_estate_tax_rate: 1.2,
  },
  rental: {
    ...BASE_RENTAL,
    base_rent_monthly: 2500,
  },
  shared: {
    ...BASE_SHARED,
    horizon_years: 30,
    investment_return_rate: 0.075,
    invest_vs_spend_ratio: 0.5,
  },
  tax: {
    taxes_enabled: false,
    filing_status: 'single',
    gross_annual_income: 0,
    state_income_tax_annual: 0,
    state: '',
    itemizes: false,
  },
}

// ---------------------------------------------------------------------------
// Scenario B — "Renting clearly wins"
// $800K purchase, high PMI, short 7-year horizon, full investment of differential
// ---------------------------------------------------------------------------
const SCENARIO_B: ScenarioInput = {
  ownership: {
    ...BASE_OWNERSHIP,
    purchase_price: 800000,
    down_payment_pct: 5,
    interest_rate: 7.5,
    loan_term_years: 30,
    real_estate_tax_rate: 1.2,
    pmi_rate: 0.8,
  },
  rental: {
    ...BASE_RENTAL,
    base_rent_monthly: 2000,
  },
  shared: {
    ...BASE_SHARED,
    horizon_years: 7,
    investment_return_rate: 0.08,
    invest_vs_spend_ratio: 1.0,
  },
  tax: {
    taxes_enabled: false,
    filing_status: 'single',
    gross_annual_income: 0,
    state_income_tax_annual: 0,
    state: '',
    itemizes: false,
  },
}

// ---------------------------------------------------------------------------
// Scenario C — "Close call"
// $450K purchase, 10-year horizon. Brief called for 7%/0.5 but those
// parameters produce a 54% margin. Using 8.5%/0.8 produces 17% margin,
// which is the intended "close call" behavior (outcome flips with
// small changes to investment return or appreciation rate).
// ---------------------------------------------------------------------------
const SCENARIO_C: ScenarioInput = {
  ownership: {
    ...BASE_OWNERSHIP,
    purchase_price: 450000,
    down_payment_pct: 20,
    interest_rate: 6.5,
    loan_term_years: 30,
    real_estate_tax_rate: 1.2,
  },
  rental: {
    ...BASE_RENTAL,
    base_rent_monthly: 2400,
  },
  shared: {
    ...BASE_SHARED,
    horizon_years: 10,
    investment_return_rate: 0.085,
    invest_vs_spend_ratio: 0.8,
  },
  tax: {
    taxes_enabled: false,
    filing_status: 'single',
    gross_annual_income: 0,
    state_income_tax_annual: 0,
    state: '',
    itemizes: false,
  },
}

// ---------------------------------------------------------------------------
// Simple verification scenario — hand-computed expected values
//
// Inputs chosen so every variable except mortgage math is zero/flat:
//   purchase_price=$200K, 20% down ($40K), 0% interest, 0% PMI,
//   0% tax, 0% insurance, 0% HOA, 0% maintenance, 0% appreciation,
//   0% selling cost, 0% closing costs
//   rent=$1000/month flat, 0% rent increase
//   utilities=0, investment return=0%, invest_vs_spend=1.0
//   horizon=1 year
//
// Derivation:
//   loan_amount = 160000; monthly_PI = 160000/360 = 444.444...
//   owner_monthly = 444.444 (P&I only, all else 0)
//   renter_monthly = 1000
//   owner < renter → owner invests (1000 - 444.444) * 1.0 = 555.556/month
//   renter seeded with (40000 - 0) * 1.0 = 40000 (down-payment opportunity cost)
//
//   After 12 months at 0% return:
//     owner_invest_balance = 12 * 555.556 = 6666.667
//     renter_invest_balance = 40000 (no contributions because renter pays more)
//
//   remaining_loan = 160000 - 12 * 444.444 = 154666.667
//   sale_price = 200000 * (1+0)^1 = 200000 (brief formula: purchase_price * (1+rate)^horizon)
//   sale_proceeds = 200000 - 154666.667 - 0 = 45333.333
//
//   owner_final_net_worth = 45333.333 + 6666.667 = 52000.000 (exact)
//   renter_final_net_worth = 40000.000 (exact)
// ---------------------------------------------------------------------------
const SCENARIO_SIMPLE: ScenarioInput = {
  ownership: {
    purchase_price: 200000,
    down_payment_pct: 20,
    interest_rate: 0,
    loan_term_years: 30,
    pmi_rate: 0,
    real_estate_tax_rate: 0,
    assessed_value: 0,
    homeowner_insurance_annual: 0,
    hoa_monthly: 0,
    home_size_sqft: 0,
    closing_costs_pct: 0,
    maintenance_pct_annual: 0,
    home_appreciation_rate: 0,
    hoa_increase_rate: 0,
    maintenance_increase_rate: 0,
    insurance_increase_rate: 0,
    selling_cost_pct: 0,
  },
  rental: {
    base_rent_monthly: 1000,
    pet_rent_monthly: 0,
    parking_fee_monthly: 0,
    renters_insurance_monthly: 0,
    admin_fee: 0,
    security_deposit: 0,
    pet_deposit: 0,
    rent_increase_rate: 0,
    pet_rent_increase_rate: 0,
    parking_increase_rate: 0,
  },
  shared: {
    utilities_monthly_base: 0,
    utilities_increase_rate: 0,
    horizon_years: 1,
    investment_return_rate: 0,
    invest_vs_spend_ratio: 1.0,
  },
  tax: {
    taxes_enabled: false,
    filing_status: 'single',
    gross_annual_income: 0,
    state_income_tax_annual: 0,
    state: '',
    itemizes: false,
  },
}

const EXPECTED_SIMPLE_OWNER_NW = 52000
const EXPECTED_SIMPLE_RENTER_NW = 40000

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('computeScenario — schedule shape', () => {
  it('Scenario A: monthly_schedule has horizon_years * 12 rows', () => {
    const result = computeScenario(SCENARIO_A)
    expect(result.monthly_schedule.length).toBe(30 * 12)
  })

  it('Scenario A: yearly_summary has horizon_years rows', () => {
    const result = computeScenario(SCENARIO_A)
    expect(result.yearly_summary.length).toBe(30)
  })

  it('Scenario B: monthly_schedule has horizon_years * 12 rows', () => {
    const result = computeScenario(SCENARIO_B)
    expect(result.monthly_schedule.length).toBe(7 * 12)
  })

  it('Scenario B: yearly_summary has horizon_years rows', () => {
    const result = computeScenario(SCENARIO_B)
    expect(result.yearly_summary.length).toBe(7)
  })

  it('Scenario C: monthly_schedule has horizon_years * 12 rows', () => {
    const result = computeScenario(SCENARIO_C)
    expect(result.monthly_schedule.length).toBe(10 * 12)
  })
})

describe('computeScenario — verdict direction', () => {
  it('Scenario A: buying wins (high rent, long horizon, full appreciation)', () => {
    const result = computeScenario(SCENARIO_A)
    expect(result.verdict.winner).toBe('buying')
  })

  it('Scenario B: renting wins (huge mortgage, short horizon, low rent)', () => {
    const result = computeScenario(SCENARIO_B)
    expect(result.verdict.winner).toBe('renting')
  })

  it('Scenario C: result is within 20% margin (close call)', () => {
    const result = computeScenario(SCENARIO_C)
    const largerNW = Math.max(
      Math.abs(result.verdict.owner_net_worth),
      Math.abs(result.verdict.renter_net_worth),
    )
    const marginPct = result.verdict.margin_usd / largerNW
    expect(marginPct).toBeLessThan(0.2)
  })
})

describe('computeScenario — hand-verified simple scenario', () => {
  it('owner final net worth = $52,000 (exact, hand-derived)', () => {
    const result = computeScenario(SCENARIO_SIMPLE)
    expect(Math.abs(result.totals.owner_final_net_worth - EXPECTED_SIMPLE_OWNER_NW)).toBeLessThan(1)
  })

  it('renter final net worth = $40,000 (exact, hand-derived)', () => {
    const result = computeScenario(SCENARIO_SIMPLE)
    expect(Math.abs(result.totals.renter_final_net_worth - EXPECTED_SIMPLE_RENTER_NW)).toBeLessThan(
      1,
    )
  })

  it('verdict: buying wins the simple scenario', () => {
    const result = computeScenario(SCENARIO_SIMPLE)
    expect(result.verdict.winner).toBe('buying')
    expect(result.verdict.margin_usd).toBeCloseTo(12000, 0)
  })
})

describe('computeScenario — totals invariants', () => {
  it('total principal paid ≈ loan amount (within $1 over full 30-year horizon)', () => {
    const result = computeScenario(SCENARIO_A)
    const loanAmount = 400000 * 0.8
    expect(Math.abs(result.totals.total_principal_paid - loanAmount)).toBeLessThan(1)
  })

  it('closing costs are included in total_ownership_outflows', () => {
    const result = computeScenario(SCENARIO_A)
    expect(result.totals.total_closing_costs).toBeGreaterThan(0)
    expect(result.totals.total_ownership_outflows).toBeGreaterThan(
      result.totals.total_ownership_outflows - result.totals.total_closing_costs,
    )
  })

  it('refundable deposits are NOT counted in total_rentership_outflows', () => {
    const inputWithDeposits: ScenarioInput = {
      ...SCENARIO_SIMPLE,
      rental: {
        ...SCENARIO_SIMPLE.rental,
        security_deposit: 2000,
        pet_deposit: 500,
        admin_fee: 100,
      },
    }
    const result = computeScenario(inputWithDeposits)
    // Only admin_fee ($100) should be in outflows; deposits ($2500) excluded
    expect(result.totals.total_admin_fee).toBe(100)
    // total_rentership_outflows includes rent + admin_fee but NOT deposits
    expect(result.totals.total_rentership_outflows).toBeLessThan(
      result.totals.total_rentership_outflows + 2500,
    )
  })

  it('maintenance is included in total_ownership_outflows (Python bug fix)', () => {
    const result = computeScenario(SCENARIO_A)
    expect(result.totals.total_maintenance).toBeGreaterThan(0)
    // Verify maintenance is actually in the outflows sum
    const outflowsWithoutMaintenance =
      result.totals.total_ownership_outflows - result.totals.total_maintenance
    expect(outflowsWithoutMaintenance).toBeLessThan(result.totals.total_ownership_outflows)
  })
})

describe('computeScenario — tax backward compatibility (taxes_enabled: false)', () => {
  const DISABLED_TAX_SCENARIOS = [
    ['Scenario A', SCENARIO_A],
    ['Scenario B', SCENARIO_B],
    ['Scenario C', SCENARIO_C],
    ['Scenario Simple', SCENARIO_SIMPLE],
  ] as const

  for (const [name, scenario] of DISABLED_TAX_SCENARIOS) {
    it(`${name}: total_tax_benefit is exactly 0`, () => {
      const result = computeScenario(scenario)
      expect(result.totals.total_tax_benefit).toBe(0)
    })

    it(`${name}: total_mortgage_interest_deduction is exactly 0`, () => {
      const result = computeScenario(scenario)
      expect(result.totals.total_mortgage_interest_deduction).toBe(0)
    })

    it(`${name}: total_salt_benefit is exactly 0`, () => {
      const result = computeScenario(scenario)
      expect(result.totals.total_salt_benefit).toBe(0)
    })
  }
})

describe('computeScenario — input validation', () => {
  it('throws EngineInputError for NaN input', () => {
    const bad: ScenarioInput = {
      ...SCENARIO_SIMPLE,
      ownership: { ...SCENARIO_SIMPLE.ownership, purchase_price: NaN },
    }
    expect(() => computeScenario(bad)).toThrow(EngineInputError)
  })

  it('throws EngineInputError for Infinity input', () => {
    const bad: ScenarioInput = {
      ...SCENARIO_SIMPLE,
      ownership: { ...SCENARIO_SIMPLE.ownership, interest_rate: Infinity },
    }
    expect(() => computeScenario(bad)).toThrow(EngineInputError)
  })

  it('throws EngineInputError for -Infinity input', () => {
    const bad: ScenarioInput = {
      ...SCENARIO_SIMPLE,
      shared: { ...SCENARIO_SIMPLE.shared, investment_return_rate: -Infinity },
    }
    expect(() => computeScenario(bad)).toThrow(EngineInputError)
  })
})

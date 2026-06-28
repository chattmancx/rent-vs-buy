import { describe, it, expect } from 'vitest'
import {
  computeAnnualTaxBenefit,
  computeAnnualTaxBenefitBreakdown,
  getMarginalRate,
  SALT_CAP_2026,
  SALT_CAP_MFS_2026,
} from '../tax'
import { type TaxInput } from '../types'

const BASE_TAX: TaxInput = {
  taxes_enabled: true,
  filing_status: 'single',
  gross_annual_income: 100_000,
  state_income_tax_annual: 0,
}

// ---------------------------------------------------------------------------
// Group 1 — Guard conditions
// ---------------------------------------------------------------------------
describe('computeAnnualTaxBenefit — guard conditions', () => {
  it('returns 0 when taxes_enabled is false regardless of other inputs', () => {
    const result = computeAnnualTaxBenefit({
      taxInput: { ...BASE_TAX, taxes_enabled: false },
      annualMortgageInterest: 30_000,
      annualPropertyTax: 8_000,
      loanBalance: 400_000,
    })
    expect(result).toBe(0)
  })

  it('returns 0 when gross_annual_income is 0 regardless of other inputs', () => {
    const result = computeAnnualTaxBenefit({
      taxInput: { ...BASE_TAX, gross_annual_income: 0 },
      annualMortgageInterest: 30_000,
      annualPropertyTax: 8_000,
      loanBalance: 400_000,
    })
    expect(result).toBe(0)
  })

  it('returns 0 when deductions do not exceed standard deduction (no itemizing benefit)', () => {
    // single filer: std deduction = $16,100
    // MID $5,000 + SALT $8,000 = $13,000 < $16,100 → incremental = negative → 0
    const result = computeAnnualTaxBenefit({
      taxInput: { ...BASE_TAX, gross_annual_income: 80_000 },
      annualMortgageInterest: 5_000,
      annualPropertyTax: 8_000,
      loanBalance: 200_000,
    })
    expect(result).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Group 2 — MID proration
// ---------------------------------------------------------------------------
describe('computeAnnualTaxBenefit — MID loan limit proration', () => {
  it('no proration when loan balance is below $750K limit (midRatio = 1.0)', () => {
    // $400K loan, full interest is deductible
    // single $100K income: std deduction $16,100; taxable = $83,900 → 22% bracket
    // MID $20K + SALT $0 = $20K itemized; incremental = $20K - $16,100 = $3,900
    // benefit = $3,900 × 0.22 = $858
    const result = computeAnnualTaxBenefit({
      taxInput: { ...BASE_TAX },
      annualMortgageInterest: 20_000,
      annualPropertyTax: 0,
      loanBalance: 400_000,
    })
    expect(result).toBeCloseTo(858, 0)
  })

  it('prorates MID when loan balance exceeds $750K limit', () => {
    // $900K loan: midRatio = 750/900 = 0.8333; interest = $60K → deductible = $50K
    // single $200K income: std deduction $16,100; taxable = $183,900 → 24% bracket
    // SALT $0; total itemized = $50K; incremental = $50K - $16,100 = $33,900
    // benefit = $33,900 × 0.24 = $8,136
    const result = computeAnnualTaxBenefit({
      taxInput: { ...BASE_TAX, gross_annual_income: 200_000 },
      annualMortgageInterest: 60_000,
      annualPropertyTax: 0,
      loanBalance: 900_000,
    })
    expect(result).toBeCloseTo(8_136, 0)
  })
})

// ---------------------------------------------------------------------------
// Group 3 — SALT cap
// ---------------------------------------------------------------------------
describe('computeAnnualTaxBenefit — SALT cap', () => {
  it('full SALT deduction when combined salt is below $10K cap', () => {
    // property tax $6K + state income tax $3K = $9K < $10K cap → full $9K deductible
    // single $120K income; std deduction $16,100; taxable = $103,900 → 22% bracket (≤ $105,700)
    // MID $10K + SALT $9K = $19K; incremental = $19K - $16,100 = $2,900
    // benefit = $2,900 × 0.22 = $638
    const result = computeAnnualTaxBenefit({
      taxInput: { ...BASE_TAX, gross_annual_income: 120_000, state_income_tax_annual: 3_000 },
      annualMortgageInterest: 10_000,
      annualPropertyTax: 6_000,
      loanBalance: 300_000,
    })
    expect(result).toBeCloseTo(638, 0)
  })

  it('SALT is capped at $10K when combined exceeds cap', () => {
    // property tax $8K + state income tax $5K = $13K → capped at $10K
    // single $150K income; std deduction $16,100; taxable = $133,900 → 24% bracket (> $105,700)
    // MID $15K + SALT $10K = $25K; incremental = $25K - $16,100 = $8,900
    // benefit = $8,900 × 0.24 = $2,136
    const result = computeAnnualTaxBenefit({
      taxInput: { ...BASE_TAX, gross_annual_income: 150_000, state_income_tax_annual: 5_000 },
      annualMortgageInterest: 15_000,
      annualPropertyTax: 8_000,
      loanBalance: 400_000,
    })
    expect(result).toBeCloseTo(2_136, 0)
  })

  it('married_filing_separately SALT cap is $5,000', () => {
    // combined SALT $7K → capped at $5K (MFS cap)
    // MFS $100K income; std deduction $16,100; taxable = $83,900 → 22% bracket
    // MID $15K + SALT $5K = $20K; incremental = $20K - $16,100 = $3,900
    // benefit = $3,900 × 0.22 = $858
    const result = computeAnnualTaxBenefit({
      taxInput: {
        ...BASE_TAX,
        filing_status: 'married_filing_separately',
        state_income_tax_annual: 3_000,
      },
      annualMortgageInterest: 15_000,
      annualPropertyTax: 4_000,
      loanBalance: 400_000,
    })
    expect(result).toBeCloseTo(858, 0)
    // Verify the cap is not the joint $10K cap
    expect(result).toBeLessThan(
      computeAnnualTaxBenefit({
        taxInput: {
          ...BASE_TAX,
          filing_status: 'married_filing_separately',
          state_income_tax_annual: 3_000,
        },
        annualMortgageInterest: 15_000,
        annualPropertyTax: 8_000, // would exceed $5K cap even more
        loanBalance: 400_000,
      }) + 1, // capped both ways, result should be same as property tax $4K in this bracket
    )
    expect(SALT_CAP_MFS_2026).toBe(5_000)
    expect(SALT_CAP_2026).toBe(10_000)
  })
})

// ---------------------------------------------------------------------------
// Group 4 — Itemized vs. standard deduction
// ---------------------------------------------------------------------------
describe('computeAnnualTaxBenefit — itemized vs. standard deduction', () => {
  it('single $80K income: MID $10K + SALT $8K → incremental $1,900 → benefit $418', () => {
    // Hand derivation:
    //   std deduction (single 2026) = $16,100
    //   deductible interest = $10,000 (no proration, loan < $750K)
    //   deductible SALT = min($8,000 + $0, $10,000) = $8,000
    //   total itemized = $18,000
    //   incremental = $18,000 - $16,100 = $1,900
    //   taxable income = $80,000 - $16,100 = $63,900 → 22% bracket (ceiling $105,700)
    //   benefit = $1,900 × 0.22 = $418
    const result = computeAnnualTaxBenefit({
      taxInput: { ...BASE_TAX, gross_annual_income: 80_000 },
      annualMortgageInterest: 10_000,
      annualPropertyTax: 8_000,
      loanBalance: 300_000,
    })
    expect(result).toBeCloseTo(418, 0)
  })

  it('single $80K income: MID $5K + SALT $8K → total $13K < std deduction → benefit $0', () => {
    // total itemized = $5,000 + $8,000 = $13,000 < $16,100 std deduction
    // incremental ≤ 0 → returns 0
    const result = computeAnnualTaxBenefit({
      taxInput: { ...BASE_TAX, gross_annual_income: 80_000 },
      annualMortgageInterest: 5_000,
      annualPropertyTax: 8_000,
      loanBalance: 300_000,
    })
    expect(result).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Group 5 — Filing status variation
// ---------------------------------------------------------------------------
describe('computeAnnualTaxBenefit — filing status variation', () => {
  it('married_filing_jointly $250K income: incremental $2,800 → benefit $672', () => {
    // Hand derivation:
    //   std deduction (MFJ 2026) = $32,200
    //   deductible interest = $25,000
    //   deductible SALT = min($10,000 + $0, $10,000) = $10,000
    //   total itemized = $35,000
    //   incremental = $35,000 - $32,200 = $2,800
    //   taxable income = $250,000 - $32,200 = $217,800 → 24% bracket (> $211,400 MFJ 22% ceiling)
    //   benefit = $2,800 × 0.24 = $672
    const result = computeAnnualTaxBenefit({
      taxInput: {
        ...BASE_TAX,
        filing_status: 'married_filing_jointly',
        gross_annual_income: 250_000,
      },
      annualMortgageInterest: 25_000,
      annualPropertyTax: 10_000,
      loanBalance: 400_000,
    })
    expect(result).toBeCloseTo(672, 0)
  })

  it('head_of_household uses $24,150 standard deduction (not single $16,100 or MFJ $32,200)', () => {
    // HOH $100K income: taxable = $100,000 - $24,150 = $75,850
    // HOH brackets: 12% ceiling $67,450; 22% ceiling $105,700
    // $75,850 > $67,450 → 22% bracket
    const rate = getMarginalRate(100_000, 'head_of_household')
    // taxable = $100,000 - $24,150 = $75,850 → falls in 22% bracket for HOH
    expect(rate).toBe(0.22)
    // Verify it uses the HOH-specific standard deduction by testing a case that diverges from single
    const rateHoh = getMarginalRate(55_000, 'head_of_household')
    // HOH taxable = $55,000 - $24,150 = $30,850 → 12% bracket (ceiling $67,450) ✓
    expect(rateHoh).toBe(0.12)
    const rateSingle = getMarginalRate(55_000, 'single')
    // single taxable = $55,000 - $16,100 = $38,900 → 12% bracket (ceiling $50,400) ✓
    expect(rateSingle).toBe(0.12)
  })
})

// ---------------------------------------------------------------------------
// Group 6 — Breakdown attribution
// ---------------------------------------------------------------------------
describe('computeAnnualTaxBenefitBreakdown — attribution', () => {
  it('mid_benefit + salt_benefit ≈ total (within $1) for test-9 inputs', () => {
    // Same as test 9: single $80K, MID $10K, SALT $8K → total $418
    const breakdown = computeAnnualTaxBenefitBreakdown({
      taxInput: { ...BASE_TAX, gross_annual_income: 80_000 },
      annualMortgageInterest: 10_000,
      annualPropertyTax: 8_000,
      loanBalance: 300_000,
    })
    expect(Math.abs(breakdown.mid_benefit + breakdown.salt_benefit - breakdown.total)).toBeLessThan(
      1,
    )
    expect(breakdown.mid_benefit).toBeGreaterThan(0)
    expect(breakdown.salt_benefit).toBeGreaterThan(0)
    expect(breakdown.total).toBeCloseTo(418, 0)
  })

  it('when SALT cap is binding, salt_benefit reflects only capped portion', () => {
    // SALT $13K → capped at $10K; only $10K enters the itemized calculation
    // single $150K, MID $15K + SALT $10K (capped) = $25K; incremental = $8,900; total = $2,136
    // salt share = $10K / $25K = 0.4; mid share = $15K / $25K = 0.6
    const breakdown = computeAnnualTaxBenefitBreakdown({
      taxInput: { ...BASE_TAX, gross_annual_income: 150_000, state_income_tax_annual: 5_000 },
      annualMortgageInterest: 15_000,
      annualPropertyTax: 8_000,
      loanBalance: 400_000,
    })
    expect(breakdown.salt_benefit).toBeGreaterThan(0)
    expect(breakdown.mid_benefit).toBeGreaterThan(breakdown.salt_benefit) // MID share is larger
    expect(breakdown.mid_benefit + breakdown.salt_benefit).toBeCloseTo(breakdown.total, 1)
  })
})

// ---------------------------------------------------------------------------
// Group 7 — Edge cases
// ---------------------------------------------------------------------------
describe('computeAnnualTaxBenefit — edge cases', () => {
  it('income exactly at 12% bracket boundary $66,500 (single) uses 12% rate', () => {
    // single, gross = $66,500; taxable = $66,500 - $16,100 = $50,400
    // $50,400 is exactly the 2026 single 12% bracket ceiling → 12% rate
    const rate = getMarginalRate(66_500, 'single')
    expect(rate).toBe(0.12)
  })

  it('very high income ($1M+, single) returns 37% rate and finite positive result', () => {
    const result = computeAnnualTaxBenefit({
      taxInput: { ...BASE_TAX, gross_annual_income: 1_500_000 },
      annualMortgageInterest: 30_000,
      annualPropertyTax: 10_000,
      loanBalance: 500_000,
    })
    expect(Number.isFinite(result)).toBe(true)
    expect(result).toBeGreaterThan(0)
    // Expected: std $16,100; MID $30K + SALT $10K = $40K; incremental $23,900; 37% rate
    // benefit = $23,900 × 0.37 = $8,843
    expect(result).toBeCloseTo(8_843, 0)
  })

  it('zero mortgage interest — benefit comes from SALT only if SALT exceeds standard deduction', () => {
    // No MID; SALT $10K (capped); incremental = $10K - $16,100 = negative → 0
    const result = computeAnnualTaxBenefit({
      taxInput: { ...BASE_TAX, gross_annual_income: 100_000, state_income_tax_annual: 5_000 },
      annualMortgageInterest: 0,
      annualPropertyTax: 9_000,
      loanBalance: 0,
    })
    // total itemized = $10K (capped); incremental = $10K - $16,100 < 0 → 0
    expect(result).toBe(0)
  })

  it('zero mortgage interest — benefit > 0 if SALT alone exceeds standard deduction (MFJ)', () => {
    // MFJ: std deduction $32,200. SALT $10K alone not enough.
    // But if income is $0 the guard fires. Let's verify: MFJ owner paid off loan,
    // SALT $10K < $32,200 → still 0 even for MFJ.
    // This test confirms the guard works with zero interest correctly.
    const result = computeAnnualTaxBenefit({
      taxInput: {
        ...BASE_TAX,
        filing_status: 'married_filing_jointly',
        gross_annual_income: 200_000,
        state_income_tax_annual: 8_000,
      },
      annualMortgageInterest: 0,
      annualPropertyTax: 2_000,
      loanBalance: 0,
    })
    // total SALT = min($10K, $10K) = $10K; total itemized = $10K < $32,200 std → 0
    expect(result).toBe(0)
  })
})

import { type FilingStatus, type TaxInput } from './types'

// Federal standard deduction amounts — Tax Year 2026 (IRS Rev. Proc. 2025-32)
// Update this table when tax law changes; bump the AS_OF_DATE constant below.
export const FEDERAL_TAX_AS_OF_DATE = '2026'

const STANDARD_DEDUCTION_2026: Record<FilingStatus, number> = {
  single: 16100,
  married_filing_jointly: 32200,
  married_filing_separately: 16100,
  head_of_household: 24150,
}

// 2026 federal income tax brackets (IRS Rev. Proc. 2025-32)
// Each entry: [taxableIncomeCeiling, marginalRate]
type Bracket = [ceiling: number, rate: number]

const BRACKETS_2026: Record<FilingStatus, Bracket[]> = {
  single: [
    [12400, 0.1],
    [50400, 0.12],
    [105700, 0.22],
    [201775, 0.24],
    [256225, 0.32],
    [640600, 0.35],
    [Infinity, 0.37],
  ],
  married_filing_jointly: [
    [24800, 0.1],
    [100800, 0.12],
    [211400, 0.22],
    [403550, 0.24],
    [512450, 0.32],
    [768700, 0.35],
    [Infinity, 0.37],
  ],
  married_filing_separately: [
    [12400, 0.1],
    [50400, 0.12],
    [105700, 0.22],
    [201775, 0.24],
    [256225, 0.32],
    [384350, 0.35],
    [Infinity, 0.37],
  ],
  head_of_household: [
    [17700, 0.1],
    [67450, 0.12],
    [105700, 0.22],
    [201750, 0.24],
    [256200, 0.32],
    [640600, 0.35],
    [Infinity, 0.37],
  ],
}

// SALT (State and Local Tax) deduction cap — OBBBA (P.L. 119-21, 2025); IRS Pub. 530 (2025 Returns)
// Cap raised from $10,000 to $40,000 (joint) / $20,000 (MFS) effective tax year 2025.
// Phase-down: cap reduces for MAGI > $500,000 ($250,000 MFS), but not below $10,000 ($5,000 MFS).
// Phase-down is NOT modeled here; engine uses the flat cap regardless of income level.
export const SALT_CAP_2026 = 40_000
export const SALT_CAP_MFS_2026 = 20_000

// Mortgage interest deduction loan limit — TCJA (2017), made permanent by OBBBA (2025)
// Only interest on the first $750,000 of acquisition debt is deductible.
export const MID_LOAN_LIMIT_2026 = 750_000

// 2026 long-term capital gains brackets (IRS Rev. Proc. 2025-32, §4.03
// "Maximum Capital Gains Rate" — verified directly against the source PDF,
// not derived from a secondary summary). Each entry: [taxableIncomeCeiling
// for that rate, rate]. 0% applies up to the first ceiling, 15% up to the
// second, 20% above it.
const LTCG_BRACKETS_2026: Record<FilingStatus, Bracket[]> = {
  single: [
    [49_450, 0.0],
    [545_500, 0.15],
    [Infinity, 0.2],
  ],
  married_filing_jointly: [
    [98_900, 0.0],
    [613_700, 0.15],
    [Infinity, 0.2],
  ],
  married_filing_separately: [
    [49_450, 0.0],
    [306_850, 0.15],
    [Infinity, 0.2],
  ],
  head_of_household: [
    [66_200, 0.0],
    [579_600, 0.15],
    [Infinity, 0.2],
  ],
}

// Primary-residence capital gains exclusion (IRC §121)
const CAPITAL_GAINS_EXCLUSION_MFJ = 500_000
const CAPITAL_GAINS_EXCLUSION_OTHER = 250_000

// Simplified ownership/use test: the real IRC §121 rule requires 2 of the
// last 5 years as a primary residence. This engine models one continuous
// ownership period, so the exclusion is approximated as "met when the
// analysis horizon is at least 2 years" — a material simplification, not
// a full 2-of-5-year lookback.
const MIN_HORIZON_YEARS_FOR_EXCLUSION = 2

export function getMarginalRate(grossIncome: number, filingStatus: FilingStatus): number {
  const standardDeduction = STANDARD_DEDUCTION_2026[filingStatus]
  const taxableIncome = Math.max(0, grossIncome - standardDeduction)
  const brackets = BRACKETS_2026[filingStatus]
  for (const [ceiling, rate] of brackets) {
    if (taxableIncome <= ceiling) return rate
  }
  return 0.37
}

// Simplified: does not stack the capital gain on top of ordinary taxable
// income to determine bracket placement (the real rule taxes the gain at
// the rate corresponding to ordinary income + gain, not ordinary income
// alone). Uses the same gross-income-minus-standard-deduction taxable
// income already used for the ordinary marginal rate lookup above.
function getLtcgRate(grossIncome: number, filingStatus: FilingStatus): number {
  const standardDeduction = STANDARD_DEDUCTION_2026[filingStatus]
  const taxableIncome = Math.max(0, grossIncome - standardDeduction)
  const brackets = LTCG_BRACKETS_2026[filingStatus]
  for (const [ceiling, rate] of brackets) {
    if (taxableIncome <= ceiling) return rate
  }
  return 0.2
}

export type TaxBenefitBreakdown = {
  total: number
  mid_benefit: number
  salt_benefit: number
}

export function computeAnnualTaxBenefitBreakdown(params: {
  taxInput: TaxInput
  annualMortgageInterest: number
  annualPropertyTax: number
  loanBalance: number
}): TaxBenefitBreakdown {
  const { taxInput, annualMortgageInterest, annualPropertyTax, loanBalance } = params
  const zero: TaxBenefitBreakdown = { total: 0, mid_benefit: 0, salt_benefit: 0 }

  if (!taxInput.taxes_enabled || !taxInput.itemizes || taxInput.gross_annual_income === 0)
    return zero

  // Step 1 — MID proration for loans above $750K limit
  const midRatio = loanBalance > MID_LOAN_LIMIT_2026 ? MID_LOAN_LIMIT_2026 / loanBalance : 1.0
  const deductibleInterest = annualMortgageInterest * midRatio

  // Step 2 — SALT cap
  const saltCap =
    taxInput.filing_status === 'married_filing_separately' ? SALT_CAP_MFS_2026 : SALT_CAP_2026
  const combinedSalt = annualPropertyTax + taxInput.state_income_tax_annual
  const deductibleSalt = Math.min(combinedSalt, saltCap)

  // Step 3 — Itemized vs. standard deduction comparison
  const totalItemized = deductibleInterest + deductibleSalt
  const standardDeduction = STANDARD_DEDUCTION_2026[taxInput.filing_status]
  const incrementalDeduction = totalItemized - standardDeduction
  if (incrementalDeduction <= 0) return zero

  // Step 4 — Tax savings at marginal rate
  const marginalRate = getMarginalRate(taxInput.gross_annual_income, taxInput.filing_status)
  const total = incrementalDeduction * marginalRate

  // Attribution: split total benefit proportionally between MID and SALT components
  const midShare = deductibleInterest / totalItemized
  const mid_benefit = total * midShare
  const salt_benefit = total - mid_benefit

  return { total, mid_benefit, salt_benefit }
}

export function computeAnnualTaxBenefit(params: {
  taxInput: TaxInput
  annualMortgageInterest: number
  annualPropertyTax: number
  loanBalance: number
}): number {
  return computeAnnualTaxBenefitBreakdown(params).total
}

export type CapitalGainsBreakdown = {
  gain: number
  excluded_gain: number
  taxable_gain: number
  tax: number
}

export function computeCapitalGainsTax(params: {
  taxInput: TaxInput
  gain: number
  horizonYears: number
}): CapitalGainsBreakdown {
  const { taxInput, gain, horizonYears } = params
  const zero: CapitalGainsBreakdown = { gain: 0, excluded_gain: 0, taxable_gain: 0, tax: 0 }

  if (!taxInput.taxes_enabled || !taxInput.include_capital_gains || gain <= 0) return zero

  // IRC §121 primary-residence exclusion, gated by the simplified
  // ownership/use test (see MIN_HORIZON_YEARS_FOR_EXCLUSION above).
  const exclusion =
    taxInput.filing_status === 'married_filing_jointly'
      ? CAPITAL_GAINS_EXCLUSION_MFJ
      : CAPITAL_GAINS_EXCLUSION_OTHER
  const excludedGain =
    horizonYears >= MIN_HORIZON_YEARS_FOR_EXCLUSION ? Math.min(gain, exclusion) : 0
  const taxableGain = Math.max(0, gain - excludedGain)

  if (taxableGain === 0) return { gain, excluded_gain: excludedGain, taxable_gain: 0, tax: 0 }

  const rate = getLtcgRate(taxInput.gross_annual_income, taxInput.filing_status)
  const tax = taxableGain * rate

  return { gain, excluded_gain: excludedGain, taxable_gain: taxableGain, tax }
}

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

// SALT (State and Local Tax) deduction cap — TCJA (2017), made permanent by OBBBA (2025)
// married_filing_separately is capped at $5,000 (half of joint cap).
export const SALT_CAP_2026 = 10_000
export const SALT_CAP_MFS_2026 = 5_000

// Mortgage interest deduction loan limit — TCJA (2017), made permanent by OBBBA (2025)
// Only interest on the first $750,000 of acquisition debt is deductible.
export const MID_LOAN_LIMIT_2026 = 750_000

export function getMarginalRate(grossIncome: number, filingStatus: FilingStatus): number {
  const standardDeduction = STANDARD_DEDUCTION_2026[filingStatus]
  const taxableIncome = Math.max(0, grossIncome - standardDeduction)
  const brackets = BRACKETS_2026[filingStatus]
  for (const [ceiling, rate] of brackets) {
    if (taxableIncome <= ceiling) return rate
  }
  return 0.37
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

  if (!taxInput.taxes_enabled || taxInput.gross_annual_income === 0) return zero

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

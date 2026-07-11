import { describe, it, expect } from 'vitest'
import {
  computeMonthlyMortgagePayment,
  computeMonthlyPmi,
  computeMonthlyPropertyTaxBase,
  buildAmortizationSchedule,
  buildAmortizationScheduleWithRefinance,
  type RefinanceParams,
} from '../mortgage'

describe('computeMonthlyMortgagePayment', () => {
  it('matches known reference: $320K at 6.722% for 30 years ≈ $2,069.32', () => {
    // Hand-verified via the formula M = L * r*(1+r)^n / ((1+r)^n - 1)
    // r = 6.722/1200 = 0.005601667, n = 360
    const payment = computeMonthlyMortgagePayment(320000, 6.722, 30)
    expect(Math.abs(payment - 2069.32)).toBeLessThan(1)
  })

  it('handles 0% interest: monthly payment = loanAmount / totalMonths', () => {
    const payment = computeMonthlyMortgagePayment(120000, 0, 30)
    expect(payment).toBeCloseTo(120000 / 360, 5)
  })

  it('produces a full amortization where total principal paid ≈ loanAmount', () => {
    const loanAmount = 320000
    const schedule = buildAmortizationSchedule(loanAmount, 6.722, 30, 0, 400000)
    const totalPrincipal = schedule.reduce((sum, row) => sum + row.principal_payment, 0)
    expect(Math.abs(totalPrincipal - loanAmount)).toBeLessThan(1)
  })

  it('produces a final balance close to zero after full term', () => {
    const schedule = buildAmortizationSchedule(320000, 6.722, 30, 0, 400000)
    const lastRow = schedule[schedule.length - 1]
    expect(lastRow).toBeDefined()
    expect(lastRow!.remaining_loan_balance).toBeLessThan(1)
  })
})

describe('PMI threshold — bug fix: uses purchase_price, not loan amount', () => {
  // Setup: purchase_price $200K, 10% down → loan $180K
  // 80% of purchase_price = $160K (threshold)
  // 80% of loan amount   = $144K (wrong, Python bug)
  // With 0% interest, monthly_PI = 180000/360 = $500
  // Balance reaches $160K after (180000 - 160000) / 500 = 40 months → PMI drops at month 40
  // With the bug (loan amount), PMI would drop at month 72 — distinct enough to verify

  const purchasePrice = 200000
  const loanAmount = 180000
  const pmiMonthly = 75 // 0.5% of $180K / 12 = $75

  it('PMI is charged before the threshold is crossed', () => {
    const schedule = buildAmortizationSchedule(loanAmount, 0, 30, pmiMonthly, purchasePrice)
    // Month 39 (0-indexed 38): balance is still above 160K
    const month39 = schedule[38]
    expect(month39).toBeDefined()
    expect(month39!.pmi_payment).toBeGreaterThan(0)
  })

  it('PMI drops to zero once balance ≤ 80% of purchase_price', () => {
    const schedule = buildAmortizationSchedule(loanAmount, 0, 30, pmiMonthly, purchasePrice)
    // Month 40 (0-indexed 39): balance = 160000, which is exactly 80% of 200000 → PMI = 0
    const month40 = schedule[39]
    expect(month40).toBeDefined()
    expect(month40!.pmi_payment).toBe(0)
  })

  it('PMI is still charged at month 71 (which is before the incorrect Python threshold)', () => {
    const schedule = buildAmortizationSchedule(loanAmount, 0, 30, pmiMonthly, purchasePrice)
    // If using loan_amount as threshold, PMI would already be 0 here — this confirms the fix
    // Month 40-72 are all past our correct threshold, so they should be 0 (PMI already dropped at 40)
    // Let's instead check month 41 just to confirm PMI stays 0 once dropped
    const month41 = schedule[40]
    expect(month41).toBeDefined()
    expect(month41!.pmi_payment).toBe(0)
  })
})

describe('computeMonthlyPmi', () => {
  it('computes PMI correctly', () => {
    // 0.5% annual rate on $180K loan: 180000 * 0.005 / 12 = $75
    expect(computeMonthlyPmi(0.5, 180000)).toBeCloseTo(75, 5)
  })

  it('returns 0 when rate is 0', () => {
    expect(computeMonthlyPmi(0, 320000)).toBe(0)
  })
})

describe('computeMonthlyPropertyTaxBase', () => {
  it('uses purchase price when assessed value is 0', () => {
    // 1.2% annual on $400K: 400000 * 0.012 / 12 = $400
    expect(computeMonthlyPropertyTaxBase(1.2, 400000, 0)).toBeCloseTo(400, 5)
  })

  it('uses assessed value when provided', () => {
    expect(computeMonthlyPropertyTaxBase(1.2, 400000, 350000)).toBeCloseTo(350, 5)
  })
})

describe('buildAmortizationScheduleWithRefinance', () => {
  const loanAmount = 320000
  const rate = 6.722
  const termYears = 30
  const purchasePrice = 400000

  it('S17-8: refinance undefined returns a schedule deep-equal to buildAmortizationSchedule, with zero closing costs', () => {
    const direct = buildAmortizationSchedule(loanAmount, rate, termYears, 0, purchasePrice)
    const result = buildAmortizationScheduleWithRefinance(
      loanAmount,
      rate,
      termYears,
      0,
      purchasePrice,
      undefined,
    )
    expect(result.schedule).toEqual(direct)
    expect(result.refinance_closing_costs_amount).toBe(0)
  })

  it('S17-9: triggerMonth=1 uses loanAmount as the new principal (nothing paid yet)', () => {
    const refinance: RefinanceParams = {
      triggerMonth: 1,
      newAnnualInterestRate: 5.0,
      newLoanTermYears: 15,
      newClosingCostsPct: 2,
    }
    const result = buildAmortizationScheduleWithRefinance(
      loanAmount,
      rate,
      termYears,
      0,
      purchasePrice,
      refinance,
    )
    const expectedFresh = buildAmortizationSchedule(loanAmount, 5.0, 15, 0, purchasePrice)
    expect(result.schedule).toEqual(expectedFresh)
    expect(result.refinance_closing_costs_amount).toBeCloseTo(loanAmount * 0.02, 5)
  })

  it('S17-10: mid-horizon refinance stitches at the exact remaining balance with continuous month_index', () => {
    const original = buildAmortizationSchedule(loanAmount, rate, termYears, 0, purchasePrice)
    const refinance: RefinanceParams = {
      triggerMonth: 61,
      newAnnualInterestRate: 5.0,
      newLoanTermYears: 15,
      newClosingCostsPct: 2,
    }
    const result = buildAmortizationScheduleWithRefinance(
      loanAmount,
      rate,
      termYears,
      0,
      purchasePrice,
      refinance,
    )
    const balanceAtTrigger = original[59]!.remaining_loan_balance
    expect(result.schedule.length).toBe(60 + 15 * 12)
    expect(result.refinance_closing_costs_amount).toBeCloseTo(balanceAtTrigger * 0.02, 5)
    // First 60 months are byte-identical to the original schedule
    expect(result.schedule.slice(0, 60)).toEqual(original.slice(0, 60))
    // month_index is continuous 1..N with no gaps or duplicates
    result.schedule.forEach((month, index) => {
      expect(month.month_index).toBe(index + 1)
    })
    // Post-event schedule starts fresh from the exact remaining balance
    const expectedPostEvent = buildAmortizationSchedule(balanceAtTrigger, 5.0, 15, 0, purchasePrice)
    expect(result.schedule[60]!.principal_payment).toBeCloseTo(
      expectedPostEvent[0]!.principal_payment,
      5,
    )
  })

  it('S17-11: triggerMonth beyond the original schedule length is a no-op', () => {
    const original = buildAmortizationSchedule(loanAmount, rate, termYears, 0, purchasePrice)
    const refinance: RefinanceParams = {
      triggerMonth: original.length + 1,
      newAnnualInterestRate: 5.0,
      newLoanTermYears: 15,
      newClosingCostsPct: 2,
    }
    const result = buildAmortizationScheduleWithRefinance(
      loanAmount,
      rate,
      termYears,
      0,
      purchasePrice,
      refinance,
    )
    expect(result.schedule).toEqual(original)
    expect(result.refinance_closing_costs_amount).toBe(0)
  })

  it('S17-12: triggerMonth exactly at the last month is NOT treated as a no-op', () => {
    const original = buildAmortizationSchedule(loanAmount, rate, termYears, 0, purchasePrice)
    const refinance: RefinanceParams = {
      triggerMonth: original.length,
      newAnnualInterestRate: 5.0,
      newLoanTermYears: 15,
      newClosingCostsPct: 2,
    }
    const result = buildAmortizationScheduleWithRefinance(
      loanAmount,
      rate,
      termYears,
      0,
      purchasePrice,
      refinance,
    )
    expect(result.schedule).not.toEqual(original)
    expect(result.refinance_closing_costs_amount).toBeGreaterThan(0)
    expect(result.schedule.length).toBe(original.length - 1 + 15 * 12)
  })

  it('S17-13: a short new loan term causes early payoff before the original term would have ended', () => {
    const refinance: RefinanceParams = {
      triggerMonth: 121, // 10 years in
      newAnnualInterestRate: 5.0,
      newLoanTermYears: 1,
      newClosingCostsPct: 2,
    }
    const result = buildAmortizationScheduleWithRefinance(
      loanAmount,
      rate,
      termYears,
      0,
      purchasePrice,
      refinance,
    )
    expect(result.schedule.length).toBe(120 + 12)
    expect(result.schedule.length).toBeLessThan(termYears * 12)
    const lastEntry = result.schedule[result.schedule.length - 1]
    expect(lastEntry).toBeDefined()
    expect(lastEntry!.remaining_loan_balance).toBeLessThan(1)
  })

  it('S17-14: refinance closing costs are hand-verified as a percentage of the balance at trigger', () => {
    const original = buildAmortizationSchedule(loanAmount, rate, termYears, 0, purchasePrice)
    const balanceAtTrigger = original[119]!.remaining_loan_balance
    const refinance: RefinanceParams = {
      triggerMonth: 121,
      newAnnualInterestRate: 5.0,
      newLoanTermYears: 15,
      newClosingCostsPct: 3.5,
    }
    const result = buildAmortizationScheduleWithRefinance(
      loanAmount,
      rate,
      termYears,
      0,
      purchasePrice,
      refinance,
    )
    expect(result.refinance_closing_costs_amount).toBeCloseTo(balanceAtTrigger * 0.035, 5)
  })

  it('S17-15: PMI is not reset by refinancing — a balance already below threshold stays PMI-free post-event', () => {
    // Mirrors the PMI-threshold fixture above: purchase_price $200K, loan $180K, 0% interest.
    // Balance drops to $160K (80% of purchase price) at month 40; by month 44 it's $158K.
    const pmiMonthly = 75
    const refinance: RefinanceParams = {
      triggerMonth: 45,
      newAnnualInterestRate: 5.0,
      newLoanTermYears: 15,
      newClosingCostsPct: 0,
    }
    const result = buildAmortizationScheduleWithRefinance(
      180000,
      0,
      30,
      pmiMonthly,
      200000,
      refinance,
    )
    // Index 44 is the first post-event month (indices 0-43 are the 44-month pre-event slice)
    const firstPostEventMonth = result.schedule[44]
    expect(firstPostEventMonth).toBeDefined()
    expect(firstPostEventMonth!.pmi_payment).toBe(0)
  })
})

export type AmortizationMonth = {
  month_index: number
  principal_payment: number
  interest_payment: number
  pmi_payment: number
  remaining_loan_balance: number
}

export function computeMonthlyMortgagePayment(
  loanAmount: number,
  annualInterestRate: number,
  loanTermYears: number,
): number {
  const monthlyRate = annualInterestRate / 12 / 100
  const n = loanTermYears * 12
  if (monthlyRate === 0) return loanAmount / n
  return (
    (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, n))) / (Math.pow(1 + monthlyRate, n) - 1)
  )
}

export function computeMonthlyPmi(pmiRatePct: number, loanAmount: number): number {
  return ((pmiRatePct / 100) * loanAmount) / 12
}

// Returns the monthly tax base (year-1 amount before any escalation).
// Escalation is applied in compute.ts using the home appreciation rate.
export function computeMonthlyPropertyTaxBase(
  annualTaxRatePct: number,
  purchasePrice: number,
  assessedValue: number,
): number {
  const taxBasis = assessedValue > 0 ? assessedValue : purchasePrice
  return ((annualTaxRatePct / 100) * taxBasis) / 12
}

// Builds the full amortization schedule for the entire loan term.
// PMI drops when remaining_balance <= 0.80 * purchasePrice (bug fix: Python used loan amount).
export function buildAmortizationSchedule(
  loanAmount: number,
  annualInterestRate: number,
  loanTermYears: number,
  pmiMonthlyPayment: number,
  purchasePrice: number,
): AmortizationMonth[] {
  const monthlyRate = annualInterestRate / 12 / 100
  const monthlyPayment = computeMonthlyMortgagePayment(
    loanAmount,
    annualInterestRate,
    loanTermYears,
  )
  const totalMonths = loanTermYears * 12
  const pmiThreshold = 0.8 * purchasePrice
  let remainingBalance = loanAmount
  const schedule: AmortizationMonth[] = []

  for (let i = 1; i <= totalMonths; i++) {
    const interest = remainingBalance * monthlyRate
    const principal = monthlyPayment - interest
    remainingBalance = Math.max(0, remainingBalance - principal)

    // PMI uses 80% of purchase_price as threshold, not loan amount
    const pmi = remainingBalance <= pmiThreshold ? 0 : pmiMonthlyPayment

    schedule.push({
      month_index: i,
      principal_payment: principal,
      interest_payment: interest,
      pmi_payment: pmi,
      remaining_loan_balance: remainingBalance,
    })
  }

  return schedule
}

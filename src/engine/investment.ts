// Converts an annual return rate to its monthly equivalent using exact compounding.
export function computeMonthlyInvestmentRate(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / 12) - 1
}

// Applies one month of growth: contribution is added before compounding.
// new_balance = (balance + contribution) * (1 + monthlyRate)
export function growBalance(balance: number, contribution: number, monthlyRate: number): number {
  return (balance + contribution) * (1 + monthlyRate)
}

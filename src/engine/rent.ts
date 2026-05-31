// Returns the non-refundable upfront cost for the renter.
// security_deposit and pet_deposit are refundable and excluded from costs
// (they seed an opportunity-cost calculation in compute.ts instead).
export function computeRenterUpfrontCost(adminFee: number): number {
  return adminFee
}

// Escalated value for year Y (1-based): base * (1 + rate)^(yearIndex - 1)
// Year 1 returns the base value unchanged.
export function escalate(baseValue: number, annualRate: number, yearIndex: number): number {
  return baseValue * Math.pow(1 + annualRate, yearIndex - 1)
}

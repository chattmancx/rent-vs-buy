import { describe, it, expect } from 'vitest'
import { escalate, computeRenterUpfrontCost } from '../rent'

describe('escalate', () => {
  it('returns base value unchanged in year 1', () => {
    expect(escalate(2000, 0.05, 1)).toBe(2000)
  })

  it('applies one year of escalation in year 2', () => {
    expect(escalate(2000, 0.05, 2)).toBeCloseTo(2000 * 1.05, 5)
  })

  it('compounds correctly over multiple years', () => {
    // Year 5: base * (1.05)^4
    expect(escalate(2000, 0.05, 5)).toBeCloseTo(2000 * Math.pow(1.05, 4), 5)
  })

  it('handles 0% rate — value never changes', () => {
    expect(escalate(1500, 0, 15)).toBe(1500)
  })
})

describe('computeRenterUpfrontCost', () => {
  it('returns only the admin_fee — deposits are excluded', () => {
    // security_deposit and pet_deposit are refundable; only admin_fee is a real cost
    expect(computeRenterUpfrontCost(250)).toBe(250)
  })

  it('returns 0 when there is no admin fee', () => {
    expect(computeRenterUpfrontCost(0)).toBe(0)
  })
})

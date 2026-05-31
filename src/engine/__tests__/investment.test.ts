import { describe, it, expect } from 'vitest'
import { computeMonthlyInvestmentRate, growBalance } from '../investment'

describe('computeMonthlyInvestmentRate', () => {
  it('converts 7.5% annual to the correct monthly equivalent', () => {
    // monthly = (1.075)^(1/12) - 1
    const expected = Math.pow(1.075, 1 / 12) - 1
    expect(computeMonthlyInvestmentRate(0.075)).toBeCloseTo(expected, 10)
  })

  it('returns 0 for 0% annual rate', () => {
    expect(computeMonthlyInvestmentRate(0)).toBe(0)
  })
})

describe('growBalance', () => {
  it('applies contribution before compounding', () => {
    // balance=100, contribution=50, rate=0.01 → (100+50)*1.01 = 151.5
    expect(growBalance(100, 50, 0.01)).toBeCloseTo(151.5, 5)
  })

  it('with 0% rate: balance = balance + contribution', () => {
    expect(growBalance(1000, 200, 0)).toBe(1200)
  })

  it('with no contribution: balance grows by monthly rate only', () => {
    expect(growBalance(1000, 0, 0.01)).toBeCloseTo(1010, 5)
  })

  it('compound growth for $80K seed at 7.5% annual over 30 years (no contributions)', () => {
    // After 360 months: balance = 80000 * ((1.075)^(1/12))^360 = 80000 * (1.075)^30
    // This verifies the monthly compounding formula is internally consistent.
    const monthlyRate = computeMonthlyInvestmentRate(0.075)
    let balance = 80000
    for (let i = 0; i < 360; i++) {
      balance = growBalance(balance, 0, monthlyRate)
    }
    // Expected = 80000 * (1.075)^30 — derived from the formula, not from running the engine
    const expected = 80000 * Math.pow(1.075, 30)
    expect(Math.abs(balance - expected)).toBeLessThan(1)
  })

  it('invest_vs_spend_ratio = 0: investment balance stays at seed despite differential', () => {
    // With ratio=0, no contributions ever flow in; seed just compounds
    const monthlyRate = computeMonthlyInvestmentRate(0.07)
    let balance = 10000
    for (let i = 0; i < 12; i++) {
      // contribution = differential * 0 = 0
      balance = growBalance(balance, 0, monthlyRate)
    }
    // Should equal 10000 * (1.07)^1 (one year of growth, no contributions)
    expect(balance).toBeCloseTo(10000 * 1.07, 0)
  })
})

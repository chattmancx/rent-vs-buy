import { describe, it, expect } from 'vitest'
import { deflate, deflateIfEnabled } from '../inflation'

describe('deflate', () => {
  it('INF-1: returns the input unchanged at year 0 (no discount)', () => {
    expect(deflate(1000, 0.03, 0)).toBe(1000)
  })

  it('INF-2: matches the hand-computed value (1000 / 1.03^10 = 744.09...)', () => {
    expect(deflate(1000, 0.03, 10)).toBeCloseTo(744.093914896725, 6)
  })

  it('INF-3: returns the input unchanged for any years when inflationRate is 0', () => {
    expect(deflate(1000, 0, 0)).toBe(1000)
    expect(deflate(1000, 0, 15)).toBe(1000)
    expect(deflate(1000, 0, 30)).toBe(1000)
  })
})

describe('deflateIfEnabled', () => {
  it('INF-4: returns the nominal value unchanged when realDollars is false', () => {
    expect(deflateIfEnabled(1000, false, 0.03, 10)).toBe(1000)
  })

  it('INF-5: returns the deflated value when realDollars is true', () => {
    expect(deflateIfEnabled(1000, true, 0.03, 10)).toBeCloseTo(744.093914896725, 6)
  })
})

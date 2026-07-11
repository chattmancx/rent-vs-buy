import { describe, it, expect } from 'vitest'
import { formatCurrencyCompact, computeXAxisInterval } from '../format'

describe('formatCurrencyCompact', () => {
  it('formats sub-thousand as integer dollars', () => {
    expect(formatCurrencyCompact(0)).toBe('$0')
    expect(formatCurrencyCompact(500)).toBe('$500')
    expect(formatCurrencyCompact(999)).toBe('$999')
  })

  it('formats thousands with K suffix', () => {
    expect(formatCurrencyCompact(1000)).toBe('$1K')
    expect(formatCurrencyCompact(1500)).toBe('$1.5K')
    expect(formatCurrencyCompact(550000)).toBe('$550K')
  })

  it('omits decimal when K value is whole', () => {
    expect(formatCurrencyCompact(2000)).toBe('$2K')
    expect(formatCurrencyCompact(10000)).toBe('$10K')
  })

  it('formats millions with M suffix', () => {
    expect(formatCurrencyCompact(1000000)).toBe('$1M')
    expect(formatCurrencyCompact(1200000)).toBe('$1.2M')
    expect(formatCurrencyCompact(2000000)).toBe('$2M')
  })

  it('handles negative values', () => {
    expect(formatCurrencyCompact(-550000)).toBe('-$550K')
    expect(formatCurrencyCompact(-1200000)).toBe('-$1.2M')
    expect(formatCurrencyCompact(-500)).toBe('-$500')
  })
})

describe('computeXAxisInterval', () => {
  it('is a no-op (shows every tick) at or below the default max of 15', () => {
    expect(computeXAxisInterval(1)).toBe(0)
    expect(computeXAxisInterval(10)).toBe(0)
    expect(computeXAxisInterval(15)).toBe(0)
  })

  it('shows every other tick at 30 points (~15 labels)', () => {
    expect(computeXAxisInterval(30)).toBe(1)
  })

  it('shows every third tick at 40 points (~14 labels)', () => {
    expect(computeXAxisInterval(40)).toBe(2)
  })

  it('respects a custom maxLabels', () => {
    expect(computeXAxisInterval(20, 10)).toBe(1)
    expect(computeXAxisInterval(10, 10)).toBe(0)
  })
})

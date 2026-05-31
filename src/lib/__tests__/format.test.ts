import { describe, it, expect } from 'vitest'
import { formatCurrencyCompact } from '../format'

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

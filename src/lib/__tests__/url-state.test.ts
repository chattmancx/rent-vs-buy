import { describe, it, expect } from 'vitest'
import { encode, decode } from '../url-state'
import { DEFAULT_INPUT } from '../defaults'

describe('encode / decode', () => {
  it('round-trips DEFAULT_INPUT', () => {
    const result = decode(encode(DEFAULT_INPUT))
    expect(result).toEqual(DEFAULT_INPUT)
  })

  it('round-trips with non-default values', () => {
    const custom = {
      ...DEFAULT_INPUT,
      ownership: { ...DEFAULT_INPUT.ownership, purchase_price: 750000 },
      rental: { ...DEFAULT_INPUT.rental, base_rent_monthly: 3200 },
      shared: { ...DEFAULT_INPUT.shared, horizon_years: 15 },
    }
    const result = decode(encode(custom))
    expect(result).toEqual(custom)
  })

  it('returns null for empty string', () => {
    expect(decode('')).toBeNull()
  })

  it('returns null for valid base64 that decodes to non-JSON', () => {
    const notJson = btoa(encodeURIComponent('not valid json {{{'))
    expect(decode(notJson)).toBeNull()
  })

  it('returns null for valid JSON failing schema validation (horizon_years: 0)', () => {
    const bad = { ...DEFAULT_INPUT, shared: { ...DEFAULT_INPUT.shared, horizon_years: 0 } }
    const encoded = btoa(encodeURIComponent(JSON.stringify(bad)))
    expect(decode(encoded)).toBeNull()
  })

  it('returns null for valid JSON with null field', () => {
    const bad = {
      ...DEFAULT_INPUT,
      ownership: { ...DEFAULT_INPUT.ownership, purchase_price: null },
    }
    const encoded = btoa(encodeURIComponent(JSON.stringify(bad)))
    expect(decode(encoded)).toBeNull()
  })

  it('does not throw for any failure case', () => {
    expect(() => decode('')).not.toThrow()
    expect(() => decode('not-base64!!!')).not.toThrow()
    expect(() => decode(btoa(encodeURIComponent('{}')))).not.toThrow()
  })
})

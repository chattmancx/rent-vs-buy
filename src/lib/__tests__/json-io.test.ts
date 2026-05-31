import { describe, it, expect } from 'vitest'
import { exportToJson, importFromJson } from '../json-io'
import { DEFAULT_INPUT } from '../defaults'

describe('exportToJson', () => {
  it('returns a valid JSON string', () => {
    const json = exportToJson(DEFAULT_INPUT)
    expect(() => JSON.parse(json)).not.toThrow()
  })
})

describe('importFromJson', () => {
  it('round-trips DEFAULT_INPUT through export and import', () => {
    const json = exportToJson(DEFAULT_INPUT)
    const result = importFromJson(json)
    expect(result).toEqual(DEFAULT_INPUT)
  })

  it('returns null for invalid JSON', () => {
    expect(importFromJson('not valid json {')).toBeNull()
  })

  it('returns null for valid JSON that fails schema validation (empty object)', () => {
    expect(importFromJson('{}')).toBeNull()
  })

  it('returns null when a required numeric field is out of range', () => {
    const bad = {
      ...DEFAULT_INPUT,
      shared: { ...DEFAULT_INPUT.shared, horizon_years: 99 },
    }
    expect(importFromJson(JSON.stringify(bad))).toBeNull()
  })
})

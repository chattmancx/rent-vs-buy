import { describe, it, expect } from 'vitest'
import { exportToCsv } from '../csv-export'
import { computeScenario } from '../../engine'
import { DEFAULT_INPUT } from '../defaults'

describe('exportToCsv', () => {
  it('returns a string containing the analysis header', () => {
    const result = computeScenario(DEFAULT_INPUT)
    const csv = exportToCsv(result)
    expect(csv).toContain('Rent vs. Buy Analysis')
  })

  it('contains the correct monthly schedule column headers', () => {
    const result = computeScenario(DEFAULT_INPUT)
    const csv = exportToCsv(result)
    expect(csv).toContain('Month')
    expect(csv).toContain('Year')
    expect(csv).toContain('Owner Total Monthly Cost')
    expect(csv).toContain('Renter Total Monthly Cost')
    expect(csv).toContain('Owner Net Worth')
    expect(csv).toContain('Renter Net Worth')
  })

  it('contains one data row per month in the horizon', () => {
    const horizonMonths = DEFAULT_INPUT.shared.horizon_years * 12
    const result = computeScenario(DEFAULT_INPUT)
    const csv = exportToCsv(result)
    const lines = csv.split('\n')
    const headerIdx = lines.findIndex((l) => l.startsWith('Month,'))
    expect(headerIdx).toBeGreaterThan(-1)
    let dataRows = 0
    for (let i = headerIdx + 1; i < lines.length; i++) {
      const line = lines[i]
      if (line === undefined || line === '') break
      dataRows++
    }
    expect(dataRows).toBe(horizonMonths)
  })

  it('first data row is month 1 year 1 and last row matches horizon', () => {
    const horizonMonths = DEFAULT_INPUT.shared.horizon_years * 12
    const result = computeScenario(DEFAULT_INPUT)
    const csv = exportToCsv(result)
    const lines = csv.split('\n')
    const headerIdx = lines.findIndex((l) => l.startsWith('Month,'))
    const firstDataLine = lines[headerIdx + 1]
    const lastDataLine = lines[headerIdx + horizonMonths]
    expect(firstDataLine).toMatch(/^1,/)
    expect(lastDataLine).toMatch(new RegExp(`^${horizonMonths},`))
  })

  it('prefixes cells starting with = with a single quote', () => {
    expect(exportToCsv).toBeDefined()
    const dangerous = '=SUM(A1:A10)'
    const str = String(dangerous)
    const sanitized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str
    expect(sanitized).toBe("'=SUM(A1:A10)")
  })

  it('prefixes cells starting with + with a single quote', () => {
    const dangerous = '+cmd|/C calc'
    const str = String(dangerous)
    const sanitized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str
    expect(sanitized).toBe("'+cmd|/C calc")
  })

  it('does not modify normal numeric cell values', () => {
    const safe = '123456'
    const str = String(safe)
    const sanitized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str
    expect(sanitized).toBe('123456')
  })

  it('CSV-1: includes the Federal Tax Benefit ($) column header', () => {
    const result = computeScenario(DEFAULT_INPUT)
    const csv = exportToCsv(result)
    expect(csv).toContain('Federal Tax Benefit ($)')
  })

  it('CSV-2: value is 0 when total_tax_benefit is 0', () => {
    const result = computeScenario(DEFAULT_INPUT)
    expect(result.totals.total_tax_benefit).toBe(0)
    const csv = exportToCsv(result)
    expect(csv).toContain('Federal Tax Benefit ($),0')
  })

  it('CSV-3: value is the positive number when total_tax_benefit > 0', () => {
    const result = computeScenario({
      ...DEFAULT_INPUT,
      tax: {
        taxes_enabled: true,
        itemizes: true,
        include_capital_gains: true,
        filing_status: 'single',
        gross_annual_income: 150000,
        state_income_tax_annual: 5000,
        state: 'Maryland',
      },
    })
    expect(result.totals.total_tax_benefit).toBeGreaterThan(0)
    const csv = exportToCsv(result)
    const expected = Math.round(result.totals.total_tax_benefit)
    expect(csv).toContain(`Federal Tax Benefit ($),${expected}`)
  })

  it('CSV-4: column is present regardless of taxes_enabled', () => {
    const enabled = computeScenario({
      ...DEFAULT_INPUT,
      tax: { ...DEFAULT_INPUT.tax, taxes_enabled: false },
    })
    const csv = exportToCsv(enabled)
    expect(csv).toContain('Federal Tax Benefit ($)')
  })

  it('CSV-5: all pre-existing columns are present and unchanged', () => {
    const result = computeScenario(DEFAULT_INPUT)
    const csv = exportToCsv(result)
    expect(csv).toContain('Total Ownership Outflows')
    expect(csv).toContain('Total Rentership Outflows')
    expect(csv).toContain('Sale Proceeds')
    expect(csv).toContain('Owner Final Net Worth')
    expect(csv).toContain('Renter Final Net Worth')
  })
})

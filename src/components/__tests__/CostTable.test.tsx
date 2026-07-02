import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CostTable } from '../CostTable'
import { computeScenario } from '../../engine'
import { DEFAULT_INPUT } from '../../lib/defaults'
import { formatCurrency } from '../../lib/format'
import { deflate } from '../../lib/inflation'

const result = computeScenario(DEFAULT_INPUT)

const realDollarsResult = computeScenario({
  ...DEFAULT_INPUT,
  shared: { ...DEFAULT_INPUT.shared, real_dollars: true, inflation_rate: 0.03 },
})

const taxResult = computeScenario({
  ...DEFAULT_INPUT,
  tax: {
    taxes_enabled: true,
    itemizes: true,
    filing_status: 'single',
    gross_annual_income: 150000,
    state_income_tax_annual: 5000,
    state: 'Maryland',
    include_capital_gains: true,
  },
})

const taxDisabledZeroBenefitResult = computeScenario({
  ...DEFAULT_INPUT,
  tax: {
    taxes_enabled: true,
    itemizes: false,
    filing_status: 'single',
    gross_annual_income: 150000,
    state_income_tax_annual: 5000,
    state: 'Maryland',
    include_capital_gains: true,
  },
})

// Longer horizon than `taxResult` so the sale-year gain (~$565K) clears the
// $250K single exclusion and leaves a nonzero taxable gain — `taxResult`'s
// 10-year gain (~$203K) stays fully excluded, so it can't exercise the
// capital-gains-tax row.
const capitalGainsResult = computeScenario({
  ...DEFAULT_INPUT,
  shared: { ...DEFAULT_INPUT.shared, horizon_years: 20 },
  tax: {
    taxes_enabled: true,
    itemizes: true,
    filing_status: 'single',
    gross_annual_income: 150000,
    state_income_tax_annual: 5000,
    state: 'Maryland',
    include_capital_gains: true,
  },
})

describe('CostTable', () => {
  it('renders Buying and Renting column headers', () => {
    render(<CostTable result={result} />)
    expect(screen.getByText('Buying')).toBeTruthy()
    expect(screen.getByText('Renting')).toBeTruthy()
  })

  it('renders the Final net worth row', () => {
    render(<CostTable result={result} />)
    expect(screen.getByText('Final net worth')).toBeTruthy()
  })

  it('renders formatted currency values containing $', () => {
    render(<CostTable result={result} />)
    const cells = screen.getAllByText(/\$[\d,]+/)
    expect(cells.length).toBeGreaterThan(0)
  })

  it('highlights the winning side net worth with a signal color', () => {
    render(<CostTable result={result} />)
    const highlighted = document.querySelectorAll('.text-signal-buy, .text-signal-rent')
    expect(highlighted.length).toBeGreaterThan(0)
  })

  it('shows em dash for cells with no value on that side', () => {
    render(<CostTable result={result} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('column headers have scope="col"', () => {
    render(<CostTable result={result} />)
    const headers = document.querySelectorAll('th[scope="col"]')
    expect(headers.length).toBe(3)
  })

  it('CT-1: does not render Federal tax benefit row when taxes_enabled is false', () => {
    render(<CostTable result={result} />)
    expect(screen.queryByText('Federal tax benefit')).toBeNull()
  })

  it('CT-2: does not render Federal tax benefit row when total_tax_benefit is 0', () => {
    expect(taxDisabledZeroBenefitResult.totals.total_tax_benefit).toBe(0)
    render(<CostTable result={taxDisabledZeroBenefitResult} />)
    expect(screen.queryByText('Federal tax benefit')).toBeNull()
  })

  it('CT-3: renders Federal tax benefit row when taxes_enabled and total_tax_benefit > 0', () => {
    expect(taxResult.totals.total_tax_benefit).toBeGreaterThan(0)
    render(<CostTable result={taxResult} />)
    expect(screen.getByText('Federal tax benefit')).toBeTruthy()
  })

  it('CT-4: row label reads "Federal tax benefit"', () => {
    render(<CostTable result={taxResult} />)
    expect(screen.getByText('Federal tax benefit')).toBeTruthy()
  })

  it('CT-5: row displays value as a negative cost', () => {
    render(<CostTable result={taxResult} />)
    const label = screen.getByText('Federal tax benefit')
    const row = label.closest('tr')
    expect(row?.textContent).toMatch(/-\$[\d,]+/)
  })

  it('CT-6: row uses the signal-benefit color class', () => {
    render(<CostTable result={taxResult} />)
    const label = screen.getByText('Federal tax benefit')
    expect(label.className).toMatch(/text-signal-benefit/)
  })

  it('CT-7: row does not render an asterisk or footnote marker', () => {
    render(<CostTable result={taxResult} />)
    const label = screen.getByText('Federal tax benefit')
    const row = label.closest('tr')
    expect(row?.textContent).not.toMatch(/[*†]/)
  })

  it('CT-8: other rows are unaffected', () => {
    render(<CostTable result={taxResult} />)
    expect(screen.getByText('Final net worth')).toBeTruthy()
  })

  it('CT-9: value is formatted as currency matching the rest of the table', () => {
    render(<CostTable result={taxResult} />)
    const label = screen.getByText('Federal tax benefit')
    const row = label.closest('tr')
    expect(row?.textContent).toMatch(/-\$[\d,]+/)
  })

  it('CT-10: row is positioned before the ownership total row', () => {
    render(<CostTable result={taxResult} />)
    const rows = Array.from(document.querySelectorAll('tbody tr'))
    const taxBenefitIdx = rows.findIndex((r) => r.textContent?.includes('Federal tax benefit'))
    const totalOutflowsIdx = rows.findIndex((r) => r.textContent?.includes('Total outflows'))
    expect(taxBenefitIdx).toBeGreaterThan(-1)
    expect(totalOutflowsIdx).toBeGreaterThan(-1)
    expect(taxBenefitIdx).toBeLessThan(totalOutflowsIdx)
  })

  it('CG-12: "Capital gains tax" row renders when taxes_enabled and total_capital_gains_tax > 0', () => {
    expect(capitalGainsResult.totals.total_capital_gains_tax).toBeGreaterThan(0)
    render(<CostTable result={capitalGainsResult} />)
    expect(screen.getByText('Capital gains tax')).toBeTruthy()
  })

  it('CG-13: row absent when taxes_enabled is false', () => {
    render(<CostTable result={result} />)
    expect(screen.queryByText('Capital gains tax')).toBeNull()
  })

  it('CG-14: row absent when total_capital_gains_tax is 0 (fully excluded case)', () => {
    expect(taxResult.totals.total_capital_gains_tax).toBe(0)
    render(<CostTable result={taxResult} />)
    expect(screen.queryByText('Capital gains tax')).toBeNull()
  })

  it('CG-15: row displays as a positive cost (no negative sign), formatted as currency', () => {
    render(<CostTable result={capitalGainsResult} />)
    const label = screen.getByText('Capital gains tax')
    const row = label.closest('tr')
    expect(row?.textContent).toMatch(/\$[\d,]+/)
    expect(row?.textContent).not.toMatch(/-\$[\d,]+/)
  })

  it('CG-16: row is positioned after Sale proceeds, before Investment portfolio', () => {
    render(<CostTable result={capitalGainsResult} />)
    const rows = Array.from(document.querySelectorAll('tbody tr'))
    const saleProceedsIdx = rows.findIndex((r) => r.textContent?.includes('Sale proceeds'))
    const capitalGainsIdx = rows.findIndex((r) => r.textContent?.includes('Capital gains tax'))
    const investmentIdx = rows.findIndex((r) => r.textContent?.includes('Investment portfolio'))
    expect(saleProceedsIdx).toBeGreaterThan(-1)
    expect(capitalGainsIdx).toBeGreaterThan(-1)
    expect(investmentIdx).toBeGreaterThan(-1)
    expect(saleProceedsIdx).toBeLessThan(capitalGainsIdx)
    expect(capitalGainsIdx).toBeLessThan(investmentIdx)
  })

  it('INF-11: "Final net worth" (point-in-time) is deflated when real_dollars is true', () => {
    render(<CostTable result={realDollarsResult} />)
    const expected = formatCurrency(
      deflate(
        realDollarsResult.totals.owner_final_net_worth,
        0.03,
        realDollarsResult.inputs.shared.horizon_years,
      ),
    )
    const row = screen.getByText('Final net worth').closest('tr')
    expect(row?.textContent).toContain(expected)
  })

  it('INF-12: "Mortgage interest" (summed outflow) stays nominal when real_dollars is true', () => {
    render(<CostTable result={realDollarsResult} />)
    const row = screen.getByText('Mortgage interest').closest('tr')
    expect(row?.textContent).toContain(formatCurrency(realDollarsResult.totals.total_interest_paid))
  })

  it('INF-13: footnote is absent when real_dollars is false', () => {
    render(<CostTable result={result} />)
    expect(screen.queryByText(/nominal dollars/)).toBeNull()
  })

  it('INF-14: footnote renders when real_dollars is true', () => {
    render(<CostTable result={realDollarsResult} />)
    expect(screen.getByText(/nominal dollars/)).toBeTruthy()
  })
})

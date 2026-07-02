import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HeadlineResult } from '../HeadlineResult'
import { computeScenario, FEDERAL_TAX_AS_OF_DATE } from '../../engine'
import { DEFAULT_INPUT } from '../../lib/defaults'

const result = computeScenario(DEFAULT_INPUT)

const tieResult = {
  ...result,
  verdict: { ...result.verdict, winner: 'tie' as const, margin_usd: 0 },
}

const taxEnabledResult = {
  ...result,
  inputs: { ...result.inputs, tax: { ...result.inputs.tax, taxes_enabled: true } },
}

describe('HeadlineResult', () => {
  it('renders the winner word from the verdict', () => {
    render(<HeadlineResult result={result} />)
    expect(screen.getByText(result.verdict.winner === 'buying' ? 'buying' : 'renting')).toBeTruthy()
  })

  it('renders the horizon years', () => {
    render(<HeadlineResult result={result} />)
    expect(screen.getByText(String(result.inputs.shared.horizon_years))).toBeTruthy()
  })

  it('renders a formatted dollar amount for non-tie verdicts', () => {
    render(<HeadlineResult result={result} />)
    expect(screen.getByText(/\$[\d,]+/).textContent).toMatch(/\$[\d,]+/)
  })

  it('does not render a dollar amount when winner is tie', () => {
    render(<HeadlineResult result={tieResult} />)
    expect(screen.getByText(/essentially even/)).toBeTruthy()
    expect(screen.queryByText(/wins by/)).toBeNull()
  })

  it('HR-1: disclosure note is absent when taxes_enabled is false', () => {
    render(<HeadlineResult result={result} />)
    expect(screen.queryByText(/IRS tables/)).toBeNull()
  })

  it('HR-2: disclosure note renders when taxes_enabled is true', () => {
    render(<HeadlineResult result={taxEnabledResult} />)
    expect(screen.getByText(/IRS tables/)).toBeTruthy()
  })

  it('HR-3: disclosure note contains the FEDERAL_TAX_AS_OF_DATE value', () => {
    render(<HeadlineResult result={taxEnabledResult} />)
    expect(screen.getByText(new RegExp(FEDERAL_TAX_AS_OF_DATE))).toBeTruthy()
  })

  it('HR-4: disclosure note does not contain a hyperlink', () => {
    render(<HeadlineResult result={taxEnabledResult} />)
    const note = screen.getByText(/IRS tables/)
    expect(note.querySelector('a')).toBeNull()
    expect(note.closest('a')).toBeNull()
  })

  it('HR-5: disclosure note uses small, muted typography', () => {
    render(<HeadlineResult result={taxEnabledResult} />)
    const note = screen.getByText(/IRS tables/)
    expect(note.className).toMatch(/text-xs/)
    expect(note.className).toMatch(/text-gray-500/)
  })
})

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HeadlineResult } from '../HeadlineResult'
import { computeScenario } from '../../engine'
import { DEFAULT_INPUT } from '../../lib/defaults'

const result = computeScenario(DEFAULT_INPUT)

const tieResult = {
  ...result,
  verdict: { ...result.verdict, winner: 'tie' as const, margin_usd: 0 },
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
})

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SensitivityStrip } from '../SensitivityStrip'
import { computeScenario } from '../../engine'
import { DEFAULT_INPUT } from '../../lib/defaults'

describe('SensitivityStrip', () => {
  it('renders heading without crashing', () => {
    const result = computeScenario(DEFAULT_INPUT)
    render(<SensitivityStrip input={DEFAULT_INPUT} result={result} />)
    expect(screen.getByText('Sensitivity: ±1pp Change')).toBeTruthy()
  })

  it('renders all four card labels', () => {
    const result = computeScenario(DEFAULT_INPUT)
    render(<SensitivityStrip input={DEFAULT_INPUT} result={result} />)
    expect(screen.getByText('Interest Rate')).toBeTruthy()
    expect(screen.getByText('Home Appreciation')).toBeTruthy()
    expect(screen.getByText('Investment Return')).toBeTruthy()
    expect(screen.getByText('Rent Growth')).toBeTruthy()
  })

  it('renders four +1pp and four -1pp row labels', () => {
    const result = computeScenario(DEFAULT_INPUT)
    render(<SensitivityStrip input={DEFAULT_INPUT} result={result} />)
    expect(screen.getAllByText('+1pp')).toHaveLength(4)
    expect(screen.getAllByText('-1pp')).toHaveLength(4)
  })

  it('renders formatted delta values containing $ sign', () => {
    const result = computeScenario(DEFAULT_INPUT)
    render(<SensitivityStrip input={DEFAULT_INPUT} result={result} />)
    const dollarValues = screen.getAllByText(/[+-]\$[\d,]+/)
    expect(dollarValues.length).toBeGreaterThan(0)
  })

  it('applies green or red color classes to non-zero deltas', () => {
    const result = computeScenario(DEFAULT_INPUT)
    render(<SensitivityStrip input={DEFAULT_INPUT} result={result} />)
    const greenCount = document.querySelectorAll('.text-green-600').length
    const redCount = document.querySelectorAll('.text-red-600').length
    expect(greenCount + redCount).toBeGreaterThan(0)
  })

  it('updates delta values when result changes', () => {
    const result1 = computeScenario(DEFAULT_INPUT)
    const result2 = computeScenario({
      ...DEFAULT_INPUT,
      shared: { ...DEFAULT_INPUT.shared, horizon_years: 20 },
    })
    const { rerender } = render(<SensitivityStrip input={DEFAULT_INPUT} result={result1} />)
    const initial = screen.getAllByText(/[+-]\$[\d,]+/).map((el) => el.textContent)
    rerender(<SensitivityStrip input={DEFAULT_INPUT} result={result2} />)
    const updated = screen.getAllByText(/[+-]\$[\d,]+/).map((el) => el.textContent)
    expect(initial).not.toEqual(updated)
  })
})

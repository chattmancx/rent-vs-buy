import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { BreakEvenChart } from '../BreakEvenChart'
import { computeScenario } from '../../engine'
import { DEFAULT_INPUT } from '../../lib/defaults'

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  }
})

beforeEach(() => {
  Object.defineProperty(window, 'location', { value: { search: '' }, writable: true })
  vi.spyOn(history, 'replaceState').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('BreakEvenChart', () => {
  it('renders heading without crashing', () => {
    const result = computeScenario(DEFAULT_INPUT)
    const updateShared = vi.fn()
    render(<BreakEvenChart result={result} updateShared={updateShared} />)
    expect(screen.getByText('Net Worth Over Time')).toBeTruthy()
  })

  it('renders the chart horizon slider', () => {
    const result = computeScenario(DEFAULT_INPUT)
    const updateShared = vi.fn()
    render(<BreakEvenChart result={result} updateShared={updateShared} />)
    expect(screen.getByRole('slider', { name: /chart horizon/i })).toBeTruthy()
  })

  it('calls updateShared with new horizon_years when slider changes', () => {
    const result = computeScenario(DEFAULT_INPUT)
    const updateShared = vi.fn()
    render(<BreakEvenChart result={result} updateShared={updateShared} />)
    const slider = screen.getByRole('slider', { name: /chart horizon/i })
    fireEvent.change(slider, { target: { value: '15' } })
    expect(updateShared).toHaveBeenCalledWith({ horizon_years: 15 })
  })

  it('slider value reflects current horizon_years', () => {
    const result = computeScenario(DEFAULT_INPUT)
    const updateShared = vi.fn()
    render(<BreakEvenChart result={result} updateShared={updateShared} />)
    const slider = screen.getByRole('slider', { name: /chart horizon/i }) as HTMLInputElement
    expect(slider.value).toBe(String(DEFAULT_INPUT.shared.horizon_years))
  })

  it('does not show Break-even text when one side always leads', () => {
    // High purchase price scenario: renting wins the full horizon with no crossover
    const rentingWinsInput = {
      ...DEFAULT_INPUT,
      ownership: { ...DEFAULT_INPUT.ownership, purchase_price: 900000, interest_rate: 7.5 },
      rental: { ...DEFAULT_INPUT.rental, base_rent_monthly: 2000 },
      shared: { ...DEFAULT_INPUT.shared, horizon_years: 5 },
    }
    const result = computeScenario(rentingWinsInput)
    const updateShared = vi.fn()
    render(<BreakEvenChart result={result} updateShared={updateShared} />)
    expect(screen.queryByText('Break-even')).toBeNull()
  })
})

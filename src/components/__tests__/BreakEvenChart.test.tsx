import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { BreakEvenChart } from '../BreakEvenChart'
import { computeScenario } from '../../engine'
import { DEFAULT_INPUT } from '../../lib/defaults'
import { deflate } from '../../lib/inflation'

type ChartPoint = { year: number; owner: number; renter: number }
let capturedChartData: ChartPoint[] = []

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    LineChart: (props: { data: ChartPoint[] } & Record<string, unknown>) => {
      capturedChartData = props.data
      const ActualLineChart = actual.LineChart
      return <ActualLineChart {...props} />
    },
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

  it('INF-9: chart data points are deflated per-year when real_dollars is true, not by a flat multiplier', () => {
    const nominalResult = computeScenario({
      ...DEFAULT_INPUT,
      shared: { ...DEFAULT_INPUT.shared, horizon_years: 10 },
    })
    const updateShared = vi.fn()
    render(<BreakEvenChart result={nominalResult} updateShared={updateShared} />)
    const nominalData = capturedChartData
    const nominalYear3 = nominalData.find((p) => p.year === 3)
    const nominalYear9 = nominalData.find((p) => p.year === 9)
    expect(nominalYear3).toBeDefined()
    expect(nominalYear9).toBeDefined()

    const realResult = {
      ...nominalResult,
      inputs: {
        ...nominalResult.inputs,
        shared: { ...nominalResult.inputs.shared, real_dollars: true, inflation_rate: 0.03 },
      },
    }
    render(<BreakEvenChart result={realResult} updateShared={updateShared} />)
    const realData = capturedChartData
    const realYear3 = realData.find((p) => p.year === 3)
    const realYear9 = realData.find((p) => p.year === 9)

    expect(realYear3?.owner).toBeCloseTo(deflate(nominalYear3!.owner, 0.03, 3), 6)
    expect(realYear9?.owner).toBeCloseTo(deflate(nominalYear9!.owner, 0.03, 9), 6)
  })

  it('INF-10: chart reproduces nominal values when real_dollars is false', () => {
    const result = computeScenario(DEFAULT_INPUT)
    const updateShared = vi.fn()
    render(<BreakEvenChart result={result} updateShared={updateShared} />)
    expect(capturedChartData).toEqual(
      result.yearly_summary.map((row) => ({
        year: row.year,
        owner: row.owner_net_worth,
        renter: row.renter_net_worth,
      })),
    )
  })
})

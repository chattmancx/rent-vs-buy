import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React, { isValidElement, type ReactNode } from 'react'
import { Legend } from 'recharts'
import { CostsOverTimeChart } from '../CostsOverTimeChart'
import { computeScenario } from '../../engine'
import { DEFAULT_INPUT } from '../../lib/defaults'
import { deflate } from '../../lib/inflation'

type ChartPoint = { year: number; owner: number; renter: number }
type LegendFormatter = (value: string) => string
let capturedChartData: ChartPoint[] = []
let capturedChildren: ReactNode

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    LineChart: (props: { data: ChartPoint[]; children: ReactNode } & Record<string, unknown>) => {
      capturedChartData = props.data
      capturedChildren = props.children
      const ActualLineChart = actual.LineChart
      return <ActualLineChart {...props} />
    },
  }
})

function findLegendFormatter(children: ReactNode): LegendFormatter | undefined {
  const match = React.Children.toArray(children).find(
    (child) => isValidElement(child) && child.type === Legend,
  )
  if (!match || !isValidElement(match)) return undefined
  return (match.props as { formatter: LegendFormatter }).formatter
}

describe('CostsOverTimeChart', () => {
  it('S16-1: renders without crashing', () => {
    const result = computeScenario(DEFAULT_INPUT)
    render(<CostsOverTimeChart result={result} />)
    expect(screen.getByRole('img')).toBeTruthy()
  })

  it('S16-2: chart reproduces nominal cost values when real_dollars is false', () => {
    const result = computeScenario(DEFAULT_INPUT)
    render(<CostsOverTimeChart result={result} />)
    expect(capturedChartData).toEqual(
      result.yearly_summary.map((row) => ({
        year: row.year,
        owner: row.owner_costs_this_year,
        renter: row.renter_costs_this_year,
      })),
    )
  })

  it('S16-3: chart data points are deflated per-year when real_dollars is true', () => {
    const nominalResult = computeScenario({
      ...DEFAULT_INPUT,
      shared: { ...DEFAULT_INPUT.shared, horizon_years: 10 },
    })
    render(<CostsOverTimeChart result={nominalResult} />)
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
    render(<CostsOverTimeChart result={realResult} />)
    const realData = capturedChartData
    const realYear3 = realData.find((p) => p.year === 3)
    const realYear9 = realData.find((p) => p.year === 9)

    expect(realYear3?.owner).toBeCloseTo(deflate(nominalYear3!.owner, 0.03, 3), 6)
    expect(realYear9?.owner).toBeCloseTo(deflate(nominalYear9!.owner, 0.03, 9), 6)
  })

  it('S16-4: legend formatter maps owner to Buying and renter to Renting', () => {
    const result = computeScenario(DEFAULT_INPUT)
    render(<CostsOverTimeChart result={result} />)
    const formatter = findLegendFormatter(capturedChildren)
    expect(formatter?.('owner')).toBe('Buying')
    expect(formatter?.('renter')).toBe('Renting')
  })

  it('S17-26: a refinance scenario is reflected in the chart with zero code changes to this component — year 1 unaffected, later years reflect the new rate', () => {
    const refinanceInput = {
      ...DEFAULT_INPUT,
      ownership: {
        ...DEFAULT_INPUT.ownership,
        refinance_enabled: true,
        refinance_trigger_month: 13, // takes effect at the start of year 2
        refinance_new_interest_rate: 3.0,
        refinance_new_loan_term_years: 25,
        refinance_closing_costs_pct: 2.0,
      },
      shared: { ...DEFAULT_INPUT.shared, horizon_years: 5 },
    }
    const noRefinanceInput = {
      ...refinanceInput,
      ownership: { ...refinanceInput.ownership, refinance_enabled: false },
    }
    const refinanceResult = computeScenario(refinanceInput)
    const noRefinanceResult = computeScenario(noRefinanceInput)

    render(<CostsOverTimeChart result={refinanceResult} />)
    const refinanceChartData = capturedChartData
    render(<CostsOverTimeChart result={noRefinanceResult} />)
    const noRefinanceChartData = capturedChartData

    const year1Refi = refinanceChartData.find((p) => p.year === 1)
    const year1NoRefi = noRefinanceChartData.find((p) => p.year === 1)
    const year5Refi = refinanceChartData.find((p) => p.year === 5)
    const year5NoRefi = noRefinanceChartData.find((p) => p.year === 5)

    // Year 1 (before the trigger month) is unaffected
    expect(year1Refi?.owner).toBeCloseTo(year1NoRefi!.owner, 6)
    // Year 5 (well after the trigger) reflects the lower new rate — lower owner cost
    expect(year5Refi?.owner).toBeLessThan(year5NoRefi!.owner)
  })
})

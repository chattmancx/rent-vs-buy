import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React, { isValidElement, type ReactNode } from 'react'
import { Legend, XAxis } from 'recharts'
import { MonthlyCostsChart } from '../MonthlyCostsChart'
import { computeScenario } from '../../engine'
import { DEFAULT_INPUT } from '../../lib/defaults'
import { deflate } from '../../lib/inflation'
import { computeXAxisInterval } from '../../lib/format'

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

function findXAxisInterval(children: ReactNode): number | undefined {
  const match = React.Children.toArray(children).find(
    (child) => isValidElement(child) && child.type === XAxis,
  )
  if (!match || !isValidElement(match)) return undefined
  return (match.props as { interval: number }).interval
}

describe('MonthlyCostsChart', () => {
  it('renders without crashing', () => {
    const result = computeScenario(DEFAULT_INPUT)
    render(<MonthlyCostsChart result={result} />)
    expect(screen.getByRole('img')).toBeTruthy()
  })

  it('chart reproduces nominal monthly cost values (yearly total / 12) when real_dollars is false, including year 1', () => {
    const result = computeScenario(DEFAULT_INPUT)
    render(<MonthlyCostsChart result={result} />)
    expect(capturedChartData).toEqual(
      result.yearly_summary.map((row) => ({
        year: row.year,
        owner: row.owner_costs_this_year / 12,
        renter: row.renter_costs_this_year / 12,
      })),
    )
    expect(capturedChartData.find((p) => p.year === 1)).toBeDefined()
  })

  it('chart data points are deflated per-year when real_dollars is true', () => {
    const nominalResult = computeScenario({
      ...DEFAULT_INPUT,
      shared: { ...DEFAULT_INPUT.shared, horizon_years: 10 },
    })
    render(<MonthlyCostsChart result={nominalResult} />)
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
    render(<MonthlyCostsChart result={realResult} />)
    const realData = capturedChartData
    const realYear3 = realData.find((p) => p.year === 3)
    const realYear9 = realData.find((p) => p.year === 9)

    expect(realYear3?.owner).toBeCloseTo(deflate(nominalYear3!.owner, 0.03, 3), 6)
    expect(realYear9?.owner).toBeCloseTo(deflate(nominalYear9!.owner, 0.03, 9), 6)
  })

  it('legend formatter maps owner to Buying and renter to Renting', () => {
    const result = computeScenario(DEFAULT_INPUT)
    render(<MonthlyCostsChart result={result} />)
    const formatter = findLegendFormatter(capturedChildren)
    expect(formatter?.('owner')).toBe('Buying')
    expect(formatter?.('renter')).toBe('Renting')
  })

  it('shows every year on a short horizon (interval 0)', () => {
    const result = computeScenario({
      ...DEFAULT_INPUT,
      shared: { ...DEFAULT_INPUT.shared, horizon_years: 10 },
    })
    render(<MonthlyCostsChart result={result} />)
    expect(findXAxisInterval(capturedChildren)).toBe(0)
  })

  it('thins the x-axis on a 40-year horizon', () => {
    const result = computeScenario({
      ...DEFAULT_INPUT,
      shared: { ...DEFAULT_INPUT.shared, horizon_years: 40 },
    })
    render(<MonthlyCostsChart result={result} />)
    expect(findXAxisInterval(capturedChildren)).toBe(computeXAxisInterval(40))
    expect(findXAxisInterval(capturedChildren)).toBeGreaterThan(0)
  })
})

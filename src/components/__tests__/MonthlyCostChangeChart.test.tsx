import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React, { isValidElement, type ReactNode } from 'react'
import { MonthlyCostChangeChart } from '../MonthlyCostChangeChart'
import { computeScenario } from '../../engine'
import { DEFAULT_INPUT } from '../../lib/defaults'
import { deflate } from '../../lib/inflation'

type ChangePoint = { year: number; owner: number; renter: number }
let capturedChartData: ChangePoint[] = []
let capturedChildren: ReactNode

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    LineChart: (props: { data: ChangePoint[]; children: ReactNode } & Record<string, unknown>) => {
      capturedChartData = props.data
      capturedChildren = props.children
      const ActualLineChart = actual.LineChart
      return <ActualLineChart {...props} />
    },
  }
})

describe('MonthlyCostChangeChart', () => {
  it('S16-5: renders without crashing', () => {
    const result = computeScenario(DEFAULT_INPUT)
    render(<MonthlyCostChangeChart result={result} />)
    expect(screen.getByRole('img')).toBeTruthy()
  })

  it('S16-6: chart data has yearly_summary.length - 1 points, starting at year 2', () => {
    const result = computeScenario({
      ...DEFAULT_INPUT,
      shared: { ...DEFAULT_INPUT.shared, horizon_years: 10 },
    })
    render(<MonthlyCostChangeChart result={result} />)
    expect(capturedChartData.length).toBe(result.yearly_summary.length - 1)
    expect(capturedChartData[0]?.year).toBe(2)
  })

  it('S16-7: delta values match hand-computed differences of owner_costs_this_year / 12 (nominal)', () => {
    const result = computeScenario({
      ...DEFAULT_INPUT,
      shared: { ...DEFAULT_INPUT.shared, horizon_years: 10 },
    })
    render(<MonthlyCostChangeChart result={result} />)

    const yearRow = (year: number) => result.yearly_summary.find((row) => row.year === year)
    const year2 = yearRow(2)
    const year3 = yearRow(3)
    expect(year2).toBeDefined()
    expect(year3).toBeDefined()

    const expectedOwnerDeltaYear3 =
      year3!.owner_costs_this_year / 12 - year2!.owner_costs_this_year / 12
    const expectedRenterDeltaYear3 =
      year3!.renter_costs_this_year / 12 - year2!.renter_costs_this_year / 12

    const point3 = capturedChartData.find((p) => p.year === 3)
    expect(point3?.owner).toBeCloseTo(expectedOwnerDeltaYear3, 6)
    expect(point3?.renter).toBeCloseTo(expectedRenterDeltaYear3, 6)
  })

  it('S16-8: real-dollars case deflates each year before differencing, not the raw delta after', () => {
    const nominalResult = computeScenario({
      ...DEFAULT_INPUT,
      shared: { ...DEFAULT_INPUT.shared, horizon_years: 10 },
    })
    const realResult = {
      ...nominalResult,
      inputs: {
        ...nominalResult.inputs,
        shared: { ...nominalResult.inputs.shared, real_dollars: true, inflation_rate: 0.05 },
      },
    }
    render(<MonthlyCostChangeChart result={realResult} />)
    const realData = capturedChartData

    const yearRow = (year: number) => nominalResult.yearly_summary.find((row) => row.year === year)
    const year5 = yearRow(5)
    const year6 = yearRow(6)
    expect(year5).toBeDefined()
    expect(year6).toBeDefined()

    // Correct order: deflate each year's monthly cost independently, then difference.
    const deflatedOwnerYear5 = deflate(year5!.owner_costs_this_year / 12, 0.05, 5)
    const deflatedOwnerYear6 = deflate(year6!.owner_costs_this_year / 12, 0.05, 6)
    const expectedOwnerDelta = deflatedOwnerYear6 - deflatedOwnerYear5

    // Wrong order (regression this test guards against): difference nominal values first,
    // then deflate the raw delta by a single year exponent.
    const nominalOwnerDelta = year6!.owner_costs_this_year / 12 - year5!.owner_costs_this_year / 12
    const wrongOwnerDelta = deflate(nominalOwnerDelta, 0.05, 6)

    const point6 = realData.find((p) => p.year === 6)
    expect(point6?.owner).toBeCloseTo(expectedOwnerDelta, 6)
    expect(point6?.owner).not.toBeCloseTo(wrongOwnerDelta, 6)
  })

  it('S16-9: a y=0 ReferenceLine is present among the chart children', () => {
    const result = computeScenario(DEFAULT_INPUT)
    render(<MonthlyCostChangeChart result={result} />)
    const children = React.Children.toArray(capturedChildren)
    const referenceLine = children.find(
      (child) => isValidElement(child) && (child.props as { y?: number }).y === 0,
    )
    expect(referenceLine).toBeDefined()
  })
})

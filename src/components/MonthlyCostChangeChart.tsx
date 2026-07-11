import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { ScenarioResult } from '../engine'
import { formatDelta, formatCurrencyCompact } from '../lib/format'
import { deflateIfEnabled } from '../lib/inflation'

type MonthlyCostChangeChartProps = {
  result: ScenarioResult
}

export function MonthlyCostChangeChart({ result }: MonthlyCostChangeChartProps) {
  const { real_dollars, inflation_rate } = result.inputs.shared
  const monthlyByYear = result.yearly_summary.map((row) => ({
    year: row.year,
    owner: deflateIfEnabled(row.owner_costs_this_year / 12, real_dollars, inflation_rate, row.year),
    renter: deflateIfEnabled(
      row.renter_costs_this_year / 12,
      real_dollars,
      inflation_rate,
      row.year,
    ),
  }))

  const chartData: { year: number; owner: number; renter: number }[] = []
  for (let i = 1; i < monthlyByYear.length; i++) {
    const prev = monthlyByYear[i - 1]
    const curr = monthlyByYear[i]
    if (prev === undefined || curr === undefined) continue
    chartData.push({
      year: curr.year,
      owner: curr.owner - prev.owner,
      renter: curr.renter - prev.renter,
    })
  }

  return (
    <div
      role="img"
      aria-label={`Monthly cost change over time chart over ${result.inputs.shared.horizon_years} years.`}
    >
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD6" />
          <XAxis
            dataKey="year"
            label={{ value: 'Year', position: 'insideBottom', offset: -4 }}
            tick={{ fill: '#8C8884', fontSize: 12 }}
          />
          <YAxis
            tickFormatter={formatCurrencyCompact}
            width={72}
            tick={{ fill: '#8C8884', fontSize: 12 }}
          />
          <ChartTooltip
            formatter={(value: number, name: string) => [
              formatDelta(value),
              name === 'owner' ? 'Buying' : 'Renting',
            ]}
            labelFormatter={(label: number) => `Year ${label}`}
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2DDD6',
              color: '#1A1A18',
            }}
          />
          <Legend formatter={(value: string) => (value === 'owner' ? 'Buying' : 'Renting')} />
          <ReferenceLine y={0} stroke="#8C8884" />
          <Line
            type="monotone"
            dataKey="owner"
            stroke="#3B6EA5"
            strokeWidth={2}
            dot={false}
            name="owner"
          />
          <Line
            type="monotone"
            dataKey="renter"
            stroke="#7A6E5F"
            strokeWidth={2}
            dot={false}
            name="renter"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

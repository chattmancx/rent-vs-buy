import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { ScenarioResult } from '../engine'
import { formatCurrency, formatCurrencyCompact, computeXAxisInterval } from '../lib/format'
import { deflateIfEnabled } from '../lib/inflation'

type CostsOverTimeChartProps = {
  result: ScenarioResult
}

export function CostsOverTimeChart({ result }: CostsOverTimeChartProps) {
  const { real_dollars, inflation_rate } = result.inputs.shared
  const chartData = result.yearly_summary.map((row) => ({
    year: row.year,
    owner: deflateIfEnabled(row.owner_costs_this_year, real_dollars, inflation_rate, row.year),
    renter: deflateIfEnabled(row.renter_costs_this_year, real_dollars, inflation_rate, row.year),
  }))

  return (
    <div
      role="img"
      aria-label={`Costs over time chart over ${result.inputs.shared.horizon_years} years.`}
    >
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD6" />
          <XAxis
            dataKey="year"
            type="category"
            interval={computeXAxisInterval(chartData.length)}
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
              formatCurrency(value),
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

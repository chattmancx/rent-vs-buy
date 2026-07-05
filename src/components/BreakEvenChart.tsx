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
import type { ScenarioResult, SharedInput } from '../engine'
import { formatCurrency, formatCurrencyCompact } from '../lib/format'
import { deflateIfEnabled } from '../lib/inflation'

type BreakEvenChartProps = {
  result: ScenarioResult
  updateShared: (patch: Partial<SharedInput>) => void
}

export function BreakEvenChart({ result, updateShared }: BreakEvenChartProps) {
  const { real_dollars, inflation_rate } = result.inputs.shared
  const chartData = result.yearly_summary.map((row) => ({
    year: row.year,
    owner: deflateIfEnabled(row.owner_net_worth, real_dollars, inflation_rate, row.year),
    renter: deflateIfEnabled(row.renter_net_worth, real_dollars, inflation_rate, row.year),
  }))

  let crossoverYear: number | null = null
  for (let i = 1; i < chartData.length; i++) {
    const prev = chartData[i - 1]
    const curr = chartData[i]
    if (prev === undefined || curr === undefined) continue
    const prevDiff = prev.owner - prev.renter
    const currDiff = curr.owner - curr.renter
    if (prevDiff !== 0 && currDiff !== 0 && Math.sign(prevDiff) !== Math.sign(currDiff)) {
      crossoverYear = curr.year
      break
    }
  }

  return (
    <div className="rounded-lg border border-surface-rule bg-surface-panel p-6">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-muted">
        Net Worth Over Time
      </h2>
      <div
        role="img"
        aria-label={`Net worth over time chart over ${result.inputs.shared.horizon_years} years.${crossoverYear !== null ? ` Buying and renting lines cross at year ${crossoverYear}.` : ' No break-even within the analysis period.'}`}
      >
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 28, right: 16, bottom: 8, left: 16 }}>
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
            {crossoverYear !== null && (
              <ReferenceLine
                x={crossoverYear}
                stroke="#4A7C59"
                strokeDasharray="4 4"
                label={{ value: 'Break-even', position: 'top', fontSize: 11, fill: '#4A7C59' }}
              />
            )}
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
      <div className="mt-3 px-4">
        <div className="mb-1 flex items-center justify-between text-xs text-ink-muted">
          <span>1 yr</span>
          <span className="font-medium text-ink-secondary">
            Horizon: {result.inputs.shared.horizon_years} years
          </span>
          <span>30 yrs</span>
        </div>
        <input
          type="range"
          min={1}
          max={30}
          step={1}
          value={result.inputs.shared.horizon_years}
          onChange={(e) => updateShared({ horizon_years: parseInt(e.target.value, 10) })}
          className="w-full accent-accent"
          aria-label="Chart horizon in years"
        />
      </div>
    </div>
  )
}

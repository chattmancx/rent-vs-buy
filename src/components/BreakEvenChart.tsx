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

type BreakEvenChartProps = {
  result: ScenarioResult
  updateShared: (patch: Partial<SharedInput>) => void
}

export function BreakEvenChart({ result, updateShared }: BreakEvenChartProps) {
  const chartData = result.yearly_summary.map((row) => ({
    year: row.year,
    owner: row.owner_net_worth,
    renter: row.renter_net_worth,
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
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-700">Net Worth Over Time</h2>
      <div
        role="img"
        aria-label={`Net worth over time chart over ${result.inputs.shared.horizon_years} years.${crossoverYear !== null ? ` Buying and renting lines cross at year ${crossoverYear}.` : ' No break-even within the analysis period.'}`}
      >
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -4 }} />
            <YAxis tickFormatter={formatCurrencyCompact} width={72} />
            <ChartTooltip
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === 'owner' ? 'Buying' : 'Renting',
              ]}
              labelFormatter={(label: number) => `Year ${label}`}
            />
            <Legend formatter={(value: string) => (value === 'owner' ? 'Buying' : 'Renting')} />
            {crossoverYear !== null && (
              <ReferenceLine
                x={crossoverYear}
                stroke="#6b7280"
                strokeDasharray="4 4"
                label={{ value: 'Break-even', position: 'top', fontSize: 11, fill: '#6b7280' }}
              />
            )}
            <Line
              type="monotone"
              dataKey="owner"
              stroke="#16a34a"
              strokeWidth={2}
              dot={false}
              name="owner"
            />
            <Line
              type="monotone"
              dataKey="renter"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              name="renter"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 px-4">
        <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
          <span>1 yr</span>
          <span className="font-medium text-gray-700">
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
          className="w-full accent-blue-600"
          aria-label="Chart horizon in years"
        />
      </div>
    </div>
  )
}

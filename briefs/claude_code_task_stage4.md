# Rent vs Buy Calculator — Stage 4: Break-Even Chart, Horizon Slider, Sensitivity Strip

## 1. Session context

Stage 3 delivered `HeadlineResult` (verdict card) and `CostTable` (side-by-side cost breakdown). 77 tests pass. The app computes and displays results live on every input change.

Stage 4 adds three visual features:

1. **`BreakEvenChart`** — two-line Recharts chart (owner vs. renter net worth over time), crossover highlight, and a horizon slider visually attached to the chart X-axis.
2. **`SensitivityStrip`** — four cards showing ±1pp deltas on the four key assumptions.
3. **`formatCurrencyCompact`** — compact Y-axis label formatter added to `src/lib/format.ts`.

**Read only this brief and the specific source files you are modifying.**

---

## 2. Scope

### Deliverables

1. `src/lib/format.ts` — add `formatCurrencyCompact` export (do not modify existing exports).
2. `src/components/BreakEvenChart.tsx` — named export.
3. `src/components/SensitivityStrip.tsx` — named export.
4. `src/components/__tests__/BreakEvenChart.test.tsx`
5. `src/components/__tests__/SensitivityStrip.test.tsx`
6. `src/lib/__tests__/format.test.ts` — new file with `formatCurrencyCompact` tests.
7. `src/App.tsx` — insert both new components, update imports.
8. `CHANGELOG.md` — add Stage 4 entry.

### Out of scope

- Any modification to `src/engine/` or `src/hooks/useScenario.ts`.
- CSV/JSON export/import (Stage 5).
- Accessibility audit, responsive layout overhaul, deployment (Stage 6).
- New npm/pnpm dependencies — Recharts v2.13.0 is already installed.

---

## 3. `formatCurrencyCompact` spec

Add to `src/lib/format.ts` as a named export alongside the existing `formatCurrency` and `formatDelta`.

### Algorithm

```ts
export function formatCurrencyCompact(value: number): string
```

1. `abs = Math.abs(value)`, `sign = value < 0 ? '-' : ''`
2. Tier selection (descending):
   - `abs >= 1_000_000`: `divisor = 1_000_000`, `suffix = 'M'`
   - `abs >= 1_000`: `divisor = 1_000`, `suffix = 'K'`
   - Otherwise: return `sign + '$' + Math.round(abs).toString()`
3. For M/K tiers: `rounded = Math.round(abs / divisor * 10) / 10`, format as `rounded.toFixed(1).replace(/\.0$/, '')`, return `sign + '$' + str + suffix`

### Test cases (use in `src/lib/__tests__/format.test.ts`)

| Input      | Expected   |
| ---------- | ---------- |
| `0`        | `'$0'`     |
| `500`      | `'$500'`   |
| `1000`     | `'$1K'`    |
| `1500`     | `'$1.5K'`  |
| `2000`     | `'$2K'`    |
| `550000`   | `'$550K'`  |
| `1000000`  | `'$1M'`    |
| `1200000`  | `'$1.2M'`  |
| `2000000`  | `'$2M'`    |
| `-550000`  | `'-$550K'` |
| `-1200000` | `'-$1.2M'` |

---

## 4. `BreakEvenChart.tsx`

### Props

```ts
import type { ScenarioResult, SharedInput } from '../engine'

type BreakEvenChartProps = {
  result: ScenarioResult
  updateShared: (patch: Partial<SharedInput>) => void
}
```

### Recharts v2 imports

```ts
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
```

All of these are confirmed exports of recharts@2.13.0.

### Data mapping

```ts
const chartData = result.yearly_summary.map((row) => ({
  year: row.year,
  owner: row.owner_net_worth,
  renter: row.renter_net_worth,
}))
```

No `useMemo` needed — `chartData` derives directly from `result` and the component only renders when `result` changes.

### Crossover detection

```ts
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
```

`crossoverYear` is `number | null`. Render `<ReferenceLine>` only when non-null.

### Recharts component tree

```tsx
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
```

Colors: Buying = `#16a34a` (green-600), Renting = `#2563eb` (blue-600), reference line = `#6b7280` (gray-500).

### Chart horizon slider

Render below the `ResponsiveContainer`, inside the same outer wrapper:

```tsx
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
```

This slider coexists with the one in `BasicInputs` — both control `shared.horizon_years` via `updateShared`.

### Outer wrapper

```tsx
<div className="rounded-lg border border-gray-200 bg-white p-4">
  <h2 className="mb-3 text-sm font-semibold text-gray-700">Net Worth Over Time</h2>
  {/* ResponsiveContainer */}
  {/* slider div */}
</div>
```

Named export only.

---

## 5. `SensitivityStrip.tsx`

### Props

```ts
import type { ScenarioInput, ScenarioResult } from '../engine'

type SensitivityStripProps = {
  input: ScenarioInput
  result: ScenarioResult
}
```

### Module-level helpers (before the component)

```ts
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function deltaColorClass(delta: number | null): string {
  if (delta === null) return 'text-gray-400'
  if (delta > 0) return 'text-green-600'
  if (delta < 0) return 'text-red-600'
  return 'text-gray-600'
}

function formatSensitivityDelta(delta: number | null): string {
  if (delta === null) return 'N/A'
  return formatDelta(delta)
}
```

### The 4 assumptions

| Card label        | Field path                               | ±amount | Clamp range   |
| ----------------- | ---------------------------------------- | ------- | ------------- |
| Interest Rate     | `input.ownership.interest_rate`          | `±1`    | `[0, 100]`    |
| Home Appreciation | `input.ownership.home_appreciation_rate` | `±0.01` | `[-0.5, 0.5]` |
| Investment Return | `input.shared.investment_return_rate`    | `±0.01` | `[-0.5, 0.5]` |
| Rent Growth       | `input.rental.rent_increase_rate`        | `±0.01` | `[-0.5, 0.5]` |

### Delta definition

```
delta = (tweakedOwnerNetWorth − tweakedRenterNetWorth) − (baseOwnerNetWorth − baseRenterNetWorth)
```

Positive = buying relatively improved. Negative = renting relatively improved.

### `useMemo` structure

```ts
import { useMemo } from 'react'
import { computeScenario, EngineInputError } from '../engine'
import { formatDelta } from '../lib/format'

const sensitivities = useMemo(() => {
  const baseAdvantage = result.verdict.owner_net_worth - result.verdict.renter_net_worth

  function computeDelta(tweakedInput: ScenarioInput): number | null {
    try {
      const tweaked = computeScenario(tweakedInput)
      return tweaked.verdict.owner_net_worth - tweaked.verdict.renter_net_worth - baseAdvantage
    } catch (e) {
      if (e instanceof EngineInputError) return null
      throw e
    }
  }

  return [
    {
      label: 'Interest Rate',
      plus: computeDelta({
        ...input,
        ownership: {
          ...input.ownership,
          interest_rate: clamp(input.ownership.interest_rate + 1, 0, 100),
        },
      }),
      minus: computeDelta({
        ...input,
        ownership: {
          ...input.ownership,
          interest_rate: clamp(input.ownership.interest_rate - 1, 0, 100),
        },
      }),
    },
    {
      label: 'Home Appreciation',
      plus: computeDelta({
        ...input,
        ownership: {
          ...input.ownership,
          home_appreciation_rate: clamp(input.ownership.home_appreciation_rate + 0.01, -0.5, 0.5),
        },
      }),
      minus: computeDelta({
        ...input,
        ownership: {
          ...input.ownership,
          home_appreciation_rate: clamp(input.ownership.home_appreciation_rate - 0.01, -0.5, 0.5),
        },
      }),
    },
    {
      label: 'Investment Return',
      plus: computeDelta({
        ...input,
        shared: {
          ...input.shared,
          investment_return_rate: clamp(input.shared.investment_return_rate + 0.01, -0.5, 0.5),
        },
      }),
      minus: computeDelta({
        ...input,
        shared: {
          ...input.shared,
          investment_return_rate: clamp(input.shared.investment_return_rate - 0.01, -0.5, 0.5),
        },
      }),
    },
    {
      label: 'Rent Growth',
      plus: computeDelta({
        ...input,
        rental: {
          ...input.rental,
          rent_increase_rate: clamp(input.rental.rent_increase_rate + 0.01, -0.5, 0.5),
        },
      }),
      minus: computeDelta({
        ...input,
        rental: {
          ...input.rental,
          rent_increase_rate: clamp(input.rental.rent_increase_rate - 0.01, -0.5, 0.5),
        },
      }),
    },
  ]
}, [result, input])
```

### Card JSX

```tsx
<div>
  <h2 className="mb-2 text-sm font-semibold text-gray-700">Sensitivity: ±1pp Change</h2>
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
    {sensitivities.map((card) => (
      <div key={card.label} className="rounded-lg border border-gray-200 bg-white p-3">
        <p className="mb-2 text-xs font-semibold text-gray-700">{card.label}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">+1pp</span>
            <span className={`font-mono text-xs ${deltaColorClass(card.plus)}`}>
              {formatSensitivityDelta(card.plus)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">-1pp</span>
            <span className={`font-mono text-xs ${deltaColorClass(card.minus)}`}>
              {formatSensitivityDelta(card.minus)}
            </span>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
```

Named export only.

---

## 6. `App.tsx` update

### Imports (replace full import block)

```ts
import { useScenario } from './hooks/useScenario'
import { BasicInputs } from './components/BasicInputs'
import { AdvancedInputs } from './components/AdvancedInputs'
import { DebugPanel } from './components/DebugPanel'
import { HeadlineResult } from './components/HeadlineResult'
import { CostTable } from './components/CostTable'
import { InputSection } from './components/InputSection'
import { BreakEvenChart } from './components/BreakEvenChart'
import { SensitivityStrip } from './components/SensitivityStrip'
```

### Component order in JSX

```tsx
<HeadlineResult result={result} />
<BasicInputs input={input} updateOwnership={updateOwnership} updateRental={updateRental} updateShared={updateShared} />
<InputSection title="Advanced Options">
  <AdvancedInputs input={input} updateOwnership={updateOwnership} updateRental={updateRental} updateShared={updateShared} />
</InputSection>
<BreakEvenChart result={result} updateShared={updateShared} />
<SensitivityStrip input={input} result={result} />
<CostTable result={result} />
<DebugPanel result={result} />
```

---

## 7. Testing requirements

### `src/lib/__tests__/format.test.ts`

New file (does not yet exist). Import `formatCurrencyCompact` from `'../format'`. Cover all test cases from Section 3.

### `src/components/__tests__/BreakEvenChart.test.tsx`

**Recharts jsdom fix** — add this mock at the top of the file (before any tests):

```ts
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  }
})
```

**5 test cases:**

1. Renders "Net Worth Over Time" heading without crashing
2. `getByRole('slider', { name: /chart horizon/i })` finds the slider
3. `fireEvent.change(slider, { target: { value: '15' } })` calls `updateShared({ horizon_years: 15 })`
4. Slider `.value` equals `String(DEFAULT_INPUT.shared.horizon_years)`
5. With a scenario where buying always leads (e.g., the Scenario A inputs from engine tests: purchase_price 400000, interest_rate 6.722, base_rent_monthly 2500, horizon_years 30, investment_return_rate 0.075), `screen.queryByText('Break-even')` returns null

**Note:** Test 5 verifies the crossover label is absent. The `ReferenceLine` label text only appears in DOM because the mock renders `LineChart` children. If the label doesn't appear due to the mock, skip test 5 with a comment.

### `src/components/__tests__/SensitivityStrip.test.tsx`

**6 test cases:**

1. Renders "Sensitivity: ±1pp Change" heading without crashing
2. All 4 card labels present: "Interest Rate", "Home Appreciation", "Investment Return", "Rent Growth"
3. `getAllByText('+1pp')` has length 4; `getAllByText('-1pp')` has length 4
4. `getAllByText(/[+-]\$[\d,]+/)` has length > 0 (formatted delta values present)
5. `document.querySelectorAll('.text-green-600').length + document.querySelectorAll('.text-red-600').length > 0`
6. Rerender with `horizon_years: 20`; delta text values differ from initial render

---

## 8. Acceptance criteria

1. `pnpm test -- --run` exits 0; all existing 77 tests pass; new tests pass.
2. `pnpm typecheck` exits 0; no `!` non-null assertions in new code.
3. `pnpm lint` exits 0.
4. `pnpm format:check` exits 0.
5. `pnpm build` exits 0.
6. Running app component order: HeadlineResult → BasicInputs → Advanced Options → BreakEvenChart → SensitivityStrip → CostTable → DebugPanel.
7. Both horizon sliders (BasicInputs + chart) control the same state; moving either updates the chart, headline, and table simultaneously.
8. Chart shows two labeled lines (green Buying, blue Renting), compact Y-axis labels, year X-axis, full-dollar tooltip on hover.
9. Crossover: dashed "Break-even" line present when lines cross; absent when they do not.
10. SensitivityStrip: 4 cards, 2-col mobile / 4-col desktop; each card shows +1pp and -1pp rows with green/red/gray coloring.
11. `CHANGELOG.md` has a Stage 4 entry.

# Rent vs Buy Calculator — Stage 3: Numerical Outputs

## 1. Session context

Stage 2 delivered the full input form, URL state, and live recalculation. `App.tsx` renders `BasicInputs`, `AdvancedInputs`, and `DebugPanel`. Every input change calls `computeScenario` synchronously and stores the result in `useScenario` state.

Stage 3 adds the two visible output surfaces: a **headline answer** (one sentence, live-updating) and a **side-by-side cost breakdown table** (owner vs. renter, all line items, totals). The `DebugPanel` remains but moves below both outputs.

**Read only this brief and the specific source files you are modifying.**

---

## 2. Scope

### Deliverables

1. `src/lib/format.ts` — `formatCurrency` and `formatDelta` utilities.
2. `src/components/HeadlineResult.tsx` — one-sentence verdict, live-updating.
3. `src/components/CostTable.tsx` — side-by-side cost breakdown table.
4. `src/components/__tests__/HeadlineResult.test.tsx`
5. `src/components/__tests__/CostTable.test.tsx`
6. Update `src/App.tsx` — insert `HeadlineResult` above the form, `CostTable` below it.
7. All CI checks must pass.

### Out of scope

- Break-even chart, horizon slider on chart, sensitivity strip (Stage 4)
- CSV/JSON export/import (Stage 5)
- Responsive layout, accessibility audit, deployment (Stage 6)
- Any modification to `src/engine/`

---

## 3. `src/lib/format.ts`

```ts
export function formatCurrency(value: number): string
// Formats as "$1,234,567" (no decimal places, en-US locale).
// Handles negative values: "-$12,300".

export function formatDelta(value: number): string
// Formats the absolute value with a sign prefix: "+$42,300" or "-$12,100".
// Used for the headline margin only.
```

Implementation: use `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })`.

For `formatDelta`: format `Math.abs(value)` then prefix with `+` if positive or `-` if negative.

---

## 4. `HeadlineResult.tsx`

### Props

```ts
type HeadlineResultProps = {
  result: ScenarioResult
}
```

### Copy rules

| `verdict.winner` | Text                                                           |
| ---------------- | -------------------------------------------------------------- |
| `'buying'`       | Over **N** years, **buying** wins by **$X**                    |
| `'renting'`      | Over **N** years, **renting** wins by **$X**                   |
| `'tie'`          | Over **N** years, buying and renting come out essentially even |

- **N** = `result.inputs.shared.horizon_years`
- **$X** = `formatCurrency(result.verdict.margin_usd)` (already positive per engine)
- Tie case (`verdict.winner === 'tie'`) omits the margin amount.

### Styling

Outer wrapper: `<div className="rounded-lg border p-6 text-center">`.

Border and background by winner:

- `buying`: `border-green-300 bg-green-50`
- `renting`: `border-blue-300 bg-blue-50`
- `tie`: `border-gray-300 bg-gray-50`

Headline text: `<p className="text-xl font-semibold text-gray-900">`.

Bold the winner word and margin amount inline using `<strong>`.

Named export only.

---

## 5. `CostTable.tsx`

### Props

```ts
type CostTableProps = {
  result: ScenarioResult
}
```

### Data to display

Derive `lastRow` from `result.monthly_schedule[result.monthly_schedule.length - 1] ?? null`.

Pull `downPayment` from `result.inputs`: `result.inputs.ownership.purchase_price * result.inputs.ownership.down_payment_pct / 100`.

**Owner rows** (in order):

| Label                | Value source                             |
| -------------------- | ---------------------------------------- |
| Down payment         | `downPayment` (computed)                 |
| Closing costs        | `totals.total_closing_costs`             |
| Mortgage principal   | `totals.total_principal_paid`            |
| Mortgage interest    | `totals.total_interest_paid`             |
| PMI                  | `totals.total_pmi_paid`                  |
| Property taxes       | `totals.total_property_taxes`            |
| Home insurance       | `totals.total_homeowner_insurance`       |
| HOA fees             | `totals.total_hoa`                       |
| Maintenance          | `totals.total_maintenance`               |
| Utilities            | `totals.total_utilities_owner`           |
| **Total outflows**   | `totals.total_ownership_outflows`        |
| Sale proceeds        | `totals.sale_proceeds`                   |
| Investment portfolio | `lastRow?.owner_investment_balance ?? 0` |
| **Final net worth**  | `totals.owner_final_net_worth`           |

**Renter rows** (in order):

| Label                | Value source                              |
| -------------------- | ----------------------------------------- |
| Admin fee            | `totals.total_admin_fee`                  |
| Rent paid            | `totals.total_rent_paid`                  |
| Pet rent             | `totals.total_pet_rent`                   |
| Parking fees         | `totals.total_parking_fees`               |
| Renters insurance    | `totals.total_renters_insurance`          |
| Utilities            | `totals.total_utilities_renter`           |
| **Total outflows**   | `totals.total_rentership_outflows`        |
| Investment portfolio | `lastRow?.renter_investment_balance ?? 0` |
| **Final net worth**  | `totals.renter_final_net_worth`           |

### Table structure

Render as an HTML `<table>` with three columns: **Category**, **Buying**, **Renting**.

Rows that have no equivalent on one side (e.g. "Down payment" has no renter value, "Admin fee" has no owner value) show `—` in the empty cell.

**Row types and styling:**

- Normal row: `<tr className="border-t border-gray-100">`; cells `<td className="py-2 px-3 text-sm text-gray-600">` for label, `<td className="py-2 px-3 text-sm text-right tabular-nums">` for values.
- **Subtotal row** ("Total outflows"): `<tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">`.
- **Net worth row** ("Final net worth"): `<tr className="border-t-2 border-gray-400 text-base font-bold">`. Highlight the winning side's cell: `className="... text-green-700"`. If `verdict.winner === 'tie'`, both cells use neutral color.
- "Sale proceeds" row: value is a credit — format normally (it's already a positive number in the engine).

### Table header

```tsx
<thead>
  <tr className="bg-gray-100">
    <th className="py-2 px-3 text-left text-sm font-semibold text-gray-700">Category</th>
    <th className="py-2 px-3 text-right text-sm font-semibold text-gray-700">Buying</th>
    <th className="py-2 px-3 text-right text-sm font-semibold text-gray-700">Renting</th>
  </tr>
</thead>
```

Wrap the table in `<div className="overflow-x-auto rounded-lg border border-gray-200">`.

Named export only.

---

## 6. `App.tsx` layout

```tsx
<div className="mx-auto max-w-4xl px-4 py-8">
  {/* URL error banner */}
  <h1>Rent vs Buy Calculator</h1>
  <div className="space-y-6">
    <HeadlineResult result={result} />        {/* NEW — above form */}
    <BasicInputs ... />
    <InputSection title="Advanced Options">
      <AdvancedInputs ... />
    </InputSection>
    <CostTable result={result} />             {/* NEW — below form */}
    <DebugPanel result={result} />
  </div>
</div>
```

---

## 7. Testing requirements

### `HeadlineResult.test.tsx`

Use `computeScenario(DEFAULT_INPUT)` as the base result. Also construct a mock result with `winner: 'tie'` to test that branch.

1. Renders "buying" or "renting" text matching `result.verdict.winner`.
2. Renders the horizon years from `result.inputs.shared.horizon_years`.
3. Renders a formatted dollar amount for non-tie verdicts.
4. Does NOT render a dollar amount when `winner === 'tie'`.

### `CostTable.test.tsx`

1. Renders "Buying" and "Renting" column headers.
2. Renders "Final net worth" row.
3. Renders formatted currency values (contains "$").
4. Highlights the winning side (checks for `text-green-700` class on the correct cell).
5. Shows `—` for cells that have no value on that side.

---

## 8. Acceptance criteria

1. `HeadlineResult` renders above the input form in `App.tsx`.
2. Headline text matches the pattern "Over N years, [buying/renting] wins by $X" for non-tie verdicts, with N and $X reflecting current input values.
3. For a tie verdict, the headline reads "essentially even" and shows no dollar amount.
4. Headline background color changes based on winner (green for buying, blue for renting, gray for tie).
5. `CostTable` renders below the input form and above the debug panel.
6. All 14 owner rows and 9 renter rows are present in the table.
7. "Total outflows" and "Final net worth" rows are visually distinct (bold / heavier border) from regular rows.
8. The winning side's "Final net worth" cell has a distinct color; the losing side's cell is neutral.
9. Changing any input updates both `HeadlineResult` and `CostTable` without a page reload.
10. `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test -- --run`, and `pnpm build` all exit 0.
11. `CHANGELOG.md` has a Stage 3 entry.

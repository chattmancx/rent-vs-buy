# Rent vs Buy Calculator — Stage 2: App Shell, Input Form, URL State, Live Recalculation

## 1. Session context

Stage 1 built the math engine at `src/engine/`. It exports `computeScenario(input: ScenarioInput): ScenarioResult`, `EngineInputError`, and all types from `src/engine/index.ts`. The engine is complete and must not be modified in this session.

`src/App.tsx` is currently a placeholder stub (`<h1>Rent vs Buy Calculator — Stage 1 complete</h1>`). Stage 2 replaces it with a working application shell: a full input form with progressive disclosure, URL-encoded state, live recalculation wired to the engine, and a debug output panel. No chart, no polished results view — those come in Stages 3 and 4.

**Read only this brief and the specific source files you are modifying.** Do not re-read the Stage 1 brief, the Python reference files, or the handoff document. All essential information is in CLAUDE.md and this brief.

---

## 2. Scope

### Deliverables

1. Install the `zod` package (only new runtime dependency — run `pnpm add zod` first).
2. Create `src/lib/defaults.ts` — the canonical default `ScenarioInput`.
3. Create `src/lib/schema.ts` — a Zod schema that validates `ScenarioInput` at the URL/import boundary.
4. Create `src/lib/url-state.ts` — `encode()` and `decode()` helpers for `?s=` query-param state.
5. Create `src/hooks/useScenario.ts` — React hook managing form state, live recalculation, and URL sync.
6. Create the component tree under `src/components/`.
7. Replace `src/App.tsx` with the working application shell.
8. Write unit tests for `url-state.ts` and `schema.ts`, plus component smoke tests.
9. All CI checks must pass: `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test -- --run`, `pnpm build`.

### Out of scope for this session

- Styled results panel, headline verdict, cost breakdown table (Stage 3)
- Break-even chart, sensitivity strip (Stage 4)
- CSV/JSON export/import (Stage 5)
- Responsive layout, accessibility audit, deployment (Stage 6)
- Any modification to `src/engine/`

---

## 3. Target file structure

```
src/
  lib/
    defaults.ts
    schema.ts
    url-state.ts
    __tests__/
      url-state.test.ts
      schema.test.ts
  hooks/
    useScenario.ts
  components/
    Tooltip.tsx
    InputField.tsx
    InputSection.tsx
    BasicInputs.tsx
    AdvancedInputs.tsx
    DebugPanel.tsx
    __tests__/
      InputForm.test.tsx
      DebugPanel.test.tsx
  App.tsx                   ← replace the placeholder stub
```

All new file names follow the existing project conventions: `kebab-case` for `lib/` and `hooks/`, `PascalCase` for component files (matches component name).

---

## 4. Default values — `src/lib/defaults.ts`

Export a single constant `DEFAULT_INPUT` of type `ScenarioInput`. Use exactly these values.

```ts
import type { ScenarioInput } from '../engine'

export const DEFAULT_INPUT: ScenarioInput = {
  ownership: {
    purchase_price: 550000,
    down_payment_pct: 20,
    interest_rate: 6.8,
    loan_term_years: 30,
    pmi_rate: 0.5,
    real_estate_tax_rate: 1.1,
    assessed_value: 0,
    homeowner_insurance_annual: 1500,
    hoa_monthly: 0,
    home_size_sqft: 1800,
    closing_costs_pct: 2.5,
    maintenance_pct_annual: 1.0,
    home_appreciation_rate: 0.04,
    hoa_increase_rate: 0.03,
    maintenance_increase_rate: 0.03,
    insurance_increase_rate: 0.03,
    selling_cost_pct: 7.5,
  },
  rental: {
    base_rent_monthly: 2500,
    pet_rent_monthly: 0,
    parking_fee_monthly: 0,
    renters_insurance_monthly: 20,
    admin_fee: 0,
    security_deposit: 0,
    pet_deposit: 0,
    rent_increase_rate: 0.04,
    pet_rent_increase_rate: 0.03,
    parking_increase_rate: 0.03,
  },
  shared: {
    utilities_monthly_base: 150,
    utilities_increase_rate: 0.03,
    horizon_years: 10,
    investment_return_rate: 0.07,
    invest_vs_spend_ratio: 0.5,
  },
}
```

`DEFAULT_INPUT` is a plain object literal (not frozen). No other exports from this file.

**Reference table — all 31 fields with units:**

| Group     | Field                      | Default | Unit / Notes                             |
| --------- | -------------------------- | ------- | ---------------------------------------- |
| ownership | purchase_price             | 550000  | USD                                      |
| ownership | down_payment_pct           | 20      | percentage (0–100)                       |
| ownership | interest_rate              | 6.8     | annual % (e.g. 6.8 means 6.8%)           |
| ownership | loan_term_years            | 30      | integer years                            |
| ownership | pmi_rate                   | 0.5     | annual %; 0 = no PMI                     |
| ownership | real_estate_tax_rate       | 1.1     | annual % of home value                   |
| ownership | assessed_value             | 0       | USD; 0 = use purchase_price as tax basis |
| ownership | homeowner_insurance_annual | 1500    | USD/year                                 |
| ownership | hoa_monthly                | 0       | USD/month                                |
| ownership | home_size_sqft             | 1800    | square feet                              |
| ownership | closing_costs_pct          | 2.5     | % of purchase price                      |
| ownership | maintenance_pct_annual     | 1.0     | % of home value/year                     |
| ownership | home_appreciation_rate     | 0.04    | decimal (0.04 = 4%/yr)                   |
| ownership | hoa_increase_rate          | 0.03    | decimal                                  |
| ownership | maintenance_increase_rate  | 0.03    | decimal                                  |
| ownership | insurance_increase_rate    | 0.03    | decimal                                  |
| ownership | selling_cost_pct           | 7.5     | % of sale price                          |
| rental    | base_rent_monthly          | 2500    | USD/month                                |
| rental    | pet_rent_monthly           | 0       | USD/month                                |
| rental    | parking_fee_monthly        | 0       | USD/month                                |
| rental    | renters_insurance_monthly  | 20      | USD/month                                |
| rental    | admin_fee                  | 0       | USD, one-time non-refundable             |
| rental    | security_deposit           | 0       | USD, refundable                          |
| rental    | pet_deposit                | 0       | USD, refundable                          |
| rental    | rent_increase_rate         | 0.04    | decimal                                  |
| rental    | pet_rent_increase_rate     | 0.03    | decimal                                  |
| rental    | parking_increase_rate      | 0.03    | decimal                                  |
| shared    | utilities_monthly_base     | 150     | USD/month                                |
| shared    | utilities_increase_rate    | 0.03    | decimal                                  |
| shared    | horizon_years              | 10      | integer 1–30                             |
| shared    | investment_return_rate     | 0.07    | decimal (0.07 = 7%/yr)                   |
| shared    | invest_vs_spend_ratio      | 0.5     | decimal 0.0–1.0                          |

---

## 5. Zod schema — `src/lib/schema.ts`

### Purpose

Validates untrusted input (URL-decoded JSON; later, JSON import) before it reaches `computeScenario`. The engine does not use Zod.

### Rules

- Import from `zod` only. Do not import from `../engine` or from React.
- Export `ScenarioInputSchema` (a `z.ZodObject`) and the inferred type alias `ValidatedScenarioInput` as `z.infer<typeof ScenarioInputSchema>`.
- All fields: `.number().finite()` as the base constraint, plus the range constraints below.
- Do not export the sub-schemas (`OwnershipSchema`, etc.) — keep them internal to this file.

### Per-field constraints

**OwnershipInput:**

| Field                      | Constraint                                |
| -------------------------- | ----------------------------------------- |
| purchase_price             | `.number().finite().positive()`           |
| down_payment_pct           | `.number().finite().min(0).max(100)`      |
| interest_rate              | `.number().finite().min(0).max(100)`      |
| loan_term_years            | `.number().finite().int().min(1).max(50)` |
| pmi_rate                   | `.number().finite().min(0).max(10)`       |
| real_estate_tax_rate       | `.number().finite().min(0).max(10)`       |
| assessed_value             | `.number().finite().min(0)`               |
| homeowner_insurance_annual | `.number().finite().min(0)`               |
| hoa_monthly                | `.number().finite().min(0)`               |
| home_size_sqft             | `.number().finite().min(0)`               |
| closing_costs_pct          | `.number().finite().min(0).max(20)`       |
| maintenance_pct_annual     | `.number().finite().min(0).max(20)`       |
| home_appreciation_rate     | `.number().finite().min(-0.5).max(0.5)`   |
| hoa_increase_rate          | `.number().finite().min(-0.5).max(0.5)`   |
| maintenance_increase_rate  | `.number().finite().min(-0.5).max(0.5)`   |
| insurance_increase_rate    | `.number().finite().min(-0.5).max(0.5)`   |
| selling_cost_pct           | `.number().finite().min(0).max(30)`       |

**RentalInput:**

| Field                     | Constraint                              |
| ------------------------- | --------------------------------------- |
| base_rent_monthly         | `.number().finite().min(0)`             |
| pet_rent_monthly          | `.number().finite().min(0)`             |
| parking_fee_monthly       | `.number().finite().min(0)`             |
| renters_insurance_monthly | `.number().finite().min(0)`             |
| admin_fee                 | `.number().finite().min(0)`             |
| security_deposit          | `.number().finite().min(0)`             |
| pet_deposit               | `.number().finite().min(0)`             |
| rent_increase_rate        | `.number().finite().min(-0.5).max(0.5)` |
| pet_rent_increase_rate    | `.number().finite().min(-0.5).max(0.5)` |
| parking_increase_rate     | `.number().finite().min(-0.5).max(0.5)` |

**SharedInput:**

| Field                   | Constraint                                |
| ----------------------- | ----------------------------------------- |
| utilities_monthly_base  | `.number().finite().min(0)`               |
| utilities_increase_rate | `.number().finite().min(-0.5).max(0.5)`   |
| horizon_years           | `.number().finite().int().min(1).max(30)` |
| investment_return_rate  | `.number().finite().min(-0.5).max(0.5)`   |
| invest_vs_spend_ratio   | `.number().finite().min(0).max(1)`        |

### Schema structure

```ts
import { z } from 'zod'

const OwnershipSchema = z.object({
  /* fields above */
})
const RentalSchema = z.object({
  /* fields above */
})
const SharedSchema = z.object({
  /* fields above */
})

export const ScenarioInputSchema = z.object({
  ownership: OwnershipSchema,
  rental: RentalSchema,
  shared: SharedSchema,
})

export type ValidatedScenarioInput = z.infer<typeof ScenarioInputSchema>
```

---

## 6. URL state — `src/lib/url-state.ts`

### Format

The entire `ScenarioInput` is serialized to a single `?s=` query parameter using base64-encoded JSON.

Encode: `btoa(encodeURIComponent(JSON.stringify(input)))`  
Decode: `JSON.parse(decodeURIComponent(atob(raw)))`

Both `btoa`/`atob` are available in all modern browsers and in jsdom (the Vitest test environment).

### Exported interface

```ts
import type { ScenarioInput } from '../engine'

export function encode(input: ScenarioInput): string
// Returns a base64 string. Does NOT include "?s=" prefix.
// Never throws.

export function decode(raw: string): ScenarioInput | null
// Returns a validated ScenarioInput on success.
// Returns null on any failure (empty string, malformed base64, invalid JSON, Zod failure).
// Never throws.
```

### Encode algorithm

1. `JSON.stringify(input)`
2. `encodeURIComponent(jsonString)`
3. `btoa(encodedString)`
4. Return result.

### Decode algorithm (inside a single `try/catch` that catches everything and returns `null`)

1. `atob(raw)` — throws on invalid base64, caught by outer try/catch
2. `decodeURIComponent(decoded)`
3. `JSON.parse(jsonString)` — throws on invalid JSON, caught
4. `ScenarioInputSchema.safeParse(parsed)` — use `.safeParse()`, never `.parse()`
5. If `result.success`, return `result.data as ScenarioInput`
6. Otherwise, return `null`

`decode('')` must return `null` (not throw). `decode` must never throw under any input.

---

## 7. Hook — `src/hooks/useScenario.ts`

### State shape (internal)

```ts
type ScenarioState = {
  input: ScenarioInput
  result: ScenarioResult // always in sync with input; never null
  urlError: boolean // true when page loaded with a ?s= param that failed to decode
}
```

### Exposed interface

```ts
export function useScenario(): {
  input: ScenarioInput
  result: ScenarioResult
  urlError: boolean
  dismissUrlError: () => void
  updateOwnership: (patch: Partial<OwnershipInput>) => void
  updateRental: (patch: Partial<RentalInput>) => void
  updateShared: (patch: Partial<SharedInput>) => void
}
```

### Initialization

Run once, synchronously, via a `useState` initializer callback (not `useEffect`) so the correct values are available on the first render without a flash of defaults:

1. Read `window.location.search`.
2. Extract `new URLSearchParams(search).get('s')`.
3. If the `s` param exists:
   - Call `decode(s)`.
   - If `decode` returns a valid input: use it; `urlError = false`.
   - If `decode` returns `null`: use `DEFAULT_INPUT`; `urlError = true`.
4. If `s` param is absent: use `DEFAULT_INPUT`; `urlError = false`.
5. Call `computeScenario(initialInput)` synchronously to produce `initialResult`.
6. Initialize state: `{ input: initialInput, result: initialResult, urlError }`.

### URL sync

After every input change, update the URL without navigation:

```ts
const didMount = useRef(false)

useEffect(() => {
  if (!didMount.current) {
    didMount.current = true
    return
  }
  history.replaceState(null, '', `?s=${encode(input)}`)
}, [input])
```

The `useRef` guard prevents a `replaceState` call on the initial render (which would overwrite a ?s= param with the same value, but is still unnecessary churn).

### Update functions

Each update function merges a partial patch, recomputes, and commits state atomically:

```ts
const updateOwnership = useCallback((patch: Partial<OwnershipInput>) => {
  setState((prev) => {
    const newInput: ScenarioInput = {
      ...prev.input,
      ownership: { ...prev.input.ownership, ...patch },
    }
    return { input: newInput, result: computeScenario(newInput), urlError: false }
  })
}, [])
```

Apply the same pattern for `updateRental` (patches `rental`) and `updateShared` (patches `shared`). All three clear `urlError` on first interaction.

`dismissUrlError`: `() => setState(prev => ({ ...prev, urlError: false }))`.

### Imports for the hook

```ts
import { useState, useEffect, useCallback, useRef } from 'react'
import { computeScenario } from '../engine'
import type {
  ScenarioInput,
  ScenarioResult,
  OwnershipInput,
  RentalInput,
  SharedInput,
} from '../engine'
import { DEFAULT_INPUT } from '../lib/defaults'
import { encode, decode } from '../lib/url-state'
```

---

## 8. Components

### 8.1 `Tooltip.tsx`

Lightweight accessible tooltip. No external library. ~40–50 lines.

**Props:**

```ts
type TooltipProps = {
  text: string
  children: React.ReactNode
}
```

**Behavior:**

- Wrap children in a `div` with `position: relative` and `display: inline-block`.
- Show tooltip `div` when `isVisible` state is true (toggle on `onMouseEnter`/`onMouseLeave` and `onFocus`/`onBlur` of the container).
- Tooltip `div`: `role="tooltip"`, stable `id` via `useId()`, positioned below the trigger with `absolute left-0 top-full z-10 mt-1 w-56 rounded bg-gray-800 p-2 text-xs text-white shadow-lg`.
- Add `aria-describedby={tooltipId}` to the container div when `isVisible` is true.
- Do not use `dangerouslySetInnerHTML`.
- Named export only.

**Implementation sketch:**

```tsx
export function Tooltip({ text, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const tooltipId = useId()
  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      aria-describedby={isVisible ? tooltipId : undefined}
    >
      {children}
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute left-0 top-full z-10 mt-1 w-56 rounded bg-gray-800 p-2 text-xs text-white shadow-lg"
        >
          {text}
        </div>
      )}
    </div>
  )
}
```

---

### 8.2 `InputField.tsx`

Labeled numeric input with optional tooltip.

**Props:**

```ts
type InputFieldProps = {
  label: string
  value: number
  onChange: (value: number) => void
  tooltip?: string
  min?: number
  max?: number
  step?: number
  prefix?: string // e.g. "$"
  suffix?: string // e.g. "%", "yrs", "sqft"
}
```

**Behavior:**

- Render a `<label>` + optional `<Tooltip>`-wrapped `?` button + `<input type="number">`.
- Connect `<label htmlFor>` to the input's `id` via `useId()`.
- `onChange` handler: parse with `parseFloat`. If the result is not a finite number, do not call `onChange` (silently discard the intermediate typed value).
- Named export only.

**Tailwind classes:**

- Outer: `<div className="flex flex-col gap-1">`
- Label row: `<div className="flex items-center text-sm font-medium text-gray-700">`
- Tooltip trigger button: `<button type="button" className="ml-1 text-gray-400 hover:text-gray-600">?</button>`
- Input wrapper: `<div className="flex items-center gap-1">`
- Prefix/suffix: `<span className="text-sm text-gray-500">`
- Input: `<input className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">`

---

### 8.3 `InputSection.tsx`

Collapsible section using a native `<details>` element.

**Props:**

```ts
type InputSectionProps = {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean // default: false
}
```

**Behavior:**

- Local state `isOpen` initialized from `defaultOpen ?? false`.
- `<details open={isOpen}` with `onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}`.
- `<summary className="cursor-pointer select-none py-2 text-sm font-semibold text-gray-800">` with `{title}`.
- Children in `<div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">`.
- Named export only.

---

### 8.4 `BasicInputs.tsx`

Renders the always-visible basic inputs.

**Props:**

```ts
type BasicInputsProps = {
  input: ScenarioInput
  updateOwnership: (patch: Partial<OwnershipInput>) => void
  updateRental: (patch: Partial<RentalInput>) => void
  updateShared: (patch: Partial<SharedInput>) => void
}
```

**Fields (in order):**

| #   | Field                           | Control      | Label               | Extras                                                                                                       |
| --- | ------------------------------- | ------------ | ------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | `ownership.purchase_price`      | `InputField` | "Purchase Price"    | prefix="$", step=1000, min=0                                                                                 |
| 2   | `ownership.down_payment_pct`    | `InputField` | "Down Payment"      | suffix="%", min=0, max=100, step=0.5                                                                         |
| 3   | `ownership.interest_rate`       | `InputField` | "Interest Rate"     | suffix="%/yr", min=0, max=30, step=0.05                                                                      |
| 4   | `rental.base_rent_monthly`      | `InputField` | "Monthly Rent"      | prefix="$", min=0, step=50                                                                                   |
| 5   | `shared.horizon_years`          | range slider | "Analysis Horizon"  | min=1, max=30, step=1; display: "N years"                                                                    |
| 6   | `shared.investment_return_rate` | `InputField` | "Investment Return" | suffix="%/yr", min=0, max=50, step=0.25; **stored as decimal, displayed as %** (value × 100, onChange ÷ 100) |
| 7   | `shared.invest_vs_spend_ratio`  | range slider | "Invest vs. Spend"  | min=0, max=1, step=0.05; display: "N% invested" (value × 100, toFixed(0))                                    |

Add tooltips (see Section 9) to fields 1, 3, 4, 5, 6, 7.

**Slider markup pattern** (use for fields 5 and 7):

```tsx
<div className="flex flex-col gap-1">
  <div className="flex items-center justify-between">
    <div className="flex items-center text-sm font-medium text-gray-700">
      <span>{label}</span>
      {tooltip && <Tooltip text={tooltip}><button type="button" className="ml-1 text-gray-400 hover:text-gray-600">?</button></Tooltip>}
    </div>
    <span className="text-sm text-gray-500">{displayValue}</span>
  </div>
  <input type="range" ... className="w-full accent-blue-600" />
</div>
```

Slider `onChange` for `horizon_years`: `parseInt(e.target.value, 10)`.  
Slider `onChange` for `invest_vs_spend_ratio`: `parseFloat(e.target.value)`.

**Outer wrapper:** `<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">`.

Named export only.

---

### 8.5 `AdvancedInputs.tsx`

Renders all advanced fields in four collapsible `InputSection` sub-groups.

**Props:** Same as `BasicInputsProps`.

**All rate fields that are stored as decimals must be displayed/entered as percentages:**

- `value` prop: `fieldValue * 100`
- `onChange` handler: `(v) => updateX({ field: v / 100 })`

This applies to: `home_appreciation_rate`, `hoa_increase_rate`, `maintenance_increase_rate`, `insurance_increase_rate`, `rent_increase_rate`, `pet_rent_increase_rate`, `parking_increase_rate`, `utilities_increase_rate`, and `shared.investment_return_rate` (already handled in BasicInputs).

**Sub-section "Loan Details"** (`defaultOpen={false}`):

| Field                         | Label           | Control      | Extras                                  |
| ----------------------------- | --------------- | ------------ | --------------------------------------- |
| `ownership.loan_term_years`   | "Loan Term"     | `InputField` | suffix="yrs", min=1, max=50, step=1     |
| `ownership.pmi_rate`          | "PMI Rate"      | `InputField` | suffix="%/yr", min=0, max=10, step=0.05 |
| `ownership.closing_costs_pct` | "Closing Costs" | `InputField` | suffix="%", min=0, max=20, step=0.1     |
| `ownership.selling_cost_pct`  | "Selling Cost"  | `InputField` | suffix="%", min=0, max=30, step=0.1     |

**Sub-section "Property Costs"** (`defaultOpen={false}`):

| Field                                  | Label               | Control      | Extras                                   |
| -------------------------------------- | ------------------- | ------------ | ---------------------------------------- |
| `ownership.real_estate_tax_rate`       | "Property Tax Rate" | `InputField` | suffix="%/yr", min=0, max=10, step=0.05  |
| `ownership.assessed_value`             | "Assessed Value"    | `InputField` | prefix="$", min=0, step=1000             |
| `ownership.homeowner_insurance_annual` | "Home Insurance"    | `InputField` | prefix="$", suffix="/yr", min=0, step=50 |
| `ownership.hoa_monthly`                | "HOA Fee"           | `InputField` | prefix="$", suffix="/mo", min=0, step=10 |
| `ownership.home_size_sqft`             | "Home Size"         | `InputField` | suffix="sqft", min=0, step=100           |
| `ownership.maintenance_pct_annual`     | "Maintenance"       | `InputField` | suffix="%/yr", min=0, max=20, step=0.1   |

**Sub-section "Appreciation & Escalation"** (`defaultOpen={false}`):

| Field                                 | Label                    | Decimal→% | Extras                                    |
| ------------------------------------- | ------------------------ | --------- | ----------------------------------------- |
| `ownership.home_appreciation_rate`    | "Home Appreciation"      | yes       | suffix="%/yr", min=-50, max=50, step=0.25 |
| `ownership.hoa_increase_rate`         | "HOA Escalation"         | yes       | suffix="%/yr", min=-50, max=50, step=0.25 |
| `ownership.maintenance_increase_rate` | "Maintenance Escalation" | yes       | suffix="%/yr", min=-50, max=50, step=0.25 |
| `ownership.insurance_increase_rate`   | "Insurance Escalation"   | yes       | suffix="%/yr", min=-50, max=50, step=0.25 |
| `rental.rent_increase_rate`           | "Rent Escalation"        | yes       | suffix="%/yr", min=-50, max=50, step=0.25 |
| `shared.utilities_monthly_base`       | "Utilities"              | no        | prefix="$", suffix="/mo", min=0, step=10  |
| `shared.utilities_increase_rate`      | "Utilities Escalation"   | yes       | suffix="%/yr", min=-50, max=50, step=0.25 |

**Sub-section "Rental Details"** (`defaultOpen={false}`):

| Field                              | Label                 | Decimal→% | Extras                                    |
| ---------------------------------- | --------------------- | --------- | ----------------------------------------- |
| `rental.pet_rent_monthly`          | "Pet Rent"            | no        | prefix="$", suffix="/mo", min=0, step=5   |
| `rental.pet_rent_increase_rate`    | "Pet Rent Escalation" | yes       | suffix="%/yr", min=-50, max=50, step=0.25 |
| `rental.parking_fee_monthly`       | "Parking Fee"         | no        | prefix="$", suffix="/mo", min=0, step=5   |
| `rental.parking_increase_rate`     | "Parking Escalation"  | yes       | suffix="%/yr", min=-50, max=50, step=0.25 |
| `rental.renters_insurance_monthly` | "Renters Insurance"   | no        | prefix="$", suffix="/mo", min=0, step=5   |
| `rental.admin_fee`                 | "Admin Fee"           | no        | prefix="$", min=0, step=50                |
| `rental.security_deposit`          | "Security Deposit"    | no        | prefix="$", min=0, step=100               |
| `rental.pet_deposit`               | "Pet Deposit"         | no        | prefix="$", min=0, step=50                |

Add tooltips (see Section 9) to: `loan_term_years`, `pmi_rate`, `closing_costs_pct`, `selling_cost_pct`, `real_estate_tax_rate`, `assessed_value`, `homeowner_insurance_annual`, `hoa_monthly`, `home_size_sqft`, `maintenance_pct_annual`, `home_appreciation_rate`, `rent_increase_rate`, `utilities_monthly_base`, `renters_insurance_monthly`, `admin_fee`, `security_deposit`.

Named export only.

---

### 8.6 `DebugPanel.tsx`

Shows raw engine output. Intentionally minimal — replaced entirely in Stage 3.

**Props:**

```ts
type DebugPanelProps = {
  result: ScenarioResult
}
```

**Behavior:**

- `<details>` element, closed by default (no `open` attribute).
- `<summary>Debug: Raw Engine Output</summary>`
- Inside: four `<pre className="overflow-auto text-xs">` blocks containing:
  1. `JSON.stringify(result.verdict, null, 2)`
  2. `JSON.stringify(result.totals, null, 2)`
  3. `JSON.stringify(result.monthly_schedule[0] ?? null, null, 2)` — first row
  4. `JSON.stringify(result.monthly_schedule[result.monthly_schedule.length - 1] ?? null, null, 2)` — last row

Use `?? null` guards to satisfy `noUncheckedIndexedAccess`. Do not use `dangerouslySetInnerHTML`. Named export only.

---

## 9. Tooltip text

Pass these strings as the `tooltip` prop. Keep under 120 characters each.

| Field                      | Tooltip text                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| purchase_price             | "The total price you will pay for the home, not including closing costs."                                                      |
| interest_rate              | "Your annual mortgage interest rate. Check current rates from your lender or Bankrate."                                        |
| base_rent_monthly          | "Your base monthly rent, not including parking, pet fees, or utilities."                                                       |
| horizon_years              | "How many years to model. Longer horizons tend to favor buying; shorter ones often favor renting."                             |
| investment_return_rate     | "Expected annual return on investments. The S&P 500 has averaged about 7% after inflation historically."                       |
| invest_vs_spend_ratio      | "When one option is cheaper monthly, what fraction of the savings gets invested vs. spent. 50% is a reasonable middle ground." |
| loan_term_years            | "Most mortgages are 30 years. A 15-year term builds equity faster but requires higher monthly payments."                       |
| pmi_rate                   | "Private Mortgage Insurance, required when down payment is below 20%. Typically 0.5–1.5%/yr of the loan."                      |
| closing_costs_pct          | "Upfront fees when buying: lender fees, title insurance, escrow. Typically 2–5% of purchase price."                            |
| selling_cost_pct           | "Cost to sell at horizon end: agent commissions, transfer taxes. Typically 6–8% of sale price."                                |
| real_estate_tax_rate       | "Annual property tax as a percentage of home value. Varies widely by location; 1–2% is typical."                               |
| assessed_value             | "Some counties tax based on assessed value rather than market value. Enter 0 to use purchase price."                           |
| homeowner_insurance_annual | "Annual home insurance premium. Roughly $1,000–$2,000/yr for a median home."                                                   |
| hoa_monthly                | "Monthly Homeowners Association fee, if any. Covers shared amenities and maintenance."                                         |
| home_size_sqft             | "Square footage of the home. Used for reference; utilities are entered separately."                                            |
| maintenance_pct_annual     | "Annual maintenance and repairs as a % of home value. The 1% rule is a common starting point."                                 |
| home_appreciation_rate     | "Expected annual home value appreciation. The national average is ~4%/yr but varies by market."                                |
| rent_increase_rate         | "Expected annual rent increase. The national average is ~3–5%/yr."                                                             |
| utilities_monthly_base     | "Combined monthly utilities (electric, gas, water, etc.) in the first year."                                                   |
| renters_insurance_monthly  | "Renters insurance protects your belongings. Typically $15–$30/month."                                                         |
| admin_fee                  | "A one-time, non-refundable fee charged by some landlords at move-in (also called an application or move-in fee)."             |
| security_deposit           | "A refundable deposit returned when you move out (minus damages). Not counted as a rental cost."                               |

Fields with no tooltip (self-explanatory): `down_payment_pct`, `hoa_increase_rate`, `maintenance_increase_rate`, `insurance_increase_rate`, `pet_rent_monthly`, `pet_rent_increase_rate`, `parking_fee_monthly`, `parking_increase_rate`, `pet_deposit`, `utilities_increase_rate`.

---

## 10. `App.tsx` — application shell

Replace the existing stub entirely:

```tsx
import { useScenario } from './hooks/useScenario'
import { BasicInputs } from './components/BasicInputs'
import { AdvancedInputs } from './components/AdvancedInputs'
import { DebugPanel } from './components/DebugPanel'
import { InputSection } from './components/InputSection'

export default function App() {
  const { input, result, urlError, dismissUrlError, updateOwnership, updateRental, updateShared } =
    useScenario()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {urlError && (
        <div className="mb-4 flex items-center justify-between rounded border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <span>URL parameters were invalid or corrupted. Showing default values.</span>
          <button
            type="button"
            onClick={dismissUrlError}
            className="ml-4 font-semibold underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Rent vs Buy Calculator</h1>
      <div className="space-y-6">
        <BasicInputs
          input={input}
          updateOwnership={updateOwnership}
          updateRental={updateRental}
          updateShared={updateShared}
        />
        <InputSection title="Advanced Options">
          <AdvancedInputs
            input={input}
            updateOwnership={updateOwnership}
            updateRental={updateRental}
            updateShared={updateShared}
          />
        </InputSection>
        <DebugPanel result={result} />
      </div>
    </div>
  )
}
```

`App.tsx` uses `export default` (required by the ESLint `react-refresh/only-export-components` rule). All other components and hooks use named exports.

Note: `AdvancedInputs` is wrapped in an `InputSection` here at the `App` level. Inside `AdvancedInputs`, each sub-section uses its own nested `InputSection`. The outer `InputSection` in `App` uses `defaultOpen={false}`.

---

## 11. Testing requirements

### `src/lib/__tests__/url-state.test.ts`

Vitest only — no React or RTL imports.

**Test cases:**

1. Round-trip with defaults: `decode(encode(DEFAULT_INPUT))` deep-equals `DEFAULT_INPUT`.
2. Round-trip with overrides: change `purchase_price`, `base_rent_monthly`, and `horizon_years`; encode; decode; assert changed values survived.
3. `decode('')` returns `null`.
4. `decode` with a valid base64 string that decodes to plain text (not JSON) returns `null`.
5. `decode` with valid base64/JSON but `horizon_years: 0` (below schema min) returns `null`.
6. `decode` with valid base64/JSON but `purchase_price: null` (wrong type) returns `null`.
7. All of cases 3–6: wrap in a try/catch; assert no error was thrown.

### `src/lib/__tests__/schema.test.ts`

**Test cases:**

1. `ScenarioInputSchema.safeParse(DEFAULT_INPUT).success` is `true`.
2. `horizon_years: 0` → fail.
3. `horizon_years: 31` → fail.
4. `horizon_years: 1` → pass; `horizon_years: 30` → pass.
5. `invest_vs_spend_ratio: -0.01` → fail; `invest_vs_spend_ratio: 1.01` → fail.
6. `invest_vs_spend_ratio: 0` → pass; `invest_vs_spend_ratio: 1` → pass.
7. `purchase_price: 0` → fail (must be positive); `purchase_price: 1` → pass.
8. `home_appreciation_rate: 0.51` → fail; `home_appreciation_rate: -0.51` → fail.
9. `loan_term_years: 1.5` → fail (must be integer).
10. Any field set to `NaN` → fail (`.finite()` rejects NaN).
11. Any field set to `Infinity` → fail (`.finite()` rejects Infinity).
12. Omit one required field → fail.

### `src/components/__tests__/InputForm.test.tsx`

Uses React Testing Library + Vitest. Mock `window.location` and `history.replaceState` in `beforeEach`:

```ts
beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: { search: '' },
    writable: true,
  })
  vi.spyOn(history, 'replaceState').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
})
```

**Test cases:**

1. Render `<App />` → find an input with value `550000` (purchase price default).
2. Change the purchase price input → assert the displayed value updates.
3. On initial render, the advanced options section is collapsed (assert an advanced-only field, e.g. the PMI input, is not in the document, or that the `<details>` element for "Advanced Options" lacks the `open` attribute).
4. Click the `<summary>` of "Advanced Options" → assert a previously-hidden field is now in the document.

### `src/components/__tests__/DebugPanel.test.tsx`

**Test cases:**

1. Render `<DebugPanel result={computeScenario(DEFAULT_INPUT)} />` → no crash.
2. The `<details>` element does not have the `open` attribute on initial render.
3. After setting `open` on the `<details>` (or clicking the summary), the text `"buying"` or `"renting"` is present in the rendered output.

---

## 12. TypeScript conventions

All rules from CLAUDE.md apply. Key reminders for Stage 2:

- `noUncheckedIndexedAccess`: array index access returns `T | undefined`. Use `?? null` or optional chaining before passing to `JSON.stringify`. Do not use `!` non-null assertions in new code.
- The `as ScenarioInput` cast in `url-state.ts` after Zod validation is intentional and acceptable — document it with a short inline comment explaining the structural identity.
- Export types using the `type` keyword in `useScenario.ts` to satisfy `isolatedModules`: `import type { ... }`.
- No `dangerouslySetInnerHTML`, `eval`, `new Function`, or raw `innerHTML` anywhere.

---

## 13. CI compliance checklist

Before closing the session, verify all of the following exit with code 0:

- `pnpm lint` — zero errors, zero warnings
- `pnpm format:check` — run `pnpm format` first if needed, then re-check
- `pnpm typecheck` — zero type errors
- `pnpm test -- --run` — all new tests pass; all existing engine tests pass
- `pnpm build` — Vite production build succeeds

**ESLint note:** `App.tsx` must use `export default` (required by `react-refresh/only-export-components`). All other component and hook files must use only named exports.

**Prettier config** (from the project): `semi: false`, `singleQuote: true`, `tabWidth: 2`, `trailingComma: 'all'`, `printWidth: 100`. Run `pnpm format` to auto-fix.

---

## 14. Acceptance criteria

The session is complete when all 15 of the following are true:

1. `pnpm add zod` has been run; `zod` appears in `package.json` under `"dependencies"`.
2. `src/lib/defaults.ts` exists and exports `DEFAULT_INPUT` with all 31 fields at the values specified in Section 4.
3. `ScenarioInputSchema.safeParse(DEFAULT_INPUT).success` is `true`; `ScenarioInputSchema.safeParse({ ...DEFAULT_INPUT, shared: { ...DEFAULT_INPUT.shared, horizon_years: 0 } }).success` is `false`.
4. `decode(encode(DEFAULT_INPUT))` deep-equals `DEFAULT_INPUT`; `decode('')` returns `null` without throwing.
5. `useScenario` initializes from `?s=` when present; sets `urlError: true` when the param is present but invalid.
6. `Tooltip` uses `role="tooltip"` and `aria-describedby`; shows/hides on hover and keyboard focus.
7. `InputField` does not call `onChange` when the typed value parses to NaN or Infinity.
8. `InputSection` renders a `<details>`/`<summary>` pair; is closed by default when `defaultOpen` is omitted.
9. `BasicInputs` renders all 7 basic fields. Both sliders (`horizon_years`, `invest_vs_spend_ratio`) display their current value next to the label. The `investment_return_rate` field converts decimal storage to % display.
10. `AdvancedInputs` renders all 4 sub-sections with the correct fields. All decimal rate fields display as percentages and divide by 100 on `onChange`.
11. `DebugPanel` renders a `<details>` closed by default; when open, shows `verdict`, `totals`, first monthly row, and last monthly row as JSON strings.
12. `App.tsx` renders: URL error banner (only when `urlError` is true), page title, `BasicInputs`, collapsible `AdvancedInputs` (via `InputSection`), `DebugPanel`. Changing any input causes the debug panel output to update (live recalculation confirmed).
13. All new unit and component tests pass. All Stage 1 engine tests (`src/engine/__tests__/`) continue to pass.
14. `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test -- --run`, and `pnpm build` all exit with code 0.
15. `CHANGELOG.md` contains a "Stage 2" entry listing the deliverables completed.

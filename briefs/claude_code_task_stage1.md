# Rent vs Buy Calculator — Stage 1: Math Engine + Validation

## Project context

This is a new project. A client-side TypeScript web application that compares the financial outcome of renting versus buying a home over a user-defined horizon. The full project handoff document (`Rent-vs-buy project handoff.md`) covers the why, the user, the tech stack, the six-stage plan, and the project-level acceptance criteria. Read it first if you haven't.

Stage 1 builds the **math engine in isolation**: a pure TypeScript module that takes scenario inputs, runs the financial model, and returns a structured result. No UI. No DOM. No React. Just functions, types, and tests.

The engine ports an existing Python implementation (in `reference/`) and extends it with the Tier 2 model additions. Bugs in the Python source are fixed during the port; they are **not** carried forward.

## Scope of THIS session (Stage 1)

1. Initialize the repository with the Vite + React + TypeScript + Tailwind + Vitest tech stack (per the handoff's tool requirements). The React/Tailwind scaffolding is wiring only — no components yet. The reason to set up the full stack now rather than just a bare TS module is to avoid a separate "configure the project" stage later.
2. Place the Python source files (`rent.py`, `mortgage.py`, `housinganalysis.py`, `main.py`) into `reference/` and commit them. They are read-only reference material for the rest of the project.
3. Build the math engine as a standalone module at `src/engine/`.
4. Define the engine's public types (input scenario, output result) explicitly. These types will be the contract for every subsequent stage.
5. Fix every bug listed in the "Bugs to fix during the port" section below. Do not preserve any of them.
6. Add the Tier 2 model extensions (opportunity cost on up-front capital, opportunity cost on monthly differential with split parameter, sale proceeds at end of horizon, variable analysis horizon).
7. Write unit tests against three hand-computed reference scenarios.
8. Wire ESLint, Prettier, and Vitest so they all run cleanly from `pnpm` scripts (or `npm` if pnpm isn't available).
9. Stand up a minimal CI workflow (GitHub Actions) that installs with a frozen lockfile and runs, on every push and pull request: lint, format-check, type-check, the test suite, and a dependency audit that **fails the build on high or critical advisories**. CI is created now rather than at Stage 6 so the gate guards every subsequent stage's dependency additions from the start. The workflow is intentionally lean here and grows build/deploy steps in later stages.

## Out of scope for THIS session

- **Any UI.** No React components, no input form, no chart. Stage 2 starts the UI work.
- **URL state encoding.** Stage 2.
- **CSV or JSON export/import.** Stage 5.
- **Sensitivity strip calculations.** Stage 4 — though if the engine's API is designed well, the sensitivity strip will just be repeated calls to the engine with perturbed inputs, so think about that when designing the public API.
- **Tax effects, inflation adjustment.** Tier 3. Out of scope entirely for this project.
- **Performance optimization beyond reasonable defaults.** The engine runs in <10ms for any sensible scenario; don't go past that.

---

## Repository structure (target end-state for Stage 1)

```
rent-vs-buy/
├── .github/
│   └── workflows/
│       └── ci.yml                # install (frozen) + lint + format + tsc + test + audit
├── reference/
│   ├── rent.py
│   ├── mortgage.py
│   ├── housinganalysis.py
│   └── main.py
├── src/
│   ├── engine/
│   │   ├── index.ts              # public API: exports computeScenario and types
│   │   ├── types.ts              # ScenarioInput, ScenarioResult, related types
│   │   ├── mortgage.ts           # amortization, PMI, taxes
│   │   ├── rent.ts               # rent escalation, upfront costs
│   │   ├── investment.ts         # opportunity cost helpers
│   │   ├── compute.ts            # top-level orchestration
│   │   └── __tests__/
│   │       ├── mortgage.test.ts
│   │       ├── rent.test.ts
│   │       ├── investment.test.ts
│   │       └── scenarios.test.ts # three reference scenarios end-to-end
│   └── main.tsx                  # React entry point, placeholder content
├── index.html
├── package.json
├── pnpm-lock.yaml (or package-lock.json)
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts (or merged into vite.config.ts)
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.cjs (or eslint.config.js for flat config)
├── .prettierrc
├── .gitignore
├── README.md
└── CHANGELOG.md
```

The `src/main.tsx` placeholder can be as simple as a heading reading "Rent vs Buy Calculator — Stage 1 complete." It exists only to verify the Vite + React + Tailwind pipeline works end-to-end before Stage 2 builds on top of it.

---

## Engine public API

The engine exposes a single primary function and a small set of types. Subsequent stages consume only the public exports from `src/engine/index.ts`.

### Primary function

```ts
function computeScenario(input: ScenarioInput): ScenarioResult
```

Pure, synchronous, deterministic. Same input always produces the same output. No side effects, no async, no I/O.

### `ScenarioInput` shape

Design the type with three top-level groupings to mirror how the UI will eventually present inputs. Use exact field names:

```ts
type ScenarioInput = {
  ownership: OwnershipInput
  rental: RentalInput
  shared: SharedInput
}

type OwnershipInput = {
  purchase_price: number // USD
  down_payment_pct: number // percentage, e.g. 20 for 20%
  interest_rate: number // annual percentage, e.g. 6.722
  loan_term_years: number // typically 30
  pmi_rate: number // annual percentage, e.g. 0.5; 0 means no PMI
  real_estate_tax_rate: number // annual percentage of home value
  assessed_value: number // USD; 0 means use purchase price for tax basis
  homeowner_insurance_annual: number // USD per year
  hoa_monthly: number // USD per month
  home_size_sqft: number // used for utilities estimation
  closing_costs_pct: number // percentage of purchase price
  maintenance_pct_annual: number // percentage of home value per year
  home_appreciation_rate: number // annual, as decimal, e.g. 0.04
  hoa_increase_rate: number // annual, as decimal
  maintenance_increase_rate: number // annual, as decimal
  insurance_increase_rate: number // annual, as decimal
  selling_cost_pct: number // percentage of sale price at end of horizon
}

type RentalInput = {
  base_rent_monthly: number
  pet_rent_monthly: number
  parking_fee_monthly: number
  renters_insurance_monthly: number
  admin_fee: number // one-time, non-refundable
  security_deposit: number // refundable; NOT counted as cost
  pet_deposit: number // refundable; NOT counted as cost
  rent_increase_rate: number // annual, as decimal
  pet_rent_increase_rate: number // annual, as decimal
  parking_increase_rate: number // annual, as decimal
}

type SharedInput = {
  utilities_monthly_base: number // USD per month at year 0
  utilities_increase_rate: number // annual, as decimal
  horizon_years: number // 1 to 30
  investment_return_rate: number // annual, as decimal, e.g. 0.075
  invest_vs_spend_ratio: number // 0.0 to 1.0; 0 = spend it all, 1 = invest it all
}
```

The utilities go in `shared` because both renters and owners pay them — the model assumes equivalent square footage. (Reasonable simplification for an MVP; if you disagree, note it but don't change the design.)

### `ScenarioResult` shape

```ts
type ScenarioResult = {
  inputs: ScenarioInput // echoed for downstream consumers
  monthly_schedule: MonthlyRow[] // length = horizon_years * 12
  yearly_summary: YearlySummary[] // length = horizon_years
  totals: ScenarioTotals
  verdict: Verdict
}

type MonthlyRow = {
  month_index: number // 1-based, 1 to horizon_years * 12
  year_index: number // 1-based
  // Ownership side
  mortgage_payment: number // principal + interest only
  principal_payment: number
  interest_payment: number
  pmi_payment: number
  property_tax: number
  homeowner_insurance: number
  hoa: number
  home_maintenance: number
  utilities_owner: number
  remaining_loan_balance: number
  home_value: number
  // Rental side
  base_rent: number
  pet_rent: number
  parking_fee: number
  renters_insurance: number
  utilities_renter: number
  // Differential and investment tracking
  owner_total_monthly_cost: number // sum of all owner monthly outflows
  renter_total_monthly_cost: number
  monthly_differential: number // positive if owning costs more; negative if renting costs more
  invested_amount_this_month: number // absolute value of differential * invest_vs_spend_ratio, applied to whichever side is cheaper
  owner_investment_balance: number // running total, includes growth at investment_return_rate compounded monthly
  renter_investment_balance: number
}

type YearlySummary = {
  year: number // 1-based
  owner_costs_this_year: number
  renter_costs_this_year: number
  owner_equity_in_home: number // home_value - remaining_loan_balance at year-end
  owner_net_worth: number // see net worth definition below
  renter_net_worth: number
}

type ScenarioTotals = {
  // Ownership totals over the horizon
  total_principal_paid: number
  total_interest_paid: number
  total_pmi_paid: number
  total_property_taxes: number
  total_homeowner_insurance: number
  total_hoa: number
  total_maintenance: number
  total_utilities_owner: number
  total_closing_costs: number // one-time at month 0
  total_ownership_outflows: number // sum of all owner cash out
  sale_proceeds: number // home_value at horizon end - remaining_loan - selling_costs
  owner_final_net_worth: number // sale_proceeds + owner_investment_balance at horizon end
  // Rental totals over the horizon
  total_rent_paid: number
  total_pet_rent: number
  total_parking_fees: number
  total_renters_insurance: number
  total_utilities_renter: number
  total_admin_fee: number // one-time, counted as cost
  total_rentership_outflows: number
  renter_final_net_worth: number // renter_investment_balance at horizon end (deposits returned, ignored)
}

type Verdict = {
  winner: 'buying' | 'renting' | 'tie'
  margin_usd: number // absolute value of net worth difference
  owner_net_worth: number
  renter_net_worth: number
}
```

The `verdict` field is what the Stage 3 headline answer will consume directly. `monthly_schedule` is what Stage 4's break-even chart and Stage 5's CSV export will consume. `yearly_summary` is for the chart's coarser-grained view. Design the engine so all three views derive from a single pass; do not run the engine three times.

### Net worth definition

This is load-bearing. The break-even chart compares these two values over time:

- **Owner net worth at time T:** (home_value at T) − (remaining_loan_balance at T) + (owner_investment_balance at T) − (any selling costs if liquidating at T)
- **Renter net worth at time T:** renter_investment_balance at T

For the **final** net worth at horizon end, the owner is treated as selling the home, so selling costs are subtracted. For intermediate months in the schedule, the chart should show owner net worth **before** selling costs (illustrating "what is this person worth on paper") — and then the final headline number uses the post-sale figure. This is a UI consideration that affects the engine output shape: include both `owner_paper_net_worth` and `owner_realized_net_worth` in `MonthlyRow` so Stage 4 can choose what to display.

Add these two fields to `MonthlyRow`:

```ts
owner_paper_net_worth: number // equity + investment balance, no selling costs
owner_realized_net_worth: number // equity - selling costs + investment balance (what you'd walk away with if you sold this month)
```

---

## Bugs to fix during the port

These are issues from the Python source. None should appear in the TypeScript port.

1. **Include maintenance in total cost of ownership.** Python's `totalcostofownership` sums everything except `total_maintenance`. In TS, every cost incurred by the owner appears in `total_ownership_outflows`.
2. **Include closing costs in total cost of ownership.** Python computes `closingcosts` but never adds them. In TS, closing costs are paid at month 0 and counted in `total_closing_costs` and `total_ownership_outflows`.
3. **Refundable deposits do not count as costs.** `security_deposit` and `pet_deposit` are refundable; do not include them in `total_rentership_outflows`. `admin_fee` is non-refundable and IS counted.
4. **Pet rent and parking escalate by their own rates.** Python couples them to `hoaincrease`, which is incoherent. In TS, use `pet_rent_increase_rate` and `parking_increase_rate` (both new inputs in `RentalInput`).
5. **PMI removal threshold uses original purchase price, not original loan amount.** Standard PMI rule: PMI drops off when remaining_loan_balance ≤ 0.80 × purchase_price. In Python it's compared to `initialloanvalue` (the loan amount). Fix this in `mortgage.ts`.
6. **Fix all typos when porting symbols.** `amatorization` → `amortization`, `amamtorization` → `amortization`, `real_estate_rax_rate` → `real_estate_tax_rate`, `ultilitiesincrease` → `utilities_increase_rate`, `totalcostofonwership` → `total_cost_of_ownership`, `Insuarnce` → `Insurance`.

---

## Tier 2 model additions (new logic)

### 1. Opportunity cost on up-front capital

Owner pays at month 0: `down_payment_amount + closing_costs + admin_fee_equivalent`. Wait — owner doesn't pay admin fee, but **the renter does have less up-front capital outflow**, so the _renter_ receives an opportunity-cost benefit on the down payment + closing costs equivalent.

Concretely:

- At month 0, define `owner_initial_outflow = down_payment_amount + closing_costs`.
- The renter's month 0 outflow is `admin_fee + security_deposit + pet_deposit`. Deposits are recoverable, so the **net** renter outflow at month 0 is just `admin_fee`.
- The differential at month 0 is `owner_initial_outflow - admin_fee`. This entire amount (multiplied by `invest_vs_spend_ratio`) seeds the **renter's** investment balance at month 0. The renter is treated as if they kept their down payment + closing costs in the market.

### 2. Opportunity cost on monthly differential

For each month:

- Compute `owner_total_monthly_cost` and `renter_total_monthly_cost` (the full sums of everything the owner / renter pays that month).
- Compute `monthly_differential = owner_total_monthly_cost - renter_total_monthly_cost`.
- If positive (owner pays more), the **renter** has extra money; invest `|monthly_differential| × invest_vs_spend_ratio` into renter's investment balance.
- If negative (renter pays more), the **owner** has extra money; invest `|monthly_differential| × invest_vs_spend_ratio` into owner's investment balance.
- Whichever balance gets the contribution, compound the **whole** balance at the monthly investment rate this month.

Monthly investment rate: `(1 + investment_return_rate)^(1/12) - 1`. Compound monthly even though the input is annual.

The `invest_vs_spend_ratio` is exactly that — a ratio. 0.5 means half the differential goes to investment, half is "spent" (vanishes from the model). 0.0 means everything is spent. 1.0 means everything is invested.

### 3. Sale proceeds at end of horizon

At the final month of the horizon:

- `sale_price = home_value at horizon end` (which is `purchase_price × (1 + home_appreciation_rate)^horizon_years` since appreciation is annual).
- `remaining_loan = remaining_loan_balance at horizon end month` (may be 0 if horizon ≥ loan_term).
- `selling_costs = sale_price × selling_cost_pct / 100`.
- `sale_proceeds = sale_price - remaining_loan - selling_costs`.

This value goes into `ScenarioTotals.sale_proceeds` and into `owner_final_net_worth = sale_proceeds + owner_investment_balance` at horizon end.

If `horizon_years > loan_term_years`, the loan is paid off before horizon end. The schedule's monthly mortgage payments (principal and interest) stop at month `loan_term_years * 12`. Property tax, insurance, HOA, maintenance, utilities continue. (For Stage 1 this is moot since horizon is capped at 30 = loan term, but design the code to handle it cleanly — it's two `if` statements.)

### 4. Variable analysis horizon

`SharedInput.horizon_years` ∈ [1, 30]. The engine's monthly_schedule has exactly `horizon_years * 12` rows. The yearly_summary has exactly `horizon_years` rows. Sale proceeds are computed at horizon end, not loan end. All totals are over the horizon, not the loan term.

---

## Math reference (sanity checks)

**Monthly mortgage payment (P&I):**

```
M = L * (r * (1+r)^n) / ((1+r)^n - 1)
```

where `L` is loan amount, `r` is monthly interest rate (`annual_rate / 12 / 100`), `n` is total payments (`loan_term_years * 12`). The existing Python uses an equivalent rearrangement; either form is fine. Handle `r = 0` separately to avoid division by zero (`M = L / n`).

**Amortization step:**

```
interest_this_month = remaining_balance * monthly_rate
principal_this_month = M - interest_this_month
remaining_balance -= principal_this_month
```

**Annual escalation applied at year boundary:** values inflate at the start of each new year, not gradually each month. This matches the Python behavior and avoids spurious precision.

**Compounding for investment:**

```
monthly_rate_investment = (1 + investment_return_rate)^(1/12) - 1
new_balance = (old_balance + contribution_this_month) * (1 + monthly_rate_investment)
```

Apply contribution **before** compounding (this is the convention that mirrors a typical brokerage where contributions go in at month start and the whole balance earns the month's return).

---

## Unit tests required

Tests live under `src/engine/__tests__/`. Use Vitest.

### Module-level tests

1. **`mortgage.test.ts`:** verify the monthly payment formula against a known reference (e.g., $320,000 loan at 6.722% for 30 years → monthly payment ≈ $2,069.32). Verify the amortization sums (total payments ≈ payment × 360; total interest ≈ total payments − principal). Verify PMI drops off when remaining balance crosses 80% of **purchase price** (not loan amount).
2. **`rent.test.ts`:** verify base rent and ancillary fees escalate at the correct annual rate. Verify refundable deposits are not in total rentership outflows. Verify admin fee is included exactly once.
3. **`investment.test.ts`:** verify monthly compounding produces the right balance for known inputs (e.g., $80,000 seed at 7.5% annual, no contributions, 30 years → ~$705,800; verify within $1 tolerance using the monthly compounding formula above). Verify the invest-vs-spend ratio works at endpoints (0.0 means investment balance stays at the seed; 1.0 means full contribution flows in).

### End-to-end reference scenarios

`scenarios.test.ts` runs three full scenarios and asserts on `verdict`, `totals.owner_final_net_worth`, and `totals.renter_final_net_worth`. Compute the expected values by hand or in a spreadsheet first; commit the expected values as constants in the test file with a comment explaining the derivation. Don't compute "expected" by running the engine and copy-pasting — the test must be a real check.

**Scenario A — "Buying clearly wins":**

- Purchase price $400K, 20% down, 6.722% / 30 yr, 1.2% tax, 0% PMI
- Rent $2,500/month (high relative to mortgage)
- Horizon 30 years, investment return 7.5%, invest_vs_spend 0.5
- Default escalations (4% appreciation, 5% rent, etc.)
- Expected: owner wins by a wide margin.

**Scenario B — "Renting clearly wins":**

- Purchase price $800K, 5% down, 7.5% / 30 yr, 1.2% tax, 0.8% PMI
- Rent $2,000/month (low relative to mortgage)
- Horizon 7 years, investment return 8%, invest_vs_spend 1.0
- Expected: renter wins by a wide margin (high PMI, short horizon, low rent, full invest of differential).

**Scenario C — "Close call":**

- Purchase price $450K, 20% down, 6.5% / 30 yr
- Rent $2,400/month
- Horizon 10 years, investment return 7%, invest_vs_spend 0.5
- Expected: outcome within 10% — exact verdict depends on the math, which is the point of the test.

For each scenario, also assert that `monthly_schedule` has the right length (horizon × 12) and that `yearly_summary` has the right length (horizon).

---

## Acceptance criteria

The session is done when:

1. The repo `rent-vs-buy` exists with the structure described above.
2. `pnpm install` (or `npm install`) completes without errors on Node 20+.
3. `pnpm dev` (or `npm run dev`) launches Vite, the browser opens, and the page renders the Stage 1 placeholder content via React + Tailwind.
4. `pnpm test` (or `npm test`) runs Vitest, all tests pass, and engine module coverage is ≥ 80%.
5. `pnpm lint` (or `npm run lint`) runs ESLint with zero errors and zero warnings.
6. `pnpm format:check` (or equivalent) confirms Prettier is happy.
7. `tsc --noEmit` runs with zero errors in strict mode.
8. The four Python files are in `reference/` and committed.
9. The engine's public API (`src/engine/index.ts`) exports `computeScenario`, `ScenarioInput`, `ScenarioResult`, and the nested types. No internal helpers leak.
10. Every bug from the "Bugs to fix" section is verifiably absent — there's a test or visible code path covering each one.
11. Every Tier 2 model addition is implemented as specified.
12. The three reference scenarios in `scenarios.test.ts` pass with hand-derived expected values (not engine-derived).
13. `README.md` exists with a short "what / who / how to run" section and links the project handoff.
14. `CHANGELOG.md` exists with a "Stage 1 — Math engine + validation" entry dated and bullet-listing what was completed.
15. No new third-party dependencies beyond what's specified in the handoff's tool requirements (React, Vite, TypeScript, Tailwind, Recharts, Vitest, React Testing Library, ESLint, Prettier, and their transitive deps). No date libraries (use stdlib), no math libraries (use stdlib), no decimal libraries (JavaScript `number` is fine for currency at this scale; document this assumption in a code comment).
16. `computeScenario` guards its inputs: if any numeric field is non-finite (`NaN`, `Infinity`, `-Infinity`), it throws a typed error rather than letting non-finite values propagate silently through the net-worth math. A unit test covers this. (This is a thin internal guard only — full schema validation lives at the UI/import boundary in Stages 2 and 5, not in the engine.)
17. A GitHub Actions workflow (`.github/workflows/ci.yml`) exists and, on push and pull request, installs with a frozen lockfile and runs lint, format-check, `tsc --noEmit`, the test suite, and a dependency audit. The audit step fails the build on high or critical advisories. The workflow passes on the Stage 1 codebase.

## Constraints

- TypeScript strict mode is non-negotiable. `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitOverride": true` in `tsconfig.json`.
- Engine module is pure. No `import` of React, DOM globals, or anything Node-specific. It must compile and run in any JS environment.
- Don't introduce a state management library. The engine has no state. (Stage 2+ will introduce React state, which is fine.)
- Function names use `camelCase`. Type and interface names use `PascalCase`. Constants are `SCREAMING_SNAKE_CASE`. File names are `kebab-case` or single-word lowercase.
- Money is `number` (USD). Rates expressed as decimals where the project handoff calls for decimals (e.g., 0.04 for 4%) and as percentages where it calls for percentages (e.g., 20 for 20% down). The type definitions above are authoritative on which is which — follow them exactly.
- Don't over-engineer. The engine is ~500 lines of TypeScript when done. If you find yourself building a generic financial-modeling framework, stop.
- The engine module (`src/engine/`) stays strictly dependency-free. A schema-validation library (zod) will be introduced in Stage 2 at the UI/import boundary only; it must never be imported into the engine. Stage 1 adds no dependencies.
- Defensive note: the engine assumes its inputs are already validated and in-range (the UI/import layer enforces bounds). The engine's own guard is limited to rejecting non-finite numbers, so a malformed call fails loudly instead of returning a plausible-looking wrong answer.
- CI audit gate: the audit step fails on high/critical advisories in **runtime** dependencies. If a fresh toolchain surfaces a high/critical advisory confined to a dev-only or build-only transitive dependency (a common occurrence with Vite/ESLint trees) and no non-breaking fix exists, it may be suppressed via an explicit, commented allow-list entry (e.g. an audit ignore/override keyed to the advisory ID) rather than blanket-lowering the threshold. Each suppression is documented with the advisory ID and the reason. Do not weaken the gate globally to make the build pass.

## Design notes for future stages (context only, do not implement)

- **Stage 2 (App shell + input form):** will consume `ScenarioInput` directly. Form fields map 1-to-1 to `ScenarioInput` leaves. The URL encoding will serialize this same object.
- **Stage 3 (Numerical outputs):** consumes `ScenarioResult.verdict` for the headline and `ScenarioResult.totals` for the cost breakdown table.
- **Stage 4 (Visualization):** consumes `ScenarioResult.monthly_schedule` for the chart data and `ScenarioResult.yearly_summary` for tooltip aggregates. The sensitivity strip will call `computeScenario` four extra times with perturbed inputs — so the engine being fast and pure is what makes that feature cheap.
- **Stage 5 (Import/export):** the JSON scenario export is literally `JSON.stringify(scenarioInput)`. The CSV export iterates `monthly_schedule` (or `yearly_summary`). Both rely on the engine's output shape being well-defined here.
- **Stage 6 (Polish + deploy):** no engine changes.

The cleaner the engine API is at the end of Stage 1, the cheaper every subsequent stage gets. Treat the type definitions as a contract the project commits to, not a suggestion.

## Definition of Done

This stage is "Done" when all 17 acceptance criteria above are satisfied, the repo is committed (one commit per logical chunk is fine; no single "stage 1 complete" mega-commit), and the engine is demonstrably consumable: open a Node REPL, `import { computeScenario } from './src/engine/'`, call it with sample inputs, get a sensible result.

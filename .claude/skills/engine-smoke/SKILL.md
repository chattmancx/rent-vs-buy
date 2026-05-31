---
name: engine-smoke
description: Run a quick smoke test of the math engine using Scenario A inputs. Imports computeScenario, calls it, and prints verdict and net worth totals. Use after any engine edit to sanity-check results before running the full test suite.
disable-model-invocation: true
allowed-tools: Bash(npx tsx*) Bash(node*) Bash(rm*) Bash(pnpm add*)
---

Run a quick smoke test of the math engine using Scenario A inputs from `briefs/claude_code_task_stage1.md`:

- purchase_price: 400000, down_payment_pct: 20, interest_rate: 6.722, loan_term_years: 30
- pmi_rate: 0, real_estate_tax_rate: 1.2, assessed_value: 0
- homeowner_insurance_annual: 1500, hoa_monthly: 0, home_size_sqft: 2000
- closing_costs_pct: 3, maintenance_pct_annual: 1
- home_appreciation_rate: 0.04, hoa_increase_rate: 0.05, maintenance_increase_rate: 0.04
- insurance_increase_rate: 0.06, selling_cost_pct: 7.5
- base_rent_monthly: 2500, pet_rent_monthly: 0, parking_fee_monthly: 0
- renters_insurance_monthly: 0, admin_fee: 0, security_deposit: 0, pet_deposit: 0
- rent_increase_rate: 0.05, pet_rent_increase_rate: 0.05, parking_increase_rate: 0.05
- utilities_monthly_base: 500, utilities_increase_rate: 0.06
- horizon_years: 30, investment_return_rate: 0.075, invest_vs_spend_ratio: 0.5

Write a temporary script at `/tmp/engine-smoke.mjs` that uses `tsx` to import `computeScenario` from `./src/engine/index.ts`, calls it with those inputs, and prints:

- verdict.winner and verdict.margin_usd
- totals.owner_final_net_worth and totals.renter_final_net_worth
- monthly_schedule.length and yearly_summary.length

Run the script with `npx tsx /tmp/engine-smoke.mjs`, print output, then delete `/tmp/engine-smoke.mjs`. If tsx is not available, suggest `pnpm add -D tsx` and retry.

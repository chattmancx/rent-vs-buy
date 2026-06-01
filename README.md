# Rent vs Buy Calculator

A client-side TypeScript web app that computes a credible, side-by-side financial comparison of renting versus buying a home over a user-defined horizon.

**For:** aspiring first-time homebuyers who want to settle the rent-vs-buy question with real numbers, not rules of thumb.

## What it models

- Full amortization with PMI removal at 80% LTV of purchase price
- Opportunity cost on down payment and closing costs (capital the renter keeps invested)
- Monthly cost differential invested at a user-adjustable return rate
- Sale proceeds at horizon end (appreciated home value minus loan balance minus selling costs)
- Variable analysis horizon (1–30 years)
- Year-over-year escalation of all costs (rent, HOA, maintenance, insurance, utilities)

## Model assumptions and limitations (Tier 2)

This tool does **not** model:

- Tax effects (mortgage interest deduction, SALT cap, capital gains exclusion) — see Tier 3 proposal
- Inflation adjustment / real-dollars display
- Adjustable-rate mortgages or non-conventional loans
- Refinancing
- Geographic variation in tax rates or appreciation

Shared URLs embed your full financial scenario and are visible in browser history, host access logs, and referrer headers.

## Running locally

Requires Node.js 20+ and pnpm 9+.

```bash
pnpm install
pnpm dev        # dev server at http://localhost:5173
pnpm test       # run tests in watch mode
pnpm typecheck  # TypeScript strict check
pnpm lint       # ESLint
```

## Project structure

```
src/engine/   Pure TypeScript math engine — no UI dependencies
src/          React app
```

## Deployed URL

https://chattmancx.github.io/rent-vs-buy/

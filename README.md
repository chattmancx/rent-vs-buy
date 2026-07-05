# Rent vs Buy Calculator

A client-side TypeScript web app that computes a credible, side-by-side financial comparison of renting versus buying a home over a user-defined horizon.

**For:** aspiring first-time homebuyers who want to settle the rent-vs-buy question with real numbers, not rules of thumb.

## What it models

- Full amortization with PMI removal at 80% LTV of purchase price
- Opportunity cost on down payment, closing costs, and refundable deposits (capital the renter keeps invested, refunded at horizon end)
- Monthly cost differential invested at a user-adjustable return rate
- Sale proceeds at horizon end (appreciated home value minus loan balance minus selling costs), net of federal capital gains tax (IRC §121 primary-residence exclusion)
- Federal tax effects: mortgage interest deduction, SALT cap, itemize vs. standard deduction, state income tax estimate
- Optional inflation adjustment — display figures in today's dollars without changing the underlying model
- Variable analysis horizon (1–30 years)
- Year-over-year escalation of all costs (rent, HOA, maintenance, insurance, utilities)

## Model assumptions and limitations (Tier 4, in progress)

Tier 2 (core model) and Tier 3 (tax effects + inflation adjustment) are complete and deployed. This tool still does **not** model:

- Adjustable-rate mortgages or non-conventional loan products (FHA/VA/jumbo)
- Refinancing
- Geographic variation in tax rates or appreciation
- Multiple scenarios side-by-side (use the JSON export/import to compare separately)
- Tax on the invested cost differential (a closed design decision, not a gap)

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

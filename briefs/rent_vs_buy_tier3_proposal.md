# Rent vs Buy Calculator — Tier 3 Proposal

## Purpose of this document

This is a forward-looking proposal for a follow-on project to the Tier 2 MVP of the Rent vs Buy Calculator. It is **not** yet a stage brief and not yet committed to. Its purpose is to capture the scope, rationale, dependencies, and open questions for the Tier 3 feature set so that a future planning conversation has a clear starting point.

Tier 3 was deliberately carved out of the MVP because each feature introduces UX cost (new inputs, new assumptions, new explanation burden) that pulls the tool toward "tax software" rather than "decision tool." That trade-off deserves its own scoping discussion rather than being bundled into the MVP.

---

## Relationship to the Tier 2 MVP

The Tier 2 MVP delivers a credible rent-vs-buy comparison built on:

- Debugged port of the existing Python model to TypeScript
- Opportunity cost on down payment, closing costs, and the monthly cost differential
- Sale proceeds at end of horizon (appreciated home value − remaining loan − selling costs)
- Variable analysis horizon with break-even visualization
- Adjustable investment return rate
- Toggle and slider for what share of the cost differential gets invested vs. spent
- Adjustable selling cost (default 7.5%)

Tier 3 assumes the MVP exists, is stable, and has been used enough to validate the core UX. Tier 3 is **additive** — it does not change any Tier 2 math; it layers refinements on top.

---

## Proposed feature set

Tier 3 contains two features. They are independent of each other and could be sequenced as two separate stages within the Tier 3 project, or done together.

### Feature 1: Tax effects modeling

The single largest distortion in any rent-vs-buy calculator that ignores taxes is on the owner side. Three tax effects materially change the answer for most users:

**Mortgage interest deduction.** Mortgage interest is deductible against federal income tax for itemizers, up to the loan limit ($750K for loans originated after 2017 under current law). Annual interest paid × marginal tax rate = annual tax benefit. The benefit is front-loaded because early payments are mostly interest.

**SALT cap interaction.** State and local taxes — including property taxes — are deductible only up to $10,000 federally. For owners in high-tax states or high-value homes, property tax above $10K (after combining with state income tax) provides no federal benefit. Modeling this correctly requires knowing the user's state income tax payment.

**Primary residence capital gains exclusion.** When the home is sold, up to $250K of gains ($500K married filing jointly) is excluded from capital gains tax, provided ownership and use tests are met. For long horizons in appreciating markets, this is significant — the difference between a $300K gain being fully taxed vs. fully excluded is potentially $60K–$90K.

**Renter side is mostly null** — there's no direct federal tax benefit to renting. Some states (e.g., NY, MA, CA) offer modest renter credits, but they're small enough to defer indefinitely.

**Why this is worth doing:** in high-cost, high-tax markets (CA, NY, NJ, MA, IL, DC area), the tax effects can swing the answer by tens of thousands of dollars over a 10-year horizon. A tool that claims to answer "should I rent or buy" while ignoring taxes is honest only in low-tax, lower-value scenarios.

**Why it's deferred from MVP:**

- Adds 3–5 new required inputs (filing status, marginal federal rate, state, state income tax)
- The standard deduction comparison is non-trivial — if the user wouldn't itemize anyway, the deduction is worth $0
- Tax law changes (the 2017 SALT cap, 2025 expiration of TCJA provisions); model needs to be auditable and dated
- Significant explanation burden — users will not trust outputs they don't understand

### Feature 2: Inflation adjustment

The MVP computes everything in nominal dollars. Over a 30-year horizon at 3% inflation, $1 today is worth ~$0.41 in year 30 dollars. Comparing a $500K nominal cost in year 30 to a $500K cost today distorts the comparison in ways that are not obvious to users.

**The proposal:** add a display toggle — "show results in today's dollars" vs. "show nominal dollars." The underlying calculations stay nominal (mortgage payments, rent escalations, appreciation are all naturally nominal); the toggle deflates display values by an assumed inflation rate (user-adjustable, default 3%) when active.

**Why this is worth doing:** the headline "buying is $80K cheaper over 30 years" number is misleading without inflation context. In today's dollars, that gap might be $35K, which changes whether a user perceives the difference as decisive or marginal.

**Why it's deferred from MVP:**

- Adds a conceptual layer that needs to be explained well (today's-dollars math is non-intuitive)
- Requires UI affordances to make the active mode unambiguous (no one should ever confuse nominal and real dollars)
- Less impactful than tax effects for shorter horizons (under 10 years, inflation distortion is small)

The implementation cost is modest once Tier 2 is in place; the UX cost is in explanation, not engineering.

---

## Why this is its own project

Bundling Tier 3 into the MVP would:

1. **Triple the input surface.** MVP has roughly 15–20 inputs depending on disclosure design. Tier 3 adds 5–8 more, mostly tax-related. Cognitive load matters for a tool whose value proposition is "settle the argument in 5 minutes."
2. **Force premature decisions on tax UX.** Should taxes be opt-in or default-on? Should the tool ask for state and infer the income tax rate, or ask for the rate directly? These deserve a scoping conversation informed by how users actually interact with the MVP.
3. **Delay shipping.** The MVP is decision-useful as-is. Holding it back for tax modeling delays the validation we need to inform the Tier 3 UX.

Shipping MVP → observing usage → designing Tier 3 with that data is the right sequence.

---

## Dependencies and prerequisites

Before Tier 3 work begins, the following should be true:

1. **Tier 2 MVP is shipped and stable.** All known bugs from the Python port are fixed. The MVP has been used by at least a handful of users (even informally) for a few weeks.
2. **The total-cost calculation engine is well-factored.** Tier 3 will plug into this engine, so it needs to be clean enough that adding tax terms doesn't require rewriting it. This is a constraint on Tier 2 implementation that should be flagged in the MVP stage briefs.
3. **The horizon model handles arbitrary years cleanly.** Tier 3 break-even calculations may interact with tax effects (e.g., capital gains exclusion only applies after 2 years of ownership). The horizon mechanism needs to be flexible.
4. **There's a real user need for it.** If MVP usage suggests users don't care about precision beyond the credible-comparison level, Tier 3 may not be worth doing at all.

---

## Risks and open questions

These need answers before Tier 3 becomes a stage-planning conversation.

1. **Tax law dating.** Federal tax rules change. The current SALT cap is scheduled (at time of writing) to potentially expire at the end of 2025; mortgage interest deduction limits were modified in 2017 and may change again. Strategy options:
   - Hard-code current rules with a clearly displayed "as of [date]" disclaimer
   - Make tax parameters user-configurable so the tool can be updated by editing config rather than code
   - Versioned tax tables in the codebase, with the user selecting "tax year"

2. **State income tax modeling.** Real state tax is progressive and varies wildly. Options:
   - Ask the user for their marginal state rate (simple, requires user knowledge)
   - Ask for state + approximate income, look up effective rate (more accurate, more inputs)
   - Hide it entirely and accept the SALT cap modeling will be slightly off

3. **Itemize vs. standard deduction.** The MID is only valuable to the extent the user itemizes. Should the tool:
   - Ask the user directly ("do you itemize?")
   - Estimate based on inputs (mortgage interest + property tax + state tax vs. current standard deduction)
   - Show both scenarios

4. **Capital gains modeling precision.** Federal long-term capital gains rates are bracketed (0%, 15%, 20%) by income. The exclusion is binary above the threshold. Open question: how much precision is appropriate for a calculator vs. how much should be flagged as "consult a tax professional."

5. **Inflation rate default.** 3% is the historical post-1990 average. The current Fed target is 2%. The post-2021 reality has been higher. Default value choice will shape user perception.

6. **Real vs. nominal in the investment return.** If results are displayed in today's dollars, the investment return rate should be the real return (historical real return on a 60/40 portfolio is ~5%, not 7.5%). This interaction needs care — users will not understand if numbers move when they toggle the display.

7. **Tax effects on the investment side.** Capital gains tax on the invested differential is currently ignored in Tier 2. If Tier 3 introduces taxes, consistency demands modeling investment taxation too — which adds the question of tax-advantaged accounts (401k, IRA) vs. taxable brokerage.

---

## Next steps

When this proposal becomes an active project:

1. Open a fresh planning conversation with this document and the Tier 2 project handoff as context.
2. Resolve the open questions above, in roughly the order listed.
3. Decide whether Feature 1 (tax effects) and Feature 2 (inflation adjustment) are one stage or two.
4. Write the stage briefs for Claude Code, following the convention established in the workout planner project (`claude_code_task_stageN.md`).

This document should be revisited if Tier 2 reveals architectural decisions that affect Tier 3 feasibility.

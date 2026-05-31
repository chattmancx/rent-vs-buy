# Rent vs Buy Calculator — Project Handoff Document

## Purpose of this document

A self-contained snapshot of the Rent vs Buy Calculator project's state, intended to seed a new conversation that continues planning or development. Reading this end-to-end should give you enough context to pick up at any stage without going back through the prior conversation.

This document covers the **Tier 2 MVP**. A separate `rent_vs_buy_tier3_proposal.md` exists for the Tier 3 follow-on project (tax effects + inflation adjustment), which is explicitly out of scope here.

---

## What this project is

A client-side TypeScript web application that helps users decide between renting and buying a home by computing a credible, side-by-side financial comparison over a user-defined horizon. The tool exists to answer the **quantitative** half of the rent-vs-buy debate; qualitative factors (lifestyle, mobility, attachment to place) are explicitly out of scope.

**Target user:** aspiring first-time homebuyer. The user has done some research, knows what a mortgage and PMI are, but appreciates tooltips and progressive disclosure. The UI surfaces basic inputs by default and hides advanced fields behind a toggle.

**Core differentiator vs. existing online calculators:** most rent-vs-buy tools either ignore opportunity cost on the down payment (biasing toward renting) or ignore sale proceeds at the end of the horizon (biasing toward renting again). This tool models both, plus a user-controlled spend/invest dial for the monthly cost differential — letting users see how sensitive the answer is to assumptions about their own behavior.

---

## Source material

The project starts from an existing Python implementation:

- `rent.py` — `Renter` class for monthly rent and upfront costs
- `mortgage.py` — `HomeLoan`, `RealEstateTaxes`, `PrivateMortgageInsurance`, `Mortgage` classes
- `housinganalysis.py` — `HousingAnalysis` class that combines mortgage and rent into a side-by-side analysis with year-over-year cost increases
- `main.py` — CLI entry point that runs the analysis and writes `schedule.csv`

This Python code is **reference material, not source to evolve.** The TypeScript port in Stage 1 will preserve the model's structure where it makes sense and rewrite where it doesn't. The Python files should be kept in a `reference/` subdirectory of the new repo for traceability.

### Known issues in the Python source

These were identified during scoping and must be fixed (or made non-applicable) in the TypeScript port:

1. **Missing maintenance in total cost of ownership.** `housinganalysis.py` computes `total_maintenance` but does not include it in the `totalcostofownership` sum.
2. **Missing closing costs in total cost of ownership.** `main.py` computes `closingcosts` but never passes it to the totals.
3. **Renter `upfront_costs` ignored.** `main.py` computes admin fees and deposits but never adds them to the total cost of rentership. Decision needed in Stage 1: refundable deposits should not count as a cost; the admin fee and non-refundable portion of pet deposit should.
4. **Pet rent and parking escalate by `hoaincrease`.** `housinganalysis.py` couples these to HOA increase, which is incoherent. They should use `rent_increase` or have their own dedicated escalation rates.
5. **PMI removal threshold uses original loan amount, not original home value.** `mortgage.py` compares remaining balance to `0.8 * initialloanvalue`. The standard PMI rule uses 80% LTV against original purchase price.
6. **Typos throughout:** `amatorization`, `amamtorization`, `real_estate_rax_rate`, `ultilitiesincrease`, `totalcostofonwership`, `Insuarnce`. Fix during the port.

### Model gaps to address in the port (Tier 2 additions)

These are new features, not bug fixes. Tier 2 adds:

1. **Opportunity cost on down payment + closing costs.** In the rent scenario, the equivalent up-front capital is invested at the user-defined investment return rate.
2. **Opportunity cost on monthly cost differential.** Whichever scenario is cheaper per month, the difference is partially invested at the user-defined return rate. A slider (0% to 100%) controls what fraction of the differential is invested vs. spent. 0% = "user spends every dollar they don't have to pay" (closer to human behavior); 100% = "every dollar saved is invested" (academically correct). Default position is a planning decision for Stage 2.
3. **Sale proceeds at end of horizon.** Owner sells the home at end of horizon: receives appreciated home value − remaining loan balance − selling costs (default 7.5%, user-adjustable).
4. **Variable analysis horizon.** User selects analysis horizon from 1 to 30 years. Default horizon TBD in Stage 2 (likely 10 years to reflect median US homeownership tenure). All totals and the break-even visualization respect the selected horizon.

---

## Tech stack and tool requirements

**Language:** TypeScript 5.x (strict mode enabled).

**Build tool:** Vite 5.x or later.

**UI framework:** React 18+ with function components and hooks. No class components.

**Charting:** Recharts. Chosen for its React-native API, declarative composition, and the fact that the break-even chart is a straightforward two-line chart that Recharts handles cleanly. Alternatives considered: Chart.js (imperative, less React-friendly), D3 (overkill for the chart needs). Revisit if Recharts proves insufficient.

**Styling:** Tailwind CSS, configured with a minimal custom theme. No CSS-in-JS libraries.

**Testing:** Vitest for unit tests (pairs natively with Vite). React Testing Library for component tests.

**Linting / formatting:** ESLint with the recommended TypeScript and React configs. Prettier for formatting. Both must run cleanly before any stage is considered complete.

**Package manager:** pnpm preferred for disk efficiency and speed; npm acceptable. yarn discouraged. Lock file must be committed.

**Runtime:** Node.js 20 LTS or later for development tooling. The shipped app is browser-only and has no Node runtime dependency.

**Version control:** Git. Repository name: `rent-vs-buy`. Initial commit should include the Python source files in `reference/` and a `.gitignore` covering `node_modules/`, `dist/`, `.env.local`, IDE artifacts.

**Deployment target:** Cloudflare Pages or GitHub Pages (decision deferred to Stage 6). Both are free, both serve static sites, both support custom domains. Cloudflare Pages has faster cold-start performance globally; GitHub Pages has tighter integration if the repo is already on GitHub.

**Browser support:** Last two versions of Chrome, Firefox, Safari, Edge. No IE11 support.

---

## Tier 2 scope (the MVP)

### Locked-in decisions from scoping conversations

| Decision                    | Value                                                                         |
| --------------------------- | ----------------------------------------------------------------------------- |
| Tech stack direction        | Client-side TypeScript (no backend)                                           |
| Model tier                  | Tier 2 (credible comparison, not comprehensive)                               |
| Target user                 | Aspiring first-time homebuyer                                                 |
| Investment return rate      | User-adjustable, sensible default                                             |
| Cost differential treatment | Toggle + slider for invest-vs-spend ratio                                     |
| Selling cost                | 7.5% default, user-adjustable                                                 |
| Horizon range               | 1 to 30 years, slider-controlled                                              |
| Output components           | Headline answer, break-even chart, side-by-side cost table, sensitivity strip |
| Persistence                 | URL-encoded state                                                             |
| Settings export             | JSON download                                                                 |
| Settings import             | JSON upload                                                                   |
| Results export              | CSV download                                                                  |
| Repository name             | `rent-vs-buy`                                                                 |

### Basic vs. advanced input disclosure

**Basic (visible by default):**

- Purchase price
- Down payment %
- Mortgage interest rate
- Monthly rent
- Analysis horizon
- Investment return rate
- Spend-vs-invest dial position

**Advanced (hidden behind toggle):**

- Loan term (years)
- PMI rate
- Real estate tax rate
- Homeowner insurance (annual)
- HOA fee
- Home size (for utilities estimation)
- Closing costs %
- Maintenance % (annual, of home value)
- Home appreciation rate
- Rent escalation rate
- HOA escalation rate
- Utilities escalation rate
- Insurance escalation rate
- Maintenance escalation rate
- Selling cost %
- Pet rent, pet deposit, parking fee, renters insurance, admin fee, security deposit

### Output components

1. **Headline answer.** One sentence at the top: "Over [N] years, buying wins by $[X]" or equivalent for renting. Updates live.
2. **Break-even chart.** Two lines on one axis (owner net worth, renter net worth) over time. Crossover point visually highlighted. Horizon slider attached to the X-axis updates the headline and table when moved.
3. **Side-by-side cost breakdown table.** Owner column, renter column, line items for principal, interest, PMI, taxes, insurance, HOA, maintenance, utilities, rent, renters insurance, pet fees, parking, opportunity cost on up-front capital, opportunity cost on differential, sale proceeds (owner only). Totals at the bottom.
4. **Sensitivity strip.** Small panel showing how the headline shifts for ±1 percentage point moves on key assumptions (interest rate, investment return rate, home appreciation rate, rent escalation rate). Four mini-deltas displayed compactly.

---

## Stage breakdown

The project decomposes into six stages, each scoped to a single Claude Code session, each producing demonstrable output. Stage briefs (`claude_code_task_stageN.md`) will be written one at a time in the conversation preceding each stage.

### Stage 1 — Math engine + validation

Port the Python financial model to TypeScript as a pure module with no UI. Fix all bugs identified in the "Known issues" section. Add the Tier 2 extensions (opportunity cost on up-front capital, opportunity cost on differential with split parameter, sale proceeds, variable horizon). Unit tests against hand-computed reference scenarios.

Also stands up a minimal CI workflow (GitHub Actions) in this first stage rather than at Stage 6. The workflow installs with a frozen lockfile and runs lint, format-check, type-check, tests, and a dependency audit (fail on high/critical). Standing CI up now means every subsequent stage's dependency additions and code changes are gated from the moment they land, rather than being audited retroactively five stages later. The workflow grows as later stages add build and deploy steps.

### Stage 2 — App shell + input form

Vite + React + TypeScript scaffolding. Input form with progressive disclosure (basic vs. advanced). Tooltips on every non-trivial field. URL state encoding (settings serialized to a compact form, decoded on page load). Live recalculation wired to the Stage 1 engine. No fancy output yet — debug panel showing raw numbers is acceptable.

### Stage 3 — Numerical outputs

Headline answer (one-sentence summary, live-updating). Side-by-side cost breakdown table (owner column, renter column, line items, totals). Both update live as inputs change.

### Stage 4 — Visualization outputs

Break-even chart (two lines, crossover highlight). Horizon slider on the X-axis controlling the headline and table. Sensitivity strip showing ±1pp deltas on the four key assumptions.

### Stage 5 — Import / export

CSV results export (year-by-year or month-by-month breakdown, columns for all model terms including invested differential and net worth tracks). JSON scenario export (settings only, compact, human-readable). JSON scenario import (file picker, populates inputs cleanly, triggers recalc).

### Stage 6 — Polish + deploy

Accessibility pass (keyboard navigation, ARIA labels, color contrast WCAG AA). Responsive layout (mobile-friendly inputs, chart adapts to narrow viewports). Tooltip and copy review. Static hosting deployment (Cloudflare Pages or GitHub Pages, decision made in this stage). Final acceptance pass against the project-level acceptance criteria.

---

## Project-level acceptance criteria

The project is considered done when **all** of the following are true. This is the project-level Definition of Done; individual stages will have their own per-stage acceptance criteria in their respective briefs.

### Functional

1. The app loads in a modern browser and renders the input form with default values.
2. All basic and advanced inputs accept user changes and trigger live recalculation.
3. Tooltips appear on hover/focus for every non-trivial input.
4. The headline answer correctly reflects the current scenario and updates within 100ms of any input change.
5. The break-even chart renders both net worth curves correctly. If a crossover exists within the horizon, it is visually highlighted. If no crossover exists, the chart still renders cleanly.
6. The horizon slider, when moved, updates the headline, the cost breakdown table, and the chart's X-axis range.
7. The cost breakdown table shows correct totals matching the headline answer.
8. The sensitivity strip shows four ±1pp deltas that mathematically reconcile with the underlying engine (verified by sample comparison).
9. URL state captures the full scenario; pasting a URL into a fresh browser tab restores the same scenario.
10. CSV export downloads a well-formed CSV that opens correctly in Excel and Google Sheets and is parseable by Python's `csv` module and pandas.
11. JSON settings export downloads a well-formed JSON file matching a documented schema.
12. JSON settings import accepts an exported file and restores the scenario cleanly; malformed JSON shows a user-friendly error.
13. The spend-vs-invest slider moves smoothly between 0% and 100% and the model correctly applies the chosen split.

### Model correctness

14. The engine produces results consistent with hand-computed reference scenarios for at least three distinct input combinations (low rent / high purchase price, comparable rent / purchase price, high rent / low purchase price).
15. All Python source bugs (maintenance omission, closing costs omission, deposit treatment, escalation coupling, PMI threshold, typos) are not present in the TypeScript port.
16. The PMI removal threshold uses 80% LTV against original purchase price, not original loan amount.
17. Refundable deposits do not count toward total cost of rentership; non-refundable upfront costs do.

### Code quality

18. TypeScript compiles cleanly in strict mode with zero errors.
19. ESLint runs cleanly with zero errors and zero warnings on the project's chosen config.
20. Prettier formatting is consistent across the codebase.
21. Unit tests cover the math engine; all tests pass; coverage of the engine module is ≥ 80%.
22. The Stage 1 engine module is consumed unchanged by all subsequent stages — its public API is stable.

### Accessibility and UX

23. The app is keyboard-navigable end to end (tab order is sensible, no keyboard traps).
24. All interactive elements have appropriate ARIA labels.
25. Color contrast meets WCAG AA for all text and meaningful UI elements.
26. The app is usable on a 375px-wide mobile viewport. The chart adapts; inputs stack vertically; no horizontal scroll on the main content area.
27. Tooltips are accessible via keyboard focus, not just mouse hover.

### Deployment

28. The app is deployed to a public static host with a stable URL.
29. The deployed build is the production build (minified, tree-shaken).
30. The deployed app passes a basic Lighthouse audit: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 90, SEO ≥ 90 (Mobile or Desktop, either).

### Documentation

31. The repository README explains what the tool does, who it's for, and how to run it locally.
32. The README links to the deployed URL.
33. The README includes a brief "model assumptions and limitations" section that honestly states what the tool does and does not model (Tier 3 omissions are flagged).
34. A `CHANGELOG.md` records each stage's completion.

### Security

35. All deserialized input (URL state, imported JSON) is schema-validated;
    malformed, out-of-range, non-finite, or prototype-polluting input is
    rejected or clamped at the boundary and never reaches the engine raw.
36. CSV export neutralizes formula-injection vectors; a crafted input
    beginning with `=`/`+`/`-`/`@` does not execute when the file is opened
    in Excel or Google Sheets.
37. No `dangerouslySetInnerHTML`, `eval`, `new Function`, or raw `innerHTML`
    anywhere in the codebase; external links use `rel="noopener noreferrer"`.
38. CI runs a dependency audit and fails on high/critical advisories; the
    lockfile is committed and CI installs frozen.
39. The deployed app is HTTPS-only and ships the strongest header/CSP set the
    chosen host supports; any control the host cannot provide is documented
    as a known gap with the remediation path.
40. The README "limitations" section discloses that a shared URL embeds the
    full scenario and is visible in history, host logs, and referrer headers.

---

## Security requirements

### Threat model (scope-setting)

This is a static, client-side app: no backend, no auth, no database, no
secrets in the bundle, and no user PII collected. That eliminates most
server-side vulnerability classes (injection into a server, broken access
control, SSRF, etc.). Security effort is therefore concentrated on the four
surfaces that actually exist:

1. **Untrusted input entering the client** — URL-encoded state (Stage 2) and
   imported JSON (Stage 5). Primary surface.
2. **Output that lands in another program** — CSV opened in Excel / Sheets
   (Stage 5): formula/CSV injection.
3. **The served page** — XSS vectors, response headers, CSP (Stage 6).
4. **Supply chain** — npm dependencies (all stages, CI gate from Stage 1).

A fifth, non-vulnerability concern is **privacy**: a shared URL embeds the
user's full financial scenario and is exposed via browser history, host
access logs, and referrer headers. This is documented honestly, not
"fixed" (see Documentation DoD).

### Requirements

**Input deserialization (Stage 2 URL decode, Stage 5 JSON import)**

- All deserialized input is validated against an explicit schema before it
  reaches the engine. Wrong-type, missing, or unexpected keys are rejected,
  not silently coerced.
- Each numeric field has a documented min/max; out-of-range values are
  clamped or rejected, never passed downstream raw.
- `NaN`, `Infinity`, and `-Infinity` are rejected at the boundary.
- Prototype-pollution guard: `__proto__`, `constructor`, and `prototype`
  keys are rejected; untrusted parsed objects are never spread into trusted
  objects without an allow-list.
- JSON import enforces a file-size cap and a schema/version check; malformed
  input produces a friendly error (hardens functional AC #12).

**Output safety (Stage 5)**

- CSV injection mitigation: any cell value beginning with `=`, `+`, `-`,
  `@`, tab, or carriage return is neutralized per OWASP guidance before
  export.

**DOM / XSS (Stages 2–4)**

- No `dangerouslySetInnerHTML`, `eval`, `new Function`, or raw `innerHTML`.
  All values reach the DOM as React text nodes.
- Every external link carries `rel="noopener noreferrer"`.

**Supply chain (all stages; CI gate stood up in Stage 1)**

- Lockfile committed; CI installs with `--frozen-lockfile`.
- `pnpm audit` (or `npm audit`) runs in CI and **fails the build on high or
  critical** advisories. The CI workflow is created in Stage 1 (not deferred
  to Stage 6) so the gate guards every stage's dependency additions from the
  start.

**Transport & headers (Stage 6)**

- Served over HTTPS only.
- Strict Content-Security-Policy. Because the app makes **zero** network
  calls at runtime, the target policy is `'self'`-only with `connect-src
'none'` and `object-src 'none'`.
- `X-Content-Type-Options: nosniff`, a restrictive `Referrer-Policy`,
  `Permissions-Policy`, and clickjacking protection
  (`frame-ancestors` / `X-Frame-Options`) where the host permits headers.

### Dependency-policy amendment

The handoff's "no new third-party dependencies" rule is amended to permit
**one** sanctioned exception: a small, well-audited schema-validation library
(**zod**) is allowed **only at the UI/import boundary** (Stages 2 and 5).
The Stage 1 engine module remains strictly dependency-free — zod must never
be imported into `src/engine/`.

### Hosting note (affects Stage 6)

GitHub Pages (the starting host) cannot set HTTP response headers. CSP there
is limited to a `<meta http-equiv>` tag, and `frame-ancestors` /
`X-Frame-Options` are not honored in meta form — so header-based clickjacking
protection is unavailable on GitHub Pages and is deferred until a move to a
host that supports custom headers (e.g. Cloudflare Pages via `_headers`).
"Supports custom security headers" is added as a weighted criterion to the
Stage 6 host decision.

---

## Architectural decisions worth preserving

These choices were made deliberately during scoping. Future stages should honor them unless there's a strong reason to change.

1. **Client-side only, no backend.** The entire app is a static site. No user accounts, no server-side state, no database. URL-encoded state is the sharing mechanism; JSON files are the archival mechanism.

2. **The math engine is a pure TypeScript module with no UI dependencies.** Stage 1 builds this in isolation. All subsequent stages consume it without modification. This is what makes the engine testable and reusable (a future React Native port, for instance, could lift it cleanly).

3. **Progressive disclosure over wizard-style onboarding.** All inputs live on one screen; advanced fields toggle into view. No multi-step wizard. Sophisticated users get to everything quickly; novices get sensible defaults without being forced through a setup flow.

4. **Tier 3 features stay deferred.** Tax effects and inflation adjustment are explicitly out of scope for Tier 2. The architecture should not preclude them, but no Tier 2 code should anticipate them prematurely.

5. **URL state and JSON settings serve different purposes.** URL state is for instant sharing ("send this scenario to a friend"). JSON files are for archival comparison ("save three scenarios I'm weighing"). Both exist.

6. **Refundable deposits are not costs.** Security deposit and refundable pet deposit are not counted toward total cost of rentership. They appear as an opportunity cost — the renter's deposit money sits in escrow earning nothing while the owner's down payment is "deployed."

7. **The Python source is reference, not source.** The TypeScript port can deviate structurally where it improves the code. The goal is not a line-by-line translation.

---

## Out of scope for Tier 2

The following are explicitly deferred. They are not "we'll get to them"; they are "they are intentionally not in scope and the MVP is shippable without them."

- Tax effects (mortgage interest deduction, SALT cap, capital gains exclusion). See `rent_vs_buy_tier3_proposal.md`.
- Inflation adjustment / today's-dollars display toggle. See Tier 3 proposal.
- Horizons longer than 30 years.
- Monthly-granularity input changes (e.g., "rent increases by 4% in years 1–5 then 6% thereafter"). All escalation rates are flat across the horizon.
- Multiple offer / scenario comparison side-by-side in one view. (Workaround: use the URL-state and JSON-export features to compare scenarios across browser tabs.)
- Geographic data integration (auto-populating tax rates, typical appreciation by metro area, etc.).
- Refinance modeling.
- Adjustable-rate mortgages. Fixed-rate only.
- Multiple loan products (FHA, VA, jumbo). Conventional only.

---

## Open questions / decisions pending

1. **Default values for inputs.** What are the canonical "starter" values the user sees on first load? Some are obvious (loan term = 30 years, down payment = 20%); others need thought (purchase price — national median? a round number? Maryland-specific?). Best resolved in Stage 2 brief.

2. **Default position of the spend-vs-invest slider.** 0%, 50%, 100%? My instinct is 50% as a defensible middle ground that doesn't bias either direction, but 100% is the academically correct default. Decide in Stage 2 brief.

3. **Default analysis horizon.** 10 years? 7 years? Loan term (30)? Median US homeownership tenure is around 8–13 years, so 10 years is defensible. Decide in Stage 2 brief.

4. **Default investment return rate.** 7% (S&P long-run after-inflation real return roughly aligns with this nominally for a 60/40 portfolio in the modern era), 6% (more conservative), 8% (more optimistic)? Decide in Stage 2 brief.

5. **CSV export granularity.** Monthly (more detail, ~360 rows for 30 years) or annual (cleaner, 30 rows)? Or offer both? Decide in Stage 5 brief.

6. **Visualization of "no crossover" case.** When buying never overtakes renting (or vice versa) within the horizon, what does the chart show? A note? Extrapolate? Decide in Stage 4 brief.

7. **Mobile chart behavior.** On a narrow viewport, the break-even chart needs to remain legible. Should the horizon slider stay at the bottom, move to the side, or transform into a different control? Decide in Stage 6 brief.

8. **Input bounds table.** Each input needs a documented min/max to drive both the form's constraints and the security validation layer (DoD #35, Security requirements → Input deserialization). This table does not exist yet. Produce it in the **Stage 2 brief**, where it pairs naturally with the default-values decision (open question #1) — the two together fully specify each field's domain. Until then, the validation stories in Stages 2 and 5 are blocked on this artifact.

These don't need answers now — they are flagged as the inflection points where stage-planning conversations should pause for a quick design discussion before writing the brief.

---

## How to use this document

When opening a new conversation to continue development:

1. Paste this document into the first message.
2. Attach the Python source files (`rent.py`, `mortgage.py`, `housinganalysis.py`, `main.py`) if Stage 1 work is in progress.
3. Attach the existing stage briefs (`claude_code_task_stageN.md`) if any have been written.
4. Specify which stage to work on. Each stage takes one focused session.
5. The stage briefs themselves are the implementation specs Claude Code consumes — separate from this conversational planning document.

Convention used throughout this project (inherited from the workout planner): **one Claude conversation does planning and brief-writing for one stage at a time. Claude Code does the implementation in its own dedicated session.** This separation keeps each context window focused.

The stage briefs will be carried forward to any new conversation:

- `claude_code_task_stage1.md` — Math engine + validation
- `claude_code_task_stage2.md` — App shell + input form
- `claude_code_task_stage3.md` — Numerical outputs
- `claude_code_task_stage4.md` — Visualization outputs
- `claude_code_task_stage5.md` — Import / export
- `claude_code_task_stage6.md` — Polish + deploy

The Tier 3 proposal (`rent_vs_buy_tier3_proposal.md`) lives alongside this document but is dormant until the Tier 2 MVP ships and is validated.

---

## Status as of this writing

**Phase:** Planning complete, Stage 1 brief not yet written.

**Next action:** Open the Stage 1 planning conversation to write `claude_code_task_stage1.md`. That brief will specify the TypeScript engine's public API, the exact bug fixes from the Python source, the Tier 2 model additions, the unit test plan, and the per-stage acceptance criteria.

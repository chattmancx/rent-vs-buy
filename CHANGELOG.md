# Changelog

## Stage 4 — Break-even chart, horizon slider, sensitivity strip (2026-05-31)

- `src/lib/format.ts` — added `formatCurrencyCompact` for compact Y-axis labels (`$550K`, `$1.2M`)
- `src/components/BreakEvenChart.tsx` — Recharts v2 two-line net-worth chart (green Buying, blue Renting); dashed "Break-even" ReferenceLine when lines cross; horizon range slider below chart wired to same `horizon_years` state as BasicInputs
- `src/components/SensitivityStrip.tsx` — 4-card ±1pp sensitivity panel for interest rate, home appreciation, investment return, and rent growth; 8 synchronous `computeScenario` calls via `useMemo`; green/red delta coloring
- Updated `App.tsx` — BreakEvenChart and SensitivityStrip inserted between Advanced Options and CostTable
- `src/test-setup.ts` — added `globalThis.ResizeObserver` stub so InputForm tests continue to pass after Recharts was added to App
- Tests: 93 total (16 new — 5 format + 5 BreakEvenChart + 6 SensitivityStrip); wrote `briefs/claude_code_task_stage4.md`

## Stage 3 — Numerical outputs (2026-05-31)

- `src/lib/format.ts` — `formatCurrency` (en-US, no decimals) and `formatDelta` (+/- prefixed) utilities
- `src/components/HeadlineResult.tsx` — live one-sentence verdict: "Over N years, buying/renting wins by $X"; color-coded border by winner; tie branch shows "essentially even"
- `src/components/CostTable.tsx` — side-by-side owner/renter cost breakdown table; 19 rows covering all cost components, total outflows (subtotal), sale proceeds, investment portfolio, and final net worth; winner's net worth highlighted green
- Updated `App.tsx` — `HeadlineResult` above form, `CostTable` below form, `DebugPanel` last
- Tests: 77 total (9 new — 4 HeadlineResult + 5 CostTable)
- Pre-stage: added `Bash(rm /tmp/*)` to allowlist for engine-smoke; added visual verification step to stage wrap-up in CLAUDE.md; updated skills-log with bundled `/run` skill guidance; wrote `briefs/claude_code_task_stage3.md`

## Stage 2 — App shell, input form, URL state, live recalculation (2026-05-31)

- Installed `zod` for boundary validation of untrusted input
- `src/lib/defaults.ts` — canonical `DEFAULT_INPUT` with all 31 fields
- `src/lib/schema.ts` — `ScenarioInputSchema` (Zod) with per-field range constraints; rejects NaN, Infinity, and out-of-range values
- `src/lib/url-state.ts` — `encode()` / `decode()` for `?s=` base64-JSON query-param state; `decode()` never throws
- `src/hooks/useScenario.ts` — manages form state, calls `computeScenario` synchronously on every change, syncs URL via `history.replaceState`; initializes from `?s=` on load with `urlError` fallback
- Component tree: `Tooltip`, `InputField`, `InputSection`, `BasicInputs`, `AdvancedInputs`, `DebugPanel`
  - Progressive disclosure: 7 basic fields always visible; 31 advanced fields in 4 collapsible sub-sections
  - All decimal rate fields (stored as 0.04) display and accept input as percentages (4.0%)
  - Tooltips on 22 fields via accessible `role="tooltip"` + `aria-describedby` component
  - Debug panel shows live `verdict`, `totals`, and first/last monthly rows as JSON
- Replaced App.tsx stub with full application shell including URL error banner
- Tests: 68 total (42 engine + 7 url-state + 12 schema + 3 DebugPanel + 4 InputForm)
- Migrated skills from `.claude/commands/` to `.claude/skills/` directory format; added `/token-report` skill

## Stage 1 — Math engine + validation (2026-05-31)

- Initialized Vite 5 + React 18 + TypeScript 5 + Tailwind CSS project
- Built pure TypeScript math engine at `src/engine/` with no UI dependencies
- Ported Python financial model and fixed all known bugs:
  - PMI removal threshold now uses 80% of purchase price, not loan amount
  - Maintenance and closing costs included in total ownership outflows
  - Refundable deposits excluded from renter cost totals; admin fee counted
  - Pet rent and parking use dedicated escalation rates, not HOA rate
- Added Tier 2 model extensions:
  - Opportunity cost on down payment + closing costs seeds renter investment balance at month 0
  - Monthly cost differential invested at user-controlled invest_vs_spend_ratio
  - Sale proceeds at horizon end: appreciated home value − remaining loan − selling costs
  - Variable horizon (1–30 years); schedule and summaries respect the chosen horizon
- Engine public API: `computeScenario(ScenarioInput): ScenarioResult`
- Unit tests: mortgage payment formula, amortization invariants, PMI threshold bug fix, rent escalation, investment compounding, three reference scenarios plus one hand-verified zero scenario
- ESLint 9 flat config, Prettier, TypeScript strict mode (`noUncheckedIndexedAccess`, `noImplicitOverride`)
- GitHub Actions CI: install (frozen lockfile) → lint → format:check → typecheck → test → audit
- Custom slash commands: `/stage-verify`, `/ci-check`, `/engine-smoke`, `/stage-scaffold`, `/scenario-diff`, `/acceptance-report`

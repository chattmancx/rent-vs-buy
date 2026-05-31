# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A client-side TypeScript web app that compares the financial outcome of renting vs. buying a home over a user-defined horizon. No backend, no auth, no database — purely static. URL-encoded state is the sharing mechanism; JSON files are the archival mechanism.

The Python files (`rent.py`, `mortgage.py`, `housinganalysis.py`, `main.py`) in `reference/` are **read-only reference material** — the source of truth for the financial model's intent, not code to evolve. Stage briefs and planning documents live in `briefs/`. Verification outputs go in `verifications/`.

**Do not read these files in future sessions** — all essential information is already captured in this CLAUDE.md:

- `briefs/Rent-vs-buy project handoff.md` — superseded by this file
- `briefs/rent_vs_buy_tier3_proposal.md` — out of scope until Tier 2 ships
- `reference/*.py` — only needed if investigating a specific model behavior

**Per-session reading rule:** read only the current stage brief (`briefs/claude_code_task_stageN.md`) and the specific source files being modified.

**Do not re-read these files — they are fully described in this CLAUDE.md:**

- `src/engine/types.ts` — all key types are transcribed in the Architecture section below
- `src/lib/defaults.ts` — all 31 DEFAULT_INPUT values are listed in the Architecture section below

**Do not re-read a file after editing it** — `Edit` and `Write` tools confirm success; a follow-up `Read` wastes ~200 tokens and adds no signal.

## Tech stack

| Concern         | Choice                               |
| --------------- | ------------------------------------ |
| Language        | TypeScript 5.x, strict mode          |
| Build           | Vite 5.x                             |
| UI              | React 18+ (function components only) |
| Styling         | Tailwind CSS                         |
| Charting        | Recharts                             |
| Tests           | Vitest + React Testing Library       |
| Lint/format     | ESLint + Prettier                    |
| Package manager | pnpm preferred (npm acceptable)      |
| CI              | GitHub Actions                       |

## Commands

Once the project is scaffolded (Stage 1), these scripts must exist:

```bash
pnpm install          # install dependencies (frozen lockfile in CI)
pnpm dev              # Vite dev server
pnpm build            # production build
pnpm test             # Vitest
pnpm test -- --run    # single test run (no watch mode)
pnpm test -- --run --reporter=dot   # compact output for confirmation runs (saves tokens)
pnpm lint             # ESLint (zero warnings = clean)
pnpm format:check     # Prettier check
pnpm format           # Prettier fix
pnpm typecheck        # tsc --noEmit
```

**Test run discipline:** use `--reporter=dot` for confirmation runs (all passing); switch to default `--reporter=verbose` only when diagnosing failures. Full verbose output for 90+ tests repeated multiple times is a significant token sink.

Run `pnpm audit` for dependency security check; CI fails on high/critical advisories.

## Bash allowlist

These commands are safe and will be needed repeatedly across all stages. Add them to `.claude/settings.json` under `allowedTools` to avoid permission prompts.

**Project configuration (`.claude/` directory)**

```
Edit(.claude/**)
Write(.claude/**)
Read(.claude/**)
```

**Package management**

```
pnpm install
pnpm add *
pnpm add -D *
pnpm remove *
pnpm audit
```

**Dev scripts (run via pnpm)**

```
pnpm dev
pnpm build
pnpm preview
pnpm test
pnpm test -- *
pnpm lint
pnpm lint --fix
pnpm format
pnpm format:check
pnpm typecheck
```

**Node / npx**

```
node *
npx tsc *
npx vite *
```

**Filesystem (non-destructive)**

```
find . *
ls *
mkdir -p *
rm /tmp/*
```

**Git (read)**

```
git status
git diff *
git log *
git show *
```

**Git (write)**

```
git init
git add *
git commit *
git branch *
git checkout *
git push *
git remote *
```

Note: `git push --force`, `git reset`, `git checkout --`, and `git rebase` are intentionally omitted — always confirm these interactively.

**GitHub CLI**

```
gh pr create *
gh pr view *
gh pr list *
gh pr status *
gh repo view *
gh auth status *
```

Note: `gh pr merge *` and `gh pr close *` are omitted — confirm merges and closes interactively.

## Architecture

The project is decomposed into six stages. **One conversation = one stage.** Stage briefs are in `briefs/claude_code_task_stageN.md`.

### Engine (`src/engine/`) — built in Stage 1

The math engine is a **pure TypeScript module with zero UI or Node dependencies**. It exposes a single function:

```ts
computeScenario(input: ScenarioInput): ScenarioResult
```

Every subsequent stage consumes the engine's public API (`src/engine/index.ts`) without modifying it. The engine is the stable contract. All types are in `src/engine/types.ts`.

Key types: `ScenarioInput` (grouped into `OwnershipInput`, `RentalInput`, `SharedInput`) → `ScenarioResult` (contains `monthly_schedule`, `yearly_summary`, `totals`, `verdict`).

The engine runs a single forward pass over `horizon_years * 12` months. `monthly_schedule`, `yearly_summary`, and `totals` all derive from that one pass.

**Engine constraints:**

- No imports from React, DOM, or Node — must run in any JS environment
- Throws a typed error if any numeric input is non-finite (NaN/Infinity/-Infinity)
- No third-party dependencies (zod is allowed only at the UI/import boundary in Stage 2+)

### Net worth definition (load-bearing)

- **Owner:** `home_value − remaining_loan_balance + owner_investment_balance`. `MonthlyRow` includes both `owner_paper_net_worth` (no selling costs, for charting) and `owner_realized_net_worth` (selling costs deducted, for the final headline).
- **Renter:** `renter_investment_balance` (deposits are returned, not counted as cost).

The renter's investment balance is seeded at month 0 by `(down_payment + closing_costs - admin_fee) × invest_vs_spend_ratio` — the opportunity cost on the capital the renter kept by not buying.

### Stage breakdown

| Stage | Brief                               | Deliverable                                         |
| ----- | ----------------------------------- | --------------------------------------------------- |
| 1     | `briefs/claude_code_task_stage1.md` | Math engine + Vitest tests + CI                     |
| 2     | `briefs/claude_code_task_stage2.md` | App shell, input form, URL state, live recalc       |
| 3     | `briefs/claude_code_task_stage3.md` | Headline answer, cost breakdown table               |
| 4     | `briefs/claude_code_task_stage4.md` | Break-even chart, horizon slider, sensitivity strip |
| 5     | `briefs/claude_code_task_stage5.md` | CSV export, JSON import/export                      |
| 6     | `briefs/claude_code_task_stage6.md` | Accessibility, responsive layout, deploy            |

## Key bugs fixed from the Python source (must stay fixed)

1. Maintenance and closing costs are included in `total_ownership_outflows` (Python omitted both)
2. PMI drops when `remaining_balance ≤ 0.80 × purchase_price` (Python used loan amount, not purchase price)
3. Refundable deposits (`security_deposit`, `pet_deposit`) are NOT counted in `total_rentership_outflows`; only `admin_fee` is
4. Pet rent and parking escalate by their own rates (`pet_rent_increase_rate`, `parking_increase_rate`), not by the HOA rate

## TypeScript conventions

- `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noImplicitOverride": true` in `tsconfig.json`
- Functions: `camelCase`; Types/Interfaces: `PascalCase`; Constants: `SCREAMING_SNAKE_CASE`; Files: `kebab-case`
- Rates that the handoff calls "decimal" (e.g., 0.04 for 4%) are stored as decimals; rates the handoff calls "percentage" (e.g., 20 for 20% down) are stored as percentages. Follow `types.ts` exactly — do not normalize them.
- Money is `number` (USD, `number` precision is sufficient at this scale)
- Annual escalation is applied at year boundaries, not monthly — matches Python behavior

## Security constraints

- All deserialized input (URL state, imported JSON) must be schema-validated (via zod, at boundary only) before reaching the engine
- CSV export must neutralize formula-injection: prefix cells starting with `=`, `+`, `-`, `@`, tab, or CR with a single quote
- No `dangerouslySetInnerHTML`, `eval`, `new Function`, or raw `innerHTML`; all external links use `rel="noopener noreferrer"`
- CI installs with `--frozen-lockfile`; dependency audit fails on high/critical

## Scope boundaries

**Out of scope for Tier 2 (the current MVP):** tax effects (mortgage interest deduction, SALT cap, capital gains exclusion), inflation adjustment / real-dollars toggle, horizons > 30 years, adjustable-rate mortgages, multiple scenario side-by-side comparison, geographic data, refinance modeling. These are in `rent_vs_buy_tier3_proposal.md`.

## Stage wrap-up procedure

Run at the end of **every** stage session, in this order:

1. **Verify CI** — `/ci-check`; fix any failures before continuing.
2. **Visual verification** — Stages 3–6 produce UI output. Run `pnpm dev` and open the browser to confirm the golden path works and no regressions exist in previously working features. Use the bundled `/run` skill to launch and drive the app. Document what was verified.
3. **Acceptance report** — `/acceptance-report N`; save output to `verifications/stage-N.md`.
4. **Token report** — `/token-report N`; saves `verifications/stage-N-tokens.md` (see format below). **This step is mandatory — do not skip.**
5. **Skills update** — add any new recommended skills for the next stage to `.claude/skills/`; update `briefs/skills-log.md`. Proactively add any browser API stubs needed by the next stage to `src/test-setup.ts` (e.g., `ResizeObserver`, `URL.createObjectURL`, `FileReader`).
6. **Commit** — stage only files touched in this session; commit message: `Stage N — <stage name>`.

### Token distribution report

The token report (`verifications/stage-N-tokens.md`) captures how context budget was spent in the session so future sessions can improve. It is generated by `/token-report N` and covers:

- **Session composition** — count of files read, files written, bash commands, test runs, subagent spawns, plan-mode iterations.
- **Estimated token totals** — rough input/output token counts for the session. Use Claude's context window as a reference: if you consumed most of a 200K window, that's ~200K input tokens. Estimates within ±20% are acceptable; record them so trends are visible across stages.
- **Context budget breakdown** — relative weight of each source (CLAUDE.md, stage brief, source files, tool output, subagent context, conversation turns). Qualitative estimates are acceptable; exact counts are not required.
- **Cache effectiveness** — whether the "do not re-read" rules in this file were followed; any files read more than once unnecessarily; any tool results that were excessively large.
- **What was efficient** — 2–4 concrete patterns that saved tokens.
- **What wasted tokens** — 2–4 concrete patterns to avoid in future stages.
- **Recommendations for next stage** — actionable changes to reading strategy, tool use, or brief structure.

Reports accumulate in `verifications/` and serve as the baseline for improving brief design and session discipline across stages. Review the previous stage's report at the start of each new session.

### Skills in `.claude/skills/`

Project skills live at `.claude/skills/<skill-name>/SKILL.md`. Each skill is a directory; the directory name becomes the `/skill-name` command. Skill content only loads into context when invoked — unlike CLAUDE.md, which loads every turn. Long reference material, multi-step checklists, and stage-specific procedures belong in skills, not in this file.

Existing `.claude/commands/*.md` files remain valid and keep working. New skills should use the `.claude/skills/` format to gain frontmatter support (auto-invocation control, `allowed-tools`, `context: fork`, dynamic context injection via `` !`command` ``).

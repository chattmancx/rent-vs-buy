# Skills Log

Catalog of custom Claude Code skills that reduce token usage and repeated work in this project.

**Format:** Skills live at `.claude/skills/<skill-name>/SKILL.md`. The directory name becomes the `/skill-name` command. Skill content only loads into context when invoked — unlike CLAUDE.md content, which loads every turn. This makes skills the right home for long procedures and reference material.

All skills live at `.claude/skills/<skill-name>/SKILL.md`. The `.claude/commands/` directory has been removed.

Add a **Status** entry when a skill is built.

---

## Proposed skills

### `stage-verify`

**Purpose:** Given a stage number, reads `briefs/claude_code_task_stageN.md`, runs lint → format:check → typecheck → test in sequence, and reports pass/fail against each numbered acceptance criterion.  
**Saves:** Manually walking through 15–17 ACs one at a time at the end of each stage session; catches regressions before declaring a stage done.  
**Trigger:** End of every stage implementation session.  
**Status:** Built — `.claude/skills/`

---

### `ci-check`

**Purpose:** Runs the exact same sequence as `.github/workflows/ci.yml` locally — `pnpm install --frozen-lockfile` → lint → format:check → typecheck → test → audit — and reports the result as a single pass/fail.  
**Saves:** Running 5–6 separate commands and mentally combining their outputs to predict whether CI will pass. Especially useful before a `git push`.  
**Trigger:** Before any commit intended to hit CI.  
**Status:** Built — `.claude/skills/`

---

### `engine-smoke`

**Purpose:** Imports `computeScenario` from `src/engine/index.ts` via a temporary Node script, calls it with the "Scenario A" reference inputs, prints `verdict` and `totals` to stdout, then deletes the temp script.  
**Saves:** Opening a REPL manually and typing import paths every time the engine needs a quick sanity check that doesn't require the full test suite.  
**Trigger:** After any engine edit, before running the full test suite.  
**Status:** Built — `.claude/skills/`

---

### `stage-scaffold`

**Purpose:** Given a stage number and a component/module name, creates the boilerplate source file and a paired test file following project conventions (kebab-case file names, PascalCase exports, Vitest `describe`/`it` shell, correct import paths).  
**Saves:** Manually creating files and copying boilerplate; eliminates convention mistakes (wrong case, wrong import path).  
**Trigger:** Start of Stage 2+ when new React components or utility modules are added.  
**Status:** Built — `.claude/skills/`

---

### `scenario-diff`

**Purpose:** Runs all three reference scenarios from `src/engine/__tests__/scenarios.test.ts` and prints a side-by-side table of expected vs. actual `owner_final_net_worth`, `renter_final_net_worth`, and `verdict` for each. Flags any cell that diverges by more than $1.  
**Saves:** Reading raw Vitest output and mentally reconstructing which scenario failed and by how much. Useful when tweaking engine math and needing to see the full impact at a glance.  
**Trigger:** After any change to `src/engine/compute.ts`, `mortgage.ts`, `rent.ts`, or `investment.ts`.  
**Status:** Built — `.claude/skills/`

---

### `acceptance-report`

**Purpose:** Reads the acceptance criteria section of the current stage brief, runs every mechanically verifiable check (script exits, output formats, file existence), and produces a markdown checklist. Non-automatable ACs (e.g., "chart renders correctly") are listed as manual items.  
**Saves:** Writing the same verification checklist by hand at the end of each stage; provides a consistent artifact to drop into `verifications/`.  
**Trigger:** End of any stage session before marking it complete.  
**Status:** Built — `.claude/skills/`

---

---

### `token-report`

**Purpose:** At the end of a stage session, generates `verifications/stage-N-tokens.md` — a structured record of session composition (files read/written, bash runs, subagent spawns), context budget breakdown by source, cache effectiveness, what was efficient, what wasted tokens, and recommendations for the next stage.  
**Saves:** Manually writing the same post-mortem template every session; creates an accumulating baseline that measurably improves brief design and reading discipline across stages.  
**Trigger:** End of every stage, after `/acceptance-report`, before committing.  
**Status:** Built — `.claude/skills/token-report/SKILL.md`

---

## Notes

- All six skills are ready for immediate use in Stage 2.
- `/stage-scaffold` is the highest-value skill in Stage 2: the session creates ~10 new files (`Tooltip.tsx`, `InputField.tsx`, `InputSection.tsx`, `BasicInputs.tsx`, `AdvancedInputs.tsx`, `DebugPanel.tsx`, `useScenario.ts`, `defaults.ts`, `schema.ts`, `url-state.ts`). Using the scaffold command for each prevents convention errors (wrong case, missing test file, wrong import path).
- `/ci-check` should run once before the session closes the acceptance criteria checklist — it replicates exactly what GitHub Actions will run.
- `/stage-verify 2` replaces manually walking through the 15 ACs in the Stage 2 brief.
- `/acceptance-report` generates the artifact to save in `verifications/stage2.md`.
- Skills should be re-evaluated after each stage; remove entries that turn out to be unnecessary.

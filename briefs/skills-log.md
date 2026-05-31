# Skills Log

Catalog of custom Claude Code skills that reduce token usage and repeated work in this project.

**Format:** Skills live at `.claude/skills/<skill-name>/SKILL.md`. The directory name becomes the `/skill-name` command. Skill content only loads into context when invoked — unlike CLAUDE.md content, which loads every turn. This makes skills the right home for long procedures and reference material.

All custom skills live at `.claude/skills/<skill-name>/SKILL.md`. The `.claude/commands/` directory has been removed.

Add a **Status** entry when a skill is built.

---

## Custom skills

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

**Purpose:** Given a type (`component`, `hook`, `util`) and name, creates the boilerplate source file and a paired test file following project conventions (kebab-case file names, PascalCase exports, Vitest `describe`/`it` shell, correct import paths).
**Saves:** Manually creating files and copying boilerplate; eliminates convention mistakes (wrong case, wrong import path).
**Trigger:** Start of any stage when new React components or utility modules are added.
**Status:** Built — `.claude/skills/`

---

### `scenario-diff`

**Purpose:** Runs all three reference scenarios from `src/engine/__tests__/scenarios.test.ts` and prints a side-by-side table of expected vs. actual `owner_final_net_worth`, `renter_final_net_worth`, and `verdict` for each. Flags any cell that diverges by more than $1.
**Saves:** Reading raw Vitest output and mentally reconstructing which scenario failed and by how much.
**Trigger:** After any change to `src/engine/compute.ts`, `mortgage.ts`, `rent.ts`, or `investment.ts`.
**Status:** Built — `.claude/skills/`

---

### `acceptance-report`

**Purpose:** Reads the acceptance criteria section of the current stage brief, runs every mechanically verifiable check (script exits, file existence, output format checks), and produces a markdown checklist. Non-automatable ACs are listed as manual items.
**Saves:** Writing the same verification checklist by hand at the end of each stage; provides a consistent artifact to drop into `verifications/`.
**Trigger:** End of any stage session before the token report and commit.
**Status:** Built — `.claude/skills/`

---

### `token-report`

**Purpose:** At the end of a stage session, generates `verifications/stage-N-tokens.md` — a structured record of session composition (files read/written, bash runs, subagent spawns), context budget breakdown by source, cache effectiveness, what was efficient, what wasted tokens, and recommendations for the next stage.
**Saves:** Manually writing the same post-mortem template every session; creates an accumulating baseline that measurably improves brief design and reading discipline across stages.
**Trigger:** End of every stage, after `/acceptance-report`, before committing.
**Status:** Built — `.claude/skills/`

---

## Bundled skills (no setup needed)

These ship with Claude Code and are available in every session. No files to create.

| Skill                | When to use                                                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `/run`               | Start `pnpm dev` and drive the browser to confirm UI changes work end-to-end. Use for Stages 3–6 visual verification in the wrap-up procedure. |
| `/verify`            | Confirm a specific code change works in the running app without falling back to tests alone.                                                   |
| `/code-review`       | Review staged diff for correctness bugs and simplification opportunities before committing.                                                    |
| `/ci-check` (custom) | Prefer the custom skill — it matches this project's exact CI steps.                                                                            |

---

## Notes

- All seven custom skills are ready for immediate use from Stage 3 onward.
- `/run` (bundled) replaces manually starting `pnpm dev` for Stages 3–6 visual verification — it infers the launch from `package.json`.
- `Bash(rm /tmp/*)` is now in the allowlist so `/engine-smoke` can clean up its temp script without a permission prompt.
- `/stage-scaffold` remains the highest single-use value skill — call it before creating any new component or util to avoid convention drift.
- `/ci-check` should be the final automated step before every commit; it replicates GitHub Actions exactly.
- Skills should be re-evaluated after each stage; remove entries that turn out to be unnecessary.

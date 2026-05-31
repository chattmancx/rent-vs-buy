---
name: stage-verify
description: Read the stage brief, run lint/format/typecheck/tests, and verify each numbered acceptance criterion. Use at the end of a stage implementation session to confirm it is ready to close.
disable-model-invocation: true
argument-hint: <stage-number>
allowed-tools: Read Bash(pnpm lint*) Bash(pnpm format:check*) Bash(pnpm typecheck*) Bash(pnpm test*)
---

Read the stage brief at `briefs/claude_code_task_stage$ARGUMENTS.md` and extract all numbered acceptance criteria.

Then run these checks in sequence and capture each result:

1. `pnpm lint` — must exit 0
2. `pnpm format:check` — must exit 0
3. `pnpm typecheck` — must exit 0
4. `pnpm test -- --run` — must exit 0 with all tests passing

For each numbered acceptance criterion in the brief, produce one line:

- ✅ PASS — if mechanically verified by the script results or by reading a file/output
- ❌ FAIL (reason) — if a check failed
- 🔲 MANUAL (what to verify) — if it requires visual, browser, or deployment verification

Output a markdown checklist with two sections: "Automated Checks" (the 4 script results) then the full numbered AC list. Save the report to `verifications/stage-$ARGUMENTS-report.md` and print the summary line (e.g., "9 pass · 3 manual · 0 fail").

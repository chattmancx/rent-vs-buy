---
name: acceptance-report
description: Generate an acceptance report for a completed stage. Reads the stage brief, runs mechanical checks, and writes a pass/fail/manual checklist to verifications/. Use at the end of a stage session before the token report and commit.
disable-model-invocation: true
allowed-tools: Read Write Bash(pnpm lint*) Bash(pnpm format:check*) Bash(pnpm typecheck*) Bash(pnpm test*) Bash(ls*) Bash(find . *)
---

Generate an acceptance report for a completed stage.

1. Determine the stage number: look at which `briefs/claude_code_task_stageN.md` exists and which `verifications/stage-N-acceptance.md` does not yet exist. Use that stage number, or if all exist, use the highest N.
2. Read the full acceptance criteria section from the relevant stage brief.
3. For each numbered AC, run what you can mechanically (script exits, file existence, output format checks) and report:
   - ✅ PASS
   - ❌ FAIL (reason)
   - 🔲 MANUAL (description of what to check)
4. Write the report to `verifications/stage-N-acceptance.md` with today's date, a pass/fail/manual summary line, and one line per AC.

Keep output concise — one line per AC. The report becomes the record that this stage was accepted before moving on.

---
name: ci-check
description: Simulate the full CI pipeline locally. Run lint, format check, typecheck, tests, and audit in sequence — stopping on first failure. Use before any git push to predict CI outcome.
disable-model-invocation: true
allowed-tools: Bash(pnpm install*) Bash(pnpm lint*) Bash(pnpm format:check*) Bash(pnpm typecheck*) Bash(pnpm test*) Bash(pnpm audit*)
---

Simulate the full CI pipeline locally. Run these commands in sequence and stop immediately on first failure:

1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm format:check`
4. `pnpm typecheck`
5. `pnpm test -- --run`
6. `pnpm audit --audit-level high --prod`

After all steps complete (or on first failure), report:

- Overall result: ✅ PASS or ❌ FAIL
- Per-step status with exit code
- On failure: print the relevant error excerpt

This mirrors `.github/workflows/ci.yml` exactly. Run before any `git push` to predict CI outcome.

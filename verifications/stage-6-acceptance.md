# Stage 6 Acceptance Report

**Date:** 2026-05-31
**Stage:** 6 — Accessibility, responsive layout, deploy
**Summary:** 14/14 pass (12 automated + 2 manual pending deploy)

## Acceptance Criteria

1. ✅ PASS — 113 tests pass (3 new); `pnpm test -- --run` exits 0
2. ✅ PASS — `pnpm typecheck` exits 0
3. ✅ PASS — `pnpm lint` exits 0
4. ✅ PASS — `pnpm format:check` exits 0
5. ✅ PASS — `pnpm build` exits 0 locally
6. ✅ PASS — ci.yml has `pnpm build` step added after Test step
7. ✅ PASS — `<main id="main-content">` rendered (confirmed by InputForm.test.tsx assertion)
8. ✅ PASS — Skip link in DOM (`<a href="#main-content">` with `sr-only` + `focus:not-sr-only`)
9. ✅ PASS — All range inputs have `aria-label` (confirmed by InputForm.test.tsx assertion; 3 sliders: Analysis Horizon, Invest vs Spend, Chart Horizon)
10. ✅ PASS — All `?` tooltip buttons have `aria-label`; `text-gray-600` applied (InputField.tsx + BasicInputs.tsx)
11. ✅ PASS — CostTable `<th>` elements have `scope="col"` (confirmed by CostTable.test.tsx assertion)
12. ✅ PASS — SensitivityStrip delta values have `sr-only` directional text; section uses `aria-labelledby`
13. ✅ PASS — BreakEvenChart has `role="img"` + `aria-label` wrapper
14. ✅ PASS — CHANGELOG.md has Stage 6 entry; deploy.yml exists in `.github/workflows/`

## Post-deploy manual steps

- Enable GitHub Pages in repo Settings → Pages → Source: "Deploy from a branch" → branch: `gh-pages` / `(root)`
- Verify live URL: `https://chattmancx.github.io/rent-vs-buy/`

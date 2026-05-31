# Stage 6 Brief: Accessibility, Responsive Layout, Deploy

## Goal

Polish the app for public release: targeted accessibility fixes, minor responsive improvements, and a GitHub Pages deploy pipeline. After this stage the app is live at `https://chattmancx.github.io/rent-vs-buy/`.

## Deliverables

| File                                          | Action | Description                                                        |
| --------------------------------------------- | ------ | ------------------------------------------------------------------ |
| `vite.config.ts`                              | Edit   | Conditional `base: '/rent-vs-buy/'` for production builds          |
| `.github/workflows/deploy.yml`                | New    | Deploy to gh-pages on push to master                               |
| `.github/workflows/ci.yml`                    | Edit   | Add `pnpm build` step after tests                                  |
| `src/App.tsx`                                 | Edit   | Skip link + `<main>` landmark + `role="alert"` on URL error banner |
| `src/components/InputField.tsx`               | Edit   | `?` button aria-label + `text-gray-600` contrast fix               |
| `src/components/BasicInputs.tsx`              | Edit   | `aria-label` on both range sliders; `?` button contrast fix        |
| `src/components/CostTable.tsx`                | Edit   | `scope="col"` on `<th>`; visually hidden `<caption>`               |
| `src/components/SensitivityStrip.tsx`         | Edit   | `<section>` wrapper; `sr-only` text on color-coded deltas          |
| `src/components/BreakEvenChart.tsx`           | Edit   | `role="img"` + `aria-label` wrapper around chart                   |
| `src/components/DebugPanel.tsx`               | Edit   | `text-gray-600` on `<summary>` (contrast fix)                      |
| `src/components/__tests__/CostTable.test.tsx` | Edit   | Assert `scope="col"` on column headers                             |
| `src/components/__tests__/InputForm.test.tsx` | Edit   | Assert `<main>` landmark; slider `aria-label` attributes           |
| `CHANGELOG.md`                                | Edit   | Stage 6 entry                                                      |

## Accessibility fixes (WCAG 2.1 AA targets)

1. **Landmark regions** — `<main id="main-content">` in App.tsx; skip link at top
2. **Color contrast** — `text-gray-400` tooltip buttons → `text-gray-600` (4.5:1 minimum)
3. **Range inputs** — Add `aria-label` to all `<input type="range">` elements in BasicInputs
4. **Table headers** — `scope="col"` on all `<th>` in CostTable
5. **Color reliance** — SensitivityStrip delta values get `sr-only` directional text
6. **Chart** — `role="img"` + `aria-label` for screen reader description of line chart
7. **URL error banner** — Add `role="alert"` so screen readers announce it immediately

## Deploy setup

- `base` set via Vite's `command` param: `/rent-vs-buy/` on build, `/` on serve
- `peaceiris/actions-gh-pages@v4` pushes dist to `gh-pages` branch on master push
- **Post-deploy manual step:** Repo Settings → Pages → Source: branch `gh-pages` / `(root)`

## Acceptance criteria

1. All 110+ tests pass; new a11y assertions pass
2. `pnpm typecheck` exits 0
3. `pnpm lint` exits 0
4. `pnpm format:check` exits 0
5. `pnpm build` exits 0 locally and in CI
6. CI workflow includes `pnpm build` step
7. `<main id="main-content">` rendered in app HTML
8. Skip link present in DOM; visible on keyboard focus
9. All range inputs have `aria-label`
10. All `?` tooltip buttons have `aria-label` and use `text-gray-600`
11. CostTable `<th>` elements have `scope="col"`
12. SensitivityStrip deltas have `sr-only` directional text
13. BreakEvenChart container has `role="img"` + `aria-label`
14. deploy.yml exists; CHANGELOG.md has Stage 6 entry

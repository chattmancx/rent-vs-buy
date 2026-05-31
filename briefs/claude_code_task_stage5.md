# Stage 5 Brief: CSV Export, JSON Import/Export

## Goal

Add file I/O to the rent-vs-buy calculator: a yearly-analysis CSV download, a scenario JSON export, and a JSON import that restores all inputs from a previously exported file.

## Deliverables

| File                                            | Action | Description                                             |
| ----------------------------------------------- | ------ | ------------------------------------------------------- |
| `src/lib/csv-export.ts`                         | New    | Pure function `exportToCsv(result)` — no DOM            |
| `src/lib/json-io.ts`                            | New    | `exportToJson` / `importFromJson` (Zod-validated)       |
| `src/components/ExportPanel.tsx`                | New    | Download CSV, Download JSON, Import JSON                |
| `src/hooks/useScenario.ts`                      | Edit   | Add `replaceInput(input: ScenarioInput): void`          |
| `src/App.tsx`                                   | Edit   | Insert ExportPanel between CostTable and DebugPanel     |
| `src/test-setup.ts`                             | Edit   | Add `URL.createObjectURL` / `URL.revokeObjectURL` stubs |
| `src/lib/__tests__/csv-export.test.ts`          | New    | 7 tests                                                 |
| `src/lib/__tests__/json-io.test.ts`             | New    | 5 tests                                                 |
| `src/components/__tests__/ExportPanel.test.tsx` | New    | 5 tests                                                 |
| `CHANGELOG.md`                                  | Edit   | Stage 5 entry                                           |

## CSV format

```
Rent vs. Buy Analysis
Verdict,Buying wins,Margin,123456
Horizon,10 years

Year,Owner Net Worth,Renter Net Worth,Owner Costs This Year,Renter Costs This Year,Owner Equity in Home
1,...
...

Key Totals
Total Ownership Outflows,...
Total Rentership Outflows,...
Sale Proceeds,...
Owner Final Net Worth,...
Renter Final Net Worth,...
```

**Security:** All cell values run through `sanitize()` — strings starting with `=`, `+`, `-`, `@`, `\t`, or `\r` are prefixed with `'`.

**Download filename:** `rent-vs-buy-analysis.csv`

## JSON format

Exports `ScenarioInput` only (not the full result — it can always be recomputed).

`importFromJson` validates through `ScenarioInputSchema.safeParse` before returning. Returns `null` on any error.

**Download filename:** `rent-vs-buy-scenario.json`

## ExportPanel props

```ts
{
  result: ScenarioResult
  input: ScenarioInput
  onImport: (input: ScenarioInput) => void
}
```

Import button triggers a hidden `<input type="file" accept=".json">`. On successful parse, calls `onImport`. On failure, shows an inline red error message.

## useScenario addition

```ts
const replaceInput = useCallback((newInput: ScenarioInput) => {
  const newResult = computeScenario(newInput)
  setState({ input: newInput, result: newResult, urlError: false })
}, [])
```

Single `setState` call — one render, one URL sync.

## Security

- CSV: formula-injection sanitization on all cell values
- JSON import: `ScenarioInputSchema.safeParse` at the boundary; engine never receives unvalidated data

## Acceptance criteria

1. All 93 existing tests + new tests pass
2. `pnpm typecheck` exits 0; no `!` non-null assertions in new files
3. `pnpm lint` exits 0
4. `pnpm format:check` exits 0
5. `pnpm build` exits 0
6. ExportPanel renders between CostTable and DebugPanel
7. CSV: "Year" header row + N rows matching `horizon_years`; formula injection sanitized
8. JSON export: valid JSON that round-trips through `ScenarioInputSchema`
9. JSON import: valid file replaces inputs, re-runs calculation, updates URL
10. JSON import: invalid file shows inline error, does not crash
11. CHANGELOG.md has Stage 5 entry

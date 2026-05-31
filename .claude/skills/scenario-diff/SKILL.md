---
name: scenario-diff
description: Run the engine scenario tests and print a human-readable table of expected vs. actual net worth values for each reference scenario. Use after any change to engine source files to see the full numerical impact before committing.
disable-model-invocation: true
allowed-tools: Read Bash(pnpm test*)
---

Run the scenario tests and print a human-readable diff of expected vs. actual values.

1. Run `pnpm test -- --run src/engine/__tests__/scenarios.test.ts --reporter=verbose` and capture output.
2. Read `src/engine/__tests__/scenarios.test.ts` to find the hardcoded expected constants for each scenario.
3. If all tests passed, print a table:

   | Scenario | owner_final_net_worth (expected) | (actual) | renter_final_net_worth (expected) | (actual) | winner |
   | -------- | -------------------------------- | -------- | --------------------------------- | -------- | ------ |

   Mark any numerical deviation > $1 with ⚠️.

4. If any test failed, print the failure output directly and note which expected values diverged.

Use this after any change to `src/engine/compute.ts`, `mortgage.ts`, `rent.ts`, or `investment.ts` to see the full impact before committing.

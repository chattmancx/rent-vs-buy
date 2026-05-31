---
name: stage-scaffold
description: Scaffold a new source file and its paired test file following project conventions. Use at the start of any stage when adding new React components, hooks, or utility modules.
disable-model-invocation: true
argument-hint: <type> <name>
arguments: type name
allowed-tools: Write Bash(mkdir -p*)
---

Scaffold a new source file and its paired test file. Arguments: `<type> <name>` where type is `component`, `hook`, or `util`, and name uses PascalCase for components and camelCase for hooks/utils.

Examples: `component ResultsTable`, `hook useScenario`, `util formatCurrency`

File placement:

- component → `src/components/<kebab-case-name>.tsx` + `src/components/__tests__/<kebab-case-name>.test.tsx`
- hook → `src/hooks/<kebab-case-name>.ts` + `src/hooks/__tests__/<kebab-case-name>.test.ts`
- util → `src/utils/<kebab-case-name>.ts` + `src/utils/__tests__/<kebab-case-name>.test.ts`

Source file template:

- component: named export function with a typed `Props` interface, returns a placeholder div
- hook: named export `use<Name>` function returning an empty object
- util: named export function with typed params and return type, returns a placeholder value

Test file template:

- import `describe` and `it` from `vitest`
- one `describe` block named after the export
- one placeholder `it('todo', () => {})` inside

Create both files. Create the parent directory if it doesn't exist. Print both paths.

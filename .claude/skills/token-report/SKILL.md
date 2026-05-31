---
name: token-report
description: Generate a token distribution report at the end of a stage session. Records what was read, written, and run; notes what consumed the most context; and captures efficiency recommendations for the next stage. Use at the end of any stage implementation session.
disable-model-invocation: true
argument-hint: <stage-number>
---

Generate a token distribution report for Stage $ARGUMENTS and save it to `verifications/stage-$ARGUMENTS-tokens.md`.

## Dynamic context

Current date: !`date "+%Y-%m-%d"`

Files changed this session (git perspective):

```!
git status --short
```

## Report format

Write `verifications/stage-$ARGUMENTS-tokens.md` using this exact structure. Fill in each section based on what actually happened in this session — do not invent numbers.

---

```markdown
# Stage $ARGUMENTS Token Distribution Report

**Date:** <today>
**Model:** <model ID from session>
**Stage:** $ARGUMENTS — <stage name from brief>

## Session composition

| Category                | Count | Notes                                   |
| ----------------------- | ----- | --------------------------------------- |
| Files read (Read tool)  | N     | List the most expensive (largest files) |
| Files written / edited  | N     |                                         |
| Bash commands run       | N     |                                         |
| Test suite runs         | N     |                                         |
| Subagent / Agent spawns | N     |                                         |
| Plan mode iterations    | N     |                                         |

## Context budget usage

Estimate relative token weight for each category as a percentage of total context consumed.
Use qualitative judgement ("~high / ~medium / ~low") if exact counts are unavailable.

| Source                                | Relative weight | Notes                                 |
| ------------------------------------- | --------------- | ------------------------------------- |
| CLAUDE.md (always loaded)             | —               | Fixed cost every session              |
| Stage brief                           | ~?              |                                       |
| Source files read                     | ~?              | Which files were largest / most-read? |
| Tool call results (tests, lint, etc.) | ~?              | Long test output is a common sink     |
| Subagent context                      | ~?              | Each spawn is a separate context      |
| Conversation turns                    | ~?              |                                       |

## Cache effectiveness

- Were the CLAUDE.md "do not re-read" rules followed? (yes / no / partially)
- Were any files read more than once unnecessarily? List them.
- Were any tool results truncated or excessively large?

## What was efficient

List 2–4 specific patterns or decisions that saved tokens in this session.

## What wasted tokens

List 2–4 specific patterns to avoid in future stages. Be concrete (e.g., "read types.ts twice — could have been referenced from memory after first read").

## Recommendations for Stage $((ARGUMENTS + 1))

Specific, actionable guidance derived from this session's observations. Focus on changes to reading strategy, tool use, or brief structure that would measurably reduce context consumption.

1.
2.
3.
```

---

After writing the file, print a one-line summary: "Token report saved to verifications/stage-$ARGUMENTS-tokens.md".

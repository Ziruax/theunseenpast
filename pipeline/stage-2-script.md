# Stage 2 — Script

## Input
- `research.json`

## Task
Write a `script.json` conforming to `schemas/script.schema.json`.

## Rules
- Five acts, exact durations (Cold Open 20s, Context 40s, How It Worked 90s, Hidden Cost 75s, Legacy 75s)
- Total narration: 700–850 words
- Every material claim carries a `[S#]` citation resolving to `research.json`
- One central question stated explicitly in Act 2
- No invented quotations
- Composite characters flagged in the narration text ("reconstructed composite")
- End on a historical consequence, not a moral

## Validation
Run the script gate before reporting success:

```
bun pipeline/validate/validate-script.ts <path-to-script.json> <path-to-research.json>
```

The research path may be omitted if `research.json` sits next to `script.json` (or one directory up). The gate must print `PASS`. On `FAIL`, fix `script.json` and re-run.

## Output
Return path to `script.json` and the central question.

## Stop condition
If total words fall outside 700–850 or any act is missing, output:
"SCRIPT FAILED — [reason]"
and regenerate once. If second attempt fails, halt.

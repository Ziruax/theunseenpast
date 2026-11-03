# Stage 1 — Research

## Input
- Topic title (one line from the editorial calendar)
- Target series (Dangerous Jobs / Everyday Life / Hidden Cost / Fought Back / Disasters)

## Task
Produce a `research.json` file conforming to `schemas/research.schema.json`.

## Rules
- At least 2 primary sources (Priority 1 or 2)
- Every documented fact tied to a source_id
- Explicitly list reconstruction elements
- If a composite character is used, define it and its disclosure text
- Every borrowed asset must have a license entry

## Validation
Run the research gate before reporting success:

```
bun pipeline/validate/validate-research.ts <path-to-research.json>
```

The gate must print `PASS`. On `FAIL`, fix `research.json` and re-run.

## Output
Return the path to `research.json` and a one-paragraph summary of the central claim.

## Stop condition
If you cannot find 2 primary sources, output:
"INSUFFICIENT SOURCES — cannot proceed to scripting"
and list what is missing.

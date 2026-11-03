# Stage 3 — Shot List

## Input
- `script.json`
- `research.json`

## Task
Produce `shots.json` conforming to `schemas/shots.schema.json`.

## Rules
- 80–100 shots total
- Every shot `duration_s ≤ 4.0`
- Target average 2–3 seconds
- Every shot has `visual_type`, `characters`, `environment`, `camera_move`
- SFX listed per shot
- Every mechanical/tool shot has `source_id`

## Validation
Run `pipeline/validate/validate-shots.ts`:

```
bun pipeline/validate/validate-shots.ts <path-to-shots.json>
```

- Reject if `total_shots < 80` or `> 120`
- Reject if any `duration_s > 4.0`
- Reject if any shot lacks `visual_type`
- Reject if the sum of durations is not 300 ± 0.5
- Reject if shots are not contiguous and non-overlapping

The gate must print `PASS`. On `FAIL`, fix `shots.json` and re-run.

## Output
Return path to `shots.json` and the shot count.

## Stop condition
If the validator fails twice after fixes, output:
"SHOT LIST FAILED — [reason]"
and halt. Do not proceed to storyboard with a failing shot list.

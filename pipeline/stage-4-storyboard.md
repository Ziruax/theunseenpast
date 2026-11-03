# Stage 4 — Storyboard

## Input
- `shots.json`
- `research.json`
- `references/style.md`
- `references/palette.md`

## Task
Render one still per shot. Run both quality gates on every still.

Render the stills with the still renderer:

```
bun scripts/stills.mjs <path-to-shots.json> <output-stills-dir>
```

Stills are code-drawn flat-vector frames (SVG → PNG), one per shot, using the palette and style tokens above.

## Rules
- Every still must pass the 11-point visual checklist in `references/self-check.md`
- Every still must pass the 8-point historical gate
- If a still fails, regenerate once with a corrected prompt
- If it fails twice, halt and report
- Record the rendered still path in each shot's optional `still_path` field in `shots.json`

## Validation
Before reporting success, run the gate scripts in `pipeline/validate/` for the inputs this stage depends on:

```
bun pipeline/validate/validate-shots.ts <path-to-shots.json>
```

Both must print `PASS`. The storyboard itself is gated by the two quality gates above (historical + visual), recorded in `storyboard.json` as `self_check_passed: true` with all 11 checks true per frame.

## Output
Produce `storyboard.json` conforming to `schemas/storyboard.schema.json` with `self_check_passed: true`.

## Stop condition
If any still fails twice, output:
"STORYBOARD FAILED — [shot_id] — [check failed]"

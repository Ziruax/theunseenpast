# Stage 7 — Metadata

## Input
- `script.json` (title, acts and their `start_s` values, central question)
- `research.json` (all cited sources with URLs and priorities)
- Stage 6 output: `thumbnail-1.png` and `thumbnail-2.png` paths
- `storyboard.json` (optional: to reference `contact_sheet_path` context)

## Task
Produce `metadata.json` conforming to `schemas/metadata.schema.json` — the YouTube upload package for the episode.

## Rules
- `title` ≤ 70 characters, complements (does not repeat) the thumbnail text
- `description` must include a `Sources` section (a line starting with `Sources`) that lists **every** source cited in `script.json` with its full URL from `research.json`; primary sources first, then secondary
- `description` must include a synthetic-content / AI disclosure sentence containing the marker phrase `Reconstructed composite` (or equivalent clear language stating that the visuals are code-drawn reconstructions and the voiceover is synthetic — no authentic historical footage is shown)
- `chapters` are derived from the act `start_s` values in `script.json`: one entry per act (`{ "time_s": <act start_s>, "label": "<act name>" }`), plus at minimum this set; do not invent chapter labels that contradict the acts
- `tags`: 10–30 tags, each ≤ 30 characters; no misleading tags
- `thumbnail_paths`: exactly the 2 paths from Stage 6
- `disclosure`: `true` (the episode uses AI voiceover and reconstructed code-drawn visuals — the YouTube altered/synthetic content disclosure is mandatory)

## Validation
Run the metadata gate before reporting success:

```
bun pipeline/validate/validate-metadata.ts <path-to-metadata.json>
```

The gate must print `PASS`. On `FAIL`, fix `metadata.json` and re-run.

## Output
Return the path to `metadata.json` and the final title string.

## Stop condition
If the description cannot honestly list every cited source with a working URL, or any citation in `script.json` cannot be resolved to a source in `research.json`, output:
"METADATA FAILED — [reason]"
and return to Stage 1 (research) to repair the source record. Never publish metadata with unresolved or missing citations.

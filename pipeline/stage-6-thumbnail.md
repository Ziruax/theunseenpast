# Stage 6 — Thumbnail

## Input
- Episode title
- Best 5 frames from the storyboard (visually striking)

## Task
Generate 2 thumbnail concepts (PNG, 1280×720) per `references/thumbnails.md`.

## Rules
- Different concept type per thumbnail (A/B/C/D)
- 0–4 words of text, Inter Bold 140–180px
- One dominant subject
- Palette compliant

## Validation
Confirm both PNGs exist at 1280×720 before reporting success. The thumbnail paths will be consumed by Stage 7 (`metadata.json` → `thumbnail_paths`, exactly 2 entries).

## Output
Return paths to `thumbnail-1.png` and `thumbnail-2.png` and a one-line rationale each.

## Stop condition
If either thumbnail cannot be produced at 1280×720, or both concepts use the same concept type after one regeneration attempt, output:
"THUMBNAIL FAILED — [reason]"
and halt. Do not proceed to metadata without exactly two distinct-concept thumbnails.

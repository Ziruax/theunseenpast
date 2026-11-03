# Quality Gates

Two gates. Both must pass before render. Run them on the storyboard stills, honestly, one by one — a gate you
grade from the thumbnail sheet instead of the full-size stills is not a gate.

## Gate 1 — Historical Quality (blocking)

Run after storyboard, before animation.

1. Core claim appears in `research.json` with ≥2 primary sources (Priority 1 or 2).
2. Every `[S#]` citation in the script resolves to a URL or archive record in `research.json`.
3. Every composite character is flagged in script AND has an on-screen "reconstructed composite" caption.
4. AI-generated or code-drawn scenes cannot be mistaken for authentic historical photographs or documents. If a
   scene depicts a real historical photo/document, it must be a vector redraw clearly labelled "illustrated
   reconstruction."
5. Dates, geography, machinery, clothing verified against sources.
6. No overclaiming ("universally deadly," "instantly solved"). Language must match source strength — if the record
   shows one inquiry, say "the inquiry found", not "everyone knew".
7. All audio/voice/music licenses cleared.
8. Synthetic-content disclosure completed per YouTube requirements.

**If any check fails → block render, report failure, return to research or script stage.**

### How to run it

Work through the 8 checks against `research.json`, `script.json`, and the storyboard in one pass. Record the
result per check. A failed check names its shot or claim:

```
GATE 1: FAIL
- check 5: S37 shows a pocket watch; period is 1810, watch is anachronistic → fix shot
- check 6: Act 4 line "every match girl was poisoned" overclaims; source says "some 60 cases of phossy jaw" → rewrite line
```

Fixes loop back to the stage that produced the failure (shot → stage 4, claim → stage 2, fact → stage 1). Never
patch a historical failure in the animation stage.

## Gate 2 — Visual Quality (11-point stills checklist)

Run on every storyboard still — all 80–100, at full size, not on the contact sheet.

1. Reads at 200×200px (mobile thumbnail size)
2. One dominant focal point
3. Character silhouette is clear
4. No modern objects or anachronisms
5. Palette compliance (only the five tokens)
6. Crimson used at most once per scene
7. Text overlay ≤4 words and readable
8. No stick figures or cartoon expressions
9. Period-accurate clothing and tools visible
10. Background depth via overlapping planes (not flat)
11. Parchment texture layer present

**If any check fails → regenerate still, re-run gate.**

### How to run it

Render the board (`scripts/stills.mjs <slug>` → `out/<slug>/board/`), then check each still against the 11 points.
Record failures per still in `storyboard.json`'s `checks` object (one boolean per check — see
`schemas/storyboard.schema.json`). Re-render only failing shots and re-check them. A still that fails the same
check twice halts the pipeline:

```
GATE 2: FAIL — S31 — no_anachronism (electric pendant lamp in an 1838 mill interior)
```

### The checks people skip, and why they must not be

- **#1 (reads at 200 px):** most episodes are watched on phones. Shrink the still; if the subject is not
  immediately clear, reframe before animating — it will not get clearer in motion.
- **#4 (anachronisms):** the anachronism list lives in `references/style.md` (pocket watches, buttons, nails,
  glass, gas/electric light). Check objects, not just clothing.
- **#6 (crimson once):** the accent works only if it is scarce. Two crimson elements per scene is a cartoon.
- **#11 (parchment layer):** it is the film's unifying texture. A scene without it looks like it came from a
  different channel.

## Worked micro-example

One frame entry in `storyboard.json`, as it should look when the gate passes:

```json
{
  "shot_id": "S24",
  "still_path": "out/chimney-boys/board/S24.png",
  "checks": {
    "reads_at_200px": true, "single_focal_point": true, "clear_silhouette": true,
    "no_anachronism": true, "palette_compliant": true, "crimson_max_once": true,
    "text_max_4_words": true, "no_stick_figures": true, "period_accurate": true,
    "background_depth": true, "parchment_layer": true
  }
}
```

`self_check_passed: true` at the top level only when every frame's every check is true.

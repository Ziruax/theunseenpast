# Pacing Standard — 5-Minute High-Density Documentary

## Global rule

**Visual change every 2–3 seconds.** Hard maximum: 4 seconds per shot.

Target: 80–100 visual changes across 300 seconds (a 3.0–3.75 s average). At 30 fps that is 2,400–3,000 frames of
holding between 2,700 cuts — the engine cuts on the word timings, so the grid must be laid out in `shots.json`
before the voice is ever rendered.

## Per-act cut targets

| Act | Duration | Cuts |
|---|---|---|
| Cold Open | 20s | 6–8 |
| Context | 40s | 10–12 |
| How It Worked | 90s | 25–30 |
| Hidden Cost | 75s | 20–25 |
| Turning Point & Legacy | 75s | 20–25 |

Act 1 is allowed to run fast (2.5 s average) because it is short; Act 3 carries the most shots because it explains
a process. If your per-act counts are inside these bands but the total is under 80, the shortfall is real — add
shots that carry information, not filler.

## Visual change types (use a mix)

| Type | Share | Example |
|---|---|---|
| New composition / scene | 30% | Mine entrance → underground face |
| Shot size change | 25% | Full-body silhouette → hand on tool |
| Line/vector animation reveal | 20% | Tool structure drawn in stroke-by-stroke |
| Map / diagram state change | 15% | Cholera deaths spreading block-by-block |
| Document highlight | 10% | Factory Act clause line-highlighted |

A board that is 90% new compositions is a slideshow; a board that is 90% documents is a lecture. Hold near the
shares.

## What counts as a visual change

Any change in: composition, shot size, animation state, map state, on-screen document highlight, or text overlay.

## What does NOT count

- Camera push/pull alone (must combine with composition or detail change)
- Colour shift alone
- SFX alone
- Text appearing on an unchanged frame

A slow push over a 4 s hold is a camera move, not a cut. If you need the hold to exceed 4 s, split it: push on the
first half, detail change (a highlight, a line reveal, a shot size change) on the second.

## Validation

The shot-list generator must produce `shots.json` where every entry has `start_s`, `end_s`, and `duration_s ≤ 4.0`.
A validator script must reject any episode where:

- any shot exceeds 4.0 seconds
- total visual changes fall below 80
- the sum of `duration_s` is not 300.0 ± 0.5

Cuts land on word timings: a shot's first frame should sit within ~2 frames (≈66 ms) before the word that begins
its content, as computed from `words.json`.

## Anti-pattern warning

High cut frequency is NOT the same as chaotic editing. Every cut must carry information. A 4-second hold on a
document close-up is acceptable if it is the only shot in that window and conveys evidence. Do not insert filler
cuts to hit the target.

## Pacing traps

- **Filler cuts.** Six near-identical wides of the same factory in Act 3 to reach the count. If two neighbouring
  shots differ only in camera zoom, you have one shot and a camera move — delete one and give the other a real
  content change.
- **The 2-second question.** A shot shorter than ~1.8 s cannot be read at all, let alone at 200 px. If the grid
  demands a cut but the eye needs a rest, make the change a *type* change (wide → line reveal of the same subject),
  not a brand-new scene.
- **Cuts on function words.** Cutting on "the", "and", "was" puts the picture change in a dead spot. Cue on the
  content word ("sent", "chimney", "never") even if the shot starts a syllable early.
- **Rhythmic predictability.** Ten shots at exactly 3.0 s reads as a metronome. Vary 1.8–4.0 s within the acts;
  the 2–3 s target is an average, not a template.

## Worked micro-example

Four consecutive rows from a shot list (act boundaries and mixes visible):

```json
{"shot_id":"S22","start_s":64.0,"end_s":66.5,"duration_s":2.5,"act":3,"visual_type":"new_scene","environment":"mine_tunnel","camera_move":"lateral_pan","description":"Wide: seam face, four silhouettes picking coal, lamp light left"}
{"shot_id":"S23","start_s":66.5,"end_s":68.8,"duration_s":2.3,"act":3,"visual_type":"shot_size_change","camera_move":"hold","description":"Insert: pick head against coal, sparks of dust"}
{"shot_id":"S24","start_s":68.8,"end_s":71.4,"duration_s":2.6,"act":3,"visual_type":"line_reveal","camera_move":"slow_push","description":"Ventilation path drawn over the tunnel, arrow into stale-air corner"}
{"shot_id":"S25","start_s":71.4,"end_s":75.2,"duration_s":3.8,"act":3,"visual_type":"document_highlight","camera_move":"hold","description":"1842 Commission report page, 'children… from five to six years of age' highlighted"}
```

Four changes in 11.2 s (2.8 s average), five change types represented, the only long hold is the document.

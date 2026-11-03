---
name: unseen-past
description: 'Make a 5-minute animated historical documentary episode for "The Unseen Past" — a faceless YouTube channel covering dangerous jobs, forgotten workers, and the hidden human costs of history. Runs a gated pipeline — research dossier, five-act script with citations, 80–100 shot list, storyboard of code-drawn stills, 300 s Remotion render at 1920x1080/30fps, two thumbnails, YouTube metadata — in a flat-vector parchment style with block-silhouette figures, period-accurate tools, and chiaroscuro vector lighting. Voice is word-synced with free Microsoft Edge TTS (en-GB-RyanNeural) by default, ElevenLabs optional. Use when someone asks to "make a history documentary video about X", "a The Unseen Past episode about X", an animated history explainer, a Victorian dangerous-jobs video (chimney sweeps, match girls, miners, workhouses), or a 5-minute faceless-channel documentary in this style.'
---

# The Unseen Past — Animated Historical Documentary Pipeline

One topic line in, a finished 5-minute (300-second) fully animated historical documentary episode out — for
"The Unseen Past": dangerous jobs, forgotten workers, hidden human costs in history. Every frame is SVG that
Claude writes (rendered by Remotion). The voice is free Microsoft Edge TTS (en-GB-RyanNeural) with word-boundary
timings; ElevenLabs is optional and off unless `ELEVENLABS_API_KEY` is set. Two quality gates (historical and
visual) block the render until the storyboard passes.

## What this skill produces

Per episode:

- 300-second master MP4 (1920×1080, 30 fps, −14 LUFS integrated, −1 dBTP)
- Word-synced voiceover (free Edge TTS `en-GB-RyanNeural` by default; ElevenLabs neutral British English optional)
- 80–100 code-drawn flat-vector historical scenes
- Two 1280×720 thumbnail PNGs with one-line rationales
- YouTube metadata package (title ≤70 chars, description with sources and disclosure, `chapters.txt`, tags)

## What this skill does NOT do

- It does not generate 15–25 second "What If" shorts. That formula is retired.
- It does not use stick figures or dusk-lit perspective rooms. That visual system is retired.
- It does not script before research. The research gate is mandatory.
- It does not use photorealistic AI images. All visuals are SVG + Remotion code.
- It does not invent quotations, private thoughts, or unsourced statistics.

## The mandatory pipeline (in order)

Every episode passes through these stages sequentially. The skill must refuse to skip a stage. Stage prompts live
in `pipeline/stage-1-research.md` … `stage-6-thumbnail.md` (stage 7, metadata, is part of the handover).

| Stage | Output | Gate |
|---|---|---|
| 1. Research | `research.json` | ≥2 primary sources, licensed assets |
| 2. Script | `script.json` | 5 acts, 700–850 words, all `[S#]` citations resolve |
| 3. Shot list | `shots.json` | 80–100 shots, every shot ≤4.0 s, durations sum to 300 ± 0.5 s |
| 4. Storyboard | stills + `storyboard.json` | Historical gate (8 checks) AND visual gate (11 checks) |
| 5. Animation | `final.mp4` + `chapters.txt` | Mix at −14 LUFS / −1 dBTP |
| 6. Thumbnail | `thumbnail-1.png`, `thumbnail-2.png` | Two different concept types, ≤4 words each |
| 7. Metadata | title, description, chapters, tags | Title ≤70 chars; sources + synthetic-content disclosure in description |

If any stage fails its quality gate, stop and report. Do not proceed.

## Narrative formula

The **Five-Act Historical Documentary Arc** — see `references/formula.md`:

| Act | Duration | Function |
|---|---|---|
| Cold Open | 0:00–0:20 | Documented danger, contradiction, or consequence |
| Context | 0:20–1:00 | Person, place, period, central question |
| How It Worked | 1:00–2:30 | Process, tools, lived experience |
| Hidden Cost | 2:30–3:45 | Risks, incentives, consequences, evidence |
| Turning Point & Legacy | 3:45–5:00 | Reform, resistance, what changed, why it matters |

Word count: **700–850 spoken words** at 140–150 wpm. Every material claim carries a `[S#]` citation that resolves
to a source in `research.json`.

## Visual style

**Flat-vector historical documentary** — see `references/style.md` and `references/palette.md`.

- Block-silhouette characters with period-accurate clothing and tools; 3–5 key poses per scene, 2–4 frame
  interpolations, then hold
- Chiaroscuro via SVG vector gradients driven by visible light sources (lamp, fire, window) — never flat fills,
  never glow or bloom
- Parchment texture base layer at 15–20% opacity
- Five-colour palette: charcoal, parchment, bronze, crimson, bone — crimson is an accent, one element per scene

## Pacing rule

**Visual change every 2–3 seconds.** Hard maximum 4.0 seconds per shot; 80–100 visual changes per episode. See
`references/pacing.md`. Every cut carries information — no filler cuts to hit the count.

## Research requirement

Before any script is written, `research.json` must exist and pass its validator. It must contain:

- Core historical claim (one sentence, falsifiable)
- Exact period (start year–end year) and geographic location
- Key dates and named figures (if any), each with a `source_id`
- At least 2 primary-source evidence items from Priority 1 or 2 sources (see `references/research.md`)
- Explicit distinction between documented fact and reconstruction; composite characters flagged
- Source URLs and licenses for all borrowed assets

The script generator must cite a `source_id` for every material claim. Insufficient sources → the pipeline halts
with `INSUFFICIENT SOURCES`.

## Voice specification

- Default: **free Microsoft Edge TTS via `edge-tts`, voice `en-GB-RyanNeural`** (neutral British English), which
  returns word-boundary timings for free — those timings drive the word-level sync in the engine.
- Optional: ElevenLabs (neutral British English, mature, measured) when `ELEVENLABS_API_KEY` is set and commercial
  use is verified for the plan.
- Target 140–150 wpm. Act-boundary pauses 0.8–1.2 s; evidence reveals 0.4–0.6 s; natural sentence breaks
  0.2–0.3 s. No artificial urgency, no "Shorts host" energy, no tightened-pauses post-process (retired).
- Pronunciation check every historical name and place name (see `references/traps.md`).

## Quality gates

Two gates must pass before rendering — both defined in `references/self-check.md`:

1. **Historical gate** — 8 checks (sources, citations, composites flagged, no fake documents, no overclaiming,
   licenses, disclosure). Run after storyboard, before animation.
2. **Visual gate** — 11-point stills checklist, rewritten for flat-vector (reads at 200×200 px, one focal point,
   palette compliance, no anachronisms, parchment layer present, …). Run on every still.

If either gate fails, block rendering.

## File map

| File | What's in it |
|---|---|
| `references/research.md` | Source hierarchy, `research.json` field spec, rejection rules, archive destinations |
| `references/formula.md` | The five-act arc, per-act word budgets, storytelling rules |
| `references/pacing.md` | The 2–3 s cut grid, per-act cut targets, what counts as a visual change |
| `references/style.md` | The flat-vector historical look: figures, environments, animation rules, forbidden list |
| `references/palette.md` | The five colour tokens, typography, type sizes |
| `references/sound.md` | Voice, ambience beds, sparse music, mix targets (LUFS/dBTP) |
| `references/self-check.md` | Both quality gates: 8 historical checks, 11 visual checks |
| `references/thumbnails.md` | Thumbnail concept types A–D, text rules, what to avoid |
| `references/kit.md` | The engine and hist library: how to build a shot, render stills, chain the JSON stages |
| `references/traps.md` | Everything that cost time — drawing, motion, sound, research, pipeline |
| `schemas/` | JSON contracts: `research`, `script`, `shots`, `storyboard`, `episode` |
| `pipeline/` | One prompt per stage (`stage-1` … `stage-6`) and the validators under `pipeline/validate/` |
| `scripts/` | voice, plan, stills, board, sfx, mixcheck, motiongrid, master (Python 3.9+ and Node) |
| `studio/` | The Remotion project: copy it once, then every episode lives in it |

## Setup (once per machine)

Needs Node 18+, ffmpeg and ffprobe on the PATH, and Python 3.9+ with `numpy` (Pillow where scripts use it).

```bash
cp -r <skill>/studio ./unseenpast-studio && cd unseenpast-studio && npm install
```

Everything below runs from that studio folder; `<skill>` is this skill's folder. The default voice needs **no key**:
`edge-tts` is free (`pip install edge-tts`). To use ElevenLabs instead, set `ELEVENLABS_API_KEY` in the
environment or a `.env` above the studio — and verify your plan permits commercial use.

**Keys by name only.** Reference `ELEVENLABS_API_KEY` by name, from the environment or a `.env` above the studio.
Never print, paste, or hardcode a key — not in code, not in logs, not in chat.

**Free-voice note.** Edge TTS (`en-GB-RyanNeural`) costs nothing and returns word boundaries; it is the default.
It is a synthetic neural voice — the episode's description must carry the synthetic-content disclosure regardless
of which voice was used.

## Rules

- **Research gate is mandatory.** No scripting before `research.json` passes its validator. No topic line in →
  script out; that shortcut is retired.
- **Every fact is sourced.** Every material claim in the script cites a `[S#]` resolving to `research.json`.
  Never invent quotations; paraphrase unless a verbatim source exists.
- **Composite characters only when flagged.** A reconstructed composite must be flagged in the script AND carry an
  on-screen "reconstructed composite" caption. No real person's likeness; nothing resembling a living person.
- **Original characters, original stories.** The block-figure cast is ours. Never a channel's own hero, nothing
  that resembles a famous cartoon character; check every new figure on the cast sheet.
- **Storyboard before animation.** No video render until the stills pass both gates — 80–100 stills is the normal
  cost of a board; iterate on stills, never on renders.
- **Never claim real channels use AI tools** or any other tool. Nobody has said how they're made. Never claim any
  real channel's episode as precedent for this pipeline's output.
- **Synthetic-content disclosure.** Every upload carries YouTube's altered/synthetic content disclosure; the
  description lists sources and states that visuals are illustrated reconstruction, not archival footage.
- **Keys by name only.** See Setup.
- **Report the run.** Voice engine used, credits (if ElevenLabs), shot count, gate results, anything you'd still
  improve.

## Retired concepts

The following are explicitly retired and must not appear in any new output:

- Seven-beat "What If" formula
- Stick-figure cast (replaced by block-silhouette figures in `studio/src/hist/figures.tsx`)
- Dusk-lit perspective rooms (replaced by flat-vector historical environments)
- 15–25 second runtime (now 300 s; `durationInFrames` = 9000 at 30 fps)
- "One topic line in → script" flow (replaced by the mandatory research gate)
- Per-action cartoon SFX on every visible action (replaced by the mix targets in `references/sound.md`)
- Tightened pauses for viral pace (voice plays at natural 140–150 wpm with documented pause lengths)
- "27 cuts per minute opening burst" logic (replaced by the uniform 2–3 s grid in `references/pacing.md`)

The engine keeps **word-level voice sync**: the word-boundary timings from `words.json` still drive every cut and
cue, exactly as before — now across 9,000 frames instead of 750.

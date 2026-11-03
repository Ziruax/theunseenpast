# The Unseen Past — animated historical documentary pipeline

A Claude skill that turns one topic line into a finished **5-minute animated historical documentary episode** for
"The Unseen Past" — a faceless YouTube channel covering dangerous jobs, forgotten workers, and the hidden human
costs of history: chimney sweeps, match girls, miners, sewer hunters, workhouse labour.

Every frame is drawn in code: the AI writes each scene as SVG and Remotion renders it — flat-vector historical
illustration on a parchment base, block-silhouette figures in period-accurate clothing, chiaroscuro lighting from
vector gradients, a five-colour palette. The voiceover is word-synced: free Microsoft Edge TTS
(`en-GB-RyanNeural`) by default, ElevenLabs optional. No image model, no video model, no stock footage.

## Output per episode

- 300-second master MP4 (1920×1080, 30 fps, −14 LUFS, −1 dBTP)
- Word-synced voiceover + word-boundary timings
- 80–100 code-drawn vector scenes (visual change every 2–3 seconds)
- Two 1280×720 thumbnail concepts
- YouTube metadata: title, description with sources, `chapters.txt`, tags

## Architecture

```
            ┌──────────────────────────── pipeline (gated, in order) ────────────────────────────┐
            │                                                                                     │
 topic ──▶ STAGE 1 ──▶ STAGE 2 ──▶ STAGE 3 ──▶ STAGE 4 ──▶ STAGE 5 ──▶ STAGE 6 ──▶ STAGE 7
           Research    Script     Shot list   Storyboard   Animation   Thumbnail   Metadata
            │            │            │             │             │            │            │
            ▼            ▼            ▼             ▼             ▼            ▼            ▼
       research.json  script.json  shots.json  storyboard.json  final.mp4  thumbnail-*.png  metadata
            │            │            │             │                          ▲
            └──── [S#] citations ─────┘      stills per shot                    │
                                                  ▲                            │
                                     scripts/stills.mjs ──▶ out/<slug>/board/ │
                                                          (board.py sheet)    │
                                                              │               │
                                                     GATE 1: historical       │
                                                     GATE 2: 11-point visual ─┘

 studio/src/engine/   kept core: episode.tsx (word-sync timeline), anim.ts (easing), fonts.ts
 studio/src/hist/     flat-vector system: palette (PAL + mix()), shot.ts, ParchmentBase,
                      figures (block-silhouette, period clothing), environments (mine tunnel,
                      factory floor, Victorian street, workhouse, sewer, hospital ward,
                      medieval workshop, railway), vector-gradient lighting, documents/maps
                      animators, thumbnail compositor
 schemas/             JSON contracts for every stage hand-off
 pipeline/            one prompt per stage + validators (research / script / shots)
```

## Pipeline stages

1. **Research** — produce `research.json`: ≥2 primary sources, exact period and place, documented facts vs
   reconstruction, asset licenses. Validator blocks on failure.
2. **Script** — `script.json`: five acts (Cold Open / Context / How It Worked / Hidden Cost / Turning Point &
   Legacy), 700–850 words at 140–150 wpm, every claim cited `[S#]`.
3. **Shot list** — `shots.json`: 80–100 shots, every shot ≤4.0 s, durations summing to 300 s.
4. **Storyboard** — one still per shot (`scripts/stills.mjs`); historical gate (8 checks) and visual gate
   (11-point checklist) must pass before anything animates.
5. **Animation** — voice (word-synced), SFX, ambience beds, sparse music, mix to −14 LUFS, master MP4.
6. **Thumbnail** — two 1280×720 concepts, different concept types, ≤4 words each.
7. **Metadata** — title ≤70 chars, description with sources and synthetic-content disclosure, chapters, tags.

## Schemas

The stage hand-offs are JSON contracts under `schemas/`:

| Schema | Defines |
|---|---|
| `research.schema.json` | Sources, facts, reconstruction flags, licenses |
| `script.schema.json` | Five acts, narration, citations, on-screen text |
| `shots.schema.json` | Shot rows (id, times, act, visual type, environment, camera) |
| `storyboard.schema.json` | Per-frame still paths + 11 boolean visual checks |
| `episode.schema.json` | The render contract (300 s, 30 fps, 1920×1080, audio paths) |

## Quickstart

Needs Node 18+, ffmpeg/ffprobe on the PATH, Python 3.9+ with `numpy`.

```bash
git clone <this-repo>
cp -r <this-repo>/studio ./unseenpast-studio && cd unseenpast-studio && npm install
pip install edge-tts
```

Then, in Claude Code (or any agent that reads `SKILL.md`), from the studio folder:

> Make a history documentary video about Victorian match girls.

The skill runs the gated pipeline above. The default voice costs nothing (`edge-tts`, en-GB-RyanNeural, with word
timings); set `ELEVENLABS_API_KEY` in the environment or a `.env` above the studio only if you want ElevenLabs —
keys by name only, never hardcoded.

You get `out/<slug>/final.mp4`, `out/<slug>/storyboard.jpg`, `out/<slug>/thumbnail-1.png` and `-2.png`,
`chapters.txt`, and the metadata package.

## The rules it follows

- Research gate before any scripting: every material claim cited to a primary or archive source.
- Composite characters only when flagged, in script and on screen; no invented quotations.
- Original figures and stories; nothing resembling a famous character.
- Storyboard before animation; both gates block the render.
- It never claims real channels use AI tools.
- Every upload carries the synthetic-content disclosure; descriptions list sources and state that visuals are
  illustrated reconstruction.

## Screenshot placeholder

<!-- TODO: replace with a real frame from the pilot episode
     (pilot: "Why Victorian Children Were Forced to Climb Chimneys").
     Suggested: a 3-frame strip — act-1 flue shot, act-3 tool insert, act-5 reform document. -->

![Episode frame placeholder](docs/screenshot-placeholder.png)

## Repository layout

| Path | What |
|---|---|
| `SKILL.md` | The pipeline the agent follows |
| `references/` | Research, formula, pacing, style, palette, sound, self-check, thumbnails, kit, traps |
| `schemas/` | The five JSON contracts |
| `pipeline/` | Stage prompts and validators |
| `studio/` | The Remotion project (engine + hist library) |
| `scripts/` | voice, plan, stills, board, sfx, mixcheck, motiongrid, master |

## License

The code is free to use, change and share. Fonts load from Google Fonts (SIL Open Font License).
[Remotion](https://www.remotion.dev/license) is free for individuals and companies of up to three people; larger
teams need a Remotion company licence. Edge TTS output is free under its terms; ElevenLabs output is governed by
your account's plan, including its commercial-use terms. Historical sources and any borrowed assets are licensed
per-asset in each episode's `research.json`.

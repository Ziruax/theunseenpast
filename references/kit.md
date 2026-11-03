# The kit: engine, hist library, and how the stages chain

Everything an episode author draws with lives in two places:

- `studio/src/engine/` — the kept core: `episode.tsx` (the word-sync timeline), `anim.ts` (easing), `fonts.ts`
  (Google-font loading), plus the generic Remotion plumbing (`Root.tsx`, `index.ts`).
- `studio/src/hist/` — the flat-vector historical system (new): palette, shot types, parchment base, figures,
  environments, lighting, documents/maps, and the thumbnail compositor.

The world is 1920×1080 units, 30 fps, and a full episode is 9,000 frames (`durationInFrames: 9000`). A shot draws
in world units and frames itself with a camera; nothing else changed about the drawing discipline.

## The pipeline's JSON chain

The stages hand off through JSON files. Each stage reads its inputs and writes its output; the validators
(`pipeline/validate/`) run between them.

```
research.json ──▶ script.json ──▶ shots.json ──▶ storyboard.json ──▶ final.mp4 ──▶ thumbnail-1/2.png
   (stage 1)       (stage 2)       (stage 3)        (stage 4)         (stage 5)      (stage 6)
        ▲               ▲               ▲                  ▲
  schemas/research  schemas/script  schemas/shots   schemas/storyboard
```

Where the files live per episode (`<slug>` = the episode's kebab-case id):

| Path | Written by | What |
|---|---|---|
| `src/episodes/<slug>/research.json` | stage 1 | Sources, facts, reconstruction flags, asset licenses |
| `src/episodes/<slug>/script.json` | stage 2 | Five acts, narration, `[S#]` citations, on-screen text |
| `src/episodes/<slug>/shots.json` | stage 3 | 80–100 shot rows; the sole driver of visual state |
| `src/episodes/<slug>/storyboard.json` | stage 4 | Per-frame still paths + the 11 boolean checks |
| `src/episodes/<slug>/words.json` | voice step | Word-boundary timings from the TTS engine |
| `public/<slug>/voice.*`, `sfx.*`, `music.*`, `mix.*` | voice / sfx / mix | Audio stems |
| `out/<slug>/board/*.png` | `scripts/stills.mjs` | One still per shot |
| `out/<slug>/storyboard.jpg` | `scripts/board.py` | The captioned contact sheet |
| `out/<slug>/chapters.txt` | renderer | Act start timestamps for YouTube |
| `out/<slug>/final.mp4` | master step | The 300 s master, −14 LUFS / −1 dBTP |
| `out/<slug>/thumbnail-1.png`, `thumbnail-2.png` | stage 6 | The two concepts |

The engine reads `shots.json` and renders frame-by-frame: the shot list is the source of truth, so a retimed
episode is a re-run of stage 3, not a re-draw. `words.json` drives word-level sync inside `episode.tsx` — cuts
cue to the content words, exactly as before, now across 9,000 frames.

## The hist library (`studio/src/hist/`)

### palette.tsx — colour tokens

```ts
import { PAL, mix, HISTFONT } from '../hist/palette';

PAL.charcoal  // "#20201D"
mix(PAL.charcoal, PAL.parchment, 0.5)  // the only sanctioned intermediate colour
```

Rules live in `references/palette.md`. Never hardcode a hex that is not a token or a `mix()` of two.

### shot.ts — the types the JSON stages map onto

```ts
export type Occupation = 'chimney_sweep' | 'match_worker' | 'miner' | 'sewer_worker' | ...;
export type Pose = 'standing' | 'bending' | 'climbing' | 'carrying' | 'crouching' | 'reaching';
export type Facing = 'left' | 'right';
export type CameraMove = 'hold' | 'slow_push' | 'lateral_pan' | 'detail_push';
export type VisualType = 'new_scene' | 'shot_size_change' | 'line_reveal' | 'map_change' | 'document_highlight';

export type Shot = {
  shot_id: string;          // "S03"
  start_s: number; end_s: number; duration_s: number;  // duration_s ≤ 4.0
  act: 1 | 2 | 3 | 4 | 5;
  visual_type: VisualType;
  environment: string;      // a hist environment key, e.g. "mine_tunnel"
  characters: Array<{ occupation: Occupation; pose: Pose; facing: Facing; scale: number }>;
  camera_move: CameraMove;
  sfx: string[];
  source_id?: string;
  description: string;
};
```

`episode.tsx` converts these to frames (`start_s × 30`) and drives the composition from the array. Storyboard
stills are simply each shot at its key moment.

### parchment.tsx — the base layer

Every scene starts with `<ParchmentBase />`: the paper base at full opacity with the texture layer at 15–20%
opacity on top. It sits *under* the camera group so the texture does not scale with pushes. A scene without it
fails visual check 11.

### figures.tsx — block-silhouette characters

```tsx
<Figure occupation="chimney_sweep" pose="climbing" facing="right"
        scale={0.9} x={960} y={760} silhouetteOnly={false} />
```

- Silhouette body in `PAL.charcoal`; skin in `PAL.parchment`; clothing in `PAL.bronze` or `PAL.bone`
- Clothing is period-accurate: overlapping vector shapes (apron, cap, coat, collar), 3px stroke at 1080p
- Expression, when essential, is dot eyes + line mouth — never cartoon features
- `silhouetteOnly` for distant or compositional figures
- Pose keys only: 3–5 per scene, 2–4 frames of eased interpolation between keys (`anim.ts` easing), then hold.
  No blinking, no breathing, no idle sway.
- Every figure must read at 200×200 px; check doubtful ones on the cast sheet before the board.

### Environments

Ship in `studio/src/hist/` as three-layer components — `background` (parallax 0.3×), `midground` (1.0×),
`foreground` (1.5×) — each taking the shot clock `t` and an `id`:

| Environment | Component | Typical use |
|---|---|---|
| Mine tunnel | `MineTunnel` | Acts 1/3, coal episodes |
| Factory floor | `FactoryFloor` | Textile, match, machinery |
| Victorian street | `VictorianStreet` | Context, transition, legacy |
| Workhouse | `WorkhouseInterior` | Workhouse/pauper episodes |
| Sewer | `SewerTunnel` | Sewer hunters, sanitation |
| Hospital ward | `HospitalWard` | Consequences, medicine |
| Medieval workshop | `MedievalWorkshop` | Pre-industrial trades |
| Railway | `RailwayConstruction` | Navvies, expansion |

Each carries its own parallax-friendly geometry and expects lighting to be layered on top (below). New
environments follow the same structure and are added to the skill's copy so the next episode inherits them.

### Lighting (vector gradients)

Chiaroscuro is SVG gradients, applied over the environment and figures:

- A radial/linear gradient from a **visible light source** — the miner's lamp, the furnace, the window — with
  `PAL.bone`/`PAL.bronze` falling to `PAL.charcoal`
- Light direction must match scene logic: candle below a face lights it from below; a side window splits it
- Only palette colours in gradients (`mix()` for mid stops)
- No bloom, no glow, no lens flare — a lamp is a bright shape plus a gradient, not a filter effect

### Documents and maps

`hist` includes animators for the evidence shots (10% of the grid, per `references/pacing.md`):

- **Documents** — a report/act/letter on `ParchmentBase`, text as charcoal strokes; a clause highlights with a
  crimson underline + wash (`document_highlight` shots). The page must be a vector redraw clearly labelled
  "illustrated reconstruction" if it stands in for a real document.
- **Maps** — Britain/London/Europe flat vector; regions fill, spread, or highlight over 0.5–1 s per state change
  (`map_change` shots; e.g. cholera deaths spreading block-by-block).

### Thumbnail compositor

`hist`'s thumbnail module renders the stage-6 concepts at 1280×720: one dominant subject re-lit for contrast,
headline text 140–180px Inter Bold in code (top or bottom third), two different concept types per episode. Rules:
`references/thumbnails.md`.

## How an episode author builds a shot

1. Read the shot row from `shots.json` (`shot_id`, times, `environment`, `characters`, `camera_move`, `description`).
2. Write the shot component: `ParchmentBase` → environment (three layers) → figures per the row → lighting
   gradient from the scene's light source → the row's action as pose keys with `anim.ts` easing → overlays in code.
3. Derive everything from the shot's clock `t` (frames) — no `Math.random`, no state. Scatter with a seeded RNG.
   The same `t` must always draw the same frame.
4. Camera: `hold` is a static transform; `slow_push` is 2–4% over the shot's length; `lateral_pan` 5–10%; pans
   respect the environment's 0.3× / 1.0× / 1.5× parallax.
5. Register the shot in the episode's index; `episode.tsx` composes all shots from `shots.json` + `words.json`.

## Storyboard stills (`scripts/stills.mjs`)

```bash
node <skill>/scripts/stills.mjs <slug>              # one still per shot, at its key frame
node <skill>/scripts/stills.mjs <slug> S24 S31      # re-render named shots after a fix
python <skill>/scripts/board.py <slug>              # captioned contact sheet, out/<slug>/storyboard.jpg
```

A still takes about two seconds; a full 100-shot board renders in minutes. Iterate here, never on video renders —
a full 300 s episode render is orders of magnitude more expensive. Every still goes through both gates
(`references/self-check.md`) before stage 5.

## Render and master

```bash
python <skill>/scripts/master.py <slug>
```

Renders the composition (1920×1080, 30 fps, 9,000 frames, H.264), mixes to −14 LUFS / −1 dBTP, writes
`chapters.txt` (five act timestamps) and the run report. `mixcheck.py` verifies no stem comes within 3 dB of the
voice while a word is spoken.

## Adding to the kit

- **An environment:** build it in `src/hist/<name>.tsx` with the three-layer structure and an `id` prop, export it
  from `hist/index.ts`, document it in the table above, copy it into the skill's `studio/src/hist/`.
- **An occupation or pose:** add to `figures.tsx` with period-accurate clothing layers and its tools; check the
  silhouette on the cast sheet; add it to the `Occupation`/`Pose` types in `shot.ts` so `shots.json` can use it.
- **A document/map animator:** draw on `ParchmentBase`, keep text as code, keep highlights crimson-limited.
- **A prop family:** anything an episode needs twice goes in `hist`, not in the episode's own folder.

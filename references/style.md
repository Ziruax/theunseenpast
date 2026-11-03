# Visual Style — Flat-Vector Historical Documentary

## The look

Flat-vector illustration with limited puppet animation, chiaroscuro via vector gradients, parchment-texture
background, five-colour palette. Think "history documentary animated by a disciplined illustrator," not "cartoon"
and not "AI photoreal."

## Character system

- **Block-figure silhouettes** — simplified human forms, no facial detail beyond simple marks (dot eyes, line
  mouth) when expression is essential
- **Period-accurate clothing** — dress, apron, cap, coat, collar rendered as overlapping vector shapes
- **Period-accurate tools** — chimney brush, match dip tray, miner's lamp, pickaxe, shovel drawn as vector shapes
  with stroke detail
- **Pose keys only** — 3–5 key poses per character per scene; no walk cycles, no fluid acting. Motion between poses
  is 2–4 frames of interpolation, then hold.
- **Silhouette readability** — every character must read at 200×200px (mobile thumbnail size)

The character system lives in `studio/src/hist/figures.tsx`: occupations (`chimney_sweep`, `match_worker`,
`miner`, `sewer_worker`, `textile_worker`, `railway_worker`, `medieval_tanner`, …) × poses (`standing`, `bending`,
`climbing`, `carrying`, `crouching`, `reaching`) × facing. See `references/kit.md` for the calling convention.

## Environment system

- **Parchment base layer** — subtle paper texture at 15–20% opacity (`ParchmentBase` in `studio/src/hist/parchment.tsx`)
- **Vector architecture** — brick, timber, stone, iron rendered as flat shapes with 1–2 stroke detail lines
- **Depth via overlapping planes** — foreground (tools, partial figures), midground (action), background (building,
  skyline, tunnel)
- **Parallax** — background layers move at 0.3× speed relative to foreground on camera pans (foreground 1.5×,
  midground 1.0×)
- **Lighting** — vector radial/linear gradients for chiaroscuro; light sources (lamp, fire, window) drive gradient
  direction. A candle under a face lights it from below; a window to the side splits it.

Environments ship as components in `studio/src/hist/`: mine tunnel, factory floor, Victorian street, workhouse,
sewer, hospital ward, medieval workshop, railway. Build a new one only when the storyboard needs it, in the same
three-layer structure, and add it to the skill's copy.

## Animation rules

- **Pose-to-pose** — characters snap between key poses with 2–4 frames of ease
- **No fluid motion** — no blinking, no breathing, no idle sway
- **Camera moves** — slow push (2–4% over 2s), lateral pan (5–10% over 2s), hold
- **Line reveals** — key objects (tools, documents, maps) drawn via stroke-dashoffset over 0.5–1.0s
- **No zoom punches, no shake, no whip pans** — this is documentary, not MrBeast

## Text on screen

- Font: Inter Bold (labels, dates) / Cinzel SemiBold (act titles) — loaded via `fonts.ts` / `HISTFONT`
- Maximum 4 words per overlay
- Never baked into illustration — always added in code
- White or bone-white text with charcoal drop shadow

Sizes are in `references/palette.md`.

## Anachronism discipline

The visual gate fails a still for any anachronism. Check before drawing:

- **Pocket watches** only after ~1675, and only in waistcoat pockets from the 19th century; nobody tells time from
  a wristwatch before the 1910s–20s. A factory or mine scene pre-1850 with a wall clock is suspect — most workers
  were time-kept by bells, whistles, and knocker-uppers.
- **Buttons** before ~1300: use toggles, lacing, pins. Hooks and eyes, not zips — zips are 20th century.
- **Nails** pre-1800 are hand-forged (irregular, rose heads); machine-made wire nails are post-~1830. A Victorian
  slum interior still shows hand-forged ironmongery.
- **Glass** in working-class windows before the mid-19th century is small-paned and wavy; large clear sheets in an
  1840s tenement will read wrong.
- **Coal gas lighting** spreads street-by-street from the 1810s–20s; oil lamps and rushlights before that. Electric
  light in a working-class interior pre-1900 is wrong in Britain, near-wrong in the US.
- **Machinery** must match the period's power source: water frame (water), then steam, then electricity. A treadle
  is human; a belt drive means overhead shafting — draw the shafting in a factory interior or the room reads empty.
- **Labels and print** on documents must match the era's typography and spelling; do not typeset an 1842 report in
  a modern grotesque inside the illustration (on-screen *overlays* in Inter are fine — they are clearly ours).

When in doubt, strip the object out. A sparser set is a smaller failure than a wrong one.

## Forbidden

- Stick figures (retired system)
- Dusk-lit perspective rooms (retired system)
- Photorealistic AI images
- Sepia filters on photographs
- Modern objects, clothing, or machinery
- Cartoon expressions (exaggerated shock eyes, gaping mouths)
- Zoom punches, shake, whip pans
- Glow, bloom, lens flare

## Worked micro-example

One act-3 scene, described the way a shot component should be built:

> **S24 — "Ventilation path, mine tunnel" (2.6 s, slow push).** `ParchmentBase` under everything. Midground: mine
> tunnel in `studio/src/hist` (stone arch, charcoal fill, one bronze stroke line along the timber prop). A miner
> figure at `pick` pose, scale 0.9, facing right; pick raised as the key pose. Foreground: one partial prop beam,
> dark, cropped by frame. Lighting: a single radial gradient centred on the miner's lamp (bone → charcoal, opacity
> 0.55), everything beyond 400 px of the lamp falling to charcoal. The reveal: the ventilation path draws on via
> stroke-dashoffset over 0.8 s in bone, arrowhead at the stale corner. Crimson: none (spent on nothing this scene).
> Text overlay: none. Reads at 200 px because the lamp gradient + silhouette is one shape against dark.

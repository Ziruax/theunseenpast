# Traps

Every one of these is a trap the format has already sprung somewhere — in the original two-episode runs, or in
documentary production reality. One entry per trap: **Symptom / Cause / Fix**. Check the list before building an
environment, a figure, a shot, a mix, or a claim.

## Drawing

- **Dark figures vanish on dark scenes.** *Symptom:* a charcoal silhouette disappears against a tunnel or night
  interior; the shot reads as empty parchment. *Cause:* figure and ground at the same end of the palette. *Fix:*
  separate the extremes — a bone or bronze rim on the lit side, or lighten the ground band directly behind the
  figure. Check every dark scene at 200 px (visual check 1).
- **Bronze-on-charcoal is low contrast.** *Symptom:* a small figure or prop in bronze on charcoal disappears at
  playback size. *Cause:* mid-tone against dark. *Fix:* bone rim or a parchment glow region behind the subject;
  keep bronze for mid-ground detail, never for the subject of a dark scene.
- **Unique ids.** *Symptom:* gradients, masks or clip paths bleed between shots or between two copies of the same
  environment in one frame. *Cause:* duplicate SVG ids. *Fix:* every set takes an `id` prop; give each shot its
  own (`s24`), and a different one again if the same environment renders twice in one frame (a blurred copy behind
  a close-up).
- **Furniture needs grounding.** *Symptom:* props float. *Cause:* no contact shadow. *Fix:* an ellipse of charcoal
  at 30–40% opacity where every standing thing meets the floor.
- **Mid-ground figures must sit inside the crop** of every shot that uses the environment, not just the wide.
- **Texture stays faint.** *Symptom:* the parchment layer reads as stains. *Cause:* texture opacity pushed past
  20%. *Fix:* 15–20%, always under the camera group.
- **Nothing bright competes with the subject.** *Symptom:* two lit regions split the eye and the focal point dies.
  *Cause:* second light source left at full strength. *Fix:* one dominant bone region per scene; sub-lights come
  down via gradient, and the single crimson accent (if any) points at the same subject.
- **A grade or filter on a whole shot needs a screen-sized filter box** (`filterUnits="userSpaceOnUse"`, 0..1920 ×
  0..1080): the default box is the content's, and environments draw far past the frame.
- **Hands and props in inserts.** *Symptom:* a prop near an entering arm reads as part of the arm. *Cause:* no
  clear space at the hand. *Fix:* keep a margin round hands; scale an entering arm up hard (a sleeve 100–130 wide
  at 1080p) and enter from the side of frame where the character stands in neighbouring shots.
- **Period clothing is the silhouette.** *Symptom:* figures from different occupations look identical. *Cause:*
  same body shape, no clothing layers. *Fix:* the clothing (apron, cap, coat, collar) IS the character at 200 px;
  check every occupation on the cast sheet.

## Anachronism (the documentary kind of wrong)

- **Pocket watches pre-1600, wristwatches pre-1910s.** *Symptom:* a timepiece in an early-period scene. *Cause:*
  reflex "period prop = pocket watch". *Fix:* bells, whistles, church clocks, knocker-uppers for working-class
  time before the wristwatch.
- **Buttons, zips, machine-made nails.** *Symptom:* modern fastenings on medieval dress; wire nails in an 18th-century
  interior. *Cause:* modern default shapes. *Fix:* toggles/lacing/pins pre-1300; zips never before the 20th century;
  hand-forged rose-head nails pre-1830.
- **Gas and electric light in the wrong decade.** *Symptom:* an electric pendant in an 1838 mill. *Cause:* lighting
  drawn from habit. *Fix:* check the period's actual light source (rushlight, oil, gas from the 1810s–20s street by
  street, electricity last) and make it the scene's light source.
- **Machinery without its power source.** *Symptom:* a factory interior that is just rooms of machines, no shafting.
  *Cause:* steam/belt power not drawn. *Fix:* overhead shafts and belts for steam-era mills, or the machine reads as
  self-powered — an anachronism of implication.
- **Wrong act, right era.** *Symptom:* "THE FACTORY ACT" over a scene about mines. *Cause:* shorthand. *Fix:* name
  the act and year on screen (e.g. "MINES ACT, 1842") — each is short enough for the 4-word overlay limit.
- When in doubt, strip the object out. A sparser set is a smaller failure than a wrong one.

## Research and script

- **OCR-mangled newspaper quotes.** *Symptom:* a "verbatim" 1850s quote with misspellings and broken columns.
  *Cause:* digitised newspapers are OCR'd. *Fix:* check against the page image; if you can't, paraphrase and mark
  it as paraphrase — never print a corrupted quote as verbatim.
- **The number that mutated.** *Symptom:* a death toll that differs between the script and the source. *Cause:*
  taken from a secondary retelling. *Fix:* only priority 1–2 numbers enter the script; keep the source's exact
  wording in `quote_or_excerpt`.
- **Unnamed acts and years.** *Symptom:* "eventually the law changed". *Cause:* the reform never pinned down.
  *Fix:* act, year, what it actually did — and the documented delay between harm and reform (usually decades; that
  delay is often the best line in Act 5).
- **Invented inner life.** *Symptom:* "Thomas must have wept". *Cause:* documentary voice drifts into fiction.
  *Fix:* stakes from evidence only; a composite character carries emotion, flagged as "reconstructed composite",
  in script AND on screen.
- **Overclaiming.** *Symptom:* "universally deadly", "instantly solved". *Cause:* punchy phrasing outrunning the
  source. *Fix:* language matches source strength; historical gate check 6 blocks the render until it does.

## Motion

- **Everything derives from the shot's clock `t`.** *Symptom:* a held or re-timed segment draws different frames,
  or a re-run of the storyboard changes stills. *Cause:* `Math.random` or state inside a shot. *Fix:* pure
  functions of `t` only; scatter with a seeded RNG (`rnd(seed, i)`).
- **Poses snap, they don't morph.** *Symptom:* rubbery in-betweens over 10+ frames. *Cause:* long interpolations.
  *Fix:* 2–4 frames of eased interpolation between pose keys, then hold — the snap is the style.
- **Camera moves don't count as cuts.** *Symptom:* a 4 s slow push graded as a "visual change". *Cause:* counting
  camera motion. *Fix:* a change of composition, shot size, animation state, map state, or highlight counts; a
  push alone does not (see `pacing.md`).
- **Filler cuts.** *Symptom:* the validator passes 82 shots but the middle of Act 3 is six near-identical wides.
  *Cause:* hitting the count instead of carrying information. *Fix:* delete one and give another shot a real
  content change; the anti-pattern note in `pacing.md` is the rule.

## Sound

- **A hit on a word covers the word.** *Symptom:* `mixcheck` flags a spoken moment where an effect comes within
  3 dB of the voice. *Cause:* the effect cued on the word. *Fix:* land illustrative hits in the pause just after
  their word (and move the picture's action with it), or lower the event.
- **Beds bury facts.** *Symptom:* the key statistic is hard to hear under ambience. *Cause:* a bed at short-form
  levels. *Fix:* ambience at −28 to −32 LUFS under voice; beds under evidence reveals lower still.
- **A hit's tail runs into the next word.** *Symptom:* a 0.6 s strike still sounding under the next sentence.
  *Cause:* no fade or end cue. *Fix:* give short hits an `until` at the next shot; time the picture's action into
  the pause.
- **AI voices mispronounce exactly our words.** *Symptom:* "palimpsest" becomes "palm-pisst"; "Haworth" becomes
  "hay-worth"→"how-worth"; place names like Sowerby, Keighley, Marylebone mangled. *Cause:* neural TTS fails on
  British place names and scholarly words. *Fix:* pronunciation pass on every proper noun — phonetic respelling
  for `edge-tts` (correct spelling stays on screen), phoneme tags for ElevenLabs; listen once per name.
- **Levelling is per stem.** *Symptom:* lowering one event made the others louder. *Cause:* the stem is levelled
  as a whole. *Fix:* change balance with per-event gain; change overall room with the stem level; re-run the mix
  check after either.
- **mixcheck's windows are 0.4 s,** longer than most pauses: a flag on a word's last syllable may be a fricative
  tail under a correctly-placed hit. Check that word in 0.1 s windows before moving anything.

## Pipeline

- **Storyboard first. 100 stills is normal.** *Symptom:* a rendered episode that needs a re-draw. *Cause:*
  skipping the board to "save time". *Fix:* a still takes ~2 s and a full board minutes; a 9,000-frame render does
  not. No render until both gates pass.
- **Never cut to an empty frame.** *Symptom:* a flash of blank parchment at a cut. *Cause:* the scene's elements
  animate in from nothing at `t = 0`. *Fix:* something is already on at the shot's first frame — start reveals at
  `t + 3`, not `t − 1`.
- **Cue words can't contain a hyphen or a plus**; cue the next word, or use the explicit time/frame cue forms.
- **Google Fonts need a connection** at render time (`fonts.ts`). *Fix for offline:* put the faces in
  `public/fonts/` and point the config at them.
- **Windows:** the master step shells out to `npx.cmd`; Remotion downloads its own headless Chrome on the first
  render (about 110 MB, once).
- **A 9,000-frame render is a real cost.** *Symptom:* "quick check" full renders burning an hour each. *Cause:*
  using master for iteration. *Fix:* stills and short frame-range drafts only (`stills.mjs <slug> --frames 120
  240`); master once, after both gates.
- **The shot list is the source of truth.** *Symptom:* hand-edits in a component diverge from `shots.json`.
  *Cause:* retiming in code. *Fix:* retime in `shots.json`, re-run the validator and the board; the engine reads
  the JSON frame-by-frame.
- **Keys by name only.** *Symptom:* a key in a log, a script argument, or a committed `.env`. *Cause:* convenience.
  *Fix:* `ELEVENLABS_API_KEY` from the environment or a `.env` above the studio; never print, paste or hardcode it.
  (The default voice needs no key at all.)
- **Credits (ElevenLabs only):** the voice's exact cost is in the account history; sound clips move the account
  counter, which can lag. Re-read before reporting. Edge TTS costs nothing — which is why it is the default.

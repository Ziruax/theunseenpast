# The Unseen Past — scripts

Pipeline helper scripts for a 5-minute (300 s) flat-vector historical documentary episode.
Python 3.9+, stdlib + the three packages in `requirements.txt` (numpy, Pillow, edge-tts).
`ffmpeg`/`ffprobe` must be on PATH; `bun` is optional (it runs the JSON validators).

```
python3 -m pip install -r scripts/requirements.txt
```

## Episode data layout

```
studio/src/episodes/<slug>/     data (Claude + scripts write here)
  research.json   script.json   shots.json   words.json   storyboard.json
  metadata.json   voice.mp3
studio/out/<slug>/              renders and review files
  voice_acts/act-<n>.mp3  voice_report.json  shotlist.md  board/still-<shot_id>.png
  storyboard.jpg  ambience.wav  sfx.wav  sfx_manifest.json  mix.wav
  <slug>-raw.mp4  final.mp4  chapters.txt  report.json  costs.json (ElevenLabs only)
studio/library/sfx/             shared clip library (sfx.py reads it)
pipeline/validate/*.ts          JSON validators, run with bun (optional)
```

Run the scripts from the repo root or anywhere — every script locates the repo relative to
itself. `<slug>` is the episode folder name, e.g. `victorian-chimney-sweeps`.

## The free-voice story

There is no ElevenLabs key on this machine, and none is needed. **Voice defaults to free
Microsoft Edge TTS** (`edge-tts`), voice `en-GB-RyanNeural` — neutral British English, mature,
measured, matching the channel. Edge TTS emits WordBoundary events, which give exact word-level
timings (`words.json`), the same sync source the engine always used. ElevenLabs remains an
optional path: set `ELEVENLABS_API_KEY` (env or a `.env` file) and run voice.py with
`--provider elevenlabs --voice <voice-id>`; its credits are then logged to `costs.json`.
Edge TTS costs report as **0 credits (free Microsoft Edge TTS)** in `voice_report.json`.

## Scripts, in pipeline order

### `unseenpast.py` — orchestrator check (does NOT do research or scripting)
```
python3 scripts/unseenpast.py <slug> --stage research|script|shots|storyboard|metadata|all
```
Checks prerequisites (ffmpeg, ffprobe, numpy, Pillow, edge-tts), validates the stage JSONs
that exist via `pipeline/validate/*.ts`, and prints the next command. Research and script
JSONs are written by Claude at the prompt stages (`pipeline/stage-1-research.md`,
`stage-2-script.md`), not by this script.

### `voice.py` — narration (stage after script)
```
python3 scripts/voice.py <slug> [--voice en-GB-RyanNeural] [--rate +0%] [--gap 1.0]
                               [--provider edge|elevenlabs] [--force]
```
Reads `script.json`; writes `voice.mp3` + `words.json` (word-level timings, act gaps baked in)
+ `out/<slug>/voice_report.json`. Acts are synthesised separately and joined with 0.8–1.2 s
silences (default 1.0) because edge-tts has no SSML breaks. Rate auto-tunes once to 140–150 wpm
unless `--rate` is given.

### `plan.py` — shot list (stage after voice)
```
python3 scripts/plan.py <slug> [--target-dur 3.2]
```
Reads `script.json` (+ `research.json` source ids, `words.json` for real act boundaries);
writes `shots.json` (80–100 shots, ≤4.0 s each, ~30/25/20/15/10% visual_type distribution,
per-environment SFX suggestions) and `out/<slug>/shotlist.md`; runs the `validate-shots.ts`
validator when it and bun exist.

### `stills.mjs` — storyboard stills (run from `studio/`)
```
node scripts/stills.mjs <slug> [--limit N] [--only S012 S013] [--comp StoryboardStills]
                          [--force] [--scale 1]
```
Renders one PNG per shot (`out/<slug>/board/still-<shot_id>.png`) from the `StoryboardStills`
composition (pass `--comp` if yours is named differently), skipping files already on disk,
and writes the `storyboard.json` skeleton with all 11 checks `false`. Re-runs keep any checks
you already set. The stills must then pass both quality gates (`references/self-check.md`).

### `board.py` — contact sheet review
```
python3 scripts/board.py <slug> [--cols 4]
```
Reads the board stills + `shots.json`; writes `out/<slug>/storyboard.jpg` with captions and a
green/red count of fully-passed checks.

### `sfx.py` — documentary sound
```
python3 scripts/sfx.py <slug> [--dry]
```
Builds ambience beds per environment run (mine/factory/street/hospital/home) and sparse action
hits from `shots.json`; writes `ambience.wav` (−30 LUFS), `sfx.wav` (−20 LUFS) and
`sfx_manifest.json`. Library clips are used when they fit; missing beds are **synthesised with
ffmpeg** (filtered noise) and the manifest says so. Music is not generated: drop a curated
`music.wav` into `out/<slug>/` and the master mixes it at −26 LUFS.

### `master.py` — render, mix, master, chapters, report
```
python3 scripts/master.py <slug> [--comp <composition-id>] [--video path] [--skip-render]
```
Renders via `npx remotion render` (or takes `--video`), anchors voice at −17 LUFS and stems at
their spec levels, applies two-pass loudnorm to **−14 LUFS integrated / −1 dBTP**, muxes
`final.mp4`, writes `chapters.txt` (5 act timestamps, `0:00 Cold Open` format) and
`report.json` (measured loudness, duration check, voice provider/cost).

### `mixcheck.py` — loudness validation for any file
```
python3 scripts/mixcheck.py out/<slug>/final.mp4 [--profile master|voice|sfx|ambience|music]
```
Prints LUFS / true peak / LRA and pass-fails against the documentary targets; exit 1 on fail.

### `motiongrid.py` — pacing check
```
python3 scripts/motiongrid.py <slug>
```
Prints per-act shot counts vs the targets (6–8 / 10–12 / 25–30 / 20–25 / 20–25), duration
stats, and the visual_type distribution; exit 1 when off target.

## Worked example

```
python3 scripts/unseenpast.py chimney-boys --stage all        # gates for research + script
python3 scripts/voice.py chimney-boys                          # free edge-tts narration
python3 scripts/plan.py chimney-boys                           # shots.json on the 2-3 s grid
cd studio && node ../scripts/stills.mjs chimney-boys && cd ..  # board stills + storyboard.json
python3 scripts/board.py chimney-boys                          # contact sheet review
python3 scripts/sfx.py chimney-boys                            # beds + sparse hits
python3 scripts/master.py chimney-boys                         # render + mix + master
python3 scripts/mixcheck.py studio/out/chimney-boys/final.mp4  # -14 LUFS, -1 dBTP
python3 scripts/motiongrid.py chimney-boys                     # pacing report
```

## Retired (do not use)

ElevenLabs-by-default, pause tightening, per-action cartoon SFX, the 27-cuts/min short-form
pacing, `wi.py` (replaced by `unseenpast.py`), the seven-beat What If formula.

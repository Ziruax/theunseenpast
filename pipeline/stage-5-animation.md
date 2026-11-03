# Stage 5 — Animation

## Input
- `storyboard.json`
- `shots.json`
- Voiceover audio + word timings

## Task
Render the full 300-second episode at 1920×1080/30fps.

## Steps
1. Sync voice to shot list using word timings
2. Add SFX per shot
3. Add ambience beds per environment
4. Add sparse music at act transitions + legacy
5. Mix to −14 LUFS, −1 dBTP using the studio master script:
   `python3 scripts/master.py <input-mix> <output-mix>` (enforces −14 LUFS integrated / −1 dBTP)
6. Render the MP4 (H.264) with the studio Remotion project:
   `cd studio && bunx remotion render Episode out/<episode_id>.mp4 --props src/episodes/<episode_id>/episode.json`
   (`npx remotion render` works identically when bun is unavailable)
7. Emit `chapters.txt` with the five act start timestamps

## Validation
Before reporting success, re-run the upstream gates to confirm nothing drifted:

```
bun pipeline/validate/validate-shots.ts <path-to-shots.json>
```

The gate must print `PASS`.

## Output
Return path to final MP4 and `chapters.txt` (act timestamps).

## Stop condition
If the render fails, the mix misses −14 LUFS / −1 dBTP, or the MP4 duration is not 300 ± 0.5 seconds, output:
"ANIMATION FAILED — [reason]"
and halt. Do not proceed to thumbnails with a failing master.

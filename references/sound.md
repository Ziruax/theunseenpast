# Audio Standard — Documentary

Documentary audio is quiet. Voice carries the episode; everything else is texture under it. The most common
failure in this genre is a mix built like short-form — loud hits, wall-to-wall music — which buries the facts and
makes the channel sound dishonest even when it isn't.

## Voice

- Default: **free Microsoft Edge TTS via `edge-tts`, voice `en-GB-RyanNeural`** — neutral British English, which
  returns word-boundary timings. Those timings are the sync backbone (`words.json`).
- Optional: ElevenLabs, neutral British English, mature, measured — when `ELEVENLABS_API_KEY` is set and the plan
  permits commercial use.
- Target: 140–150 wpm
- Pauses: 0.8–1.2s at act boundaries; 0.4–0.6s at evidence reveals; 0.2–0.3s natural sentence breaks. Write these
  into the script as punctuation and verify them in the timings; do not cut pauses to manufacture pace (retired).
- No "deep movie-trailer voice" — credibility over drama
- **Pronunciation check required for all historical names and place names.** AI voices mangle exactly the words
  this channel uses: "palimpsest", "Workhouse" in a compound, place names like "Haworth" (HAY-worth), "Sowerby"
  (SOW-bi, as in "sur"), "Keighley" (KEETH-lee), "Marylebone" (MAR-lee-bun), "Cholmondeley" (CHUM-lee). For
  `edge-tts`, respell phonetically in a pronunciation-safe form passed to the synthesizer and keep the correct
  spelling on screen; for ElevenLabs, use its phoneme/tag conventions. Listen to every proper noun once before
  the mix.

## SFX

- **Action SFX** retained (tool strikes, footsteps, door) — but quieter than short-form default; target −18 to
  −22 LUFS during voice. Not every action gets a sound: one per shot maximum, and only when the sound teaches
  something (the pick striking coal; the brush scraping the flue).
- **Ambience beds per location:**

| Location | Bed |
|---|---|
| Mine | low mechanical hum, distant dripping, timber creak |
| Factory | rhythmic machinery, muffled voices |
| Street | distant carts, muffled crowd, wind |
| Hospital | quiet room tone, distant footsteps |
| Home | fire crackle, wind at window |
| Workhouse | shuffling, low murmur, distant bell |
| Sewer | dripping, slow water, hollow echo |
| Railway | hammer on iron, gravel, distant whistle |

- Ambience bed at −28 to −32 LUFS under voice. Crossfade beds over 0.5 s at location changes; never cut a bed hard
  on a cut.

## Music

- **Sparse only** — no wall-to-wall score
- Use at: act transitions (2–4s), legacy section (final 30–60s)
- Style: minimal strings, low drone, single piano note
- Volume: −24 to −28 LUFS under voice
- Never use music to cover weak narration. If a line needs music to feel like it matters, rewrite the line.

## Mix targets

| Stem | Level |
|---|---|
| Master loudness | −14 LUFS integrated |
| True peak | −1 dBTP |
| Voice | −16 to −18 LUFS short-term |
| SFX | −18 to −22 LUFS during voice |
| Ambience | −28 to −32 LUFS |
| Music | −24 to −28 LUFS |

Verify with the loudness/consistency script after the mix; if the integrated figure misses −14 by more than ±0.5
LU, re-master, don't hand-tune stems. Speech is dominant: at no moment in the episode should a stem come within
3 dB of the voice while a word is being spoken.

## Licensing

- ElevenLabs commercial use must be verified per plan
- Edge TTS output: free, but the episode still carries the synthetic-content disclosure
- All SFX and music must be original or licensed
- No sound may imply a specific recorded historical event if it is a modern reconstruction — a voice actor reading
  testimony is fine; a sound presented as the actual event is not

## Worked micro-example

One SFX entry, written the way the shot list carries it:

```json
{
  "shot_id": "S23",
  "sfx": [
    {"cue_s": 67.1, "clip": "pick_strike_coal", "gain": 0.45, "alignment": "onset",
     "note": "lands on the visible impact frame, 2 frames after the word 'coal' ends"}
  ]
}
```

And the balance check that must hold underneath it: the strike peaks at −20 LUFS short-term while the voice sits
at −17 — audible, subordinate, and not covering the word.

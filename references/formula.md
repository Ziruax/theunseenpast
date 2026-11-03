# Five-Act Historical Documentary Formula

Total runtime: 300 seconds. Target word count: 700–850 words at 140–150 wpm (≈2.4 words per second). Write to the
per-act word budgets below — they are how the acts hit their screen times without voice-tightening tricks (retired).

## The acts

### Act 1 — Cold Open (0:00–0:20) — ~48 words (40–55)

**Purpose:** Hook with a documented danger, contradiction, or unsettling consequence.

**Rules:**
- No channel intro, no logo, no "welcome back"
- Start mid-action or mid-fact
- Every claim must carry a source ID `[S1]` etc.
- 6–8 visual cuts in 20 seconds

**Example opening line:** "In 1875, a twelve-year-old boy named George Brewster was sent into a chimney in
Cambridge. He did not come out."

### Act 2 — Context (0:20–1:00) — ~95 words (80–110)

**Purpose:** Establish person, place, period, and the central question the episode answers.

**Rules:**
- Introduce exactly ONE central question
- Use a composite character only if explicitly flagged ("reconstructed composite")
- 10–12 visual cuts
- End with the question stated plainly

**Example question:** "Why did children keep climbing chimneys for nearly a century after Britain first tried to
stop them?"

### Act 3 — How It Worked (1:00–2:30) — ~220 words (190–250)

**Purpose:** Make the process understandable through visual explanation. This is the longest act and the visual
centre of the episode.

**Rules:**
- Diagrams, tool close-ups, environment shots
- 25–30 visual cuts
- Every mechanical or tool animation must be source-backed (each shot's `source_id` points at evidence for the
  mechanism, not just the scene)
- No lists — explain as a sequence of actions: "The flue narrows here. The boy scrapes the soot from his knees and
  climbs on."

### Act 4 — The Hidden Cost (2:30–3:45) — ~180 words (150–210)

**Purpose:** Reveal practical risks, incentives, and consequences with evidence.

**Rules:**
- Include at least one primary-source quotation or statistic on screen (the document-highlight shot)
- 20–25 visual cuts
- Distinguish documented consequence from reconstruction
- Never invent quotations — paraphrase unless verbatim source exists

### Act 5 — Turning Point & Legacy (3:45–5:00) — ~180 words (150–210)

**Purpose:** What changed, what didn't, and why this still matters.

**Rules:**
- Cite the specific reform, law, invention, or resistance event (name and year, not "eventually the law changed")
- Acknowledge delay or failure where documented — reform usually lagged the harm by decades
- 20–25 visual cuts
- End on a historical consequence, not a moral lecture

Word budgets sum to ~723; the band 700–850 gives room for the voice's natural pace. Count before the voice call —
800 words at 145 wpm is 331 s, which will not fit 300 s of picture.

## Storytelling rules (non-negotiable)

1. Open with the subject, not the channel
2. Introduce a new fact, reversal, or visual explanation every 20–30 seconds
3. Use emotional stakes without inventing private thoughts — no "he must have felt", no inner monologue
4. Never fabricate direct quotations
5. Distinguish consensus, disputed claims, and reconstruction — say "the records suggest" when they only suggest
6. End with consequence, not platitude

## Choosing a topic

- Dangerous jobs and hidden human costs: chimney sweeps, match workers, miners, sewer hunters, matchgirls, mill
  workers, railway navvies, radium dial painters, workhouse labour, tanners, mudlarks, knocker-uppers.
- The episode needs a turning point that is *documented*: an act of parliament, a strike, an invention, a
  prosecution. A topic with no recorded consequence cannot fill Act 5.
- Do not remake another channel's episode. The subject is history (shared); the framing, the central question and
  the composite characters are ours. Search first; if a major channel has the identical episode with the identical
  question, change the question.

## Worked micro-example

One act-1 shot row and its citation, end to end:

```json
{
  "shot_id": "S03", "start_s": 6.5, "end_s": 9.0, "duration_s": 2.5,
  "act": 1, "visual_type": "new_scene",
  "description": "Narrow chimney flue interior, soot falling; small climbing silhouette stops at a bend above",
  "characters": ["climbing_boy_composite"], "environment": "chimney_flue",
  "camera_move": "slow_push", "sfx": ["soot_fall", "brick_scrape"], "source_id": "S1"
}
```

Narration under it: `"In 1875, a twelve-year-old boy named George Brewster was sent into a chimney in Cambridge [S1]."`
Citation: `{"text_span": "In 1875, a twelve-year-old boy named George Brewster", "source_id": "S1"}`. One claim,
one source, one shot.

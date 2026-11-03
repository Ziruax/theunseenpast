# Thumbnail Standard

Two concepts per episode, rendered by the thumbnail compositor (`studio/src/hist`, 1280×720 PNG). The thumbnail is
the channel's first sentence — it must be honest, high-contrast, and legible at the size a phone actually shows
it (about 168×94 px in a subscription feed).

## Rules

- Two concepts per episode
- One dominant subject per thumbnail
- High contrast between subject and background
- 0–4 words of large text (Inter Bold 140–180px), added in code, not baked into illustration
- Title and thumbnail must complement, not repeat
- Flat-vector style matching the episode (same five tokens, same parchment feel)
- No fabricated historical photographs
- No misleading claims (thumbnail must accurately represent the video's subject)

## Concept types (use one per concept, two different types per episode)

| Type | Description | Example |
|---|---|---|
| A — Human stakes | One vulnerable subject, one obvious threat | Child silhouette facing a dark chimney |
| B — Dangerous object | A recognizable tool or substance, large | Match dipped in phosphorus, glowing |
| C — Immersive environment | Large oppressive setting with human scale reference | Mine tunnel with one small figure |
| D — Forgotten world | Dense detail but one dominant focal point | Crowded workhouse interior, one face |

Pick the two types that contrast most with each other (A+B, C+D) rather than two near-identical
environment shots. Type C is the default fallback for this channel; the mine tunnel, the flue, and the workhouse
yard are its natural subjects.

## Text examples

| Video title | Thumbnail words |
|---|---|
| Why Victorian Children Were Forced to Climb Chimneys | TRAPPED INSIDE |
| The Match Factory Workers Poisoned by Their Own Jobs | POISONED AT WORK |
| What It Was Really Like to Work in a Victorian Coal Mine | UNDERGROUND |
| What Life Was Like Inside a Victorian Workhouse | NO WAY OUT |
| The Radium Girls: The Workers Poisoned by Glowing Paint | THE GLOWING POISON |

The pattern: the thumbnail names the *condition*, the title names the *question*. Together they say more than
either alone.

## What to avoid

- Starting every title with "The Horrifying Truth About..."
- Repeating the title verbatim in the thumbnail
- More than 4 words
- Arrows, circles, or emoji
- Shocked faces / clickbait expressions — this channel's figures have dot eyes and line mouths by design, and a
  grin-and-point-face thumbnail would look borrowed from another genre and dishonest beside the film
- Yellow highlight boxes behind text (the palette has no yellow; use bone on charcoal, or a crimson underline)
- Text across the bottom-right corner — YouTube overlays the duration stamp there

## Legibility floor

Test every concept at 168×94 px before shipping. If the headline or the subject dies at that size, increase the
subject's frame coverage (a closer crop) or cut a word — do not add a stroke or a drop shadow heavy enough to
change the style.

## Worked micro-example

One concept rationale line, as returned with the PNGs:

```
thumbnail-1.png — Type A (human stakes): single climbing-boy silhouette in charcoal, 60% of frame height,
facing a flue opening rendered as pure charcoal void; bone headline "TRAPPED INSIDE" (160px Inter Bold) in the
top third. Rationale: the void is the threat; the subject is the scale. Complements the title, which asks WHY,
without repeating it. Verified legible at 168×94.
```

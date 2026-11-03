# Palette & Typography Tokens

Five tokens only. Everything in the frame — figures, architecture, gradients, light, text — is one of these five
or a blend of two. The discipline is the style: a limited palette is what makes 80–100 scenes read as one film.

In code the tokens live in `studio/src/hist/palette.tsx`:

```ts
export const PAL = {
  charcoal:  "#20201D",
  parchment: "#D5C5A5",
  bronze:    "#9B7445",
  crimson:   "#83392F",
  bone:      "#F0E8D8",
} as const;

export function mix(a: string, b: string, t: number): string; // linear blend, clamped 0..1
export const HISTFONT = { title: "Cinzel", body: "Inter" };
```

`mix()` is the only way to make an intermediate colour. If a gradient needs three stops, blend two tokens at
`t = 0.5` for the middle stop — never introduce a hex that is not a token or a mix of two tokens.

## Colours

| Token | Hex | Usage |
|---|---|---|
| `--charcoal` | #20201D | Primary dark, outlines, backgrounds |
| `--parchment` | #D5C5A5 | Paper base, mid-tones, skin |
| `--bronze` | #9B7445 | Warm highlights, metal, wood |
| `--crimson` | #83392F | Accent only — blood, fire, danger, one focal element per scene |
| `--bone` | #F0E8D8 | Lightest highlights, text |

## Rules

- Crimson is an **accent**, never a fill. Maximum one crimson element per scene.
- No gradients outside the five-colour family. If a gradient is needed, blend two tokens.
- Skin tones: parchment base with bronze shadow, bone highlight.
- Contrast discipline: figure silhouettes should sit at the extremes — charcoal against parchment/bone, or bone
  against charcoal. Bronze-on-charcoal at full-frame sizes (a 60 px-tall figure) drops below readable contrast;
  rim the figure in bone or lighten the ground behind it.
- One focal point per scene: the brightest bone region and the crimson accent (if used) must be the same subject
  or adjacent to it. Two competing bright regions split the read.

## Typography

| Font | Weight | Usage |
|---|---|---|
| Cinzel | SemiBold | Act titles, channel branding, thumbnail headlines |
| Inter | Bold | On-screen labels, dates, thumbnail subtext |
| Inter | Regular | Source captions, chapter markers |

Fonts load from Google Fonts at render time via the engine's `fonts.ts` (see `references/traps.md` for the offline
case). Never bake text into an SVG illustration; all text is a code component.

## Sizes (1920×1080)

- Act title: 96px Cinzel SemiBold
- On-screen label: 48px Inter Bold
- Source caption: 28px Inter Regular
- Thumbnail headline: 140–180px Inter Bold (or Cinzel SemiBold for brand consistency) on a 1280×720 canvas

Overlay legibility floor: any label must survive 50% playback scaling (≈960×540). At 28px Regular that means
short strings on a dark scrim; if a caption fights the illustration, add a charcoal pill at 70% opacity behind it.

## Worked micro-example

One document-highlight scene, palette-contracted:

- Base: `ParchmentBase` (parchment at full opacity, texture layer at 0.18)
- Report page: parchment with charcoal text strokes, page edge shadow = `mix(charcoal, parchment, 0.75)`
- The highlighted clause: crimson underline (2 px stroke) + `mix(crimson, parchment, 0.85)` wash behind the line —
  the scene's single crimson element
- Caption below, in code: `"1842 COMMISSION REPORT"`, 28px Inter Regular on a charcoal pill at 70% opacity
- Anywhere else crimson wanted to appear (a fire in the margin, a red wax seal): charcoal or bronze instead

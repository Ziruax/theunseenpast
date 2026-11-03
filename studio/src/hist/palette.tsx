// The palette: five colours, exactly, and nothing else. Every fill, stroke and gradient stop in the hist/
// system resolves to one of these tokens (or a `mix` of two of them). Crimson is the accent — at most one
// crimson element per scene, enforced by discipline at the shot level, not by code.
//
// `mix(a, b, t)` interpolates two hex colours so shading stays inside the palette family (an engraved edge,
// a fold line, a darker floor tone) instead of drifting into hues the channel never uses.

export const PAL = {
  charcoal: '#20201D', // the world's ink: silhouettes, lines, shadow
  parchment: '#D5C5A5', // the ground everything is drawn on: walls, paper, skin patch
  bronze: '#9B7445', // detail and wear: buttons, tool hafts, rules, mid tones
  crimson: '#83392F', // THE accent: one element per scene — a highlight, a flame, a danger
  bone: '#F0E8D8', // light: paper highlights, lamp flames, text on dark
} as const;

export type PaletteKey = keyof typeof PAL;

/** Ordered token list for swatch sheets. */
export const PALETTE: { name: PaletteKey; hex: string; note: string }[] = [
  { name: 'charcoal', hex: PAL.charcoal, note: 'ink, silhouette, shadow' },
  { name: 'parchment', hex: PAL.parchment, note: 'ground, walls, paper' },
  { name: 'bronze', hex: PAL.bronze, note: 'detail, wear, mid tone' },
  { name: 'crimson', hex: PAL.crimson, note: 'accent — one per scene' },
  { name: 'bone', hex: PAL.bone, note: 'light, text on dark' },
];

/** Interpolate two palette hexes: t = 0 gives a, t = 1 gives b. Used for every in-between tone. */
export const mix = (a: string, b: string, t: number): string => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (sh: number) => Math.round(((pa >> sh) & 255) + (((pb >> sh) & 255) - ((pa >> sh) & 255)) * t);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
};

// The two faces of the documentary: Cinzel carries act titles (engraved, period), Inter carries every
// label, caption and UI string. Loaded in engine/fonts.ts.
export const HISTFONT = {
  title: 'Cinzel',
  label: 'Inter',
} as const;

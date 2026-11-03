// The studio's settings. The documentary renders at this size and frame rate; the thumbnail composition
// is fixed at 1280 x 720 (see Root.tsx and src/thumbnail/).
export const STUDIO = {
  fps: 30,
  width: 1920,
  height: 1080,
  /** The display face for titles. Cinzel is the channel's act-title face (loaded in engine/fonts.ts). */
  titleFont: 'Cinzel',
} as const;

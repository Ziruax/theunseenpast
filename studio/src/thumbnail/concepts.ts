// Thumbnail concepts: the channel ships two PNGs per episode (stage 6 of the pipeline). Four templates,
// two picked per episode — usually one human-stakes shot and one dangerous-object shot. A concept decides
// where the headline sits, how big the subject reads, and what the framing emphasises. The layout stays
// within the palette and the flat-vector rules: one dominant subject, high contrast, text in the top or
// bottom third only.

export type ThumbConcept = 'A_human_stakes' | 'B_dangerous_object' | 'C_immersive_environment' | 'D_forgotten_world';

export type ConceptLayout = {
  name: string;
  recipe: string;
  headline: 'top' | 'bottom';
  subjectScale: number; // multiply the subject's own scale
  subjectX: number; // 1280 x 720 frame
  subjectY: number;
  vignette: number; // 0..1, how hard the edges darken behind the text
};

export const CONCEPTS: Record<ThumbConcept, ConceptLayout> = {
  A_human_stakes: {
    name: 'A — Human stakes',
    recipe: 'One figure, waist up or full body, caught in the danger. Headline over their head or beneath their feet.',
    headline: 'bottom',
    subjectScale: 1.15,
    subjectX: 640,
    subjectY: 470,
    vignette: 0.55,
  },
  B_dangerous_object: {
    name: 'B — Dangerous object',
    recipe: 'The tool, machine or document that did the harm, huge and central. The figure is small or absent.',
    headline: 'top',
    subjectScale: 1.3,
    subjectX: 640,
    subjectY: 430,
    vignette: 0.6,
  },
  C_immersive_environment: {
    name: 'C — Immersive environment',
    recipe: 'A full environment set with the figure small in it, so the world reads as huge and hostile.',
    headline: 'bottom',
    subjectScale: 0.85,
    subjectX: 640,
    subjectY: 520,
    vignette: 0.5,
  },
  D_forgotten_world: {
    name: 'D — Forgotten world',
    recipe: 'A map or document plate with one region burning crimson — the story is the place itself.',
    headline: 'top',
    subjectScale: 1.0,
    subjectX: 640,
    subjectY: 400,
    vignette: 0.45,
  },
};

/** The default pair the pipeline renders: human stakes first, dangerous object second. */
export const TWO_CONCEPTS: [ThumbConcept, ThumbConcept] = ['A_human_stakes', 'B_dangerous_object'];

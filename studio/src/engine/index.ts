// Everything an episode builds with, in one import: import { HistScene, Figure, PAL, Documentary, ... } from '../engine';
// The engine holds the clock (anim, episode), the typefaces (fonts) and the flat-vector historical system
// (hist/). The old stick-figure modules are gone.
export * from './anim';
export * from './fonts';
export * from './episode';
export * from '../hist';

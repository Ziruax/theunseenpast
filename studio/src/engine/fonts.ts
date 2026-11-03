import { loadFont as loadCinzel } from '@remotion/google-fonts/Cinzel';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { STUDIO } from '../studio.config';

// The two faces of The Unseen Past, loaded at render time from Google Fonts (a connection is needed):
// Cinzel 600/700 carries the act titles and every display line; Inter 400/600/700 carries labels,
// captions and anything else that reads. The documentary never uses another face.

loadCinzel('normal', { weights: ['600', '700'], subsets: ['latin'] });
loadInter('normal', { weights: ['400', '600', '700'], subsets: ['latin'] });

export const FONT = {
  title: STUDIO.titleFont,
  label: 'Inter',
  ui: 'Inter',
};

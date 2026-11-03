import React from 'react';
import { AbsoluteFill } from 'remotion';
import { PAL, mix } from '../hist/palette';
import { ParchmentBase } from '../hist/parchment';
import { Figure } from '../hist/figures';
import { Environment } from '../hist/environments';
import { Prop } from '../hist/objects';
import { MapBritain } from '../hist/documents';
import { GROUND } from '../hist/environments';
import { Headline } from './Headline';
import { CONCEPTS, TWO_CONCEPTS, type ThumbConcept } from './concepts';

// The thumbnail composition: 1280 x 720, one frame, one dominant subject, palette-matched. `concept` picks
// the template (see concepts.ts); `headline` is the overlay text; `subject` picks what stands in the frame.
// Render the default pair with:
//   npx remotion still src/index.ts Thumbnail out/thumb-A.png --props='{"concept":"A_human_stakes"}'

export type ThumbSubject =
  | { kind: 'figure'; occupation: Parameters<typeof Figure>[0]['occupation']; pose: Parameters<typeof Figure>[0]['pose']; carry?: Parameters<typeof Figure>[0]['carry'] }
  | { kind: 'environment'; name: Parameters<typeof Environment>[0]['name'] }
  | { kind: 'prop'; name: Parameters<typeof Prop>[0]['kind'] }
  | { kind: 'map'; regions: { name: 'scotland' | 'north' | 'midlands' | 'wales' | 'london'; state: 'idle' | 'active' | 'dim' }[] };

/** The vignette that seats the headline: palette-only, a charcoal wash that darkens toward the text edge. */
const ThumbVignette: React.FC<{ y: 'top' | 'bottom'; strength: number }> = ({ y, strength }) => (
  <svg width={1280} height={720} viewBox="0 0 1280 720" style={{ position: 'absolute', inset: 0 }}>
    <defs>
      <radialGradient id="thumbVig" cx="50%" cy={y === 'top' ? '100%' : '0%'} r="95%">
        <stop offset="0%" stopColor={PAL.charcoal} stopOpacity={0} />
        <stop offset="55%" stopColor={PAL.charcoal} stopOpacity={0.1 * strength} />
        <stop offset="100%" stopColor={PAL.charcoal} stopOpacity={strength} />
      </radialGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#thumbVig)" />
  </svg>
);

export const Thumbnail: React.FC<{ concept?: ThumbConcept; headline?: string; subject?: ThumbSubject }> = ({
  concept = TWO_CONCEPTS[0],
  headline = 'THE BOYS UP THE FLUE',
  subject = { kind: 'figure', occupation: 'climbing_boy', pose: 'climbing', carry: 'brush' },
}) => {
  const layout = CONCEPTS[concept];
  const y = layout.headline;
  return (
    <AbsoluteFill style={{ backgroundColor: PAL.charcoal }}>
      <svg width={1280} height={720} viewBox="0 0 1280 720">
        <ParchmentBase id="thumb" o={0.5} w={1280} h={720} />
        <g transform={`translate(${layout.subjectX - 640} ${layout.subjectY - 400}) scale(${layout.subjectScale}) translate(-640 -400)`}>
          {subject.kind === 'figure' ? <Figure occupation={subject.occupation} pose={subject.pose} carry={subject.carry} x={640} y={420} scale={1.6} exp="strain" t={0} /> : null}
          {subject.kind === 'environment' ? (
            <g>
              <rect width={1280} height={720} fill={mix(PAL.parchment, PAL.charcoal, 0.2)} />
              <g transform="scale(0.667)">
                <Environment name={subject.name} id="thumbenv" />
                <Figure occupation="climbing_boy" pose="standing" x={640} y={GROUND[subject.name] - 166 * 0.62} scale={0.9} />
              </g>
            </g>
          ) : null}
          {subject.kind === 'prop' ? (
            <g transform="translate(640 520) scale(2.6)">
              <Prop kind={subject.name} x={0} y={0} />
            </g>
          ) : null}
          {subject.kind === 'map' ? <MapBritain id="thumbmap" x={640} y={330} s={0.55} regions={subject.regions} /> : null}
        </g>
        <ThumbVignette y={y} strength={layout.vignette} />
        <Headline text={headline} y={y} />
      </svg>
    </AbsoluteFill>
  );
};

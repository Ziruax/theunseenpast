import React from 'react';
import { PAL, mix } from './palette';

// Documents and maps: the evidence layer. A letter, an act of Parliament or a report is drawn as a paper
// sheet with a title, ruled lines and a seal, and any one line can be HIGHLIGHTED — a crimson rule that
// draws itself along the line via stroke-dashoffset over 0.5–1.0 s, the genre's only allowed reveal for
// text. Maps come as stylised Britain and London plates whose named regions flip between idle, active
// (the crimson accent) and dim. All inserts are laid into the scene at x, y with a scale and tilt.

const DOC_W = 560;
const DOC_H = 700;

/** A period document. `highlight` (0-based line index) draws a crimson rule along that line starting at
*  frame `highlightAt` of the shot clock, taking 24 frames (0.8 s) to draw, then holds. Acts get a bronze
*  seal and a heavier header; letters get a fold crease; reports get a rule under the title. */
export const PeriodDocument: React.FC<{
  kind: 'letter' | 'act' | 'report';
  id: string;
  x: number;
  y: number;
  s?: number;
  rot?: number;
  title?: string;
  lines?: number;
  highlight?: number;
  highlightAt?: number;
  t?: number;
}> = ({ kind, id, x, y, s = 1, rot = 0, title, lines = 9, highlight, highlightAt = 0, t = 0 }) => {
  const paper = mix(PAL.bone, PAL.parchment, 0.35);
  const edge = mix(PAL.parchment, PAL.charcoal, 0.2);
  const ink = mix(PAL.charcoal, PAL.parchment, 0.12);
  const hl = highlight !== undefined ? Math.min(1, Math.max(0, (t - highlightAt) / 24)) : 0;
  const lineY = (i: number) => 150 + i * ((DOC_H - 230) / Math.max(1, lines));
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <rect x={10} y={14} width={DOC_W} height={DOC_H} fill={mix(PAL.charcoal, PAL.parchment, 0.3)} opacity={0.35} />
      <rect x={0} y={0} width={DOC_W} height={DOC_H} rx={4} fill={paper} stroke={edge} strokeWidth={3} />
      {kind === 'letter' ? <path d={`M 0 210 L ${DOC_W} 210`} stroke={edge} strokeWidth={1.5} opacity={0.5} /> : null}
      {/* the header block */}
      <text x={DOC_W / 2} y={78} textAnchor="middle" fontFamily="Cinzel" fontWeight={700} fontSize={kind === 'act' ? 40 : 34} letterSpacing={3} fill={PAL.charcoal}>
        {(title ?? (kind === 'act' ? 'AN ACT' : kind === 'letter' ? 'A LETTER' : 'REPORT')).slice(0, 18)}
      </text>
      {kind === 'act' ? <path d={`M 90 100 L ${DOC_W - 90} 100`} stroke={PAL.bronze} strokeWidth={3} /> : null}
      {kind === 'report' ? <path d={`M 90 100 L ${DOC_W - 90} 100`} stroke={ink} strokeWidth={2} opacity={0.6} /> : null}
      {/* the ruled body: every line is an ink bar of a hand-set width */}
      {Array.from({ length: lines }).map((_, i) => (
        <rect key={i} x={70} y={lineY(i) - 7} width={i % 5 === 4 ? 300 : 420} height={9} rx={4.5} fill={ink} opacity={0.72} />
      ))}
      {/* the highlight: a crimson rule that draws along the chosen line */}
      {highlight !== undefined ? (
        <g>
          <rect x={62} y={lineY(highlight) - 18} width={436} height={36} fill={PAL.crimson} opacity={0.1 * hl} />
          <path
            d={`M 62 ${lineY(highlight) + 16} L 498 ${lineY(highlight) + 16}`}
            stroke={PAL.crimson}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={436}
            strokeDashoffset={436 * (1 - hl)}
          />
        </g>
      ) : null}
      {/* the seal for acts, the signature rule for letters */}
      {kind === 'act' ? (
        <g transform={`translate(${DOC_W - 110} ${DOC_H - 110})`}>
          <circle r={44} fill={mix(PAL.bronze, PAL.charcoal, 0.25)} />
          <circle r={44} fill="none" stroke={PAL.bronze} strokeWidth={4} />
          <circle r={30} fill="none" stroke={mix(PAL.bone, PAL.bronze, 0.4)} strokeWidth={2} opacity={0.7} />
        </g>
      ) : (
        <path d={`M ${DOC_W - 250} ${DOC_H - 80} q 60 -34 120 -6 q 60 26 130 -14`} stroke={ink} strokeWidth={4} fill="none" opacity={0.75} />
      )}
      <defs>
        <filter id={`${id}-docgrain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.25" numOctaves={2} seed={31} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.12  0 0 0 0 0.12  0 0 0 0 0.11  0 0 0 0.08 0" />
        </filter>
      </defs>
      <rect width={DOC_W} height={DOC_H} rx={4} filter={`url(#${id}-docgrain)`} />
    </g>
  );
};

// The maps: stylised plates, not cartography. Regions are named slots; `active` fills the region crimson
// (the scene's one accent), `dim` sinks it toward charcoal, `idle` leaves the parchment ground.

export const BRITAIN_REGIONS = ['scotland', 'north', 'midlands', 'wales', 'london'] as const;
export type BritainRegion = (typeof BRITAIN_REGIONS)[number];
export const LONDON_REGIONS = ['east_end', 'city', 'west_end', 'southwark'] as const;
export type LondonRegion = (typeof LONDON_REGIONS)[number];

export type RegionState = 'idle' | 'active' | 'dim';

const regionFill = (state: RegionState) => (state === 'active' ? PAL.crimson : state === 'dim' ? mix(PAL.parchment, PAL.charcoal, 0.45) : mix(PAL.bone, PAL.parchment, 0.4));

/** The Britain plate: coastline, a few named regions with state fills, labels in Inter. */
export const MapBritain: React.FC<{ id: string; x: number; y: number; s?: number; regions: { name: BritainRegion; state: RegionState }[] }> = ({ id, x, y, s = 1, regions }) => {
  const state = (name: BritainRegion) => regions.find((r) => r.name === name)?.state ?? 'idle';
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <filter id={`${id}-mapgrain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.2" numOctaves={2} seed={11} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.12  0 0 0 0 0.12  0 0 0 0 0.11  0 0 0 0.07 0" />
        </filter>
      </defs>
      {/* the sea */}
      <rect x={-320} y={-420} width={900} height={1080} fill={mix(PAL.parchment, PAL.charcoal, 0.18)} />
      <path
        d="M 60 -380 L 150 -340 L 190 -240 L 140 -160 L 210 -80 L 170 40 L 230 140 L 170 250 L 210 340 L 120 400 L 20 430 L -60 390 L -20 300 L -90 220 L -30 130 L -80 40 L -30 -60 L -80 -160 L -20 -260 L -40 -340 Z"
        fill={mix(PAL.bone, PAL.parchment, 0.4)}
        stroke={mix(PAL.charcoal, PAL.parchment, 0.2)}
        strokeWidth={5}
      />
      {/* regions (crude slots that tile the island) */}
      <g stroke={mix(PAL.charcoal, PAL.parchment, 0.25)} strokeWidth={3}>
        <path d="M -40 -260 L 140 -240 L 150 -160 L 60 -110 L -70 -140 Z" fill={regionFill(state('scotland'))} />
        <path d="M -70 -140 L 60 -110 L 170 -40 L 60 30 L -80 20 Z" fill={regionFill(state('north'))} />
        <path d="M -80 20 L 60 30 L 130 120 L 40 190 L -60 160 Z" fill={regionFill(state('midlands'))} />
        <path d="M -60 160 L 40 190 L 30 280 L -60 300 L -90 220 Z" fill={regionFill(state('wales'))} />
        <path d="M 60 190 L 170 200 L 150 300 L 40 300 Z" fill={regionFill(state('london'))} />
      </g>
      {/* labels */}
      <g fontFamily="Inter" fontWeight={600} fontSize={26} fill={mix(PAL.charcoal, PAL.parchment, 0.15)} textAnchor="middle">
        <text x={30} y={-190}>SCOTLAND</text>
        <text x={10} y={-50}>NORTH</text>
        <text x={10} y={110}>MIDLANDS</text>
        <text x={-30} y={250}>WALES</text>
        <text x={120} y={250}>LONDON</text>
      </g>
      <rect x={-320} y={-420} width={900} height={1080} filter={`url(#${id}-mapgrain)`} />
    </g>
  );
};

/** The London plate: the Thames loop, the banks, named districts with state fills. */
export const MapLondon: React.FC<{ id: string; x: number; y: number; s?: number; regions: { name: LondonRegion; state: RegionState }[] }> = ({ id, x, y, s = 1, regions }) => {
  const state = (name: LondonRegion) => regions.find((r) => r.name === name)?.state ?? 'idle';
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <filter id={`${id}-lgrain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.2" numOctaves={2} seed={23} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.12  0 0 0 0 0.12  0 0 0 0 0.11  0 0 0 0.07 0" />
        </filter>
      </defs>
      <rect x={-420} y={-320} width={980} height={720} fill={mix(PAL.bone, PAL.parchment, 0.4)} />
      {/* the Thames, west to east */}
      <path
        d="M -360 -40 Q -180 60 -40 10 Q 90 -40 150 60 Q 200 150 320 130 Q 420 115 500 190"
        stroke={mix(PAL.charcoal, PAL.bronze, 0.35)}
        strokeWidth={54}
        fill="none"
        strokeLinecap="round"
        opacity={0.85}
      />
      <path
        d="M -360 -40 Q -180 60 -40 10 Q 90 -40 150 60 Q 200 150 320 130 Q 420 115 500 190"
        stroke={mix(PAL.parchment, PAL.charcoal, 0.05)}
        strokeWidth={40}
        fill="none"
        opacity={0.5}
      />
      {/* districts as slots either bank */}
      <g stroke={mix(PAL.charcoal, PAL.parchment, 0.25)} strokeWidth={3}>
        <rect x={-260} y={-230} width={240} height={170} rx={8} fill={regionFill(state('west_end'))} />
        <rect x={10} y={-250} width={190} height={170} rx={8} fill={regionFill(state('city'))} />
        <rect x={-40} y={90} width={260} height={170} rx={8} fill={regionFill(state('southwark'))} />
        <rect x={240} y={-160} width={250} height={200} rx={8} fill={regionFill(state('east_end'))} />
      </g>
      <g fontFamily="Inter" fontWeight={600} fontSize={30} fill={mix(PAL.charcoal, PAL.parchment, 0.15)} textAnchor="middle">
        <text x={-140} y={-130}>WEST END</text>
        <text x={105} y={-150}>CITY</text>
        <text x={90} y={190}>SOUTHWARK</text>
        <text x={365} y={-50}>EAST END</text>
      </g>
      <rect x={-420} y={-320} width={980} height={720} filter={`url(#${id}-lgrain)`} />
    </g>
  );
};

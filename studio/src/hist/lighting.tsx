import React from 'react';
import { PAL, mix } from './palette';

// Lighting as SVG gradients only: a VectorGradient is the primitive (radial or linear, palette colours at
// both stops), a LightSource draws the fixture itself (lamp, window, fire, candle) plus its warm wash, and
// Chiaroscuro lays the shadow — a full-frame gradient that falls away from the light's position. Direction
// logic is the genre's: window light rakes from the side, lamp light falls from above, candle light comes
// from BELOW the face, fire from its hearth. No bloom, no glow filters, no lens flare — gradients only.

/** A gradient def. Give it a unique `id` and reference it with `url(#id)`. Both stops are palette hexes. */
export const VectorGradient: React.FC<{
  id: string;
  kind: 'radial' | 'linear';
  from: string;
  to: string;
  fromOpacity?: number;
  toOpacity?: number;
  cx?: number | string;
  cy?: number | string;
  r?: number | string;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}> = ({ id, kind, from, to, fromOpacity = 1, toOpacity = 1, cx = '50%', cy = '50%', r = '50%', x1 = 0, y1 = 0, x2 = 0, y2 = 1 }) => (
  <defs>
    {kind === 'radial' ? (
      <radialGradient id={id} cx={cx} cy={cy} r={r}>
        <stop offset="0%" stopColor={from} stopOpacity={fromOpacity} />
        <stop offset="100%" stopColor={to} stopOpacity={toOpacity} />
      </radialGradient>
    ) : (
      <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
        <stop offset="0%" stopColor={from} stopOpacity={fromOpacity} />
        <stop offset="100%" stopColor={to} stopOpacity={toOpacity} />
      </linearGradient>
    )}
  </defs>
);

export type LightKind = 'lamp' | 'window' | 'fire' | 'candle';

/** The fixture and its warm wash. (x, y) is the light's origin in world pixels. The flame flickers gently
*  with `t` for fire and candle (a two-frame shimmer, never a particle effect); window and lamp hold still. */
export const LightSource: React.FC<{ kind: LightKind; x: number; y: number; id: string; intensity?: number; t?: number }> = ({ kind, x, y, id, intensity = 0.6, t = 0 }) => {
  const warm = mix(PAL.bone, PAL.parchment, 0.4);
  const flicker = kind === 'fire' || kind === 'candle' ? 1 + 0.08 * Math.sin(t * 0.7) + 0.05 * Math.sin(t * 1.9) : 1;
  return (
    <g>
      <VectorGradient id={`${id}-wash`} kind="radial" from={warm} to={warm} fromOpacity={0.3 * intensity} toOpacity={0} r="50%" />
      {kind === 'window' ? (
        // a tall sash window: two bone panes in a charcoal frame, mullions cross it
        <g transform={`translate(${x} ${y})`}>
          <rect x={-70} y={-150} width={140} height={300} rx={4} fill={PAL.bone} opacity={0.85} />
          <rect x={-78} y={-158} width={156} height={316} fill="none" stroke={PAL.charcoal} strokeWidth={9} />
          <path d="M 0 -158 L 0 158 M -78 -8 L 78 -8" stroke={PAL.charcoal} strokeWidth={6} />
        </g>
      ) : null}
      {kind === 'lamp' ? (
        // an oil lamp hung or held: bronze fittings, a bone flame
        <g transform={`translate(${x} ${y})`}>
          <path d="M -10 -26 L 0 -38 L 10 -26" stroke={PAL.charcoal} strokeWidth={4} fill="none" />
          <rect x={-16} y={-26} width={32} height={8} rx={2} fill={mix(PAL.bronze, PAL.charcoal, 0.3)} />
          <path d="M -13 -18 L 13 -18 L 9 26 L -9 26 Z" fill={mix(PAL.charcoal, PAL.parchment, 0.1)} stroke={PAL.charcoal} strokeWidth={3} />
          <path d={`M 0 12 Q ${-7 * flicker} 0 0 ${-14 * flicker} Q ${7 * flicker} 0 0 12 Z`} fill={PAL.bone} opacity={0.95} />
        </g>
      ) : null}
      {kind === 'fire' ? (
        // a hearth: coal glow, two bone tongues of flame
        <g transform={`translate(${x} ${y})`}>
          <path d="M -46 22 L 46 22 L 38 34 L -38 34 Z" fill={mix(PAL.charcoal, PAL.bronze, 0.4)} />
          <circle cx={0} cy={18} r={9} fill={PAL.crimson} />
          <path d={`M -16 18 Q ${-20 * flicker} -6 0 ${-34 * flicker} Q ${20 * flicker} -6 16 18 Z`} fill={PAL.crimson} opacity={0.9} />
          <path d={`M -9 18 Q ${-11 * flicker} 2 0 ${-16 * flicker} Q ${11 * flicker} 2 9 18 Z`} fill={PAL.bone} opacity={0.9} />
        </g>
      ) : null}
      {kind === 'candle' ? (
        // a candle stub in a holder: the smallest light, from below
        <g transform={`translate(${x} ${y})`}>
          <rect x={-11} y={0} width={22} height={7} rx={2} fill={mix(PAL.bronze, PAL.charcoal, 0.35)} />
          <rect x={-5} y={-26} width={10} height={26} fill={mix(PAL.bone, PAL.parchment, 0.5)} />
          <path d={`M 0 ${-30 - 14 * flicker} Q ${6 * flicker} -36 0 ${-44 * flicker} Q ${-6 * flicker} -36 0 ${-30 - 14 * flicker}`} fill={PAL.bone} />
        </g>
      ) : null}
      {/* the warm wash around the fixture */}
      <circle cx={x} cy={y} r={kind === 'window' ? 380 : kind === 'fire' ? 300 : 200} fill={`url(#${id}-wash)`} />
    </g>
  );
};

/** The shadow wrapper: a full-frame gradient keyed to the light's position and kind. `candle` and `lamp`
*  pool their light low and high respectively (the direction rule); `window` offsets the pool to the side
*  the window is on; `fire` centres on the hearth. Lay it over the scene, under the overlay text. */
export const Chiaroscuro: React.FC<{ kind: LightKind; x: number; y: number; id: string; intensity?: number; w?: number; h?: number }> = ({ kind, x, y, id, intensity = 0.6, w = 1920, h = 1080 }) => {
  const cx = kind === 'window' ? x : kind === 'lamp' ? x : x;
  const cy = kind === 'candle' ? y + 60 : kind === 'lamp' ? y : y;
  const r = kind === 'window' ? 1100 : kind === 'fire' ? 900 : 700;
  return (
    <g>
      <VectorGradient
        id={`${id}-chia`}
        kind="radial"
        from={mix(PAL.bone, PAL.parchment, 0.5)}
        to={PAL.charcoal}
        fromOpacity={0.16 * intensity}
        toOpacity={0.5 - 0.2 * intensity}
        cx={`${(cx / w) * 100}%`}
        cy={`${(cy / h) * 100}%`}
        r={`${(r / w) * 100}%`}
      />
      <rect width={w} height={h} fill={`url(#${id}-chia)`} />
    </g>
  );
};

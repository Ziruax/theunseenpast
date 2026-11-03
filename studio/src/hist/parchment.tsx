import React from 'react';
import { PAL, mix } from './palette';

// The parchment base: the ground every documentary frame sits on. Two layers of SVG turbulence (a coarse
// mottling and a fine tooth) plus a soft radial tone so the field never reads as flat digital colour. The
// whole effect lands at a 15–20% opacity feel — a texture, not a pattern. Rendered inside the frame's <svg>,
// so every component here is an SVG fragment, not an AbsoluteFill.

/** The parchment texture. `id` namespaces the filter/gradient defs (one base per frame); `o` scales the
*  whole texture (default 0.5); w/h default to the 1920 x 1080 frame. Covers the frame edge to edge. */
export const ParchmentBase: React.FC<{ id: string; o?: number; w?: number; h?: number }> = ({ id, o = 0.5, w = 1920, h = 1080 }) => (
  <g>
    <defs>
      <filter id={`${id}-mottle`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.008" numOctaves={3} seed={7} result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.54  0 0 0 0 0.45  0 0 0 0 0.29  0 0 0 0.5 0" />
      </filter>
      <filter id={`${id}-tooth`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.35" numOctaves={2} seed={19} result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.12  0 0 0 0 0.12  0 0 0 0 0.11  0 0 0 0.35 0" />
      </filter>
      <radialGradient id={`${id}-field`} cx="50%" cy="42%" r="80%">
        <stop offset="0%" stopColor={mix(PAL.parchment, PAL.bone, 0.35)} />
        <stop offset="70%" stopColor={PAL.parchment} />
        <stop offset="100%" stopColor={mix(PAL.parchment, PAL.bronze, 0.18)} />
      </radialGradient>
    </defs>
    <rect width={w} height={h} fill={`url(#${id}-field)`} />
    <g opacity={o}>
      <rect width={w} height={h} filter={`url(#${id}-mottle)`} opacity={0.5} />
      <rect width={w} height={h} filter={`url(#${id}-tooth)`} opacity={0.16} />
    </g>
  </g>
);

/** The engraved plate border used by sheets and title cards: a charcoal rule and a fine bronze inner line. */
export const PlateBorder: React.FC<{ w?: number; h?: number }> = ({ w = 1920, h = 1080 }) => (
  <g>
    <rect x={36} y={30} width={w - 72} height={h - 60} fill="none" stroke={PAL.charcoal} strokeWidth={3} opacity={0.85} />
    <rect x={48} y={42} width={w - 96} height={h - 84} fill="none" stroke={PAL.bronze} strokeWidth={1.5} opacity={0.7} />
  </g>
);

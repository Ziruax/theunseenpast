import React from 'react';
import { PAL, HISTFONT } from './palette';
import { clamp } from '../engine/anim';

// Overlay text — the documentary's only typography. Act titles are Cinzel 96px (engraved, period); on-screen
// labels are Inter Bold 48px; source captions are Inter 28px. Every element is bone text with a charcoal
// shadow, on at most four words: the overlay never competes with the picture. Reveals are a slow fade with a
// settling letter-spacing (no pops, no bounces — the camera rules apply to text too).

const MAX_WORDS = 4;
const four = (s: string) => s.split(/\s+/).slice(0, MAX_WORDS).join(' ');
const CAPTION_INK = 'rgba(240,232,216,0.92)';

/** Bone text over a charcoal soft shadow (the one text treatment the whole system uses). */
const BoneText: React.FC<{ x: number; y: number; size: number; weight: number; font: string; tracking: number; children: string; anchor?: 'start' | 'middle' | 'end' }> = ({ x, y, size, weight, font, tracking, children, anchor = 'start' }) => (
  <text
    x={x}
    y={y}
    textAnchor={anchor}
    fontFamily={font}
    fontWeight={weight}
    fontSize={size}
    letterSpacing={tracking}
    fill={PAL.bone}
    stroke={PAL.charcoal}
    strokeWidth={size / 12}
    paintOrder="stroke"
    style={{ filter: `drop-shadow(0 ${size / 24}px ${size / 16}px rgba(32,32,29,0.65))` }}
  >
    {children}
  </text>
);

/** The act title card: kicker (Inter, small caps) above a Cinzel 96px title. Fades and settles in over 36
*  frames from `t = titleAt` (default 6) and holds. Renders as an SVG fragment; HistScene centres it. */
export const ActTitle: React.FC<{ t: number; title: string; kicker?: string; titleAt?: number; y?: number }> = ({ t, title, kicker, titleAt = 6, y = 300 }) => {
  const k = clamp((t - titleAt) / 36);
  if (k <= 0) return null;
  const settle = 14 * (1 - k);
  return (
    <g opacity={k < 0.85 ? k : 1}>
      {kicker ? (
        <g transform={`translate(960 ${y - 84})`} opacity={k * 0.9}>
          <text textAnchor="middle" fontFamily={HISTFONT.label} fontWeight={600} fontSize={34} letterSpacing={10 + settle} fill={PAL.bone} stroke={PAL.charcoal} strokeWidth={4} paintOrder="stroke">
            {four(kicker).toUpperCase()}
          </text>
        </g>
      ) : null}
      <g transform={`translate(960 ${y})`}>
        <BoneText x={0} y={0} size={96} weight={700} font={HISTFONT.title} tracking={6 + settle} anchor="middle">
          {four(title).toUpperCase()}
        </BoneText>
      </g>
      <path d={`M ${960 - 240} ${y + 44} L ${960 + 240} ${y + 44}`} stroke={PAL.bone} strokeWidth={2.5} opacity={0.8 * k} />
    </g>
  );
};

/** An on-screen label (Inter Bold 48px): a place, a date, a name. Fades in over 18 frames from `at`. */
export const OnScreenLabel: React.FC<{ t: number; text: string; x?: number; y?: number; at?: number }> = ({ t, text, x = 130, y = 170, at = 0 }) => {
  const k = clamp((t - at) / 18);
  if (k <= 0) return null;
  return (
    <g opacity={k}>
      <BoneText x={x} y={y} size={48} weight={700} font={HISTFONT.label} tracking={2}>
        {four(text)}
      </BoneText>
    </g>
  );
};

/** A source caption (Inter 28px), bottom left by default — where the evidence is named. Fades in over 18
*  frames and never leaves while its shot runs. */
export const SourceCaption: React.FC<{ t: number; text: string; x?: number; y?: number; at?: number }> = ({ t, text, x = 130, y = 1010, at = 12 }) => {
  const k = clamp((t - at) / 18);
  if (k <= 0) return null;
  return (
    <g opacity={0.85 * k}>
      <text x={x} y={y} fontFamily={HISTFONT.label} fontWeight={400} fontSize={28} letterSpacing={1} fill={CAPTION_INK} stroke={PAL.charcoal} strokeWidth={2} paintOrder="stroke">
        {text}
      </text>
    </g>
  );
};

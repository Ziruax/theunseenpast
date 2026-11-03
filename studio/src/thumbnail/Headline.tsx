import React from 'react';
import { FONT } from '../engine/fonts';
import { PAL } from '../hist/palette';

// The thumbnail headline: Inter Bold at 140–180 px (auto-shrinking with length), bone text over a hard
// charcoal shadow, locked to the top or bottom third. Two lines max — a thumbnail is read in half a second.

/** Breaks a headline into at most two lines of roughly even length. */
const wrap = (text: string): string[] => {
  const words = text.trim().split(/\s+/);
  if (words.length < 3) return [words.join(' ')];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
};

export const Headline: React.FC<{ text: string; y: 'top' | 'bottom'; size?: number }> = ({ text, y, size }) => {
  const lines = wrap(text);
  const s = size ?? (text.length <= 12 ? 180 : text.length <= 24 ? 160 : 140);
  const base = y === 'top' ? 130 : 720 - 90 - (lines.length - 1) * s * 1.04;
  return (
    <g>
      {lines.map((line, i) => (
        <text
          key={i}
          x={640}
          y={base + i * s * 1.04}
          textAnchor="middle"
          fontFamily={FONT.label}
          fontWeight={700}
          fontSize={s}
          letterSpacing={1}
          fill={PAL.bone}
          stroke={PAL.charcoal}
          strokeWidth={s / 10}
          paintOrder="stroke"
        >
          {line.toUpperCase()}
        </text>
      ))}
    </g>
  );
};

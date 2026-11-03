import React from 'react';
import { AbsoluteFill } from 'remotion';
import { PAL, PALETTE, mix, HISTFONT } from './hist/palette';
import { PlateBorder, ParchmentBase } from './hist/parchment';
import { Figure, figY } from './hist/figures';
import { ENVIRONMENTS, Environment } from './hist/environments';
import { Prop } from './hist/objects';

// The StyleSheet (was the CastSheet): the one still that proves the visual system is coherent. Palette
// swatches with their rules, the eight environment thumbnails, the figure occupations on a baseline and
// the core props. Render it after touching anything in hist/:
//   npx remotion still src/index.ts StyleSheet out/stylesheet.png

const FIGS: { occ: Parameters<typeof Figure>[0]['occupation']; pose: Parameters<typeof Figure>[0]['pose']; carry?: Parameters<typeof Figure>[0]['carry'] }[] = [
  { occ: 'climbing_boy', pose: 'climbing', carry: 'brush' },
  { occ: 'master_sweep', pose: 'carrying', carry: 'brush' },
  { occ: 'miner', pose: 'kneeling', carry: 'lamp' },
  { occ: 'match_worker', pose: 'crouching' },
  { occ: 'factory_worker', pose: 'standing' },
  { occ: 'doctor', pose: 'writing' },
];

const PROPS = ['miners_lamp', 'pickaxe', 'shovel', 'match_dip_tray', 'coal_sack'] as const;

export const StyleSheet: React.FC = () => {
  const ground = 1010;
  return (
    <AbsoluteFill style={{ backgroundColor: PAL.parchment }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <ParchmentBase id="stylesheet" o={0.55} />
        <PlateBorder />
        {/* header */}
        <text x={960} y={100} textAnchor="middle" fontFamily={HISTFONT.title} fontWeight={700} fontSize={44} letterSpacing={10} fill={PAL.charcoal}>
          THE UNSEEN PAST
        </text>
        <text x={960} y={134} textAnchor="middle" fontFamily={HISTFONT.label} fontWeight={600} fontSize={20} letterSpacing={8} fill={mix(PAL.bronze, PAL.charcoal, 0.25)}>
          STYLE SHEET — PALETTE · ENVIRONMENTS · FIGURES · PROPS
        </text>
        <path d="M 660 152 L 1260 152" stroke={PAL.bronze} strokeWidth={2} opacity={0.7} />

        {/* palette swatches */}
        {PALETTE.map((p, i) => (
          <g key={p.name} transform={`translate(${96 + i * 352} 176)`}>
            <rect width={220} height={80} rx={6} fill={p.hex} stroke={PAL.charcoal} strokeWidth={2.5} />
            <text x={0} y={112} fontFamily={HISTFONT.label} fontWeight={700} fontSize={21} letterSpacing={2} fill={PAL.charcoal}>
              {p.name.toUpperCase()}
            </text>
            <text x={0} y={136} fontFamily={HISTFONT.label} fontWeight={400} fontSize={16} letterSpacing={1} fill={mix(PAL.bronze, PAL.charcoal, 0.25)}>
              {p.hex} — {p.note}
            </text>
          </g>
        ))}

        {/* environment thumbnails: two rows of four */}
        {ENVIRONMENTS.map((name, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const tx = 96 + col * 440;
          const ty = 348 + row * 242;
          return (
            <g key={name}>
              <g transform={`translate(${tx} ${ty}) scale(0.185)`}>
                <Environment name={name} id={`sheet-${name}`} />
              </g>
              <rect x={tx} y={ty} width={356} height={200} fill="none" stroke={mix(PAL.charcoal, PAL.parchment, 0.3)} strokeWidth={2} opacity={0.7} />
              <text x={tx} y={ty + 218} fontFamily={HISTFONT.label} fontWeight={600} fontSize={16} letterSpacing={2} fill={mix(PAL.bronze, PAL.charcoal, 0.25)}>
                {name.replace('_', ' ').toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* the figures on the baseline */}
        <path d={`M 130 ${ground} L 1520 ${ground}`} stroke={PAL.charcoal} strokeWidth={2} opacity={0.55} />
        {FIGS.map((f, i) => (
          <g key={f.occ}>
            <Figure occupation={f.occ} pose={f.pose} carry={f.carry} exp={f.pose === 'climbing' ? 'strain' : 'neutral'} x={210 + i * 260} y={figY(ground, f.occ, 0.6)} scale={0.6} t={8} />
            <text x={210 + i * 260} y={ground + 28} textAnchor="middle" fontFamily={HISTFONT.label} fontWeight={600} fontSize={14} letterSpacing={1.5} fill={mix(PAL.bronze, PAL.charcoal, 0.2)}>
              {f.occ.replace('_', ' ').toUpperCase()}
            </text>
          </g>
        ))}

        {/* the props, on the same ground to the right */}
        <path d={`M 1560 ${ground} L 1840 ${ground}`} stroke={PAL.charcoal} strokeWidth={2} opacity={0.55} />
        {PROPS.map((kind, i) => (
          <Prop key={kind} kind={kind} x={1600 + i * 65} y={ground} s={0.62} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

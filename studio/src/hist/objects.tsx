import React from 'react';
import { PAL, mix } from './palette';

// Period objects: the tools, furniture and machinery the trades used, drawn flat and grounded — each prop
// sits on its own origin (0, 0) at the point it meets the floor, drawn upright at world scale, so a shot
// places it with x, y and a `s` if the camera is wide. Charcoal bodies, bronze hafts and fittings, bone
// highlights; the firebox of any machine may take the scene's single crimson.

export type PropName =
  | 'chimney_brush' // the sweep's jointed brush, standing in a corner
  | 'match_dip_tray' // the dip tray: frame of matches, at the worker's bench
  | 'miners_lamp' // a Davy-style lamp on the ground
  | 'pickaxe' // leaning against the tunnel wall
  | 'shovel' // stuck blade-down in spoil
  | 'coal_sack' // a full sack, slumped
  | 'stool' // the workhouse / workshop stool
  | 'table' // a long plank table
  | 'bunk' // a workhouse or ward bed
  | 'loom' // the powered loom, mid-bay
  | 'mine_cart' // a filled tram on rails
  | 'barrel'; // a generic cask

/** One prop. (x, y) is its floor point; s scales it; t drives the one animated thing some props have
*  (a loom's slow shuttle tick — a two-pose cycle, never fluid). */
export const Prop: React.FC<{ kind: PropName; x: number; y: number; s?: number; rot?: number; t?: number }> = ({ kind, x, y, s = 1, rot = 0, t = 0 }) => {
  const wood = mix(PAL.bronze, PAL.parchment, 0.25);
  const darkwood = mix(PAL.bronze, PAL.charcoal, 0.45);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      {kind === 'chimney_brush' ? (
        // jointed cane rods leaning, the bristle head at the top
        <g transform="rotate(-8)">
          <path d="M 0 0 L 6 -170" stroke={wood} strokeWidth={7} strokeLinecap="round" />
          <path d="M 0 0 L 6 -170" stroke={PAL.bronze} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={2 + i * 2} cy={-40 - i * 44} r={3.4} fill={darkwood} />
          ))}
          <circle cx={6} cy={-186} r={22} fill={PAL.charcoal} />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * Math.PI * 2) / 8;
            return <path key={i} d={`M ${6 + Math.sin(a) * 8} ${-186 + Math.cos(a) * 8} L ${6 + Math.sin(a) * 20} ${-186 + Math.cos(a) * 20}`} stroke={PAL.bronze} strokeWidth={2.2} opacity={0.85} />;
          })}
        </g>
      ) : null}
      {kind === 'match_dip_tray' ? (
        // a shallow tray, a rack of dipped matches, one crimson head (the scene's accent elsewhere)
        <g>
          <path d="M -64 0 L 64 0 L 56 -14 L -56 -14 Z" fill={darkwood} />
          <path d="M -56 -14 L 56 -14" stroke={PAL.bronze} strokeWidth={1.6} opacity={0.6} />
          {[-48, -32, -16, 0, 16, 32, 48].map((cx, i) => (
            <g key={i}>
              <path d={`M ${cx} -14 L ${cx} -46`} stroke={wood} strokeWidth={2.6} />
              <circle cx={cx} cy={-50} r={3.6} fill={PAL.bronze} />
            </g>
          ))}
        </g>
      ) : null}
      {kind === 'miners_lamp' ? (
        // a Davy lamp: wire gauze cylinder over the flame
        <g>
          <path d="M -20 0 L 20 0 L 15 -8 L -15 -8 Z" fill={mix(PAL.bronze, PAL.charcoal, 0.35)} />
          <rect x={-14} y={-34} width={28} height={26} fill="none" stroke={mix(PAL.bronze, PAL.parchment, 0.35)} strokeWidth={2.4} />
          {[-9, -4.5, 0, 4.5, 9].map((lx) => (
            <path key={lx} d={`M ${lx} -34 L ${lx} -8`} stroke={mix(PAL.bronze, PAL.parchment, 0.35)} strokeWidth={1} opacity={0.7} />
          ))}
          <ellipse cx={0} cy={-34} rx={14} ry={5} fill="none" stroke={mix(PAL.bronze, PAL.parchment, 0.35)} strokeWidth={2.4} />
          <path d="M 0 -10 Q -5 -18 0 -27 Q 5 -18 0 -10 Z" fill={PAL.bone} opacity={0.95} />
        </g>
      ) : null}
      {kind === 'pickaxe' ? (
        // leaning: haft against the wall, head up
        <g transform="rotate(12)">
          <path d="M 0 0 L 8 -120" stroke={wood} strokeWidth={7} strokeLinecap="round" />
          <path d="M -26 -126 Q 8 -140 42 -126" stroke={mix(PAL.charcoal, PAL.parchment, 0.1)} strokeWidth={8} strokeLinecap="round" fill="none" />
          <path d="M -26 -126 Q 8 -140 42 -126" stroke={PAL.charcoal} strokeWidth={2} fill="none" opacity={0.6} />
        </g>
      ) : null}
      {kind === 'shovel' ? (
        // blade-down in the spoil, shaft leaning
        <g transform="rotate(9)">
          <path d="M 0 0 L 0 -108" stroke={wood} strokeWidth={7} strokeLinecap="round" />
          <rect x={-6} y={-128} width={12} height={16} rx={5} fill="none" stroke={darkwood} strokeWidth={5} />
          <path d="M -14 0 Q -16 22 0 26 Q 16 22 14 0 Z" fill={mix(PAL.charcoal, PAL.parchment, 0.1)} stroke={PAL.charcoal} strokeWidth={2} />
        </g>
      ) : null}
      {kind === 'coal_sack' ? (
        // a full sack slumped over
        <g>
          <path d="M -6 0 Q -44 -4 -46 -30 Q -47 -58 -22 -62 Q -8 -64 -2 -50 L 2 -50 Q 8 -70 30 -64 Q 50 -56 44 -28 Q 40 -4 6 0 Z" fill={PAL.charcoal} />
          <path d="M -8 -52 L 4 -48" stroke={PAL.bronze} strokeWidth={3} opacity={0.8} />
          <path d="M -30 -26 Q -6 -34 26 -24" stroke={PAL.bronze} strokeWidth={1.6} fill="none" opacity={0.45} />
        </g>
      ) : null}
      {kind === 'stool' ? (
        <g>
          <rect x={-26} y={-38} width={52} height={9} rx={2} fill={darkwood} />
          <path d="M -20 -29 L -25 0 M 20 -29 L 25 0" stroke={darkwood} strokeWidth={6} strokeLinecap="round" />
        </g>
      ) : null}
      {kind === 'table' ? (
        <g>
          <rect x={-150} y={-52} width={300} height={12} rx={3} fill={wood} />
          <path d="M -150 -46 L 150 -46" stroke={PAL.bronze} strokeWidth={1.6} opacity={0.5} />
          <path d="M -138 -40 L -142 0 M 138 -40 L 142 0" stroke={darkwood} strokeWidth={9} strokeLinecap="round" />
        </g>
      ) : null}
      {kind === 'bunk' ? (
        // an iron-frame bed: the workhouse and the ward share it
        <g>
          <path d="M -110 -64 L -110 0 M 110 -46 L 110 0 M -110 -60 L 110 -42" stroke={mix(PAL.charcoal, PAL.parchment, 0.1)} strokeWidth={7} strokeLinecap="round" fill="none" />
          <path d="M -104 -56 L 104 -38" stroke={mix(PAL.bone, PAL.parchment, 0.4)} strokeWidth={14} strokeLinecap="round" opacity={0.95} />
          <rect x={72} y={-64} width={44} height={16} rx={5} fill={mix(PAL.bone, PAL.parchment, 0.55)} />
        </g>
      ) : null}
      {kind === 'loom' ? (
        // the powered loom: upright frame, harness, the shuttle ticking with t
        <g>
          <path d="M -90 0 L -90 -190 L -70 -190 L -70 0 M 90 0 L 90 -190 L 70 -190 L 70 0" fill={darkwood} />
          <rect x={-90} y={-190} width={180} height={14} fill={darkwood} />
          <rect x={-62} y={-150} width={124} height={100} fill="none" stroke={PAL.charcoal} strokeWidth={4} />
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M ${-56 + i * 28} -150 L ${-56 + i * 28} -50`} stroke={PAL.charcoal} strokeWidth={2} opacity={0.6} />
          ))}
          <rect x={Math.sin(t * 0.5) > 0 ? -40 : 22} y={-108} width={18} height={12} rx={4} fill={wood} />
          <path d="M -90 -34 L 90 -34" stroke={wood} strokeWidth={10} />
          <circle cx={-104} cy={-90} r={22} fill="none" stroke={mix(PAL.charcoal, PAL.parchment, 0.1)} strokeWidth={9} />
        </g>
      ) : null}
      {kind === 'mine_cart' ? (
        // a filled tram on rails
        <g>
          <path d="M -80 -12 L 80 -12 L 96 -56 L -96 -56 Z" fill={mix(PAL.charcoal, PAL.parchment, 0.08)} stroke={PAL.charcoal} strokeWidth={2.5} />
          <path d="M -96 -56 L 96 -56" stroke={PAL.bronze} strokeWidth={2} opacity={0.6} />
          <path d="M -70 -56 Q 0 -78 70 -56" fill={PAL.charcoal} />
          <circle cx={-48} cy={-6} r={13} fill="none" stroke={mix(PAL.charcoal, PAL.parchment, 0.15)} strokeWidth={6} />
          <circle cx={48} cy={-6} r={13} fill="none" stroke={mix(PAL.charcoal, PAL.parchment, 0.15)} strokeWidth={6} />
          <path d="M -110 0 L 110 0" stroke={mix(PAL.charcoal, PAL.parchment, 0.1)} strokeWidth={5} />
        </g>
      ) : null}
      {kind === 'barrel' ? (
        <g>
          <path d="M -34 0 Q -42 -34 -34 -68 L 34 -68 Q 42 -34 34 0 Z" fill={darkwood} />
          <path d="M -38 -18 L 38 -18 M -38 -50 L 38 -50" stroke={mix(PAL.bronze, PAL.charcoal, 0.2)} strokeWidth={4} />
          <ellipse cx={0} cy={-68} rx={34} ry={8} fill="none" stroke={mix(PAL.bronze, PAL.charcoal, 0.2)} strokeWidth={3.5} />
        </g>
      ) : null}
    </g>
  );
};

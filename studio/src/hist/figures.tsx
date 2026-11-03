import React from 'react';
import { PAL, mix, HISTFONT } from './palette';
import type { Occupation, PoseName } from './shot';
import { ParchmentBase } from './parchment';

// The figures: flat-vector block silhouettes with volume and period-accurate clothing — engraved-edge charcoal
// bodies (a thin bone-bronze edge so they never vanish on dark sets), parchment skin only on the face patch,
// dot eyes and a single mouth line. All side-view, all pure functions of props; the only motion is a walk cycle
// and a climbing reach, both derived from t.
//
// Local units: the HIP is (0, 0). An adult is ~360 units head-to-toe (feet at +166, crown at -199). A climbing boy
// or child is drawn at 0.62 of that internally; `scale` multiplies on top. x, y are world pixels (y = the hip).

type PoseDef = {
 torso: number; // torso lean, degrees (+ leans toward facing)
 head: number; // head tilt on the neck
 hipDy: number; // hip drop for crouches
 yOff?: number; // whole-body drop (kneeling, seated)
 rot?: number; // whole-body rotation about the hip (climbing, lying)
 legs: [number, number, number, number]; // [hipL, kneeL, hipR, kneeR]; 0 = straight down, + = forward
 arms: [number, number, number, number]; // [shoulderL, elbowL, shoulderR, elbowR]; 0 = down, + = forward, 180 = up
 face: 'front' | 'profile' | 'none';
 gait?: boolean; // animated walk cycle
 climb?: boolean; // animated alternating reach
 seat?: boolean; // draw a stool
};

/** The pose library: parametric joint angles per pose. THE key pose is `climbing` — body tilted back into the flue,
*  arms overhead, knees bent to brace against the opposite wall. `still` is the death pose: a horizontal silhouette
*  with no face and no detail, drawn tastefully. */
export const POSES: Record<PoseName, PoseDef> = {
 standing: { torso: 0, head: 0, hipDy: 0, legs: [3, -2, -3, 2], arms: [7, 9, -7, -9], face: 'front' },
 walking: { torso: 6, head: -2, hipDy: 2, legs: [24, -14, -22, 30], arms: [-28, -14, 26, 16], face: 'profile', gait: true },
 climbing: { torso: -8, head: -26, hipDy: 0, rot: -68, legs: [34, -74, 26, -66], arms: [164, 172, 148, 158], face: 'profile', climb: true },
 crouching: { torso: 26, head: -20, hipDy: 74, legs: [64, -118, 56, -108], arms: [42, 66, 34, 56], face: 'profile' },
 kneeling: { torso: 10, head: -8, hipDy: 0, yOff: 62, legs: [6, -84, -4, -116], arms: [12, 22, 8, 14], face: 'profile' },
 carrying: { torso: 8, head: 2, hipDy: 4, legs: [16, -9, -14, 22], arms: [24, 44, -12, -18], face: 'profile' },
 reaching: { torso: 12, head: -12, hipDy: 6, legs: [18, -11, -16, 24], arms: [-18, -12, 142, 8], face: 'profile' },
 pointing: { torso: -4, head: -6, hipDy: 0, legs: [4, -2, -4, 2], arms: [8, 10, 96, 2], face: 'profile' },
 writing: { torso: 16, head: -14, hipDy: 0, yOff: 82, legs: [82, -84, 74, -78], arms: [36, 30, 74, 42], face: 'profile', seat: true },
 still: { torso: 0, head: 0, hipDy: 0, rot: 90, legs: [2, 0, -2, 0], arms: [10, 6, -10, -6], face: 'none' },
};

type Head = 'cap' | 'tophat' | 'hair' | 'bald' | 'bonnet' | 'shawl' | 'helmet' | 'mop';

/** Occupation sheet: internal scale, headwear, body cut, extras. Boys and workers wear aprons; the gentleman, the
*  doctor and the workhouse master wear the frock coat; women wear the skirt (feet peek below the hem). */
const OCC: Record<Occupation, { s: number; head: Head; apron?: boolean; keys?: boolean; specs?: boolean }> = {
 climbing_boy: { s: 0.62, head: 'cap', apron: true },
 master_sweep: { s: 1.0, head: 'tophat' },
 gentleman: { s: 1.0, head: 'hair' },
 doctor: { s: 1.0, head: 'bald', specs: true },
 mother: { s: 0.94, head: 'bonnet' },
 workhouse_master: { s: 1.0, head: 'hair', keys: true },
 miner: { s: 0.96, head: 'helmet' },
 match_worker: { s: 0.9, head: 'shawl', apron: true },
 factory_worker: { s: 0.92, head: 'cap', apron: true },
 child: { s: 0.6, head: 'mop' },
};

export type Carry = 'brush' | 'sack' | 'lamp' | 'scrapes';

// geometry (adult local units)
const HIP_X = 11;
const LEG_UP = 84;
const LEG_LO = 80;
const SHO_X = 28;
const SHO_Y = -112;
const ARM_UP = 60;
const ARM_LO = 56;
const HEAD_R = 27;
const HEAD_Y = -172;
const EDGE = mix(PAL.bone, PAL.bronze, 0.5); // the engraved edge on charcoal bodies
const SKIN = mix(PAL.parchment, PAL.bone, 0.5);

/** Two-segment limb: joint angles in degrees (0 = hanging down, + swings forward). Returns shoulder, elbow, hand. */
const chain = (ox: number, oy: number, a0: number, a1: number, l0: number, l1: number) => {
 const r0 = (a0 * Math.PI) / 180;
 const r1 = r0 + (a1 * Math.PI) / 180;
 const e: [number, number] = [ox + Math.sin(r0) * l0, oy + Math.cos(r0) * l0];
 const h: [number, number] = [e[0] + Math.sin(r1) * l1, e[1] + Math.cos(r1) * l1];
 return { s: [ox, oy] as [number, number], e, h };
};

/** A limb as rect capsules with a joint circle; near limbs carry the bronze engraved edge. */
const seg = (p: [number, number][], w: number, near: boolean, plain: boolean) => (
 <>
   <path d={`M ${p.map((q) => q.join(' ')).join(' L ')}`} fill="none" stroke={PAL.charcoal} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={near ? 1 : 0.82} />
   <circle cx={p[1][0]} cy={p[1][1]} r={w * 0.44} fill={PAL.charcoal} opacity={near ? 1 : 0.82} />
   {near && !plain ? (
     <g>
       <path d={`M ${p.map((q) => q.join(' ')).join(' L ')}`} fill="none" stroke={EDGE} strokeWidth={2} strokeLinecap="round" opacity={0.5} />
       <circle cx={p[1][0]} cy={p[1][1]} r={w * 0.44} fill="none" stroke={EDGE} strokeWidth={1.6} opacity={0.55} />
     </g>
   ) : null}
 </>
);

const Shoe: React.FC<{ ankle: [number, number]; shin: number }> = ({ ankle, shin }) => (
 <g transform={`translate(${ankle[0]} ${ankle[1]}) rotate(${shin * 0.4})`}>
   <rect x={-8} y={-6} width={36} height={11} rx={5} fill={PAL.charcoal} />
   <path d="M -8 3 L 26 3" stroke={EDGE} strokeWidth={1.5} opacity={0.45} />
 </g>
);

const Headwear: React.FC<{ kind: Head; plain: boolean; t: number }> = ({ kind, plain, t }) => {
 switch (kind) {
   case 'cap': // the climbing boy's flat cap, brim forward
     return (
       <g>
         <path d="M -28 -170 Q -27 -197 0 -198 Q 27 -197 28 -170 Z" fill={PAL.charcoal} />
         <path d="M 18 -171 Q 33 -167 35 -160 Q 27 -165 16 -167 Z" fill={PAL.charcoal} />
         {!plain ? <path d="M -24 -180 Q 0 -187 24 -180" stroke={PAL.bronze} strokeWidth={1.6} fill="none" opacity={0.7} /> : null}
       </g>
     );
   case 'tophat': // the master sweep's battered top hat, tilted and dented
     return (
       <g transform="rotate(-5 0 -196)">
         <ellipse cx={0} cy={-194} rx={27} ry={6.5} fill={PAL.charcoal} />
         <path d="M -15 -194 L -17 -236 Q 0 -242 17 -236 L 15 -194 Z" fill={PAL.charcoal} />
         <ellipse cx={1} cy={-237} rx={16} ry={4.5} fill={mix(PAL.charcoal, PAL.parchment, 0.14)} />
         {!plain ? (
           <g>
             <rect x={-16} y={-208} width={32} height={5} fill={PAL.bronze} opacity={0.85} />
             <path d="M -6 -238 Q 0 -243 6 -238" stroke={PAL.bronze} strokeWidth={1.5} fill="none" opacity={0.6} />
           </g>
         ) : null}
       </g>
     );
   case 'hair': // the gentleman's greased parting: a crown bump and a parting line
     return (
       <g>
         <path d="M -28 -172 Q -28 -200 0 -201 Q 28 -200 28 -172 Z" fill={PAL.charcoal} />
         {!plain ? <path d="M -20 -192 Q 2 -199 22 -186" stroke={mix(PAL.bronze, PAL.parchment, 0.4)} strokeWidth={1.4} fill="none" opacity={0.65} /> : null}
       </g>
     );
   case 'bald': // the doctor: side hair only, a high forehead
     return (
       <g>
         <path d="M -28 -170 Q -29 -188 -18 -192 L -24 -170 Z" fill={PAL.charcoal} />
         <path d="M 28 -170 Q 29 -188 18 -192 L 24 -170 Z" fill={PAL.charcoal} />
         {!plain ? <path d="M -26 -176 Q -30 -186 -22 -190 M 26 -176 Q 30 -186 22 -190" stroke={PAL.bronze} strokeWidth={1.3} fill="none" opacity={0.6} /> : null}
       </g>
     );
   case 'bonnet': // the mother's poke bonnet: a crescent over the crown, a brim forward, a ribbon under the chin
     return (
       <g>
         <path d="M 16 -156 Q 22 -176 12 -188 Q -6 -201 -22 -190 Q -31 -178 -27 -158 Q -14 -150 16 -156 Z" fill={PAL.charcoal} />
         {!plain ? (
           <g>
             <path d="M 14 -170 Q 24 -168 27 -160" stroke={PAL.bronze} strokeWidth={1.6} fill="none" opacity={0.7} />
             <path d="M -2 -152 Q 8 -146 18 -152" stroke={PAL.bronze} strokeWidth={1.6} fill="none" opacity={0.6} />
           </g>
         ) : null}
       </g>
     );
   case 'shawl': // the match worker's shawl, hooded over the head and draped to the shoulders
     return (
       <g>
         <path d="M 0 -200 C -28 -190 -34 -146 -42 -102 L 42 -102 C 34 -146 28 -190 0 -200 Z" fill={PAL.charcoal} />
         {!plain ? (
           <g>
             <path d="M -40 -104 L 40 -104" stroke={PAL.bronze} strokeWidth={2} opacity={0.55} />
             {[-28, -12, 8, 26].map((x, i) => (
               <path key={i} d={`M ${x} -104 l ${i % 2 ? 5 : -5} 9`} stroke={PAL.bronze} strokeWidth={1.4} opacity={0.5} />
             ))}
           </g>
         ) : null}
       </g>
     );
   case 'helmet': // the miner's felt helmet with a small lamp burning in front
     return (
       <g>
         <path d="M -28 -172 Q -28 -203 0 -203 Q 28 -203 28 -172 Z" fill={PAL.charcoal} />
         <ellipse cx={0} cy={-170} rx={30} ry={5} fill={PAL.charcoal} />
         <rect x={24} y={-188} width={12} height={11} rx={2} fill={PAL.charcoal} stroke={PAL.bronze} strokeWidth={1.4} />
         <circle cx={30} cy={-182.5} r={3.4} fill={PAL.bone} opacity={0.75 + 0.25 * Math.sin(t * 2.3)} />
         <circle cx={30} cy={-182.5} r={8} fill={PAL.bone} opacity={0.16} />
       </g>
     );
   case 'mop': // the child's scruffy mop of hair
     return <path d="M -28 -170 L -24 -190 L -16 -181 L -9 -197 L -1 -185 L 7 -199 L 14 -184 L 22 -193 L 28 -170 Z" fill={PAL.charcoal} />;
 }
};

const Face: React.FC<{ mode: 'front' | 'profile' | 'none'; exp: 'neutral' | 'strain' | 'grimace'; uid: string }> = ({ mode, exp, uid }) => {
 if (mode === 'none') return null;
 const front = mode === 'front';
 return (
   <g>
     <defs>
       <clipPath id={`fc-${uid}`}>
         <circle cx={0} cy={HEAD_Y} r={HEAD_R} />
       </clipPath>
     </defs>
     {/* the skin patch: a parchment crescent on the visible side of the head, clipped to the skull */}
     <circle cx={front ? 0 : 7} cy={front ? HEAD_Y : HEAD_Y + 3} r={24} fill={SKIN} clipPath={`url(#fc-${uid})`} />
     <g stroke={PAL.charcoal} fill={PAL.charcoal} strokeLinecap="round">
       {exp === 'strain' ? (
         // eyes screwed shut, mouth open (the climb, the labour)
         front ? (
           <g strokeWidth={2.2}>
             <path d="M -13 -176 L -5 -176" fill="none" />
             <path d="M 5 -176 L 13 -176" fill="none" />
             <circle cx={0} cy={-159} r={3.6} stroke="none" />
           </g>
         ) : (
           <g strokeWidth={2.2}>
             <path d="M 8 -176 L 16 -176" fill="none" />
             <circle cx={13} cy={-160} r={3.4} stroke="none" />
           </g>
         )
       ) : (
         <g>
           {front ? (
             <>
               <circle cx={-9} cy={-176} r={2.6} stroke="none" />
               <circle cx={9} cy={-176} r={2.6} stroke="none" />
             </>
           ) : (
             <circle cx={12} cy={-176} r={2.6} stroke="none" />
           )}
           {exp === 'grimace' ? (
             front ? (
               <path d="M -7 -157 Q 0 -163 7 -157" fill="none" strokeWidth={2.2} />
             ) : (
               <path d="M 8 -159 Q 13 -164 18 -159" fill="none" strokeWidth={2.2} />
             )
           ) : (
             <path d={front ? 'M -7 -158 L 7 -158' : 'M 8 -159 L 16 -159'} fill="none" strokeWidth={2.2} />
           )}
         </g>
       )}
     </g>
   </g>
 );
};

/** Carry props, drawn in the figure's local space. `sack` rides the far shoulder (drawn behind everything);
*  the rest hang from the near hand at (hx, hy). */
const CarryProps: React.FC<{ carry: Carry; hx: number; hy: number; t: number }> = ({ carry, hx, hy, t }) => {
 switch (carry) {
   case 'brush': // the chimney brush: a long wooden shaft and a round bristle head
     return (
       <g transform={`translate(${hx} ${hy}) rotate(7)`}>
         <path d="M 0 16 L 0 -152" stroke={mix(PAL.bronze, PAL.parchment, 0.3)} strokeWidth={8} strokeLinecap="round" />
         <path d="M 0 16 L 0 -152" stroke={PAL.bronze} strokeWidth={2} strokeLinecap="round" opacity={0.8} />
         <ellipse cx={0} cy={-150} rx={13} ry={7} fill={mix(PAL.bronze, PAL.parchment, 0.3)} />
         <circle cx={0} cy={-184} r={27} fill={PAL.charcoal} />
         {Array.from({ length: 9 }).map((_, i) => {
           const a = (i * Math.PI * 2) / 9;
           return <path key={i} d={`M ${Math.sin(a) * 10} ${-184 + Math.cos(a) * 10} L ${Math.sin(a) * 24} ${-184 + Math.cos(a) * 24}`} stroke={PAL.bronze} strokeWidth={2.4} opacity={0.85} />;
         })}
         <circle cx={0} cy={-184} r={27} fill="none" stroke={EDGE} strokeWidth={1.8} opacity={0.6} />
       </g>
     );
   case 'sack':
     return (
       <g transform="translate(-30 -128)">
         <path d="M 0 -14 Q -26 -10 -30 12 Q -32 34 -14 44 Q 4 52 22 42 Q 38 32 34 10 Q 30 -10 8 -14 Z" fill={PAL.charcoal} />
         <rect x={-7} y={-26} width={15} height={15} rx={4} fill={PAL.charcoal} />
         <path d="M -8 -13 L 9 -13" stroke={PAL.bronze} strokeWidth={2.4} />
         <path d="M -18 8 Q 0 2 18 10" stroke={PAL.bronze} strokeWidth={1.6} fill="none" opacity={0.5} />
       </g>
     );
   case 'lamp': // a small oil lamp, swinging gently with t
     return (
       <g transform={`translate(${hx} ${hy}) rotate(${Math.sin(t * 0.9) * 5})`}>
         <path d="M -9 2 Q 0 -15 9 2" stroke={PAL.bronze} strokeWidth={2.6} fill="none" />
         <rect x={-11} y={2} width={22} height={30} rx={4} fill={PAL.charcoal} />
         <rect x={-13} y={0} width={26} height={5} rx={2} fill={mix(PAL.bronze, PAL.charcoal, 0.4)} />
         <circle cx={0} cy={14} r={4} fill={PAL.bone} opacity={0.85} />
         <circle cx={0} cy={14} r={10} fill={PAL.bone} opacity={0.18} />
       </g>
     );
   case 'scrapes': // the scraper the boys worked the crevices with: a short handle and a flat blade
     return (
       <g transform={`translate(${hx} ${hy}) rotate(18)`}>
         <path d="M 0 6 L 0 -44" stroke={mix(PAL.bronze, PAL.parchment, 0.3)} strokeWidth={7} strokeLinecap="round" />
         <path d="M -15 -44 L 15 -44" stroke={PAL.bronze} strokeWidth={5} strokeLinecap="round" />
         <path d="M -15 -44 L -19 12 L 19 12 L 15 -44 Z" fill={PAL.charcoal} />
         <path d="M -19 12 L 19 12" stroke={EDGE} strokeWidth={2.2} opacity={0.7} />
       </g>
     );
 }
};

export type FigureProps = {
 occupation: Occupation;
 pose: PoseName;
 facing?: 'left' | 'right';
 scale?: number;
 x?: number;
 y?: number;
 t?: number;
 exp?: 'neutral' | 'strain' | 'grimace';
 carry?: Carry;
};

/** A figure. A pure function of props; the only motion is the walk cycle (gait) and the climbing reach, both from
*  t. x, y are world pixels — y is the HIP, so for grounded poses pass ground − 166·scale·occScale (or just use the
*  helper `figY(ground, occupation, scale)` below). */
export const figY = (ground: number, occupation: Occupation, scale = 1) => ground - 166 * OCC[occupation].s * scale;

export const Figure: React.FC<FigureProps> = ({ occupation, pose, facing = 'right', scale = 1, x = 960, y = 800, t = 0, exp = 'neutral', carry }) => {
 const occ = OCC[occupation];
 const base = POSES[pose] ?? POSES.standing;
 const plain = pose === 'still';
 const skirted = occupation === 'mother' || occupation === 'match_worker' || occupation === 'factory_worker';

 let legs = [...base.legs] as number[];
 let arms = [...base.arms] as number[];
 let hipDy = base.hipDy;
 if (base.gait) {
   // a silhouette walk cycle: legs alternate, arms counter-swing, the hip bobs on the passes
   const ph = t * 0.26;
   const sw = Math.sin(ph) * 24;
   legs = [sw, -Math.max(0, Math.sin(ph + 0.7)) * 42, -sw, -Math.max(0, Math.sin(ph + 0.7 + Math.PI)) * 42];
   arms = [-sw * 0.8, -14, sw * 0.8, -14];
   hipDy = base.hipDy + Math.abs(Math.cos(ph)) * 5;
 }
 if (base.climb) {
   // the flue climb: the hands walk up the wall one after the other
   const ph = t * 0.14;
   arms[0] += Math.sin(ph) * 8;
   arms[1] += Math.sin(ph) * 6;
   arms[2] += Math.sin(ph + Math.PI) * 8;
   arms[3] += Math.sin(ph + Math.PI) * 6;
   legs[0] += Math.sin(ph + Math.PI) * 3;
   legs[2] += Math.sin(ph) * 3;
 }

 const uid = `${occupation}_${pose}_${Math.round(x)}_${Math.round(y)}`;
 const legL = chain(-HIP_X, 6, legs[0], legs[1], LEG_UP, LEG_LO);
 const legR = chain(HIP_X, 6, legs[2], legs[3], LEG_UP, LEG_LO);
 const armL = chain(-SHO_X, SHO_Y, arms[0], arms[1], ARM_UP, ARM_LO);
 const armR = chain(SHO_X, SHO_Y, arms[2], arms[3], ARM_UP, ARM_LO);
 const grounded = pose !== 'climbing' && pose !== 'still';
 const bodyT = `translate(0 ${hipDy}) rotate(${base.torso})`;

 return (
   <g transform={`translate(${x} ${y}) scale(${scale * occ.s * (facing === 'left' ? -1 : 1)} ${scale * occ.s}) rotate(${base.rot ?? 0}) translate(0 ${base.yOff ?? 0})`}>
     {/* contact shadow on the ground, under everything */}
     {grounded ? <ellipse cx={4} cy={(base.yOff ?? 0) + hipDy + 170} rx={62} ry={9} fill={PAL.charcoal} opacity={0.22} /> : null}

     {/* the far leg (and the sack behind the body) */}
     {carry === 'sack' ? <CarryProps carry="sack" hx={0} hy={0} t={t} /> : null}
     <g transform={`translate(0 ${hipDy})`}>{seg([legL.s, legL.e, legL.h], 16, false, plain)}</g>

     {/* the body: far arm behind the coat, coat, head, near arm in front */}
     <g transform={bodyT}>
       {seg([armL.s, armL.e, armL.h], 13, false, plain)}

       {skirted ? (
         // the bodice of a dress (the skirt itself is drawn later, over the legs)
         <path d="M -24 -114 C -27 -76 -23 -34 -21 6 L 21 6 C 23 -34 27 -76 24 -114 Q 0 -124 -24 -114 Z" fill={PAL.charcoal} />
       ) : occ.keys ? (
         // the frock coat (workhouse master wears it with the keys at the hip)
         <g>
           <path d="M -30 -116 C -33 -70 -30 -20 -36 40 C -38 70 -41 84 -41 94 L 41 94 C 41 84 38 70 36 40 C 30 -20 33 -70 30 -116 Q 0 -126 -30 -116 Z" fill={PAL.charcoal} />
           {!plain ? (
             <g>
               <path d="M 10 -108 C 14 -40 16 30 16 90" stroke={PAL.bronze} strokeWidth={1.8} fill="none" opacity={0.55} />
               {[0, 1, 2].map((i) => (
                 <circle key={i} cx={5} cy={-58 + i * 30} r={2.4} fill={PAL.bronze} />
               ))}
               <path d="M 20 6 L 26 14" stroke={PAL.bronze} strokeWidth={2} />
               <circle cx={27} cy={18} r={5} fill="none" stroke={PAL.bronze} strokeWidth={2} />
               <circle cx={22} cy={21} r={4} fill="none" stroke={PAL.bronze} strokeWidth={1.8} />
             </g>
           ) : null}
         </g>
       ) : occ.head === 'tophat' || occ.specs ? (
         // the frock coat for the master sweep and the doctor
         <g>
           <path d="M -30 -116 C -33 -70 -30 -20 -36 40 C -38 70 -41 84 -41 94 L 41 94 C 41 84 38 70 36 40 C 30 -20 33 -70 30 -116 Q 0 -126 -30 -116 Z" fill={PAL.charcoal} />
           {!plain ? (
             <g>
               <path d="M 10 -108 C 14 -40 16 30 16 90" stroke={PAL.bronze} strokeWidth={1.8} fill="none" opacity={0.55} />
               {[0, 1, 2].map((i) => (
                 <circle key={i} cx={5} cy={-58 + i * 30} r={2.4} fill={PAL.bronze} />
               ))}
             </g>
           ) : null}
         </g>
       ) : occ.head === 'mop' ? (
         // the child's smock: boxier, straighter
         <g>
           <path d="M -32 -114 C -36 -70 -33 -20 -30 36 L -30 40 Q 0 48 30 40 L 30 36 C 33 -20 36 -70 32 -114 Q 0 -124 -32 -114 Z" fill={PAL.charcoal} />
           {!plain ? <path d="M -28 32 Q 0 40 28 32" stroke={PAL.bronze} strokeWidth={1.6} fill="none" opacity={0.55} /> : null}
         </g>
       ) : (
         // the boy's and the miner's jacket: a trapezoid coat body with fold lines
         <g>
           <path d="M -30 -116 C -33 -78 -27 -38 -25 10 L -24 28 Q 0 36 24 28 L 25 10 C 27 -38 33 -78 30 -116 Q 0 -126 -30 -116 Z" fill={PAL.charcoal} />
           {!plain ? (
             <g>
               <path d="M -17 -68 C -9 -48 -7 -26 -9 -2" stroke={mix(PAL.bronze, PAL.parchment, 0.15)} strokeWidth={1.8} fill="none" opacity={0.45} />
               <path d="M 14 -60 C 9 -42 8 -22 9 0" stroke={mix(PAL.bronze, PAL.parchment, 0.15)} strokeWidth={1.5} fill="none" opacity={0.3} />
               <path d="M -30 -116 C -33 -78 -27 -38 -25 10" stroke={EDGE} strokeWidth={1.5} fill="none" opacity={0.4} />
             </g>
           ) : null}
         </g>
       )}

       {/* the collar notch */}
       {!plain ? <path d="M -11 -117 L 0 -106 L 11 -117" stroke={mix(PAL.bone, PAL.parchment, 0.55)} strokeWidth={2} fill="none" opacity={0.75} /> : null}
       {/* the apron for boys and workers */}
       {occ.apron && !plain && !skirted ? (
         <g>
           <path d="M -19 -64 L 19 -64 L 23 54 Q 0 62 -23 54 Z" fill={mix(PAL.bone, PAL.parchment, 0.42)} opacity={0.92} />
           <path d="M -19 -64 L 19 -64" stroke={PAL.bronze} strokeWidth={1.6} opacity={0.6} />
           <path d="M -10 18 L 10 18" stroke={PAL.bronze} strokeWidth={1.4} opacity={0.5} />
         </g>
       ) : null}

       {/* the head: neck, skull, face patch, headwear, the doctor's spectacles */}
       <g transform={`rotate(${base.head} 0 ${HEAD_Y + HEAD_R})`}>
         <rect x={-7} y={-148} width={14} height={28} fill={PAL.charcoal} />
         <circle cx={0} cy={HEAD_Y} r={HEAD_R} fill={PAL.charcoal} />
         <Face mode={base.face} exp={plain ? 'neutral' : exp} uid={uid} />
         <Headwear kind={occ.head} plain={plain} t={t} />
         {occ.specs && base.face !== 'none' ? (
           <g stroke={PAL.bronze} strokeWidth={1.7} fill="none" opacity={0.9}>
             {base.face === 'front' ? (
               <>
                 <circle cx={-9} cy={-176} r={5.5} />
                 <circle cx={9} cy={-176} r={5.5} />
                 <path d="M -3.5 -176 L 3.5 -176" />
               </>
             ) : (
               <>
                 <circle cx={12} cy={-176} r={5.5} />
                 <path d="M 17.5 -177 L 23 -180" />
               </>
             )}
           </g>
         ) : null}
       </g>

       {/* the near arm, over the coat; the carry prop hangs from its hand */}
       {seg([armR.s, armR.e, armR.h], 15, true, plain)}
       {carry && carry !== 'sack' ? <CarryProps carry={carry} hx={armR.h[0]} hy={armR.h[1]} t={t} /> : null}
     </g>

     {/* the near leg and shoe (over the coat hem, so strides read) */}
     <g transform={`translate(0 ${hipDy})`}>{seg([legR.s, legR.e, legR.h], 17, true, plain)}</g>
     <Shoe ankle={legR.h} shin={legs[2] + legs[3]} />
     {!skirted ? <Shoe ankle={legL.h} shin={legs[0] + legs[1]} /> : null}

     {/* the skirt covers the legs; the feet peek below the hem; the apron sits over the skirt */}
     {skirted ? (
       <g transform={`translate(0 ${hipDy}) rotate(${base.torso * 0.3})`}>
         <path d="M -22 -10 C -30 54 -34 106 -37 144 L 37 144 C 34 106 30 54 22 -10 Z" fill={PAL.charcoal} />
         {!plain ? (
           <g opacity={0.6}>
             {[-17, -5, 9, 21].map((cx, i) => (
               <path key={i} d={`M ${cx} ${-6} C ${cx * 1.25} 50 ${cx * 1.3} 100 ${cx * 1.32} 138`} stroke={PAL.bronze} strokeWidth={1.5} fill="none" opacity={0.5} />
             ))}
             <path d="M -36 138 L 36 138" stroke={EDGE} strokeWidth={1.6} opacity={0.4} />
           </g>
         ) : null}
         {occ.apron && !plain ? (
           <g>
             <path d="M -18 -58 L 18 -58 L 22 60 Q 0 68 -22 60 Z" fill={mix(PAL.bone, PAL.parchment, 0.42)} opacity={0.92} />
             <path d="M -18 -58 L 18 -58" stroke={PAL.bronze} strokeWidth={1.6} opacity={0.6} />
           </g>
         ) : null}
       </g>
     ) : null}
     {skirted ? (
       <g>
         <Shoe ankle={legR.h} shin={legs[2] + legs[3]} />
         <Shoe ankle={legL.h} shin={legs[0] + legs[1]} />
       </g>
     ) : null}

     {/* the stool for seated poses */}
     {base.seat ? (
       <g>
         <rect x={-24} y={92} width={48} height={9} rx={2} fill={mix(PAL.bronze, PAL.charcoal, 0.45)} />
         <path d="M -18 101 L -22 138 M 18 101 L 22 138" stroke={mix(PAL.bronze, PAL.charcoal, 0.5)} strokeWidth={5} strokeLinecap="round" />
       </g>
     ) : null}
   </g>
 );
};

// ------------------------------------------------------------------------------------------ the figure sheet

const SIGNATURE: Record<Occupation, { pose: PoseName; carry?: Carry; exp?: 'neutral' | 'strain' | 'grimace' }> = {
 climbing_boy: { pose: 'climbing', carry: 'brush', exp: 'strain' },
 master_sweep: { pose: 'carrying', carry: 'brush' },
 gentleman: { pose: 'pointing' },
 doctor: { pose: 'writing' },
 mother: { pose: 'carrying', carry: 'sack' },
 workhouse_master: { pose: 'pointing' },
 miner: { pose: 'kneeling', carry: 'lamp' },
 match_worker: { pose: 'crouching' },
 factory_worker: { pose: 'standing', exp: 'strain' },
 child: { pose: 'crouching' },
};
const ORDER: Occupation[] = ['climbing_boy', 'master_sweep', 'gentleman', 'doctor', 'mother', 'workhouse_master', 'miner', 'match_worker', 'factory_worker', 'child'];

/** The figure sheet: every occupation × key poses (standing, its signature, walking) over parchment, on baseline
*  rows, labelled in small Inter. Render a still after touching anything here:
*    npx remotion still src/index.ts FigureSheet out/figuresheet.png */
export const FigureSheet: React.FC = () => {
 const rows = [ORDER.slice(0, 5), ORDER.slice(5, 10)];
 return (
   <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
     <rect width={1920} height={1080} fill={PAL.parchment} />
     <ParchmentBase id="figuresheet" o={0.55} />
     {/* the plate border */}
     <rect x={36} y={30} width={1848} height={1020} fill="none" stroke={PAL.charcoal} strokeWidth={3} opacity={0.85} />
     <rect x={48} y={42} width={1824} height={996} fill="none" stroke={PAL.bronze} strokeWidth={1.5} opacity={0.7} />
     {/* the header */}
     <text x={960} y={104} textAnchor="middle" fontFamily={HISTFONT.title} fontWeight={700} fontSize={46} letterSpacing={10} fill={PAL.charcoal}>
       THE UNSEEN PAST
     </text>
     <text x={960} y={140} textAnchor="middle" fontFamily={HISTFONT.label} fontWeight={600} fontSize={21} letterSpacing={8} fill={mix(PAL.bronze, PAL.charcoal, 0.25)}>
       FIGURE SHEET — THE CAST
     </text>
     <path d="M 700 158 L 1220 158" stroke={PAL.bronze} strokeWidth={2} opacity={0.7} />
     {rows.map((row, r) => {
       const ground = r === 0 ? 500 : 1002;
       return (
         <g key={r}>
           {row.map((occ, c) => {
             const cx = 192 + c * 384;
             const sig = SIGNATURE[occ];
             const items: { pose: PoseName; carry?: Carry; exp?: 'neutral' | 'strain' | 'grimace' }[] = [{ pose: 'standing' }, sig, { pose: 'walking' }];
             const occS = OCC[occ].s;
             const scale = occS < 0.8 ? 0.62 : 0.52; // small folk drawn a touch larger so they read
             return (
               <g key={occ}>
                 <text x={cx} y={ground - 252} textAnchor="middle" fontFamily={HISTFONT.label} fontWeight={700} fontSize={21} letterSpacing={2.5} fill={PAL.charcoal}>
                   {occ.toUpperCase().replace('_', ' ')}
                 </text>
                 <path d={`M ${cx - 150} ${ground - 236} L ${cx + 150} ${ground - 236}`} stroke={PAL.bronze} strokeWidth={1.2} opacity={0.5} />
                 <path d={`M ${cx - 168} ${ground} L ${cx + 168} ${ground}`} stroke={PAL.charcoal} strokeWidth={2} opacity={0.55} />
                 {items.map((it, i) => (
                   <g key={i}>
                     <Figure occupation={occ} pose={it.pose} carry={it.carry} exp={it.exp} x={cx - 124 + i * 124} y={figY(ground, occ, scale)} scale={scale} t={i === 2 ? 8 : 0} facing="right" />
                     <text x={cx - 124 + i * 124} y={ground + 32} textAnchor="middle" fontFamily={HISTFONT.label} fontWeight={400} fontSize={15} letterSpacing={1.5} fill={mix(PAL.bronze, PAL.charcoal, 0.2)}>
                       {it.pose.toUpperCase()}
                     </text>
                   </g>
                 ))}
               </g>
             );
           })}
         </g>
       );
     })}
     <text x={960} y={1046} textAnchor="middle" fontFamily={HISTFONT.label} fontWeight={400} fontSize={16} letterSpacing={3} fill={mix(PAL.bronze, PAL.charcoal, 0.15)} opacity={0.85}>
       ADULT ≈ 360 UNITS HEAD TO TOE · BOYS AND CHILDREN AT 0.62 · FLAT VECTOR, CHARCOAL ON PARCHMENT
     </text>
   </svg>
 );
};

import React from 'react';
import { PAL, mix } from './palette';

// The environments: eight period sets, each built as three layered groups so the camera can parallax them —
// background at 0.3x, midground at 1.0x (the plane the characters stand on), foreground at 1.5x. A lateral
// pan of dx therefore offsets the layers by dx*0.3 / dx / dx*1.5 (HistScene passes that dx as `px`).
//
// Drawing rules: flat fills from the palette and `mix`es of two tokens, one local linear gradient per sky
// or depth fade (id-namespaced), silhouette shapes for the far layer, simple geometry for structures, and
// a dark foreground pass (frames, machinery edges, hanging things) to give depth without gradients.

export type EnvironmentName =
  | 'mine_tunnel'
  | 'factory_floor'
  | 'victorian_street'
  | 'workhouse_interior'
  | 'sewer_tunnel'
  | 'hospital_ward'
  | 'medieval_workshop'
  | 'railway_construction';

export const ENVIRONMENTS: EnvironmentName[] = [
  'mine_tunnel',
  'factory_floor',
  'victorian_street',
  'workhouse_interior',
  'sewer_tunnel',
  'hospital_ward',
  'medieval_workshop',
  'railway_construction',
];

/** The ground line the cast stands on, per environment (world y for the feet). */
export const GROUND: Record<EnvironmentName, number> = {
  mine_tunnel: 870,
  factory_floor: 880,
  victorian_street: 900,
  workhouse_interior: 880,
  sewer_tunnel: 850,
  hospital_ward: 880,
  medieval_workshop: 890,
  railway_construction: 900,
};

const H = 1080;

/** One environment. `id` namespaces gradient defs; `px` is the camera's lateral pan in world pixels. */
export const Environment: React.FC<{ name: EnvironmentName; id: string; px?: number }> = ({ name, id, px = 0 }) => {
  const wall = mix(PAL.parchment, PAL.bronze, 0.22);
  const deep = mix(PAL.parchment, PAL.charcoal, 0.45);
  const far = mix(PAL.parchment, PAL.charcoal, 0.6);
  const floor = mix(PAL.parchment, PAL.bronze, 0.3);
  const stone = mix(PAL.parchment, PAL.charcoal, 0.2);
  return (
    <g>
      <g transform={`translate(${-px * 0.3} 0)`}>{name === 'mine_tunnel' ? <MineBack id={id} deep={deep} far={far} /> : null}</g>
      <g transform={`translate(${-px * 1.0} 0)`}>{name === 'mine_tunnel' ? <MineMid stone={stone} floor={floor} /> : null}</g>
      <g transform={`translate(${-px * 1.5} 0)`}>{name === 'mine_tunnel' ? <MineFront /> : null}</g>
      <g transform={`translate(${-px * 0.3} 0)`}>{name === 'factory_floor' ? <FactoryBack id={id} deep={deep} wall={wall} /> : null}</g>
      <g transform={`translate(${-px * 1.0} 0)`}>{name === 'factory_floor' ? <FactoryMid floor={floor} /> : null}</g>
      <g transform={`translate(${-px * 1.5} 0)`}>{name === 'factory_floor' ? <FactoryFront /> : null}</g>
      <g transform={`translate(${-px * 0.3} 0)`}>{name === 'victorian_street' ? <StreetBack id={id} far={far} /> : null}</g>
      <g transform={`translate(${-px * 1.0} 0)`}>{name === 'victorian_street' ? <StreetMid wall={wall} /> : null}</g>
      <g transform={`translate(${-px * 1.5} 0)`}>{name === 'victorian_street' ? <StreetFront /> : null}</g>
      <g transform={`translate(${-px * 0.3} 0)`}>{name === 'workhouse_interior' ? <WorkhouseBack deep={deep} wall={wall} /> : null}</g>
      <g transform={`translate(${-px * 1.0} 0)`}>{name === 'workhouse_interior' ? <WorkhouseMid floor={floor} /> : null}</g>
      <g transform={`translate(${-px * 1.5} 0)`}>{name === 'workhouse_interior' ? <WorkhouseFront /> : null}</g>
      <g transform={`translate(${-px * 0.3} 0)`}>{name === 'sewer_tunnel' ? <SewerBack id={id} deep={deep} far={far} /> : null}</g>
      <g transform={`translate(${-px * 1.0} 0)`}>{name === 'sewer_tunnel' ? <SewerMid stone={stone} floor={floor} /> : null}</g>
      <g transform={`translate(${-px * 1.5} 0)`}>{name === 'sewer_tunnel' ? <SewerFront /> : null}</g>
      <g transform={`translate(${-px * 0.3} 0)`}>{name === 'hospital_ward' ? <WardBack deep={deep} wall={wall} /> : null}</g>
      <g transform={`translate(${-px * 1.0} 0)`}>{name === 'hospital_ward' ? <WardMid floor={floor} /> : null}</g>
      <g transform={`translate(${-px * 1.5} 0)`}>{name === 'hospital_ward' ? <WardFront /> : null}</g>
      <g transform={`translate(${-px * 0.3} 0)`}>{name === 'medieval_workshop' ? <MedievalBack id={id} deep={deep} wall={wall} /> : null}</g>
      <g transform={`translate(${-px * 1.0} 0)`}>{name === 'medieval_workshop' ? <MedievalMid floor={floor} stone={stone} /> : null}</g>
      <g transform={`translate(${-px * 1.5} 0)`}>{name === 'medieval_workshop' ? <MedievalFront /> : null}</g>
      <g transform={`translate(${-px * 0.3} 0)`}>{name === 'railway_construction' ? <RailwayBack id={id} far={far} /> : null}</g>
      <g transform={`translate(${-px * 1.0} 0)`}>{name === 'railway_construction' ? <RailwayMid floor={floor} /> : null}</g>
      <g transform={`translate(${-px * 1.5} 0)`}>{name === 'railway_construction' ? <RailwayFront /> : null}</g>
    </g>
  );

  // ---- mine_tunnel: a low brick tunnel receding to black, rails on the floor, props in the dark ------------
  function MineBack({ id, deep, far }: { id: string; deep: string; far: string }) {
    return (
      <g>
        <defs>
          <linearGradient id={`${id}-tun`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={far} />
            <stop offset="100%" stopColor={deep} />
          </linearGradient>
        </defs>
        <rect width={1920} height={H} fill={`url(#${id}-tun)`} />
        <path d="M 0 0 L 0 1080 L 560 1080 Q 760 640 960 620 Q 1160 640 1360 1080 L 1920 1080 L 1920 0 Z" fill={PAL.charcoal} opacity={0.9} />
        <path d="M 340 240 Q 960 120 1580 240" stroke={deep} strokeWidth={10} fill="none" opacity={0.6} />
      </g>
    );
  }
  function MineMid({ stone, floor }: { stone: string; floor: string }) {
    return (
      <g>
        {/* brick courses on the visible wall */}
        {Array.from({ length: 6 }).map((_, r) => (
          <g key={r}>
            {Array.from({ length: 7 }).map((_, c) => (
              <rect key={c} x={30 + c * 150 + (r % 2) * 75} y={120 + r * 62} width={138} height={52} rx={4} fill={stone} opacity={0.5} />
            ))}
          </g>
        ))}
        <rect x={0} y={880} width={1920} height={H - 880} fill={floor} />
        <path d="M 0 950 L 1920 950" stroke={mix(PAL.bronze, PAL.charcoal, 0.3)} strokeWidth={6} />
        <path d="M 0 996 L 1920 996" stroke={mix(PAL.bronze, PAL.charcoal, 0.3)} strokeWidth={6} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <path key={i} d={`M ${i * 320} 946 l 26 8 M ${i * 320 + 26} 992 l -26 -8`} stroke={mix(PAL.bronze, PAL.charcoal, 0.4)} strokeWidth={5} />
        ))}
      </g>
    );
  }
  function MineFront() {
    return (
      <g fill={mix(PAL.charcoal, PAL.parchment, 0.08)}>
        {/* roof timbers and hanging cable, close and dark */}
        <rect x={-40} y={30} width={2000} height={26} />
        <rect x={120} y={56} width={22} height={150} />
        <rect x={1480} y={56} width={22} height={170} />
        <path d="M 240 56 Q 700 170 1180 70" stroke={mix(PAL.charcoal, PAL.parchment, 0.05)} strokeWidth={8} fill="none" />
        <path d="M 705 150 L 705 260" stroke={mix(PAL.charcoal, PAL.parchment, 0.05)} strokeWidth={6} />
      </g>
    );
  }

  // ---- factory_floor: a bay of the mill, tall windows, shafting overhead, the loom line ----------------------
  function FactoryBack({ id, deep, wall }: { id: string; deep: string; wall: string }) {
    return (
      <g>
        <defs>
          <linearGradient id={`${id}-mil`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={mix(PAL.parchment, PAL.bone, 0.3)} />
            <stop offset="100%" stopColor={wall} />
          </linearGradient>
        </defs>
        <rect width={1920} height={H} fill={`url(#${id}-mil)`} />
        {/* far windows */}
        {[80, 460, 840, 1220, 1600].map((x) => (
          <g key={x}>
            <rect x={x} y={110} width={230} height={420} fill={mix(PAL.bone, PAL.parchment, 0.4)} opacity={0.9} />
            <path d={`M ${x + 115} 110 L ${x + 115} 530 M ${x} 320 L ${x + 230} 320`} stroke={deep} strokeWidth={8} />
            <rect x={x - 8} y={102} width={246} height={436} fill="none" stroke={deep} strokeWidth={7} />
          </g>
        ))}
      </g>
    );
  }
  function FactoryMid({ floor }: { floor: string }) {
    return (
      <g>
        <rect x={0} y={880} width={1920} height={H - 880} fill={floor} />
        {/* line-shafting overhead with belts dropping to the machines */}
        <rect x={0} y={150} width={1920} height={16} fill={mix(PAL.charcoal, PAL.parchment, 0.12)} />
        {[300, 700, 1100, 1500].map((x) => (
          <g key={x}>
            <circle cx={x} cy={158} r={26} fill={mix(PAL.charcoal, PAL.parchment, 0.1)} />
            <path d={`M ${x - 18} 176 Q ${x - 60} 320 ${x - 30} 470 M ${x + 18} 176 Q ${x + 60} 320 ${x + 30} 470`} stroke={mix(PAL.charcoal, PAL.parchment, 0.08)} strokeWidth={9} fill="none" />
          </g>
        ))}
        <path d="M 0 620 L 1920 620" stroke={mix(PAL.parchment, PAL.charcoal, 0.35)} strokeWidth={4} opacity={0.5} />
      </g>
    );
  }
  function FactoryFront() {
    return (
      <g fill={mix(PAL.charcoal, PAL.parchment, 0.08)}>
        <rect x={-40} y={560} width={70} height={520} />
        <rect x={1900} y={500} width={70} height={580} />
        <rect x={-40} y={1030} width={2000} height={60} />
      </g>
    );
  }

  // ---- victorian_street: a terrace row, a corner lamp, cobblestones ------------------------------------------
  function StreetBack({ far }: { id: string; far: string }) {
    return (
      <g>
        <rect width={1920} height={H} fill={far} />
        {/* the far terrace, chimneyed and regular */}
        {Array.from({ length: 5 }).map((_, i) => (
          <g key={i} fill={mix(PAL.parchment, PAL.charcoal, 0.52)}>
            <rect x={i * 400 + 20} y={260} width={340} height={640} />
            <rect x={i * 400 + 90} y={170} width={44} height={100} />
            <rect x={i * 400 + 240} y={170} width={44} height={100} />
          </g>
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <g key={`w${i}`}>
            <rect x={i * 400 + 70} y={330} width={70} height={110} fill={mix(PAL.bone, PAL.parchment, 0.25)} opacity={0.8} />
            <rect x={i * 400 + 250} y={330} width={70} height={110} fill={mix(PAL.bone, PAL.parchment, 0.25)} opacity={0.8} />
          </g>
        ))}
      </g>
    );
  }
  function StreetMid({ wall }: { wall: string }) {
    return (
      <g>
        {/* the near terrace end-wall and pavement */}
        <rect x={0} y={300} width={230} height={600} fill={wall} />
        <rect x={0} y={250} width={230} height={60} fill={mix(PAL.charcoal, PAL.parchment, 0.25)} />
        <rect x={230} y={900} width={1690} height={180} fill={mix(PAL.parchment, PAL.bronze, 0.18)} />
        <path d="M 0 900 L 1920 900" stroke={mix(PAL.charcoal, PAL.parchment, 0.4)} strokeWidth={6} />
        {/* cobbles */}
        {Array.from({ length: 8 }).map((_, r) =>
          Array.from({ length: 12 }).map((_, c) => (
            <path key={`${r}-${c}`} d={`M ${40 + c * 165 + (r % 2) * 80} ${930 + r * 22} q 40 -12 80 0`} stroke={mix(PAL.bronze, PAL.charcoal, 0.35)} strokeWidth={3} fill="none" opacity={0.5} />
          )),
        )}
      </g>
    );
  }
  function StreetFront() {
    return (
      <g fill={mix(PAL.charcoal, PAL.parchment, 0.08)}>
        {/* a corner lamp post and the pub sign edge */}
        <rect x={1650} y={430} width={18} height={480} />
        <path d="M 1659 430 l -34 -40 l 68 0 Z" />
        <circle cx={1659} cy={402} r={16} fill={mix(PAL.bone, PAL.parchment, 0.2)} opacity={0.9} />
        <rect x={230} y={520} width={16} height={390} />
        <rect x={196} y={470} width={84} height={54} rx={6} />
      </g>
    );
  }

  // ---- workhouse_interior: the long dining hall, trestle tables, high windows --------------------------------
  function WorkhouseBack({ deep, wall }: { deep: string; wall: string }) {
    return (
      <g>
        <rect width={1920} height={H} fill={wall} />
        {[140, 620, 1100, 1580].map((x) => (
          <g key={x}>
            <rect x={x} y={140} width={200} height={330} fill={mix(PAL.bone, PAL.parchment, 0.35)} opacity={0.75} />
            <path d={`M ${x + 100} 140 L ${x + 100} 470 M ${x} 300 L ${x + 200} 300`} stroke={deep} strokeWidth={7} />
            <rect x={x - 7} y={133} width={214} height={344} fill="none" stroke={deep} strokeWidth={6} />
          </g>
        ))}
      </g>
    );
  }
  function WorkhouseMid({ floor }: { floor: string }) {
    return (
      <g>
        <rect x={0} y={880} width={1920} height={H - 880} fill={floor} />
        <path d="M 0 880 L 1920 880" stroke={mix(PAL.charcoal, PAL.parchment, 0.4)} strokeWidth={5} />
        {/* two long trestles with benches */}
        {[0, 1].map((r) => (
          <g key={r} transform={`translate(0 ${r * 190})`}>
            <rect x={120} y={640} width={1180} height={16} fill={mix(PAL.bronze, PAL.charcoal, 0.35)} />
            <path d="M 180 656 L 180 740 M 1180 656 L 1180 740 M 680 656 L 680 740" stroke={mix(PAL.bronze, PAL.charcoal, 0.4)} strokeWidth={10} />
            <rect x={220} y={740} width={1080} height={10} fill={mix(PAL.bronze, PAL.charcoal, 0.45)} />
          </g>
        ))}
      </g>
    );
  }
  function WorkhouseFront() {
    return (
      <g fill={mix(PAL.charcoal, PAL.parchment, 0.08)}>
        {/* the master's door frame, close */}
        <rect x={1560} y={330} width={26} height={570} />
        <rect x={1880} y={330} width={26} height={570} />
        <rect x={1560} y={304} width={346} height={28} />
        <circle cx={1630} cy={620} r={9} />
      </g>
    );
  }

  // ---- sewer_tunnel: the brick outfall, a channel of flow, low arch ------------------------------------------
  function SewerBack({ id, deep, far }: { id: string; deep: string; far: string }) {
    return (
      <g>
        <defs>
          <linearGradient id={`${id}-sew`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={deep} />
            <stop offset="100%" stopColor={mix(PAL.charcoal, PAL.parchment, 0.55)} />
          </linearGradient>
        </defs>
        <rect width={1920} height={H} fill={`url(#${id}-sew)`} />
        <path d="M 480 1080 L 480 420 Q 960 260 1440 420 L 1440 1080 Z" fill={mix(PAL.charcoal, PAL.parchment, 0.7)} />
        <path d="M 700 1080 L 700 520 Q 960 400 1220 520 L 1220 1080 Z" fill={far} opacity={0.9} />
      </g>
    );
  }
  function SewerMid({ stone, floor }: { stone: string; floor: string }) {
    return (
      <g>
        {Array.from({ length: 9 }).map((_, r) => (
          <g key={r}>
            {Array.from({ length: 6 }).map((_, c) => (
              <rect key={c} x={60 + c * 170 + (r % 2) * 85} y={r * 90} width={156} height={78} rx={6} fill={stone} opacity={0.35} />
            ))}
          </g>
        ))}
        <rect x={0} y={820} width={1920} height={H - 820} fill={mix(PAL.charcoal, PAL.bronze, 0.25)} />
        {/* the flow: two still bands, the near edge catching light */}
        <rect x={0} y={880} width={1920} height={90} fill={mix(PAL.charcoal, PAL.parchment, 0.4)} opacity={0.85} />
        <path d="M 0 880 L 1920 880" stroke={mix(PAL.bone, PAL.parchment, 0.4)} strokeWidth={4} opacity={0.5} />
        <rect x={0} y={970} width={1920} height={H - 970} fill={floor} opacity={0.7} />
      </g>
    );
  }
  function SewerFront() {
    return (
      <g fill={mix(PAL.charcoal, PAL.parchment, 0.06)}>
        <rect x={-40} y={0} width={120} height={1080} />
        <rect x={1840} y={0} width={120} height={1080} />
        <rect x={-40} y={-40} width={2000} height={140} />
      </g>
    );
  }

  // ---- hospital_ward: the long ward, a row of iron beds, big light from the left -----------------------------
  function WardBack({ deep, wall }: { deep: string; wall: string }) {
    return (
      <g>
        <rect width={1920} height={H} fill={mix(PAL.parchment, PAL.bone, 0.18)} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={300 + i * 460} y={130} width={250} height={360} fill={mix(PAL.bone, PAL.parchment, 0.5)} opacity={0.95} />
            <path d={`M ${425 + i * 460} 130 L ${425 + i * 460} 490 M ${300 + i * 460} 310 L ${550 + i * 460} 310`} stroke={deep} strokeWidth={7} />
            <rect x={293 + i * 460} y={123} width={264} height={374} fill="none" stroke={deep} strokeWidth={6} />
          </g>
        ))}
      </g>
    );
  }
  function WardMid({ floor }: { floor: string }) {
    return (
      <g>
        <rect x={0} y={880} width={1920} height={H - 880} fill={floor} />
        <path d="M 0 880 L 1920 880" stroke={mix(PAL.charcoal, PAL.parchment, 0.4)} strokeWidth={5} />
        {/* a row of iron beds receding right */}
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${i * 60} ${i * 40}) scale(${1 - i * 0.12})`} opacity={1 - i * 0.15}>
            <path d="M 480 840 L 480 700 M 900 840 L 900 716 M 480 706 L 900 720" stroke={mix(PAL.charcoal, PAL.parchment, 0.12)} strokeWidth={8} fill="none" strokeLinecap="round" />
            <path d="M 486 740 L 894 752" stroke={mix(PAL.bone, PAL.parchment, 0.45)} strokeWidth={16} strokeLinecap="round" />
          </g>
        ))}
      </g>
    );
  }
  function WardFront() {
    return (
      <g fill={mix(PAL.charcoal, PAL.parchment, 0.08)}>
        <rect x={-40} y={620} width={80} height={460} />
        {/* a screen at the ward's end */}
        <rect x={1780} y={480} width={140} height={420} rx={8} />
      </g>
    );
  }

  // ---- medieval_workshop: timber frame, hearth, the tanner's pits --------------------------------------------
  function MedievalBack({ id, deep, wall }: { id: string; deep: string; wall: string }) {
    return (
      <g>
        <defs>
          <linearGradient id={`${id}-med`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={mix(PAL.parchment, PAL.charcoal, 0.25)} />
            <stop offset="100%" stopColor={wall} />
          </linearGradient>
        </defs>
        <rect width={1920} height={H} fill={`url(#${id}-med)`} />
        {/* wattle daub panels between close timbers */}
        {[60, 300, 540, 780, 1020, 1260, 1500, 1740].map((x) => (
          <rect key={x} x={x} y={0} width={34} height={900} fill={deep} opacity={0.55} />
        ))}
        <path d="M 0 40 L 1920 40" stroke={deep} strokeWidth={26} opacity={0.55} />
      </g>
    );
  }
  function MedievalMid({ floor, stone }: { floor: string; stone: string }) {
    return (
      <g>
        <rect x={0} y={890} width={1920} height={H - 890} fill={floor} />
        <path d="M 0 890 L 1920 890" stroke={mix(PAL.charcoal, PAL.parchment, 0.4)} strokeWidth={5} />
        {/* the workbench and the stone hearth with its hood */}
        <rect x={1180} y={330} width={300} height={200} fill={stone} opacity={0.9} />
        <path d="M 1140 330 L 1520 330 L 1470 240 L 1190 240 Z" fill={mix(PAL.charcoal, PAL.parchment, 0.3)} />
        <rect x={1265} y={430} width={130} height={100} fill={mix(PAL.charcoal, PAL.parchment, 0.65)} />
        <rect x={140} y={700} width={520} height={18} fill={mix(PAL.bronze, PAL.charcoal, 0.35)} />
        <path d="M 190 718 L 190 890 M 610 718 L 610 890" stroke={mix(PAL.bronze, PAL.charcoal, 0.4)} strokeWidth={12} />
      </g>
    );
  }
  function MedievalFront() {
    return (
      <g fill={mix(PAL.charcoal, PAL.parchment, 0.08)}>
        {/* hanging hides and tools, close to the lens */}
        <path d="M 700 0 L 700 210 q 60 40 120 0 L 820 0 Z" />
        <rect x={1010} y={0} width={10} height={160} />
        <path d="M 960 160 l 50 46 l 50 -46 Z" />
      </g>
    );
  }

  // ---- railway_construction: the cutting, navvy embankment, rails running out --------------------------------
  function RailwayBack({ far }: { id: string; far: string }) {
    return (
      <g>
        <rect width={1920} height={H} fill={far} />
        {/* cut hillsides */}
        <path d="M 0 1080 L 0 520 Q 400 430 820 560 L 960 640 L 1920 560 L 1920 1080 Z" fill={mix(PAL.parchment, PAL.charcoal, 0.5)} />
        <path d="M 0 700 Q 500 600 960 700" stroke={mix(PAL.bronze, PAL.charcoal, 0.3)} strokeWidth={5} fill="none" opacity={0.4} />
      </g>
    );
  }
  function RailwayMid({ floor }: { floor: string }) {
    return (
      <g>
        <rect x={0} y={840} width={1920} height={H - 840} fill={floor} />
        {/* the permanent way running out to the right */}
        <path d="M -40 1010 L 1960 850" stroke={mix(PAL.charcoal, PAL.parchment, 0.2)} strokeWidth={9} fill="none" />
        <path d="M -40 1040 L 1960 874" stroke={mix(PAL.charcoal, PAL.parchment, 0.2)} strokeWidth={9} fill="none" />
        {Array.from({ length: 16 }).map((_, i) => {
          const y = 1015 - i * 10.5;
          const x = i * 128 - 30;
          return <path key={i} d={`M ${x} ${y + 18} L ${x + 60} ${y - 16}`} stroke={mix(PAL.bronze, PAL.charcoal, 0.4)} strokeWidth={12} opacity={0.9} />;
        })}
        {/* a spoil heap */}
        <path d="M 1150 840 Q 1330 730 1520 840 Z" fill={mix(PAL.parchment, PAL.bronze, 0.4)} />
      </g>
    );
  }
  function RailwayFront() {
    return (
      <g fill={mix(PAL.charcoal, PAL.parchment, 0.08)}>
        {/* a tipper wagon end and a beam, close */}
        <rect x={-60} y={560} width={200} height={340} rx={10} />
        <circle cx={40} cy={940} r={44} fill={mix(PAL.charcoal, PAL.parchment, 0.05)} />
        <rect x={1620} y={300} width={22} height={620} />
        <rect x={1560} y={280} width={150} height={24} />
      </g>
    );
  }
};

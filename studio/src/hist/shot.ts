import type { Carry } from './figures';

// The shot vocabulary: the plain-data types a shots.json entry is made of. The engine (engine/episode.tsx)
// times the shots; HistScene (hist/scene.tsx) turns one of these specs into a frame. Everything here is
// JSON-serialisable on purpose — the pipeline authors shot lists, the studio only renders them.
//
// Occupation and PoseName mirror the figure system in figures.tsx exactly (its OCC table and POSES table are
// keyed by these unions — extend both together or the sheet will not compile).

export type Occupation =
  | 'climbing_boy'
  | 'master_sweep'
  | 'gentleman'
  | 'doctor'
  | 'mother'
  | 'workhouse_master'
  | 'miner'
  | 'match_worker'
  | 'factory_worker'
  | 'child';

export type PoseName = 'standing' | 'walking' | 'climbing' | 'crouching' | 'kneeling' | 'carrying' | 'reaching' | 'pointing' | 'writing' | 'still';

export type Expression = 'neutral' | 'strain' | 'grimace';
export type Facing = 'left' | 'right';

export type { Carry };

/** A pose key: at frame `at` of the shot's clock the figure snaps to `pose`. Reads as a cut between poses —
*  the flat-vector rule. HistScene crossfades two frames either side so the cut is not a flicker. */
export type PoseKey = { at: number; pose: PoseName };

/** One character placement. x, y are world pixels; y is the HIP (use figures.figY(ground, occupation, scale)). */
export type CharacterSpec = {
  occupation: Occupation;
  pose: PoseName | PoseKey[];
  facing?: Facing;
  x: number;
  y: number;
  scale?: number;
  exp?: Expression;
  carry?: Carry;
};

/** Camera moves, and only these: a slow push (2–4% over 2 s, then hold), a lateral pan (5–10% over 2 s,
*  then hold), or a hold. No zoom punches, no shake, no whip pans — the genre forbids them. */
export type CameraSpec =
  | { kind: 'push'; pct?: number } // pct = total scale gain, default 0.03
  | { kind: 'pan'; pct?: number; dir?: 'left' | 'right' } // pct = fraction of frame width, default 0.075
  | { kind: 'hold' };

export type LightSpec = {
  kind: 'lamp' | 'window' | 'fire' | 'candle';
  x: number;
  y: number;
  intensity?: number; // 0..1, default 0.6
};

/** Overlay text. At most four words per element — titles.tsx truncates harder strings defensively. */
export type OverlaySpec = {
  actTitle?: string; // Cinzel 96px act title card (kicker above it)
  kicker?: string; // small line above the act title
  label?: string; // Inter Bold 48px on-screen label
  caption?: string; // Inter 28px source caption, bottom left
  labelAt?: number; // frame (shot clock) the label appears
  titleAt?: number; // frame the act title appears
};

/** A document or map laid over the scene (letters, acts, reports; Britain/London maps with region states). */
export type InsertSpec =
  | { insert: 'document'; kind: 'letter' | 'act' | 'report'; x: number; y: number; s?: number; rot?: number; title?: string; lines?: number; highlight?: number; highlightAt?: number }
  | { insert: 'britain' | 'london'; x: number; y: number; s?: number; regions: { name: string; state: 'idle' | 'active' | 'dim' }[] };

/** The full spec of one shot: what HistScene draws for every frame of its clock. */
export type SceneSpec = {
  environment: string; // an EnvironmentName — kept `string` so JSON loads before validation
  camera?: CameraSpec;
  light?: LightSpec;
  characters?: CharacterSpec[];
  props?: { kind: string; x: number; y: number; s?: number; rot?: number; t?: number }[];
  inserts?: InsertSpec[];
  overlay?: OverlaySpec;
};

/** One entry of shots.json: when the shot runs and what it shows. `key` is the storyboard still frame;
*  `source` is a research.json source id, resolved to the shot's caption text by the episode scaffold. */
export type ShotEntry = {
  id: string;
  start: number; // global frame the shot begins
  len: number; // frames it runs
  key?: number; // frame (shot clock) used for the storyboard still
  note?: string;
  source?: string; // a research.json source id for the evidence caption
  spec?: SceneSpec; // absent for shots coded by hand in shots.tsx
};

/** An act of the five-act arc, with its chapter timestamp for chapters.txt. */
export type Act = { id: string; title: string; startF: number };

/** Word-level voice timing, as written by the voice stage ({ w, s, e } = word, start sec, end sec). */
export type WordTiming = { w: string; s: number; e: number };

// --- JSON adapters -------------------------------------------------------------------------------------------
// The pipeline's shot list (schemas/shots.schema.json) times shots in seconds and names environments and
// cameras with short keys; the studio's ShotEntry/SceneSpec are the rendered forms. `normalizeShotList`
// accepts either shape (pipeline or the hand-written form) and fills sensible defaults, so shots.json stays
// the sole driver of visual state whichever agent wrote it.

const ENVS: Record<string, string> = {
  mine: 'mine_tunnel',
  factory: 'factory_floor',
  street: 'victorian_street',
  workhouse: 'workhouse_interior',
  sewer: 'sewer_tunnel',
  hospital: 'hospital_ward',
  medieval: 'medieval_workshop',
  railway: 'railway_construction',
  home: 'workhouse_interior',
};

const CAMS: Record<string, CameraSpec> = {
  hold: { kind: 'hold' },
  slow_push: { kind: 'push' },
  detail_push: { kind: 'push', pct: 0.04 },
  lateral_pan: { kind: 'pan' },
  pan: { kind: 'pan' },
  push: { kind: 'push' },
};

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);

const normEnv = (name: string | undefined): string => {
  const key = name ?? 'street';
  return ENVS[key] ?? (Object.values(ENVS).includes(key) ? key : 'victorian_street');
};

const normChar = (v: unknown): CharacterSpec | null => {
  if (!isObj(v)) return null;
  const occupation = str(v.occupation);
  const x = num(v.x);
  const y = num(v.y);
  if (!occupation || x === undefined || y === undefined) return null;
  const pose = str(v.pose) ?? (Array.isArray(v.pose) ? (v.pose as PoseKey[]) : 'standing');
  return {
    occupation: occupation as CharacterSpec['occupation'],
    pose: pose as CharacterSpec['pose'],
    facing: str(v.facing) as CharacterSpec['facing'],
    x,
    y,
    scale: num(v.scale),
    exp: str(v.exp) as CharacterSpec['exp'],
    carry: str(v.carry) as CharacterSpec['carry'],
  };
};

/** Accepts `{ shots: [...] }` in either schema and returns timed ShotEntries (frames at 30 fps). */
export const normalizeShotList = (raw: unknown): ShotEntry[] => {
  const list = isObj(raw) && Array.isArray(raw.shots) ? raw.shots : [];
  return list.flatMap((s): ShotEntry[] => {
    if (!isObj(s)) return [];
    const fps = 30;
    const startS = num(s.start_s);
    const endS = num(s.end_s);
    const start = startS !== undefined ? Math.round(startS * fps) : num(s.start) ?? 0;
    const len = endS !== undefined ? Math.max(1, Math.round(endS * fps) - start) : num(s.len) ?? 60;
    const spec =
      isObj(s.spec)
        ? (s.spec as SceneSpec)
        : {
            environment: normEnv(str(s.environment)),
            camera: CAMS[str(s.camera_move) ?? 'hold'] ?? { kind: 'hold' as const },
            characters: Array.isArray(s.characters) ? s.characters.map(normChar).filter((c): c is CharacterSpec => c !== null) : [],
          };
    return [
      {
        id: str(s.shot_id) ?? str(s.id) ?? `S${start}`,
        start,
        len,
        key: num(s.key),
        note: str(s.description) ?? str(s.note),
        source: str(s.source_id) ?? (str(s.source) || undefined),
        spec,
      },
    ];
  });
};

/** Accepts the pipeline's acts (`{ act_number, act_name, start_s }`) or the plain form (`{ id, title, startF }`). */
export const normalizeActs = (raw: unknown, totalF = 9000): Act[] => {
  const list = Array.isArray(raw) ? raw : isObj(raw) && Array.isArray((raw as { acts?: unknown }).acts) ? (raw as { acts: unknown[] }).acts : [];
  return list.flatMap((a): Act[] => {
    if (!isObj(a)) return [];
    const startS = num(a.start_s);
    const startF = startS !== undefined ? Math.round(startS * 30) : num(a.startF) ?? num(a.start) ?? 0;
    return [{ id: str(a.id) ?? `act${num(a.act_number) ?? 0}`, title: str(a.act_name) ?? str(a.title) ?? 'Untitled', startF: Math.min(startF, totalF) }];
  });
};

/** Word timings from whatever array the voice stage wrote: `{ w, s, e }` (engine form) or
* `{ word, start_s, end_s }` (pipeline form — scripts/voice.py and the authored words.json). */
export const normalizeWords = (raw: unknown): WordTiming[] =>
  (Array.isArray(raw) ? raw : []).flatMap((w) => {
    if (!isObj(w)) return [];
    const word = str(w.w) ?? str(w.word);
    const s = num(w.s) ?? num(w.start_s);
    const e = num(w.e) ?? num(w.end_s);
    return word !== undefined && s !== undefined && e !== undefined ? [{ w: word, s, e }] : [];
  });

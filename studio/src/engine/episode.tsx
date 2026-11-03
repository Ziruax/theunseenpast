import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { clamp, lerp } from './anim';

// The episode engine. Two layers share this file:
//
//  1. The word-sync timeline machinery (unchanged): an episode is a Timeline — a set of shots plus a segment
//     list written from the voice's word timings — and every shot is a pure function of its own clock t, so
//     the edit can cut back to a shot, hold it, or play it backwards.
//  2. The documentary layer (new): a 300 s / 9000-frame episode driven directly by a shot list (shots.json),
//     with act metadata for chapter timestamps. HistScene shots need no code at all.
//
// Both render through the same frame: vignette and a fine grain on twos, the genre's finish.

// --- the shared clock ---------------------------------------------------------------------------------------

/** What every shot receives: its own clock t, how long its clock runs (len), and the global frame f. */
export type ShotProps = { t: number; len: number; f: number };
export type ShotMap = Record<string, React.FC<ShotProps>>;

// --- the word-sync timeline (legacy machinery, kept) ---------------------------------------------------------

export type Seg = {
  shot: string; // shot id (S1, S2...)
  a: number; // first global frame
  b: number; // first frame after it
  t0: number; // the shot's clock at a
  t1: number; // the shot's clock at b (smaller than t0 when the segment plays backwards)
  look?: string; // a named look (grade + overlay) the episode defines while it runs
  line?: string; // the words spoken over it (for the storyboard)
};
export type ShotInfo = { id: string; size: string; key: number; len: number; first: number; line?: string; note?: string };
export type Fx = { f: number; kind: 'flash'; color?: string; o?: number };
export type Timeline = {
  slug: string;
  title: string;
  fps: number;
  total: number;
  segments: Seg[];
  shots: ShotInfo[];
  fx: Fx[];
  audio: { voice?: string; sfx?: string; music?: string; voiceVol?: number; sfxVol?: number; musicVol?: number };
};

/** A look: a CSS grade on the picture and an overlay on top while segments with this look run. */
export type LookDef = {
  grade?: (lv: number) => string;
  Overlay?: React.FC<{ f: number; lv: number; p: number; n: number }>; // p: progress through this run, n: which run
};

const segAt = (tl: Timeline, f: number) => tl.segments.find((s) => f >= s.a && f < s.b) ?? tl.segments[tl.segments.length - 1];
const clockAt = (s: Seg, f: number) => (s.t1 - s.t0 === s.b - s.a ? s.t0 + (f - s.a) : lerp(s.t0, s.t1, (f - s.a) / (s.b - s.a)));

/** Runs of neighbouring segments sharing a look, so a look spanning two shots doesn't blink at the cut. */
const lookRuns = (tl: Timeline) => {
  const runs: { look: string; a: number; b: number; n: number }[] = [];
  const count: Record<string, number> = {};
  for (const s of tl.segments) {
    if (!s.look) continue;
    const last = runs[runs.length - 1];
    if (last && last.look === s.look && last.b === s.a) last.b = s.b;
    else {
      runs.push({ look: s.look, a: s.a, b: s.b, n: count[s.look] ?? 0 });
      count[s.look] = (count[s.look] ?? 0) + 1;
    }
  }
  return runs;
};

const flashAt = (tl: Timeline, f: number) => {
  for (const e of tl.fx) {
    if (f === e.f) return { color: e.color ?? '#FFFFFF', o: e.o ?? 0.85 };
    if (f === e.f + 1) return { color: e.color ?? '#FFFFFF', o: (e.o ?? 0.85) * 0.35 };
  }
  return null;
};

/** Vignette and a fine grain that changes on twos, to take the vector edge off (the genre's finish). */
const Grade: React.FC<{ f: number; grain: boolean; vignette: boolean }> = ({ f, grain, vignette }) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
    <defs>
      <radialGradient id="epVig" cx="50%" cy="50%" r="75%">
        <stop offset="55%" stopColor="#000" stopOpacity={0} />
        <stop offset="100%" stopColor="#000" stopOpacity={0.55} />
      </radialGradient>
      <filter id="epGrain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={Math.floor(f / 2) % 97} />
        <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.06 0" />
      </filter>
    </defs>
    {vignette ? <rect width="1920" height="1080" fill="url(#epVig)" /> : null}
    {grain ? <rect width="1920" height="1080" filter="url(#epGrain)" /> : null}
  </svg>
);

/** One shot drawn in a 1920 x 1080 world. */
export const ShotFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    {children}
  </svg>
);

export type EpisodeProps = { timeline: Timeline; shots: ShotMap; looks?: Record<string, LookDef>; grain?: boolean; vignette?: boolean; bg?: string };

export const Episode: React.FC<EpisodeProps> = ({ timeline: tl, shots, looks = {}, grain = true, vignette = true, bg = '#20201D' }) => {
  const f = useCurrentFrame();
  const seg = segAt(tl, f);
  const Shot = shots[seg.shot];
  const info = tl.shots.find((s) => s.id === seg.shot);
  const run = lookRuns(tl).find((r) => f >= r.a && f < r.b);
  const def = run ? looks[run.look] : undefined;
  const lv = run ? Math.min(clamp((f - run.a + 1) / 2), clamp((run.b - f) / 2)) : 0;
  const flash = flashAt(tl, f);
  const A = tl.audio;
  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <AbsoluteFill style={{ filter: def?.grade && lv > 0 ? def.grade(lv) : undefined }}>
        <ShotFrame>{Shot ? <Shot t={clockAt(seg, f)} len={info?.len ?? seg.b - seg.a} f={f} /> : null}</ShotFrame>
      </AbsoluteFill>
      <Grade f={f} grain={grain} vignette={vignette} />
      {def?.Overlay && run ? (
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, opacity: lv }}>
          <def.Overlay f={f} lv={lv} p={clamp((f - run.a) / (run.b - run.a))} n={run.n} />
        </svg>
      ) : null}
      {flash ? <AbsoluteFill style={{ backgroundColor: flash.color, opacity: flash.o }} /> : null}
      {A.voice ? <Audio src={staticFile(A.voice)} volume={A.voiceVol ?? 1} /> : null}
      {A.sfx ? <Audio src={staticFile(A.sfx)} volume={A.sfxVol ?? 1} /> : null}
      {A.music ? <Audio src={staticFile(A.music)} volume={A.musicVol ?? 1} /> : null}
    </AbsoluteFill>
  );
};

/** The storyboard: frame i is shot i at its key frame, no audio, no look. Render it with scripts/stills.mjs. */
export const Board: React.FC<{ timeline: Timeline; shots: ShotMap; grain?: boolean; vignette?: boolean; bg?: string }> = ({ timeline: tl, shots, grain = true, vignette = true, bg = '#20201D' }) => {
  const f = useCurrentFrame();
  const info = tl.shots[Math.min(f, tl.shots.length - 1)];
  const Shot = shots[info.id];
  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <ShotFrame>{Shot ? <Shot t={info.key} len={info.len} f={info.first + info.key} /> : null}</ShotFrame>
      <Grade f={info.key} grain={grain} vignette={vignette} />
    </AbsoluteFill>
  );
};

/** Bundle a legacy (timeline-driven) episode for the registry. */
export const defineEpisode = (id: string, p: EpisodeProps) => ({
  id,
  total: p.timeline.total,
  shotCount: p.timeline.shots.length,
  Main: () => <Episode {...p} />,
  Board: () => <Board timeline={p.timeline} shots={p.shots} grain={p.grain} vignette={p.vignette} bg={p.bg} />,
});

// --- the documentary layer -----------------------------------------------------------------------------------

/** The documentary's fixed frame: 300 s at 30 fps, 1920 x 1080. */
export const DOC = { fps: 30, width: 1920, height: 1080, durationInFrames: 9000, coldOpenFrames: 600 } as const;

export type { Act } from '../hist/shot'; // the act type lives with the shot vocabulary (hist/shot.ts)
import type { Act } from '../hist/shot';
export type DocAudio = { voice?: string; music?: string; voiceVol?: number; musicVol?: number };

export type DocumentaryProps = {
  shotList: { id: string; start: number; len: number; key?: number }[]; // one entry per shot, timed to the voice
  shots: ShotMap; // shot id -> component (HistScene-based, or bespoke code)
  audio?: DocAudio;
  grain?: boolean;
  vignette?: boolean;
  bg?: string;
};

/** The 300 s documentary: the shot list is the sole driver of visual state. Reads the list frame by frame and
*  renders whichever shot owns the current frame, at its own clock. */
export const Documentary: React.FC<DocumentaryProps> = ({ shotList, shots, audio, grain = true, vignette = true, bg = '#20201D' }) => {
  const f = useCurrentFrame();
  const entry = shotList.find((s) => f >= s.start && f < s.start + s.len) ?? shotList[shotList.length - 1];
  const Shot = entry ? shots[entry.id] : undefined;
  const A = audio ?? {};
  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <ShotFrame>{Shot && entry ? <Shot t={f - entry.start} len={entry.len} f={f} /> : null}</ShotFrame>
      <Grade f={f} grain={grain} vignette={vignette} />
      {A.voice ? <Audio src={staticFile(A.voice)} volume={A.voiceVol ?? 1} /> : null}
      {A.music ? <Audio src={staticFile(A.music)} volume={A.musicVol ?? 1} /> : null}
    </AbsoluteFill>
  );
};

/** The documentary storyboard: frame i is shot i at its key frame (or mid-shot), no audio. */
export const DocBoard: React.FC<{ shotList: DocumentaryProps['shotList']; shots: ShotMap; grain?: boolean; vignette?: boolean; bg?: string }> = ({ shotList, shots, grain = true, vignette = true, bg = '#20201D' }) => {
  const f = useCurrentFrame();
  const entry = shotList[Math.min(f, shotList.length - 1)];
  const Shot = entry ? shots[entry.id] : undefined;
  const key = entry?.key ?? Math.floor((entry?.len ?? 1) / 2);
  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <ShotFrame>{Shot && entry ? <Shot t={key} len={entry.len} f={entry.start + key} /> : null}</ShotFrame>
      <Grade f={key} grain={grain} vignette={vignette} />
    </AbsoluteFill>
  );
};

/** chapters.txt content: "0:00 The Cold Open" per act, as the renderer emits for YouTube. */
export const chaptersText = (acts: Act[], fps = DOC.fps): string =>
  acts
    .slice()
    .sort((a, b) => a.startF - b.startF)
    .map((a) => {
      const s = Math.round(a.startF / fps);
      return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} ${a.title}`;
    })
    .join('\n');

/** Bundle a documentary episode for the registry: main, board and the 20 s cold open (frames 0–600). */
export const defineDocEpisode = (id: string, p: { shotList: DocumentaryProps['shotList']; shots: ShotMap; total?: number; acts?: Act[]; audio?: DocAudio; grain?: boolean; vignette?: boolean; bg?: string }) => {
  const docProps: DocumentaryProps = { shotList: p.shotList, shots: p.shots, audio: p.audio, grain: p.grain, vignette: p.vignette, bg: p.bg };
  return {
    id,
    total: p.total ?? DOC.durationInFrames,
    shotCount: p.shotList.length,
    acts: p.acts ?? [],
    Main: () => <Documentary {...docProps} />,
    Board: () => <DocBoard shotList={p.shotList} shots={p.shots} grain={p.grain} vignette={p.vignette} bg={p.bg} />,
    ColdOpen: () => <Documentary {...docProps} />,
  };
};

export type EpisodeDef = {
  id: string;
  total: number;
  shotCount: number;
  Main: React.FC;
  Board: React.FC;
  ColdOpen: React.FC;
};

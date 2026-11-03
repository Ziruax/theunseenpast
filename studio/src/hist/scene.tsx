import React from 'react';
import { clamp, easeInOut } from '../engine/anim';
import { ParchmentBase } from './parchment';
import { Environment, type EnvironmentName } from './environments';
import { LightSource, Chiaroscuro } from './lighting';
import { Prop, type PropName } from './objects';
import { Figure, type FigureProps } from './figures';
import { PeriodDocument, MapBritain, MapLondon, type BritainRegion, type LondonRegion } from './documents';
import { ActTitle, OnScreenLabel, SourceCaption } from './titles';
import type { SceneSpec, CharacterSpec, CameraSpec, PoseKey } from './shot';

// HistScene: THE scene primitive. One component takes a SceneSpec (what a shots.json entry carries) plus the
// shot clock, and composes the whole frame in the genre's order:
//
//   parchment base -> camera (slow push/pan/hold) -> environment (3 parallax layers) -> light fixture ->
//   props and characters (the midground plane) -> chiaroscuro shadow -> inserts (documents, maps) ->
//   overlay text (act title, label, source caption)
//
// Nothing else is allowed between those layers. A shot that HistScene cannot express is a shot that needs
// bespoke code in the episode's shots.tsx — which wraps its own drawing in the same order.

export const DOC_FPS = 30;

/** The camera solve. Push gains `pct` scale over 2 s then holds; pan sweeps `pct` of frame width over 2 s
*  (eased) then holds; hold is hold. Returns the SVG transform for the world group. */
export const cameraAt = (cam: CameraSpec | undefined, t: number): { scale: number; x: number } => {
  const k = easeInOut(clamp(t / (2 * DOC_FPS)));
  if (!cam || cam.kind === 'hold') return { scale: 1, x: 0 };
  if (cam.kind === 'push') return { scale: 1 + (cam.pct ?? 0.03) * k, x: 0 };
  const dir = cam.kind === 'pan' && cam.dir === 'left' ? -1 : 1;
  return { scale: 1.02, x: dir * (cam.pct ?? 0.075) * 1920 * k };
};

/** The current pose for a keyed character, plus the outgoing pose while the 3-frame crossfade runs. */
const poseNow = (keys: PoseKey[], t: number): { pose: string; prev?: string; fade: number } => {
  const sorted = [...keys].sort((a, b) => a.at - b.at);
  let idx = 0;
  for (let i = 0; i < sorted.length; i++) if (t >= sorted[i].at) idx = i;
  const cur = sorted[idx];
  const prev = idx > 0 ? sorted[idx - 1] : undefined;
  const since = t - cur.at;
  if (prev && since >= 0 && since < 3) return { pose: cur.pose, prev: prev.pose, fade: since / 3 };
  return { pose: cur.pose, fade: 1 };
};

const OneFigure: React.FC<{ c: CharacterSpec; t: number }> = ({ c, t }) => {
  const base = {
    occupation: c.occupation,
    pose: 'standing' as const, // always overridden below
    facing: c.facing,
    x: c.x,
    y: c.y,
    scale: c.scale,
    exp: c.exp,
    carry: c.carry,
    t,
  };
  if (Array.isArray(c.pose)) {
    const { pose, prev, fade } = poseNow(c.pose, t);
    if (prev && fade < 1) {
      // the pose cut: the outgoing pose holds one beat, the new pose fades over it (3 frames, then hold)
      return (
        <g>
          <g opacity={1 - fade}>
            <Figure {...base} pose={prev as FigureProps['pose']} />
          </g>
          <g opacity={fade}>
            <Figure {...base} pose={pose as FigureProps['pose']} />
          </g>
        </g>
      );
    }
    return <Figure {...base} pose={pose as FigureProps['pose']} />;
  }
  return <Figure {...base} pose={c.pose} />;
};

export type HistSceneProps = {
  spec: SceneSpec;
  id: string; // unique per shot: namespaces every svg def on the frame
  t: number; // the shot's clock
  len: number;
  f: number; // the global frame (passed to nothing yet, kept for cues)
};

export const HistScene: React.FC<HistSceneProps> = ({ spec, id, t }) => {
  const env = (ENV_NAMES as readonly string[]).includes(spec.environment) ? (spec.environment as EnvironmentName) : 'victorian_street';
  const cam = cameraAt(spec.camera, t);
  const panX = cam.x; // the lateral pan the parallax layers split up
  const light = spec.light;
  const o = spec.overlay;
  return (
    <g>
      <ParchmentBase id={id} o={0.45} />
      {/* push scales about the frame centre; the pan is split across the parallax layers below */}
      <g transform={`translate(${960 - cam.scale * 960} ${540 - cam.scale * 540}) scale(${cam.scale})`}>
        <Environment name={env} id={`${id}-env`} px={panX} />
        {/* the midground plane: everything that moves 1:1 with the camera pan */}
        <g transform={`translate(${-panX} 0)`}>
          {light ? <LightSource kind={light.kind} x={light.x} y={light.y} id={`${id}-lite`} intensity={light.intensity} t={t} /> : null}
          {spec.props?.map((p, i) => (
            <Prop key={i} kind={p.kind as PropName} x={p.x} y={p.y} s={p.s} rot={p.rot} t={t} />
          ))}
          {spec.characters?.map((c, i) => (
            <OneFigure key={i} c={c} t={t} />
          ))}
          {spec.inserts?.map((ins, i) =>
            ins.insert === 'document' ? (
              <PeriodDocument
                key={i}
                kind={ins.kind}
                id={`${id}-doc${i}`}
                x={ins.x}
                y={ins.y}
                s={ins.s}
                rot={ins.rot}
                title={ins.title}
                lines={ins.lines}
                highlight={ins.highlight}
                highlightAt={ins.highlightAt}
                t={t}
              />
            ) : ins.insert === 'britain' ? (
              <MapBritain key={i} id={`${id}-map${i}`} x={ins.x} y={ins.y} s={ins.s} regions={ins.regions as { name: BritainRegion; state: 'idle' | 'active' | 'dim' }[]} />
            ) : (
              <MapLondon key={i} id={`${id}-map${i}`} x={ins.x} y={ins.y} s={ins.s} regions={ins.regions as { name: LondonRegion; state: 'idle' | 'active' | 'dim' }[]} />
            ),
          )}
        </g>
      </g>
      {light ? <Chiaroscuro kind={light.kind} x={light.x} y={light.y} id={`${id}-chia`} intensity={light.intensity} /> : null}
      {o?.actTitle ? <ActTitle t={t} title={o.actTitle} kicker={o.kicker} titleAt={o.titleAt} /> : null}
      {o?.label ? <OnScreenLabel t={t} text={o.label} at={o.labelAt} /> : null}
      {o?.caption ? <SourceCaption t={t} text={o.caption} /> : null}
    </g>
  );
};

const ENV_NAMES = ['mine_tunnel', 'factory_floor', 'victorian_street', 'workhouse_interior', 'sewer_tunnel', 'hospital_ward', 'medieval_workshop', 'railway_construction'];

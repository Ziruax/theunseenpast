import React from 'react';
import { HistScene } from '../../hist/scene';
import type { SceneSpec } from '../../hist/shot';
import { normalizeShotList } from '../../hist/shot';
import type { ShotMap, ShotProps } from '../../engine/episode';
import shotListData from './shots.json';
import researchData from './research.json';

// The pilot's shot factory. Every shots.json entry (pipeline schema or the hand-written form — both are
// normalised) becomes a HistScene component with no bespoke code; shots that need one-off drawing get
// hand-coded components in CUSTOM_SHOTS below (keyed by shot id — they win over the JSON spec).

export const SHOT_LIST = { shots: normalizeShotList(shotListData) };

/** research.json's sources, resolved to caption text: entry.source = "S1" -> "Source: ...".
* Accepts the pipeline's schema form (primary_sources/secondary_sources with source_id + title) or the
* hand-written `{ sources: [{ id, label }] }` form. */
type RawSource = { id?: string; label?: string; source_id?: string; title?: string; institution?: string; priority?: number };
const raw = researchData as { sources?: RawSource[]; primary_sources?: RawSource[]; secondary_sources?: RawSource[] };
const SOURCES = [
  ...(raw.sources ?? []).map((s) => ({ id: s.id ?? '', label: s.label ?? '' })),
  ...(raw.primary_sources ?? []).map((s) => ({ id: s.source_id ?? '', label: [s.title, s.institution].filter(Boolean).join(' — ') })),
  ...(raw.secondary_sources ?? []).map((s) => ({ id: s.source_id ?? '', label: [s.title, s.institution].filter(Boolean).join(' — ') })),
];
const captionFor = (sourceId?: string) => (sourceId ? `Source: ${SOURCES.find((s) => s.id === sourceId)?.label ?? sourceId}` : undefined);

/** Wrap a spec into a shot component. Use it for hand-tuned variants too. */
export const makeShot = (id: string, spec: SceneSpec, source?: string) => {
  const Shot: React.FC<ShotProps> = ({ t, len, f }) => <HistScene spec={{ ...spec, overlay: { ...spec.overlay, caption: captionFor(source) ?? spec.overlay?.caption } }} id={id} t={t} len={len} f={f} />;
  return Shot;
};

/** Bespoke shots (one-off drawing the spec language can't express) go here, keyed by shot id. */
export const CUSTOM_SHOTS: ShotMap = {};

export const SHOTS: ShotMap = Object.fromEntries(
  SHOT_LIST.shots.map((e) => [e.id, CUSTOM_SHOTS[e.id] ?? (e.spec ? makeShot(e.id, e.spec, e.source) : undefined)]).filter(([, s]) => s !== undefined),
) as ShotMap;

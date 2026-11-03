import React from 'react';
import { defineDocEpisode, DOC } from '../../engine';
import { normalizeActs, normalizeWords } from '../../hist/shot';
import scriptData from './script.json';
import wordsData from './words.json';
import { SHOTS, SHOT_LIST } from './shots';

// The pilot episode scaffold ("pilot-chimneys"). This file is wiring only: all content lives in the four
// data files the pipeline authors, loaded here and in shots.tsx —
//
//   script.json  -> episode_id, title, the five acts (id, title, startF), audio (voice/music paths)
//   shots.json   -> { shots: [{ id, start, len, key?, note?, source?, spec? }] }  (see shots.tsx)
//   words.json   -> [{ w, s, e }]  word-level voice timings, seconds
//   research.json-> { sources: [{ id, label }] }  evidence, referenced by shot.source
//
// The pipeline drops the real files into this folder and everything downstream just works.

const script = scriptData as { episode_id?: string; title?: string; audio?: { voice?: string; music?: string } };
const acts = normalizeActs(scriptData);
const words = normalizeWords(wordsData);

/** The episode runs the full 300 s. The shot list is stretched to hold its last shot until the voice ends
*  (or to the 9000-frame total, whichever is sooner), so the picture never cuts out under the last words. */
const voiceEndF = words.length ? Math.ceil(Math.max(...words.map((w) => w.e)) * DOC.fps) : 0;
const list = SHOT_LIST.shots.slice();
if (list.length) {
  const last = list[list.length - 1];
  const end = Math.min(DOC.durationInFrames, Math.max(last.start + last.len, voiceEndF));
  list[list.length - 1] = { ...last, len: Math.max(1, end - last.start) };
}

export const pilotChimneys = defineDocEpisode('PilotChimneys', {
  shotList: list,
  shots: SHOTS,
  total: DOC.durationInFrames,
  acts,
  audio: script.audio,
});

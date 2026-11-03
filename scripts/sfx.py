"""Stage: documentary sound. Builds the ambience beds and the sparse action SFX stem that
master.py mixes, at the documentary levels from references/sound.md.

python3 scripts/sfx.py <slug> [--dry]
Reads  src/episodes/<slug>/shots.json (environments, timing, per-shot sfx suggestions)
Writes out/<slug>/ambience.wav        (environment beds, normalised to -30 LUFS, spec -28..-32)
       out/<slug>/sfx.wav             (sparse action hits, normalised to -20 LUFS, spec -18..-22)
       out/<slug>/sfx_manifest.json   (every bed and hit: time, source, level — master.py reads it)
--dry lists what would be built and where each clip comes from, without writing audio.

Documentary model (not the retired per-action cartoon SFX):
- Ambience bed per environment run (mine / factory / street / hospital / home), quiet under
  the voice. A bed uses a library clip when one fits (studio/library/sfx), otherwise it is
  SYNTHESISED with ffmpeg (filtered noise + slow tremolo) — an honest approximation, noted in
  the manifest and in the console output.
- Action SFX stays sparse: only shots whose description suggests a physical action get a hit,
  and hits are quieter than the short-form default. Unused library clips are not added.
- Music is NOT generated here: the spec wants sparse, curated music (act transitions, legacy
  section). Put a music.wav in out/<slug>/ and master.py will mix it at -26 LUFS.
"""
from __future__ import annotations

import argparse
import re
import subprocess

import numpy as np

from unseenpast import AMBIENCE_TOKENS, LIB, SR, decode, ep_file, gain_to, load_json, loudness, out_dir, save_json, write_wav

BED_TARGET_LUFS = -30.0   # spec: ambience -28..-32 under voice
SFX_TARGET_LUFS = -20.0   # spec: action SFX -18..-22 during voice
FADE_S = 0.5              # bed crossfade at environment changes

# Library clip name prefixes per environment / action, tried in order (studio/library/sfx).
BED_LIB = {'mine': ['room_tone', 'power_hum'], 'factory': ['power_hum', 'class_murmur'],
           'street': ['roof_wind', 'class_murmur'], 'hospital': ['room_tone'],
           'home': ['room_tone', 'roof_wind']}
ACTION_LIB = {'action_hit': ['clink', 'crack'], 'footsteps': ['step', 'big_step'], 'door': ['crack']}

# Synthetic beds (used when the library has nothing suitable): mono, generated per run length.
# Each is filtered noise shaped toward the environment; documented as a reconstruction.
BED_SYNTH = {
    'mine': 'anoisesrc=color=brown:amplitude=0.7:seed=11:sample_rate={sr},lowpass=f=160,tremolo=f=0.3:d=0.6',
    'factory': 'anoisesrc=color=pink:amplitude=0.6:seed=22:sample_rate={sr},bandpass=f=250:w=180,tremolo=f=1.2:d=0.7',
    'street': 'anoisesrc=color=pink:amplitude=0.5:seed=33:sample_rate={sr},lowpass=f=450,tremolo=f=0.2:d=0.4',
    'hospital': 'anoisesrc=color=white:amplitude=0.2:seed=44:sample_rate={sr},lowpass=f=250,highpass=f=60',
    'home': 'anoisesrc=color=brown:amplitude=0.5:seed=55:sample_rate={sr},lowpass=f=140,tremolo=f=0.15:d=0.3',
}
ACTION_SYNTH = {
    'action_hit': ('anoisesrc=color=white:amplitude=0.9:seed=66:sample_rate={sr},lowpass=f=900,'
                   'afade=t=in:d=0.005,afade=t=out:st=0.1:d=0.15', 0.3),
}

ACTION_HINT = re.compile(r'\b(strike|tool|hammer|machine|engine|collapse|fall|shout|alarm|door|footstep)s?\b', re.I)


def lib_find(prefixes: list) -> object:
    """First library file whose name starts with one of the prefixes, else None."""
    for p in prefixes:
        for f in sorted(LIB.glob(f'{p}-*.mp3')) or sorted(LIB.glob(f'{p}.*')):
            return f
    return None


def synth(filter_graph: str, seconds: float) -> np.ndarray:
    """Render a synthetic clip to mono float64 at 44.1 kHz with ffmpeg's lavfi."""
    r = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'lavfi', '-i', filter_graph, '-t', f'{seconds:.3f}',
                        '-f', 'f64le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.float64).copy()


def bed_for(env: str, seconds: float, notes: list) -> tuple:
    """A bed of `seconds` for an environment: (samples, source description)."""
    src = lib_find(BED_LIB.get(env, []))
    if src:
        clip = decode(src)
        reps = int(np.ceil(seconds / max(1.0, len(clip) / SR)))
        tiled = np.tile(clip, reps)[:int(seconds * SR)]
        return tiled, f'library:{src.name}'
    graph = BED_SYNTH.get(env, BED_SYNTH['street']).format(sr=SR)
    notes.append(f'{env} bed synthesised with ffmpeg ({graph.split(",")[0]}) — no library clip fits')
    return synth(graph, seconds), 'synthesised:ffmpeg-lavfi'


def put(buf: np.ndarray, at_s: float, clip: np.ndarray, gain: float) -> None:
    i = int(at_s * SR)
    j = min(len(buf), i + len(clip))
    if j > i:
        buf[i:j] += clip[:j - i] * gain


def fade_edges(x: np.ndarray, s: float = FADE_S) -> np.ndarray:
    n = min(len(x), int(s * SR))
    if n:
        x = x.copy()
        x[:n] *= np.linspace(0, 1, n)
        x[-n:] *= np.linspace(1, 0, n)
    return x


def main() -> None:
    ap = argparse.ArgumentParser(description='Documentary ambience beds + sparse action SFX.')
    ap.add_argument('slug')
    ap.add_argument('--dry', action='store_true', help='list what would be built; write nothing')
    a = ap.parse_args()

    shots = load_json(ep_file(a.slug, 'shots.json'))
    if not shots:
        raise SystemExit(f'No shots.json for {a.slug} — run plan.py first.')
    shots = shots['shots']
    total = max(s['end_s'] for s in shots) + 0.5
    notes = []

    # ---- ambience beds per environment run ----------------------------------------------
    runs = []
    for s in shots:
        if runs and runs[-1]['env'] == s['environment'] and abs(runs[-1]['end'] - s['start_s']) < 0.05:
            runs[-1]['end'] = s['end_s']
        else:
            runs.append({'env': s['environment'], 'start': s['start_s'], 'end': s['end_s']})
    amb = np.zeros(int(total * SR))
    amb_manifest = []
    for r in runs:
        x, source = bed_for(r['env'], r['end'] - r['start'] + 2 * FADE_S, notes)
        put(amb, r['start'], fade_edges(x), 1.0)
        amb_manifest.append({'environment': r['env'], 'start_s': round(r['start'], 2), 'end_s': round(r['end'], 2),
                             'source': source, 'target_lufs': BED_TARGET_LUFS})
    print(f'{len(runs)} ambience runs: ' + ', '.join(f"{r['env']} {r['start']:.0f}-{r['end']:.0f} s" for r in runs))

    # ---- sparse action hits ---------------------------------------------------------------
    sfx = np.zeros(int(total * SR))
    sfx_manifest = []
    for s in shots:
        # everything that is not a known ambience token is an action hit; ambience is the bed
        tokens = [t for t in s.get('sfx', []) if t not in AMBIENCE_TOKENS]
        if not tokens and ACTION_HINT.search(s.get('description', '')):
            tokens = ['action_hit']
        for tok in tokens:
            if tok not in ACTION_LIB and tok not in ACTION_SYNTH:
                continue  # ambience-style token: already covered by the bed
            src = lib_find(ACTION_LIB.get(tok, []))
            if src:
                clip, source = decode(src), f'library:{src.name}'
            elif tok in ACTION_SYNTH:
                graph, secs = ACTION_SYNTH[tok]
                clip, source = synth(graph.format(sr=SR), secs), 'synthesised:ffmpeg-lavfi'
                notes.append(f'{tok} synthesised with ffmpeg — no library clip fits')
            else:
                notes.append(f'{tok} skipped on shot {s["shot_id"]} — no library clip and no synthesis recipe')
                continue
            peak = 0.5 if source.startswith('library') else 0.8
            clip = clip / max(1e-9, np.abs(clip).max()) * peak
            at = s['start_s'] + s['duration_s'] * 0.4  # a beat after the cut, not on it
            put(sfx, at, clip, 1.0)
            sfx_manifest.append({'shot_id': s['shot_id'], 'token': tok, 'at_s': round(at, 2),
                                 'source': source, 'target_lufs': SFX_TARGET_LUFS})
    print(f'{len(sfx_manifest)} action hits (sparse by design)')

    if a.dry:
        for m in amb_manifest + sfx_manifest:
            print(' ', m)
        print('dry run: nothing written')
        return

    amb_p, sfx_p = out_dir(a.slug) / 'ambience.wav', out_dir(a.slug) / 'sfx.wav'
    write_wav(amb_p, amb)
    write_wav(sfx_p, sfx)
    # ebur128 gating ignores the silence between hits, so the measured level is the level
    # of the audible material — the right anchor for the "during voice" targets.
    for path, target in ((amb_p, BED_TARGET_LUFS), (sfx_p, SFX_TARGET_LUFS)):
        lufs, _ = loudness(path)
        g = gain_to(target, lufs)
        write_wav(path, decode(path) * g)
        l2, _ = loudness(path)
        print(f'{path.name}: {lufs:.1f} -> {l2:.1f} LUFS (target {target:.0f})')

    manifest = {'episode': a.slug, 'ambience': amb_manifest, 'sfx_events': sfx_manifest,
                'levels': {'ambience_lufs': BED_TARGET_LUFS, 'sfx_lufs': SFX_TARGET_LUFS},
                'music': 'none generated — put optional music.wav in out/ and master.py mixes it at -26 LUFS',
                'notes': sorted(set(notes))}
    save_json(out_dir(a.slug) / 'sfx_manifest.json', manifest)
    for n in manifest['notes']:
        print(f'note: {n}')
    print(f"next: python3 scripts/master.py {a.slug}")


if __name__ == '__main__':
    main()

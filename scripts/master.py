"""Stage 5: the master. Mixes the stems to the documentary targets, normalises to -14 LUFS
integrated / -1 dBTP (two-pass loudnorm), muxes with the render, and writes chapters + report.

python3 scripts/master.py <slug> [--comp <composition-id>] [--video path] [--skip-render]
Reads  src/episodes/<slug>/{script.json, shots.json, words.json, voice.mp3}
       out/<slug>/{ambience.wav, sfx.wav, sfx_manifest.json, music.wav (optional), costs.json (optional)}
Writes out/<slug>/final.mp4, out/<slug>/chapters.txt, out/<slug>/report.json

Mix targets (references/sound.md): master -14 LUFS integrated, -1 dBTP true peak; stems are
anchored relative to the voice at -17 LUFS: voice -16..-18, SFX -18..-22 (set by sfx.py),
ambience -28..-32 (set by sfx.py), music -24..-28. Voice is never ducked by a compressor —
the stems are simply mixed well under it, which is the documentary sound.

Render: by default this script renders the episode first with
    npx remotion render src/index.ts <comp-id> out/<slug>/<slug>-raw.mp4
(run from studio/) — pass --comp if the composition id is not the slug, --video to use an
existing render, or --skip-render to remux the audio onto the previous final.mp4.

Voice provider is reported (edge-tts costs nothing); ElevenLabs credits are only reported
when the voice stage was run with --provider elevenlabs (costs.json present).
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time

import numpy as np

from unseenpast import (STUDIO, decode, duration_s, ep_file, ffmpeg_json_loudnorm, gain_to, load_json,
                        loudness, out_dir, save_json, write_wav)

I_TARGET, TP_TARGET, LRA_TARGET = -14.0, -1.0, 11
# Pre-master anchor for the voice. The spec's voice band (-16..-18 LUFS short-term) describes
# the mix before the master bus; the two-pass loudnorm to -14 LUFS then lifts the whole mix
# (typically ~+2..3 dB), so the finished voice lands just above -14 while keeping its 3-13 dB
# separation from the beds. Verify short-term levels with mixcheck.py.
VOICE_LUFS = -17.0
STEM_TARGETS = {'sfx': -20.0, 'ambience': -30.0, 'music': -26.0}
ACT_CHAPTER_NAMES = ['Cold Open', 'Context', 'How It Worked', 'Hidden Cost', 'Turning Point & Legacy']


def fmt_ts(s: float) -> str:
    m, sec = int(s // 60), s % 60
    return f'{m}:{sec:02.0f}'


def main() -> None:
    ap = argparse.ArgumentParser(description='Documentary mix + master + chapters + report.')
    ap.add_argument('slug')
    ap.add_argument('--comp', default=None, help='Remotion composition id (default: the slug)')
    ap.add_argument('--video', default=None, help='use this rendered mp4 instead of rendering')
    ap.add_argument('--skip-render', action='store_true', help='reuse the previous final.mp4 video stream')
    a = ap.parse_args()

    od = out_dir(a.slug)
    script = load_json(ep_file(a.slug, 'script.json'))
    shots = load_json(ep_file(a.slug, 'shots.json'))
    if not script or not shots:
        raise SystemExit('script.json and shots.json must exist (stages 2 and 3) before mastering.')
    voice = ep_file(a.slug, 'voice.mp3')
    if not voice.exists():
        raise SystemExit(f'No voice.mp3 for {a.slug} — run voice.py first.')

    # ---- 1. the video ---------------------------------------------------------------------
    npx = 'npx.cmd' if sys.platform == 'win32' else 'npx'
    raw = od / f'{a.slug}-raw.mp4'
    if a.video:
        raw = type(raw)(a.video)
    elif not a.skip_render:
        cmd = [npx, 'remotion', 'render', 'src/index.ts', a.comp or a.slug, str(raw), '--log', 'error']
        print(' '.join(cmd))
        t0 = time.time()
        subprocess.run(cmd, cwd=str(STUDIO), check=True)
        print(f'rendered in {time.time() - t0:.0f} s')
    if not raw.exists():
        raise SystemExit(f'No video at {raw} — render first or pass --video/--skip-render.')

    # ---- 2. anchor every stem to the documentary level -------------------------------------
    stems = [('voice', decode(voice), VOICE_LUFS)]
    for name, target in STEM_TARGETS.items():
        p = od / f'{name}.wav'
        if p.exists():
            x = decode(p)
            lufs, _ = loudness(p)
            stems.append((name, x * gain_to(target, lufs), target))
        else:
            print(f'note: no {p.name} — mixing without it')
    n = max(len(x) for _, x, _ in stems)
    buf = np.zeros(n)
    for _, x, _ in stems:
        buf[: len(x)] += x
    mix_wav = od / 'mix.wav'
    write_wav(mix_wav, buf)

    # ---- 3. two-pass loudnorm to -14 LUFS / -1 dBTP ----------------------------------------
    # Primary: loudnorm two-pass (linear mode). On speech+beds this lands on target; when the
    # content would force loudnorm into its dynamic mode (it can overshoot on pathological
    # material), fall back to a plain measured gain that respects the true-peak ceiling.
    m = ffmpeg_json_loudnorm(['-i', str(mix_wav), '-af',
                              f'loudnorm=I={I_TARGET}:TP={TP_TARGET}:LRA={LRA_TARGET}:print_format=json'])
    filt = (f"loudnorm=I={I_TARGET}:TP={TP_TARGET}:LRA={LRA_TARGET}:measured_I={m['input_i']}"
            f":measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
            f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    final = od / 'final.mp4'

    def mux(audio_filter: str) -> None:
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(raw), '-i', str(mix_wav), '-filter:a', audio_filter,
                        '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-ar', '48000', '-c:a', 'aac', '-b:a', '256k',
                        '-movflags', '+faststart', '-shortest', str(final)], check=True)

    def measure() -> tuple:
        c = ffmpeg_json_loudnorm(['-i', str(final), '-af',
                                  f'loudnorm=I={I_TARGET}:TP={TP_TARGET}:print_format=json'])
        return float(c['input_i']), float(c['input_tp']), float(c['input_lra']), c

    mux(filt)
    lufs, true_peak, lra, check = measure()
    if abs(lufs - I_TARGET) > 0.5 or true_peak > TP_TARGET:
        gain = min(I_TARGET - float(m['input_i']), TP_TARGET - float(m['input_tp']))
        print(f'loudnorm missed ({lufs:.1f} LUFS / {true_peak:.1f} dBTP) -> measured gain {gain:+.2f} dB')
        mux(f'volume={gain:.2f}dB')
        lufs, true_peak, lra, check = measure()
    dur = duration_s(final)
    target_dur = max(s['end_s'] for s in shots['shots'])
    chapters = [(0.0, ACT_CHAPTER_NAMES[0])]
    seen = {1}
    for s in shots['shots']:
        if s['act'] not in seen:
            seen.add(s['act'])
            chapters.append((s['start_s'], ACT_CHAPTER_NAMES[s['act'] - 1]))
    (od / 'chapters.txt').write_text(
        '\n'.join(f'{fmt_ts(t)} {name}' for t, name in chapters) + '\n', encoding='utf-8')

    voice_report = load_json(od / 'voice_report.json', {}) or {}
    costs = load_json(od / 'costs.json', []) or []
    report = {
        'episode': a.slug, 'file': str(final), 'seconds': round(dur, 2),
        'duration_ok': abs(dur - target_dur) <= 0.5,
        'lufs': lufs, 'true_peak_dbtp': true_peak, 'lra': float(check.get('input_lra', 0)),
        'mix_targets': {'master_lufs': I_TARGET, 'true_peak_dbtp': TP_TARGET, 'voice_lufs': VOICE_LUFS,
                        **{f'{k}_lufs': v for k, v in STEM_TARGETS.items()}},
        'stems_mixed': [name for name, _, _ in stems],
        'voice': {'provider': voice_report.get('provider', 'edge'),
                  'voice_name': voice_report.get('voice'),
                  'cost': voice_report.get('cost', '0 credits (free Microsoft Edge TTS)'),
                  'elevenlabs_credits': sum(c.get('credits', 0) for c in costs) if costs else 0},
        'chapters': [f'{fmt_ts(t)} {name}' for t, name in chapters],
    }
    save_json(od / 'report.json', report)
    print(json.dumps({k: v for k, v in report.items() if k != 'mix_targets'}, indent=1))
    ok = abs(lufs - I_TARGET) <= 0.5 and true_peak <= TP_TARGET and abs(dur - target_dur) <= 0.5
    print('master OK: -14 LUFS, -1 dBTP, duration on target' if ok else
          '! master off target — check report.json (loudness, true peak or duration)')
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()

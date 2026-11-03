"""Loudness check for the documentary mix. Measures any audio or video file (integrated LUFS,
true peak dBTP, LRA) and validates it against the targets from references/sound.md.

python3 scripts/mixcheck.py <file> [--profile master]
profiles: master (default: -14 LUFS +/-0.5, true peak <= -1 dBTP)
          voice  (-16..-18 LUFS)   sfx (-18..-22)   ambience (-28..-32)   music (-24..-28)
Exit code 1 when the file misses its target, so it can gate a pipeline step.
"""
from __future__ import annotations

import argparse
import pathlib
import sys

from unseenpast import ffmpeg_json_loudnorm

PROFILES = {
    'master': {'lufs': (-14.5, -13.5), 'tp_max': -1.0, 'label': 'master: -14 LUFS, -1 dBTP'},
    'voice': {'lufs': (-18.0, -16.0), 'tp_max': None, 'label': 'voice: -16..-18 LUFS short-term band'},
    'sfx': {'lufs': (-22.0, -18.0), 'tp_max': None, 'label': 'sfx: -18..-22 LUFS during voice'},
    'ambience': {'lufs': (-32.0, -28.0), 'tp_max': None, 'label': 'ambience: -28..-32 LUFS'},
    'music': {'lufs': (-28.0, -24.0), 'tp_max': None, 'label': 'music: -24..-28 LUFS'},
}


def main() -> None:
    ap = argparse.ArgumentParser(description='Measure and validate loudness against the documentary targets.')
    ap.add_argument('file', help='any audio or video file (e.g. out/<slug>/final.mp4)')
    ap.add_argument('--profile', choices=sorted(PROFILES), default='master')
    a = ap.parse_args()

    p = pathlib.Path(a.file)
    if not p.exists():
        raise SystemExit(f'No such file: {p}')
    m = ffmpeg_json_loudnorm(['-i', str(p), '-af', 'loudnorm=I=-14:TP=-1:LRA=11:print_format=json'])
    lufs = float(m['input_i'])
    true_peak = float(m['input_tp'])
    lra = float(m['input_lra'])
    print(f'{p.name}: {lufs:.1f} LUFS integrated, true peak {true_peak:.1f} dBTP, LRA {lra:.1f} LU')

    spec = PROFILES[a.profile]
    problems = []
    lo, hi = spec['lufs']
    if not (lo <= lufs <= hi):
        problems.append(f'loudness {lufs:.1f} outside {lo}..{hi}')
    if spec['tp_max'] is not None and true_peak > spec['tp_max']:
        problems.append(f'true peak {true_peak:.1f} above {spec["tp_max"]}')
    for q in problems:
        print(f'! {q}')
    print(('OK — ' if not problems else 'FAIL — ') + spec['label'])
    sys.exit(1 if problems else 0)


if __name__ == '__main__':
    main()

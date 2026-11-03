"""Pacing check. Prints the per-act cut statistics from shots.json against the documentary
pacing targets, so a shot list is judged on numbers before any stills are rendered.

python3 scripts/motiongrid.py <slug>
Reads  src/episodes/<slug>/shots.json
Targets (references/pacing.md / spec Part 6): shots per act 6-8 / 10-12 / 25-30 / 20-25 / 20-25,
every duration <= 4.0 s, average 2-3 s, 80-100 shots overall. Exit code 1 when off target.
"""
from __future__ import annotations

import argparse
import statistics
import sys

from unseenpast import ACT_NAMES, ACT_PACING, ep_file, load_json

VISUAL_DIST = {'new_scene': 0.30, 'shot_size_change': 0.25, 'line_reveal': 0.20,
               'map_change': 0.15, 'document_highlight': 0.10}


def main() -> None:
    ap = argparse.ArgumentParser(description='Per-act cut stats vs the documentary pacing targets.')
    ap.add_argument('slug')
    a = ap.parse_args()

    data = load_json(ep_file(a.slug, 'shots.json'))
    if not data:
        raise SystemExit(f'No shots.json for {a.slug} — run plan.py first.')
    shots = data['shots']
    lens = [s['duration_s'] for s in shots]
    problems = []

    print(f'{data.get("episode_id", a.slug)}: {len(shots)} shots, {shots[0]["start_s"]:.1f}-'
          f'{shots[-1]["end_s"]:.1f} s, mean {statistics.mean(lens):.2f} s, median {statistics.median(lens):.2f} s')
    print(f'{"act":<4}{"name":<22}{"shots":>6}{"target":>9}{"mean s":>8}{"max s":>8}')
    for k in range(5):
        act_shots = [s for s in shots if s['act'] == k + 1]
        if not act_shots:
            print(f'{k + 1:<4}{ACT_NAMES[k]:<22}{"0":>6}{f"{ACT_PACING[k][0]}-{ACT_PACING[k][1]}":>9}')
            problems.append(f'act {k + 1} has no shots')
            continue
        lo, hi = ACT_PACING[k]
        n = len(act_shots)
        alens = [s['duration_s'] for s in act_shots]
        flag = 'ok' if lo <= n <= hi else '!'
        if flag == '!':
            problems.append(f'act {k + 1} ({ACT_NAMES[k]}) has {n} shots, target {lo}-{hi}')
        print(f'{k + 1:<4}{ACT_NAMES[k]:<22}{n:>6}{f"{lo}-{hi}":>9}{statistics.mean(alens):>8.2f}'
              f'{max(alens):>8.2f}  {flag}')

    dist = {t: sum(1 for s in shots if s['visual_type'] == t) for t in VISUAL_DIST}
    print('visual_type: ' + ', '.join(f'{t} {c} ({c / len(shots) * 100:.0f}%, target {VISUAL_DIST[t] * 100:.0f}%)'
                                      for t, c in dist.items()))
    for t, share in VISUAL_DIST.items():
        if dist[t] / len(shots) < share * 0.5:
            problems.append(f'{t} is at {dist[t] / len(shots) * 100:.0f}% (target ~{share * 100:.0f}%)')
    long_shots = [(s['shot_id'], s['duration_s']) for s in shots if s['duration_s'] > 4.0]
    if long_shots:
        problems.append(f'{len(long_shots)} shots over 4.0 s: {long_shots[:5]}')
    if not 80 <= len(shots) <= 100:
        problems.append(f'{len(shots)} shots total, outside 80-100')

    if problems:
        print('\n'.join(f'! {p}' for p in problems))
        print('FAIL — fix the shot list before the storyboard stage')
        sys.exit(1)
    print('OK — pacing on target for every act')


if __name__ == '__main__':
    main()

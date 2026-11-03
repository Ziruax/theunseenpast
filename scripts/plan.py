"""Stage 3: the shot list. Reads the five-act script (and the word timings, when voice.py has
run) and lays shots out on the 2-3 s grid to produce shots.json for the storyboard and engine.

python3 scripts/plan.py <slug> [--target-dur 3.2]
Reads  src/episodes/<slug>/script.json   (five acts: narration, citations, optional
       "environment" and "characters" per act)
       src/episodes/<slug>/research.json (source ids, for the source_id field)
       src/episodes/<slug>/words.json    (optional; gives real act boundaries from the voice)
Writes src/episodes/<slug>/shots.json    (schema: schemas/shots.schema.json)
       out/<slug>/shotlist.md            (human-readable review copy) + prints the pace

Grid rules (spec Part 1 / stage-3 prompt): 80-100 shots, every duration <= 4.0 s, average
2-3 s, act boundaries never crossed by a shot, visual_type distribution targeted at
~30% new_scene / 25% shot_size_change / 20% line_reveal / 15% map_change / 10%
document_highlight, and SFX suggestions per shot derived from the act's environment.

Act boundaries come from words.json when present (the last word of each act's narration ends
the act; the final act always ends at the script's end_s). Without words.json the script's
nominal start_s/end_s are used — re-run plan.py after voice.py to snap to the real voice.
"""
from __future__ import annotations

import argparse
import random
import re
import statistics
import sys

from unseenpast import ACT_NAMES, ENV_SFX, ep_file, load_json, out_dir, run_validator, save_json

VISUAL_DIST = [('new_scene', 0.30), ('shot_size_change', 0.25), ('line_reveal', 0.20),
               ('map_change', 0.15), ('document_highlight', 0.10)]
CAMERA_FOR = {'new_scene': ['hold', 'lateral_pan'], 'shot_size_change': ['slow_push', 'detail_push'],
              'line_reveal': ['hold'], 'map_change': ['lateral_pan'], 'document_highlight': ['detail_push']}
# (ambience tokens per environment live in unseenpast.ENV_SFX, shared with sfx.py)
ACTION_WORDS = re.compile(r'\b(strike|tool|hammer|machine|engine|collapse|fall|shout|alarm|door|footstep)s?\b', re.I)


def words_of(text: str) -> list:
    return re.findall(r"[\w'’-]+", text)


def pick_visual_type(bag: list) -> str:
    """Pop from the pre-built weighted bag; refill when empty (keeps the target distribution)."""
    if not bag:
        bag.extend([t for t, _ in VISUAL_DIST])
    return bag.pop()


def build_bag(total: int, rng: random.Random) -> list:
    """Exactly `total` visual types at the target distribution, shuffled deterministically.
    The first shot of each act is forced to new_scene without consuming the bag, so the
    realised new_scene share runs a few points above the 30% target."""
    bag = []
    for t, share in VISUAL_DIST:
        bag += [t] * max(1, round(share * total))
    while len(bag) > total:
        bag.pop()
    while len(bag) < total:
        bag.append('new_scene')
    rng.shuffle(bag)
    return bag


def main() -> None:
    ap = argparse.ArgumentParser(description='Build shots.json on the documentary 2-3 s grid.')
    ap.add_argument('slug')
    ap.add_argument('--target-dur', type=float, default=3.2, help='mean shot length in s (2-3 s spec grid; '
                    '300 s / 80-100 shots forces ~3.0-3.7 s, so this is clamped to keep <=4.0 s)')
    a = ap.parse_args()

    script = load_json(ep_file(a.slug, 'script.json'))
    if not script:
        raise SystemExit(f'No script.json for {a.slug} — write it with the stage-2 prompt first.')
    research = load_json(ep_file(a.slug, 'research.json'), {})
    words = load_json(ep_file(a.slug, 'words.json'), [])
    acts = script['acts']
    if len(acts) != 5:
        raise SystemExit(f'script.json has {len(acts)} acts, the five-act structure requires exactly 5.')

    # ---- act boundaries in seconds ------------------------------------------------------
    # With words.json: walk the narration word counts and take each act's last word end.
    # The final act ends at script end (nominal 300 s). Without words.json: nominal times.
    boundaries = []
    wi = 0
    for k, act in enumerate(acts):
        n = len(words_of(act['narration']))
        if words and wi + n <= len(words):
            end = words[min(wi + n, len(words)) - 1]['end_s']
        else:
            end = act.get('end_s', 0.0)
            if words:
                print(f'note: words.json shorter than act {k + 1}\'s narration; using nominal end_s')
        boundaries.append(round(min(end, 300.0), 3))
        wi += n
    boundaries[-1] = acts[-1].get('end_s', 300.0)
    starts = [0.0] + boundaries[:-1]
    for k in range(4):
        if boundaries[k] < starts[k] or boundaries[k] > starts[k + 1]:
            print(f'! act {k + 1} boundary ({boundaries[k]} s) is not between {starts[k]} and {starts[k + 1]} s '
                  '— check the narration against words.json')
            sys.exit(1)

    # ---- shot grid ----------------------------------------------------------------------
    total_dur = boundaries[-1]
    target = min(3.7, max(2.0, a.target_dur))
    counts = [max(2, round((boundaries[k] - starts[k]) / target)) for k in range(5)]
    total = sum(counts)
    while total > 100:
        k = counts.index(max(counts))
        counts[k] -= 1
        total -= 1
    while total < 80:
        k = counts.index(min(counts))
        counts[k] += 1
        total += 1
    rng = random.Random(a.slug)  # deterministic per episode
    bag = build_bag(total, rng)

    shots = []
    for k, act in enumerate(acts):
        a0, a1 = starts[k], boundaries[k]
        env = act.get('environment', 'street')
        chars = act.get('characters', [])
        src_ids = [c['source_id'] for c in act.get('citations', []) if c.get('source_id')]
        n = counts[k]
        # equal slices, then nudge the last one so the act sums exactly
        durs = [(a1 - a0) / n] * n
        durs[-1] = round(a1 - a0 - sum(durs[:-1]), 3)
        if durs[-1] <= 0:
            durs[-1] = 0.5
            durs[0] = round(a1 - a0 - sum(durs[1:]), 3)
        for j in range(n):
            s0, s1 = a0 + sum(durs[:j]), a0 + sum(durs[:j + 1])
            vt = 'new_scene' if j == 0 else pick_visual_type(bag)
            covered = [w['word'] for w in words if s0 <= w['start_s'] < s1] if words else \
                words_of(act['narration'])[:10]
            snippet = ' '.join(covered[:12]) + ('…' if len(covered) > 12 else '')
            sfx = list(ENV_SFX.get(env, ENV_SFX['street']))
            if ACTION_WORDS.search(snippet or ''):
                sfx.append('action_hit')
            shots.append({
                'shot_id': f'S{len(shots) + 1:03d}',
                'start_s': round(s0, 3), 'end_s': round(s1, 3), 'duration_s': round(s1 - s0, 3),
                'act': k + 1, 'visual_type': vt,
                'description': f'{ACT_NAMES[k]} — {snippet or act["narration"][:60]}',
                'characters': list(chars), 'environment': env,
                'camera_move': CAMERA_FOR[vt][rng.randrange(len(CAMERA_FOR[vt]))],
                'sfx': sfx,
                'source_id': src_ids[0] if src_ids and vt in ('map_change', 'document_highlight') else '',
            })

    data = {'episode_id': script.get('episode_id', a.slug), 'total_shots': len(shots), 'shots': shots}
    save_json(ep_file(a.slug, 'shots.json'), data)

    # ---- report + validate --------------------------------------------------------------
    lens = [s['duration_s'] for s in shots]
    dist = {t: sum(1 for s in shots if s['visual_type'] == t) for t, _ in VISUAL_DIST}
    print(f'{len(shots)} shots over {total_dur:.1f} s; mean {statistics.mean(lens):.2f} s, '
          f'median {statistics.median(lens):.2f} s, max {max(lens):.2f} s')
    print('visual_type distribution: ' + ', '.join(f'{t} {c} ({c / len(shots) * 100:.0f}%)' for t, c in dist.items()))
    for k in range(5):
        lo, hi = [(6, 8), (10, 12), (25, 30), (20, 25), (20, 25)][k]
        n = sum(1 for s in shots if s['act'] == k + 1)
        flag = '' if lo <= n <= hi else '  ! outside the pacing target'
        print(f'  act {k + 1} ({ACT_NAMES[k]}): {n} shots ({starts[k]:.1f}-{boundaries[k]:.1f} s){flag}')
    problems = []
    if not 80 <= len(shots) <= 100:
        problems.append(f'{len(shots)} shots outside 80-100')
    if max(lens) > 4.0:
        problems.append('a shot exceeds 4.0 s')
    if abs(total_dur - 300.0) > 0.5:
        problems.append(f'total {total_dur:.2f} s is not 300 +/- 0.5')
    for p in problems:
        print(f'! {p}')
    if run_validator('shots', ep_file(a.slug, 'shots.json')) and not problems:
        print('shots.json passed the validator.')
        print(f"next: node scripts/stills.mjs {a.slug}")
    else:
        sys.exit(1)
    rows = ['| # | Shot | Act | In | Dur | Type | Camera | Environment | SFX | Description |',
            '|---|---|---|---|---|---|---|---|---|---|']
    for i, s in enumerate(shots):
        rows.append(f"| {i + 1} | {s['shot_id']} | {s['act']} | {s['start_s']:.1f} s | {s['duration_s']:.2f} s | "
                    f"{s['visual_type']} | {s['camera_move']} | {s['environment']} | {', '.join(s['sfx'])} | "
                    f"{s['description'][:80]} |")
    md = (f"# {script.get('title', a.slug)}: shot list\n\n{len(shots)} shots, {total_dur:.1f} s, "
          f"mean {statistics.mean(lens):.2f} s\n\n" + '\n'.join(rows) + '\n')
    (out_dir(a.slug) / 'shotlist.md').write_text(md, encoding='utf-8')
    print(f'review copy: {out_dir(a.slug) / "shotlist.md"}')


if __name__ == '__main__':
    main()

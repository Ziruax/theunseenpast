"""Shared helpers for The Unseen Past pipeline scripts, plus the pipeline orchestrator check.

Every script locates the repo relative to this file, so they can be run from anywhere:
    python3 scripts/voice.py <slug>
Episode data:   studio/src/episodes/<slug>/{research.json, script.json, shots.json, words.json,
                storyboard.json, metadata.json, voice.mp3}
Renders/review: studio/out/<slug>/  (board/ stills, sfx.wav, ambience.wav, sfx_manifest.json,
                final.mp4, chapters.txt, report.json, shotlist.md, storyboard.jpg)
Validators:     pipeline/validate/validate-{research,script,shots}.ts, run with bun when present.

As the orchestrator it does NOT write research or scripts (that is Claude's job at the prompt
stages); it checks prerequisites, validates the stage JSONs that exist, and prints the next
command for each stage:
    python3 scripts/unseenpast.py <slug> --stage research|script|shots|storyboard|metadata|all
"""
from __future__ import annotations

import json
import os
import pathlib
import re
import shutil
import subprocess
import sys
import wave

import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
STUDIO = ROOT / 'studio'
EPISODES = STUDIO / 'src' / 'episodes'
OUT = STUDIO / 'out'
LIB = STUDIO / 'library' / 'sfx'
VALIDATORS = ROOT / 'pipeline' / 'validate'

SR = 44100
ACT_NAMES = ['Cold Open', 'Context', 'How It Worked', 'Hidden Cost', 'Turning Point & Legacy']
# Per-act shot-count pacing targets from references/pacing.md (spec Part 6 order).
ACT_PACING = [(6, 8), (10, 12), (25, 30), (20, 25), (20, 25)]
# Ambience-style SFX tokens per environment (references/sound.md). plan.py puts these on each
# shot in its environment; sfx.py turns them into beds and treats everything else as an action
# hit. Shared here so the two scripts can never disagree about what is a bed and what is a hit.
ENV_SFX = {
    'mine': ['mechanical_hum', 'distant_drip', 'timber_creak'],
    'factory': ['machinery_rhythm', 'muffled_voices'],
    'street': ['distant_carts', 'muffled_crowd', 'wind'],
    'hospital': ['room_tone', 'distant_footsteps'],
    'home': ['fire_crackle', 'window_wind'],
}
AMBIENCE_TOKENS = {t for tokens in ENV_SFX.values() for t in tokens}

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


# ---------------------------------------------------------------- paths
def ep_dir(slug: str) -> pathlib.Path:
    d = EPISODES / slug
    d.mkdir(parents=True, exist_ok=True)
    return d


def out_dir(slug: str) -> pathlib.Path:
    d = OUT / slug
    d.mkdir(parents=True, exist_ok=True)
    return d


def ep_file(slug: str, name: str) -> pathlib.Path:
    return ep_dir(slug) / name


def load_json(path, default=None):
    p = pathlib.Path(path)
    if not p.exists():
        return default
    return json.loads(p.read_text(encoding='utf-8'))


def save_json(path, data) -> None:
    p = pathlib.Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')


# ---------------------------------------------------------------- environment checks
def have(cmd: str) -> bool:
    return shutil.which(cmd) is not None


def python_deps() -> dict:
    out = {}
    for mod in ('numpy', 'PIL', 'edge_tts'):
        try:
            __import__(mod)
            out[mod] = True
        except ImportError:
            out[mod] = False
    return out


def check_prereqs(need_edge_tts: bool = False) -> list:
    """Return a list of human-readable problems (empty = all good)."""
    problems = []
    for cmd in ('ffmpeg', 'ffprobe'):
        if not have(cmd):
            problems.append(f'{cmd} not on PATH (sudo apt install ffmpeg)')
    deps = python_deps()
    if not deps['numpy']:
        problems.append('numpy missing: pip install numpy')
    if not deps['PIL']:
        problems.append('Pillow missing: pip install Pillow')
    if need_edge_tts and not deps['edge_tts']:
        problems.append('edge-tts missing: pip install edge-tts')
    return problems


# ---------------------------------------------------------------- validators (bun + TS)
def run_validator(name: str, path: pathlib.Path) -> bool:
    """Run pipeline/validate/validate-<name>.ts on a JSON file with bun. True = passed (or no
    validator installed yet, in which case a note is printed)."""
    ts = VALIDATORS / f'validate-{name}.ts'
    if not ts.exists():
        print(f'note: {ts} not found yet — skipping the {name} validator')
        return True
    if not have('bun'):
        print(f'note: bun not on PATH — cannot run {ts.name}; install it from https://bun.sh')
        return True
    r = subprocess.run(['bun', str(ts), str(path)], cwd=str(ROOT), capture_output=True, text=True, encoding='utf-8', errors='ignore')
    print(r.stdout.strip())
    if r.returncode != 0:
        print(r.stderr.strip())
        print(f'! validator {ts.name} rejected {path.name}')
        return False
    return True


# ---------------------------------------------------------------- audio
def decode(path) -> np.ndarray:
    """Any audio file to mono float64 at 44.1 kHz."""
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f64le', '-ac', '1', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float64).copy()


def write_wav(path, x: np.ndarray, peak=None) -> None:
    p = pathlib.Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    if peak is not None:
        x = x / max(1e-9, np.abs(x).max()) * peak
    with wave.open(str(p), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


def ffmpeg_json_loudnorm(args: list) -> dict:
    """Run ffmpeg with a loudnorm print_format=json filter and return the parsed JSON block."""
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', *args, '-f', 'null', '-'],
                       capture_output=True, text=True, encoding='utf-8', errors='ignore')
    txt = r.stderr
    return json.loads(txt[txt.rfind('{'):txt.rfind('}') + 1])


def loudness(path) -> tuple:
    """(integrated LUFS, true peak dBFS) of a file, via ffmpeg's ebur128."""
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                       capture_output=True, text=True, encoding='utf-8', errors='ignore')
    summ = r.stderr[r.stderr.rfind('Summary:'):]
    i = re.search(r'I:\s+(-?[\d.]+|-inf) LUFS', summ)
    p = re.search(r'Peak:\s+(-?[\d.]+|-inf) dBFS', summ)
    f = lambda m: float(m.group(1)) if m and m.group(1) != '-inf' else float('-inf')
    return f(i), f(p)


def gain_to(target_lufs: float, measured_lufs: float) -> float:
    """Linear gain that moves a stem from its measured loudness to the target."""
    if measured_lufs == float('-inf'):
        return 0.0
    return 10 ** ((target_lufs - measured_lufs) / 20)


def duration_s(path) -> float:
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)],
                       capture_output=True, text=True)
    return float(r.stdout.strip())


# ---------------------------------------------------------------- costs
def log_cost(slug: str, step: str, credits, note: str = '') -> None:
    """Append a cost line to out/<slug>/costs.json (ElevenLabs path only; edge-tts is free)."""
    p = out_dir(slug) / 'costs.json'
    rows = load_json(p, [])
    rows.append({'step': step, 'credits': credits, 'note': note})
    save_json(p, rows)
    print(f'{step}: {credits} credits{f" ({note})" if note else ""}; episode total: {sum(r["credits"] for r in rows)}')


# ---------------------------------------------------------------- orchestrator
STAGES = ['research', 'script', 'shots', 'storyboard', 'metadata']

NEXT_CMD = {
    'research': 'pipeline stage-1: write research.json (see pipeline/stage-1-research.md), then python3 scripts/unseenpast.py <slug> --stage research',
    'script': 'pipeline stage-2: write script.json (see pipeline/stage-2-script.md), then python3 scripts/unseenpast.py <slug> --stage script',
    'voice': 'python3 scripts/voice.py <slug>',
    'shots': 'python3 scripts/plan.py <slug>',
    'storyboard': 'node scripts/stills.mjs <slug>   (then pass the two quality gates before animating)',
    'sfx': 'python3 scripts/sfx.py <slug>',
    'animate': 'npx remotion render src/index.ts <comp-id> studio/out/<slug>/<slug>-raw.mp4   (run from studio/)',
    'master': 'python3 scripts/master.py <slug>',
    'metadata': 'pipeline stage-7: write metadata.json, then python3 scripts/unseenpast.py <slug> --stage metadata',
}


def check_stage(slug: str, stage: str) -> bool:
    """Validate one stage's data. Prints results; returns True when the stage may proceed."""
    if stage == 'research':
        p = ep_file(slug, 'research.json')
        if not p.exists():
            print(f'! missing {p}')
            return False
        return run_validator('research', p)
    if stage == 'script':
        p = ep_file(slug, 'script.json')
        if not p.exists():
            print(f'! missing {p}')
            return False
        return run_validator('script', p)
    if stage == 'shots':
        p = ep_file(slug, 'shots.json')
        if not p.exists():
            print(f'! missing {p} — run python3 scripts/plan.py {slug}')
            return False
        return run_validator('shots', p)
    if stage == 'storyboard':
        sb = load_json(ep_file(slug, 'storyboard.json'))
        if not sb:
            print(f'! missing {ep_file(slug, "storyboard.json")} — run: node scripts/stills.mjs {slug}')
            return False
        missing = [f['shot_id'] for f in sb.get('frames', []) if not (OUT / slug / f.get('still_path', '')).exists()]
        if missing:
            print(f'! {len(missing)} stills missing on disk, first few: {missing[:5]}')
            return False
        if not sb.get('self_check_passed'):
            print('! storyboard.json self_check_passed is false — run both quality gates (references/self-check.md)')
            return False
        print(f'storyboard: {len(sb["frames"])} stills present, self-check passed')
        return True
    if stage == 'metadata':
        p = ep_file(slug, 'metadata.json')
        if not p.exists():
            print(f'! missing {p} (title, description, chapters, tags, disclosure)')
            return False
        print(f'metadata.json present ({p.stat().st_size} bytes)')
        return True
    raise SystemExit(f'unknown stage "{stage}"')


def main() -> None:
    args = sys.argv[1:]
    if not args or args[0] in ('-h', '--help'):
        print(__doc__)
        print(f'stages: {", ".join(STAGES)} | all')
        return
    slug = args[0]
    stage = args[args.index('--stage') + 1] if '--stage' in args else 'all'
    problems = check_prereqs(need_edge_tts=True)
    for p in problems:
        print('!', p)
    if not (ep_dir(slug) / 'research.json').exists() and not (EPISODES / slug).exists():
        print(f'note: no episode folder yet at {EPISODES / slug}')
    stages = STAGES if stage == 'all' else ([stage] if stage in STAGES else [])
    if not stages:
        raise SystemExit(f'--stage must be one of: {", ".join(STAGES)} | all')
    ok = True
    for s in stages:
        print(f'--- {s} ---')
        ok = check_stage(slug, s) and ok
    if ok:
        nxt = 'voice' if stage in ('script', 'all') else NEXT_CMD.get(stage, 'master')
        print(f'\nnext: {NEXT_CMD.get(nxt, nxt).replace("<slug>", slug)}')
    else:
        print('\nFix the failures above before moving on — the pipeline refuses to skip a stage.')
        sys.exit(1)


if __name__ == '__main__':
    main()

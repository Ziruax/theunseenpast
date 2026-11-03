"""Stage: the voice. Free Microsoft Edge TTS by default (optional ElevenLabs), word-level
timings, and 0.8-1.2 s pauses between the five acts.

python3 scripts/voice.py <slug> [--voice en-GB-RyanNeural] [--rate +0%] [--gap 1.0]
                             [--provider edge|elevenlabs] [--force]
Reads  src/episodes/<slug>/script.json   (acts[].narration; [S#] citation markers are stripped
       before synthesis — citations live in script.json, not in the narration audio)
Writes src/episodes/<slug>/words.json    ([{word, start_s, end_s}, ...] on the final timeline,
       gaps included — plan.py and the engine sync to this)
       src/episodes/<slug>/voice.mp3     (the narration, act gaps baked in)
       out/<slug>/voice_report.json      (provider, voice, rate, wpm, gaps, cost)
       out/<slug>/voice_acts/act-<n>.mp3 (per-act intermediates, kept for review)

FREE-VOICE STORY: edge-tts costs nothing and emits WordBoundary events with word-level
offsets (100-ns ticks), which is exactly the timing this pipeline syncs to. The default
voice is en-GB-RyanNeural (neutral British English, mature, measured). ElevenLabs remains
available as an optional path when ELEVENLABS_API_KEY is set (costs logged to costs.json).

RATE: the spec wants 140-150 wpm. Edge's default pace drifts with the text, so after a
first synthesis the measured wpm is checked and, if it is outside the band, the rate is
adjusted once (clamped to +/-15%) and the act is re-synthesised. Pass --rate to pin it.

ACT GAPS: edge-tts has no SSML break support, so acts are synthesised separately and joined
with a silence of --gap seconds (default 1.0, the middle of the 0.8-1.2 s spec range). The
word timings of each act are shifted by that act's start on the joined timeline. Because the
join is done on decoded audio, timing and audio stay in exact agreement (mp3 decoder delay
is a few ms and is shared by both). Tradeoff vs ElevenLabs: no intra-text pauses can be
placed this way, only act boundaries — natural sentence pauses inside an act are whatever
the neural voice chooses.
"""
from __future__ import annotations

import argparse
import asyncio
import base64
import hashlib
import json
import os
import pathlib
import re
import subprocess
import sys
import time
import urllib.request

import numpy as np

from unseenpast import SR, decode, ep_dir, ep_file, load_json, log_cost, out_dir, save_json, write_wav

DEFAULT_VOICE = 'en-GB-RyanNeural'
TARGET_WPM = 145.0          # middle of the 140-150 wpm band
WPM_TOLERANCE = 6.0
MAX_RATE_ADJUST = 15        # percent, each direction


def clean_narration(text: str) -> str:
    """Citations and markdown never reach the synthesiser."""
    t = re.sub(r'\[S\d+\]', '', text)
    t = t.replace('*', '').replace('#', ' ')
    return re.sub(r'\s+', ' ', t).strip()


def api_key() -> str:
    """The ElevenLabs key from the environment or the nearest .env (never printed)."""
    if os.environ.get('ELEVENLABS_API_KEY'):
        return os.environ['ELEVENLABS_API_KEY']
    for d in [pathlib.Path.cwd(), *pathlib.Path.cwd().parents]:
        p = d / '.env'
        if p.exists():
            for line in p.read_text(encoding='utf-8-sig', errors='ignore').splitlines():
                if line.strip().startswith('ELEVENLABS_API_KEY='):
                    return line.split('=', 1)[1].strip().strip('"').strip("'")
    raise SystemExit('No ElevenLabs key: set ELEVENLABS_API_KEY in the environment or a .env file.')


def eleven_api(path: str, body: dict, timeout: int = 180) -> bytes:
    req = urllib.request.Request('https://api.elevenlabs.io' + path,
                                 headers={'xi-api-key': api_key(), 'Content-Type': 'application/json'})
    req.data = json.dumps(body).encode()
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


# ---------------------------------------------------------------- edge synthesis
async def edge_act(text: str, voice: str, rate: str) -> tuple:
    """One act -> (mp3 bytes, [word, start_s, end_s] relative to the act's own audio)."""
    import edge_tts
    com = edge_tts.Communicate(text, voice, rate=rate)
    mp3, words = bytearray(), []
    async for chunk in com.stream():
        if chunk['type'] == 'audio':
            mp3 += chunk['data']
        elif chunk['type'] == 'WordBoundary':
            s = chunk['offset'] / 1e7  # 100-ns ticks -> seconds
            words.append({'word': chunk['text'], 'start_s': round(s, 3),
                          'end_s': round((chunk['offset'] + chunk['duration']) / 1e7, 3)})
    return bytes(mp3), words


# ---------------------------------------------------------------- elevenlabs synthesis
def eleven_act(text: str, voice_id: str) -> tuple:
    """One act via ElevenLabs with character timestamps, grouped into words."""
    res = json.loads(eleven_api(f'/v1/text-to-speech/{voice_id}/with-timestamps?output_format=mp3_44100_128',
                                {'text': text, 'model_id': 'eleven_multilingual_v2',
                                 'voice_settings': {'stability': 0.4, 'similarity_boost': 0.8, 'style': 0.35}}))
    al = res['alignment']
    words, cur = [], None
    for ch, s, e in zip(al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']):
        if re.match(r"[\w'’]", ch):
            if cur is None:
                cur = {'word': '', 'start_s': s, 'end_s': e}
            cur['word'] += ch
            cur['end_s'] = e
        elif cur is not None:
            words.append(cur)
            cur = None
    if cur:
        words.append(cur)
    for w in words:
        w['start_s'] = round(w['start_s'], 3)
        w['end_s'] = round(w['end_s'], 3)
    return base64.b64decode(res['audio_base64']), words


# ---------------------------------------------------------------- join acts with gaps
def assemble(acts: list, gap_s: float, act_dir: pathlib.Path) -> tuple:
    """Decode each act's mp3, join with silences, shift word timings onto the joined timeline.
    acts: [(mp3_bytes, words), ...] in act order. Returns (full mp3 path, words, act_starts)."""
    buf, words, act_starts, pos = [], [], [], 0.0
    for n, (mp3, act_words) in enumerate(acts, 1):
        p = act_dir / f'act-{n}.mp3'
        p.write_bytes(mp3)
        x = decode(p)
        act_starts.append(round(pos, 3))
        buf.append(x)
        words += [{'word': w['word'], 'start_s': round(pos + w['start_s'], 3),
                   'end_s': round(pos + w['end_s'], 3)} for w in act_words]
        pos += len(x) / SR + gap_s
        if n < len(acts):
            buf.append(np.zeros(int(gap_s * SR)))
    full = np.concatenate(buf)
    return full, words, act_starts


def main() -> None:
    ap = argparse.ArgumentParser(description='Narration synthesis for The Unseen Past (edge-tts default).')
    ap.add_argument('slug')
    ap.add_argument('--voice', default=DEFAULT_VOICE, help=f'edge-tts voice name (default {DEFAULT_VOICE})')
    ap.add_argument('--rate', default=None, help="edge-tts rate, e.g. '+0%%'; default: auto-tuned to 140-150 wpm")
    ap.add_argument('--gap', type=float, default=1.0, help='silence between acts in s (spec 0.8-1.2, default 1.0)')
    ap.add_argument('--provider', choices=['edge', 'elevenlabs'], default='edge')
    ap.add_argument('--force', action='store_true', help='re-synthesise even if the signature is unchanged')
    a = ap.parse_args()

    script = load_json(ep_file(a.slug, 'script.json'))
    if not script:
        raise SystemExit(f'No script.json for {a.slug} — run the stage-2 script prompt first.')
    acts_text = [clean_narration(act['narration']) for act in script['acts']]
    if not acts_text or any(not t for t in acts_text):
        raise SystemExit('script.json has an act with empty narration.')
    gap = min(1.2, max(0.8, a.gap))
    act_dir = out_dir(a.slug) / 'voice_acts'
    act_dir.mkdir(parents=True, exist_ok=True)
    voice_mp3 = ep_dir(a.slug) / 'voice.mp3'
    words_path = ep_file(a.slug, 'words.json')
    report_path = out_dir(a.slug) / 'voice_report.json'
    sig = hashlib.sha1(json.dumps([acts_text, a.voice, a.rate, gap, a.provider]).encode()).hexdigest()[:12]
    old = load_json(report_path, {})
    if not a.force and old.get('sig') == sig and voice_mp3.exists() and words_path.exists():
        print('Script, voice and rate unchanged since the last run: reusing '
              f'{voice_mp3.name} and words.json (0 credits, free).')
        return

    rate, tries = a.rate, 0
    while True:
        tries += 1
        t0 = time.time()
        if a.provider == 'edge':
            try:
                import edge_tts  # noqa: F401
            except ImportError:
                print('edge-tts is not installed. Install it with:\n  pip install edge-tts\n'
                      'then re-run this script (or set --provider elevenlabs with ELEVENLABS_API_KEY).')
                sys.exit(2)
            print(f'Synthesising {len(acts_text)} acts with edge-tts, voice {a.voice}, rate {rate} ...')
            acts = asyncio.run(asyncio.gather(*[edge_act(t, a.voice, rate or '+0%') for t in acts_text]))
            acts = list(acts)
            cost = '0 credits (free Microsoft Edge TTS)'
        else:
            print(f'Synthesising {len(acts_text)} acts with ElevenLabs, voice {a.voice} ...')
            acts = [eleven_act(t, a.voice) for t in acts_text]
            cost = sum(len(t) for t in acts_text)

        full, words, act_starts = assemble(acts, gap, act_dir)
        n_words = len(words)
        speech_s = sum(len(decode(act_dir / f'act-{n}.mp3')) for n in range(1, len(acts) + 1)) / SR
        wpm = n_words / (speech_s / 60) if speech_s else 0.0
        print(f'pass {tries}: {n_words} words, {speech_s:.1f} s speech -> {wpm:.0f} wpm (target 140-150)')

        if a.rate is not None or tries >= 2 or abs(wpm - TARGET_WPM) <= WPM_TOLERANCE:
            break
        pct = int(max(-MAX_RATE_ADJUST, min(MAX_RATE_ADJUST, round((wpm / TARGET_WPM - 1) * 100))))
        rate = f'{pct:+d}%'
        print(f'  outside the band -> re-synthesising at rate {rate}')

    wav_tmp = out_dir(a.slug) / 'voice_full.wav'
    write_wav(wav_tmp, full)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(wav_tmp), '-codec:a', 'libmp3lame', '-b:a', '192k',
                    str(voice_mp3)], check=True)
    wav_tmp.unlink()
    save_json(words_path, words)
    report = {'episode': a.slug, 'sig': sig, 'provider': a.provider, 'voice': a.voice, 'rate': rate or '+0%',
              'gap_s': gap, 'words': n_words, 'speech_s': round(speech_s, 2),
              'total_s': round(len(full) / SR, 2), 'wpm': round(wpm, 1), 'act_starts_s': act_starts, 'cost': cost}
    save_json(report_path, report)
    wav = f'{report["total_s"]:.1f} s total, {speech_s:.1f} s speech, {gap:.1f} s act gaps'
    print(f'{voice_mp3} written: {wav}')
    print(f'{words_path}: {n_words} words with timings')
    if a.provider == 'edge':
        print(f'cost: {cost}')
    else:
        log_cost(a.slug, 'voice', cost, f'{len(" ".join(acts_text))} characters, {len(acts_text)} acts')


if __name__ == '__main__':
    main()

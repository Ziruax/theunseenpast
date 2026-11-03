"""Stage 4 review: the storyboard sheet. Lays the board stills out as one captioned contact
sheet: shot number and id, act, visual type, start time and the description. This is what
gets reviewed (by you, then by a human) before any animation, together with the 11-point
checks in storyboard.json.

python3 scripts/board.py <slug> [--cols 4]
Reads  out/<slug>/board/still-<shot_id>.png (from stills.mjs) and src/episodes/<slug>/shots.json
Writes out/<slug>/storyboard.jpg
"""
from __future__ import annotations

import argparse
import pathlib
import sys

from PIL import Image, ImageDraw, ImageFont

from unseenpast import ROOT, ep_file, load_json, out_dir


def font(size: int, bold: bool = True):
    """The first face that exists: the studio's own, then common system faces, then Pillow's default."""
    cands = [ROOT / 'studio' / 'public' / 'fonts' / 'board.ttf', ROOT / 'studio' / 'public' / 'fonts' / 'board.otf']
    cands += [pathlib.Path(p) for p in ['C:/Windows/Fonts/segoeuib.ttf' if bold else 'C:/Windows/Fonts/segoeui.ttf',
                                        'C:/Windows/Fonts/arialbd.ttf',
                                        '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
                                        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf']]
    for c in cands:
        if c.exists():
            return ImageFont.truetype(str(c), size)
    return ImageFont.load_default(size)


def main() -> None:
    ap = argparse.ArgumentParser(description='Contact sheet of the storyboard stills.')
    ap.add_argument('slug')
    ap.add_argument('--cols', type=int, default=4)
    a = ap.parse_args()

    data = load_json(ep_file(a.slug, 'shots.json'))
    if not data:
        raise SystemExit(f'No shots.json for {a.slug} — run plan.py first.')
    shots = data['shots']
    sb = load_json(ep_file(a.slug, 'storyboard.json'), {})
    checks = {f['shot_id']: f.get('checks', {}) for f in sb.get('frames', [])}
    src = out_dir(a.slug) / 'board'

    head, body, note = font(34), font(26), font(22, False)
    W, H, CAP, PAD = 640, 360, 150, 20
    cols = a.cols
    rows = (len(shots) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * W + (cols + 1) * PAD, rows * (H + CAP + PAD) + PAD + 90), (24, 21, 18))
    d = ImageDraw.Draw(sheet)
    total = shots[-1]['end_s']
    d.text((PAD, 26), f'{data.get("episode_id", a.slug)}  ·  storyboard, one still per shot  ·  '
                      f'{len(shots)} shots, {total:.0f} s', font=head, fill=(240, 233, 219))

    def fit(text: str, f, width: int) -> list:
        words, lines, cur = text.split(), [], ''
        for w in words:
            t = (cur + ' ' + w).strip()
            if d.textlength(t, font=f) <= width:
                cur = t
            else:
                lines.append(cur)
                cur = w
        lines.append(cur)
        return lines[:2]

    passed = 0
    for i, s in enumerate(shots):
        x = PAD + (i % cols) * (W + PAD)
        y = 90 + PAD + (i // cols) * (H + CAP + PAD)
        p = src / f'still-{s["shot_id"]}.png'
        if p.exists():
            sheet.paste(Image.open(p).convert('RGB').resize((W, H)), (x, y))
        else:
            d.rectangle([x, y, x + W, y + H], fill=(60, 30, 40))
            d.text((x + 16, y + 16), f'missing {p.name}', font=body, fill=(255, 120, 120))
        d.rectangle([x, y + H, x + W, y + H + CAP], fill=(38, 33, 28))
        c = checks.get(s['shot_id'], {})
        ok = all(c.values()) if c else False
        passed += ok
        d.text((x + 14, y + H + 10), f'{i + 1}  {s["shot_id"]}  {s["visual_type"]}', font=head,
               fill=(150, 220, 150) if ok else (255, 177, 90))
        d.text((x + W - 14 - d.textlength(f'{s["start_s"]:.1f}s / act {s["act"]}', font=note), y + H + 18),
               f'{s["start_s"]:.1f}s / act {s["act"]}', font=note, fill=(180, 170, 155))
        yy = y + H + 56
        for ln in fit(s['description'], body, W - 28):
            d.text((x + 14, yy), ln, font=body, fill=(240, 233, 219))
            yy += 30
    verdict = f'{passed}/{len(shots)} stills have all 11 checks passed'
    d.text((PAD, sheet.height - 60), verdict, font=head, fill=(150, 220, 150) if passed == len(shots) else (255, 120, 120))
    out = out_dir(a.slug) / 'storyboard.jpg'
    sheet.save(out, quality=88)
    print(f'{out}  ({sheet.width}x{sheet.height}, {verdict})')


if __name__ == '__main__':
    main()

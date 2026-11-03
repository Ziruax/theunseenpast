// Stage 4: the storyboard stills. Renders one PNG still per shot of shots.json from the
// studio's StoryboardStills composition (the per-shot board render of the flat-vector
// scenes), then writes a storyboard.json skeleton whose 11-point checks are all false —
// the checks are set by the human/agent review at the two quality gates, never by this script.
//
// Run from the studio folder (the copy with package.json):
//   node ../scripts/stills.mjs <slug> [--limit N] [--only S012 S013] [--force] [--scale 1]
// Writes out/<slug>/board/still-<shot_id>.png (skipped when it already exists, unless --force)
// and src/episodes/<slug>/storyboard.json.
//
// It uses the renderStill API (what `npx remotion still` wraps) so the bundle happens once
// for all ~90 stills instead of once per shot.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.resolve('package.json'));
const { bundle } = require('@remotion/bundler');
const { renderStill, selectComposition } = require('@remotion/renderer');

const args = process.argv.slice(2);
const slug = args[0];
if (!slug || slug.startsWith('--')) {
  console.error('usage: node scripts/stills.mjs <slug> [--limit N] [--only S012 ...] [--force] [--scale 1]');
  process.exit(1);
}
const flag = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : dflt;
};
const limit = flag('--limit') ? Number(flag('--limit')) : Infinity;
const only = args.includes('--only') ? args.slice(args.indexOf('--only') + 1).filter((a) => !a.startsWith('--')) : null;
const force = args.includes('--force');
const scale = Number(flag('--scale', 1));
const COMP = String(flag('--comp', 'StoryboardStills')); // per-shot board composition id

const shotsData = JSON.parse(fs.readFileSync(path.resolve('src/episodes', slug, 'shots.json'), 'utf8'));
let shots = shotsData.shots;
if (only) shots = shots.filter((s) => only.includes(s.shot_id));
if (Number.isFinite(limit)) shots = shots.slice(0, limit);
if (!shots.length) throw new Error('No shots to render (check the slug / --only ids).');

const outDir = path.resolve('out', slug, 'board');
fs.mkdirSync(outDir, { recursive: true });

console.log(`bundling ${COMP} for ${shots.length} still${shots.length === 1 ? '' : 's'} ...`);
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public') });
const composition = await selectComposition({ serveUrl, id: COMP });

const CHECK_KEYS = ['reads_at_200px', 'single_focal_point', 'clear_silhouette', 'no_anachronism',
  'palette_compliant', 'crimson_max_once', 'text_max_4_words', 'no_stick_figures',
  'period_accurate', 'background_depth', 'parchment_layer'];
const frames = [];
for (const s of shots) {
  const output = path.join(outDir, `still-${s.shot_id}.png`);
  const exists = fs.existsSync(output);
  if (!exists || force) {
    await renderStill({ serveUrl, composition, frame: 0, inputProps: { shotId: s.shot_id }, output, overwrite: true, scale });
    process.stdout.write(exists ? `!${s.shot_id} ` : `${s.shot_id} `);
  } else {
    process.stdout.write(`=${s.shot_id} `); // skipped, already on disk
  }
  frames.push({ shot_id: s.shot_id, still_path: `board/still-${s.shot_id}.png`, checks: Object.fromEntries(CHECK_KEYS.map((k) => [k, false])) });
}
console.log(`\n(${shots.length} stills: rendered, !forced, =skipped)`);

const storyboard = {
  episode_id: shotsData.episode_id,
  self_check_passed: false,
  frames,
};
const sbPath = path.resolve('src/episodes', slug, 'storyboard.json');
const old = fs.existsSync(sbPath) ? JSON.parse(fs.readFileSync(sbPath, 'utf8')) : null;
// Keep checks that were already reviewed when re-rendering after a fix; new frames start false.
if (old && old.frames) {
  const prev = new Map(old.frames.map((f) => [f.shot_id, f]));
  for (const f of storyboard.frames) {
    if (prev.has(f.shot_id) && !force) f.checks = prev.get(f.shot_id).checks;
  }
  storyboard.self_check_passed = old.self_check_passed && frames.every((f) => prev.has(f.shot_id));
}
fs.writeFileSync(sbPath, JSON.stringify(storyboard, null, 1) + '\n');
console.log(`${sbPath}: ${frames.length} frames, self_check_passed=${storyboard.self_check_passed}`);
console.log('next: pass both quality gates (references/self-check.md), then review with: node ../scripts/board.py ' + slug);

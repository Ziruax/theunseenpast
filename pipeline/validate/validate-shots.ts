/**
 * Stage 3 gate — validate shots.json
 *
 * Usage:
 *   bun pipeline/validate/validate-shots.ts <path-to-shots.json>
 *   node --experimental-strip-types pipeline/validate/validate-shots.ts <path-to-shots.json>
 *
 * Exit 0 + PASS summary on success; exit 1 + numbered FAIL list on failure.
 * Dependency-free: node built-ins only (no npm packages).
 */

import { readFileSync } from "node:fs";

interface ShotRec {
  shot_id: string;
  start_s: number;
  end_s: number;
  duration_s: number;
  visual_type: string;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function die(messages: string[]): never {
  for (const m of messages) console.log(m);
  process.exit(1);
}

function loadJson(path: string): unknown {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    die([
      `FAIL: 1. cannot read file: ${path} (does it exist? is the path correct?)`,
      "Usage: bun pipeline/validate/validate-shots.ts <path-to-shots.json>",
    ]);
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch (e) {
    die([`FAIL: 1. file is not valid JSON: ${path} (${String(e)})`]);
  }
}

function asShot(item: unknown, i: number, failures: string[]): ShotRec | undefined {
  if (!isObj(item)) {
    failures.push(`FAIL: shots[${i}] must be an object`);
    return undefined;
  }
  const shotId: unknown = item["shot_id"];
  const start: unknown = item["start_s"];
  const end: unknown = item["end_s"];
  const dur: unknown = item["duration_s"];
  const vtype: unknown = item["visual_type"];
  if (typeof shotId !== "string") {
    failures.push(`FAIL: shots[${i}] is missing shot_id`);
    return undefined;
  }
  const id: string = shotId;
  if (typeof start !== "number" || typeof end !== "number") {
    failures.push(`FAIL: shot ${id}: start_s and end_s must be numbers`);
    return undefined;
  }
  if (typeof dur !== "number") {
    failures.push(`FAIL: shot ${id}: duration_s must be a number`);
    return undefined;
  }
  if (typeof vtype !== "string" || vtype.trim().length === 0) {
    failures.push(`FAIL: shot ${id}: visual_type is missing or empty`);
  }
  return {
    shot_id: id,
    start_s: start,
    end_s: end,
    duration_s: dur,
    visual_type: typeof vtype === "string" ? vtype : "",
  };
}

function main(): void {
  const args: string[] = process.argv.slice(2);
  if (args.length < 1) {
    die([
      "FAIL: 1. missing required argument: path to shots.json",
      "Usage: bun pipeline/validate/validate-shots.ts <path-to-shots.json>",
    ]);
  }
  const path: string = args[0];
  const doc: unknown = loadJson(path);
  if (!isObj(doc)) {
    die([`FAIL: 1. ${path}: top level must be a JSON object`]);
  }
  const failures: string[] = [];

  const shotsRaw: unknown = doc["shots"];
  if (!Array.isArray(shotsRaw)) {
    die([`FAIL: 1. ${path}: "shots" must be an array`]);
  }
  const shots: ShotRec[] = [];
  shotsRaw.forEach((item: unknown, i: number) => {
    const s: ShotRec | undefined = asShot(item, i, failures);
    if (s !== undefined) shots.push(s);
  });

  // 1. total_shots between 80 and 120 (and consistent with shots array)
  const total: unknown = doc["total_shots"];
  if (typeof total !== "number" || !Number.isInteger(total)) {
    failures.push("FAIL: total_shots must be an integer");
  } else if (total < 80 || total > 120) {
    failures.push(`FAIL: total_shots must be between 80 and 120 (found ${total})`);
  }
  if (typeof total === "number" && total !== shots.length) {
    failures.push(`FAIL: total_shots (${total}) does not match shots array length (${shots.length})`);
  }
  if (shots.length > 0 && (shots.length < 80 || shots.length > 120)) {
    failures.push(`FAIL: actual shot count must be between 80 and 120 (found ${shots.length})`);
  }

  // 2. every duration_s <= 4.0 (and positive)
  for (const s of shots) {
    if (s.duration_s <= 0) {
      failures.push(`FAIL: shot ${s.shot_id}: duration_s must be > 0 (found ${s.duration_s})`);
    } else if (s.duration_s > 4.0) {
      failures.push(`FAIL: shot ${s.shot_id}: duration_s ${s.duration_s} exceeds the 4.0s hard maximum`);
    }
  }

  // 3. every shot has visual_type (checked in asShot; count for summary)
  const missingVisualType: number = shots.filter((s: ShotRec) => s.visual_type.length === 0).length;

  // 4. sum of duration_s equals 300 ± 0.5
  const sum: number = shots.reduce((acc: number, s: ShotRec) => acc + s.duration_s, 0);
  if (sum < 299.5 || sum > 300.5) {
    failures.push(`FAIL: sum of duration_s must be 300 ± 0.5 (found ${sum.toFixed(3)})`);
  }

  // 5. shots contiguous and non-overlapping
  const sorted: ShotRec[] = shots.slice().sort((a: ShotRec, b: ShotRec) => a.start_s - b.start_s);
  const EPS_OVERLAP: number = 0.01;
  const EPS_GAP: number = 0.05;
  for (let i = 1; i < sorted.length; i++) {
    const prev: ShotRec = sorted[i - 1];
    const cur: ShotRec = sorted[i];
    if (cur.start_s < prev.end_s - EPS_OVERLAP) {
      failures.push(
        `FAIL: shots ${prev.shot_id} and ${cur.shot_id} overlap (prev ends ${prev.end_s}s, next starts ${cur.start_s}s)`,
      );
    } else if (cur.start_s > prev.end_s + EPS_GAP) {
      failures.push(
        `FAIL: gap between shots ${prev.shot_id} and ${cur.shot_id} (prev ends ${prev.end_s}s, next starts ${cur.start_s}s)`,
      );
    }
  }

  // Report
  if (failures.length > 0) {
    const lines: string[] = [`FAIL — validate-shots (${path})`];
    failures.forEach((f: string, i: number) => lines.push(`${i + 1}. ${f}`));
    die(lines);
  }
  console.log(`PASS — validate-shots (${path})`);
  console.log(`  total_shots: ${shots.length} (80–120)`);
  console.log("  duration_s: every shot <= 4.0s");
  console.log(`  visual_type: present on every shot (${missingVisualType} missing)`);
  console.log(`  total duration: ${sum.toFixed(3)}s (300 ± 0.5)`);
  console.log("  timeline: shots contiguous and non-overlapping");
  process.exit(0);
}

main();

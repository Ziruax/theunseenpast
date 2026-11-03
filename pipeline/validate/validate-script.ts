/**
 * Stage 2 gate — validate script.json (and resolve its citations against research.json)
 *
 * Usage:
 *   bun pipeline/validate/validate-script.ts <path-to-script.json> [path-to-research.json]
 *   node --experimental-strip-types pipeline/validate/validate-script.ts <script.json> [research.json]
 *
 * If the research path is omitted, the validator auto-finds a sibling `research.json`
 * (same directory as script.json, then one directory up).
 *
 * Exit 0 + PASS summary on success; exit 1 + numbered FAIL list on failure.
 * Dependency-free: node built-ins only (no npm packages).
 */

import { readFileSync, existsSync } from "node:fs";

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function die(messages: string[]): never {
  for (const m of messages) console.log(m);
  process.exit(1);
}

function loadJson(path: string, context: string): unknown {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    die([`FAIL: 1. cannot read ${context}: ${path} (does it exist? is the path correct?)`]);
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch (e) {
    die([`FAIL: 1. ${context} is not valid JSON: ${path} (${String(e)})`]);
  }
}

function dirname(p: string): string {
  const i: number = p.lastIndexOf("/");
  if (i < 0) return ".";
  return i === 0 ? "/" : p.slice(0, i);
}

function joinPath(a: string, b: string): string {
  return a.endsWith("/") ? a + b : a + "/" + b;
}

function collectSourceIds(sources: unknown): string[] {
  const out: string[] = [];
  if (!Array.isArray(sources)) return out;
  for (const item of sources) {
    if (isObj(item) && typeof item["source_id"] === "string") {
      out.push(item["source_id"]);
    }
  }
  return out;
}

function findResearchPath(scriptPath: string, explicit: string | undefined): string | undefined {
  if (explicit !== undefined) return explicit;
  const dir: string = dirname(scriptPath);
  const candidates: string[] = [joinPath(dir, "research.json"), joinPath(dirname(dir), "research.json")];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return undefined;
}

function main(): void {
  const args: string[] = process.argv.slice(2);
  if (args.length < 1) {
    die([
      "FAIL: 1. missing required argument: path to script.json",
      "Usage: bun pipeline/validate/validate-script.ts <path-to-script.json> [path-to-research.json]",
    ]);
  }
  const scriptPath: string = args[0];
  const doc: unknown = loadJson(scriptPath, "script.json");
  if (!isObj(doc)) {
    die([`FAIL: 1. ${scriptPath}: top level must be a JSON object`]);
  }
  const failures: string[] = [];

  // 1. exactly 5 acts
  const acts: unknown = doc["acts"];
  if (!Array.isArray(acts)) {
    failures.push("FAIL: acts must be an array");
  } else if (acts.length !== 5) {
    failures.push(`FAIL: acts must contain exactly 5 acts (found ${acts.length})`);
  }

  // 2. total_words between 700 and 850
  const totalWords: unknown = doc["total_words"];
  if (typeof totalWords !== "number" || !Number.isInteger(totalWords)) {
    failures.push("FAIL: total_words must be an integer");
  } else if (totalWords < 700 || totalWords > 850) {
    failures.push(`FAIL: total_words must be between 700 and 850 (found ${totalWords})`);
  }

  // 3. every act has non-empty narration; collect citation source_ids
  const citedSourceIds: string[] = [];
  if (Array.isArray(acts)) {
    acts.forEach((act: unknown, i: number) => {
      if (!isObj(act)) {
        failures.push(`FAIL: acts[${i}] must be an object`);
        return;
      }
      const narration: unknown = act["narration"];
      if (typeof narration !== "string" || narration.trim().length === 0) {
        failures.push(`FAIL: acts[${i}] (${String(act["act_name"] ?? "unnamed")}) has empty or missing narration`);
      }
      const citations: unknown = act["citations"];
      if (Array.isArray(citations)) {
        for (const c of citations) {
          if (isObj(c) && typeof c["source_id"] === "string") {
            citedSourceIds.push(c["source_id"]);
          } else {
            failures.push(`FAIL: acts[${i}] has a citation missing source_id`);
          }
        }
      }
    });
  }

  // 4. central question present
  const question: unknown = doc["central_question"];
  if (typeof question !== "string" || question.trim().length === 0) {
    failures.push("FAIL: central_question must be a non-empty string");
  }

  // 5. every citation resolves against research.json
  const researchPath: string | undefined = findResearchPath(scriptPath, args[1]);
  if (researchPath === undefined) {
    failures.push(
      "FAIL: cannot resolve citations — research.json not found next to script.json or one directory up; pass its path as the 2nd argument",
    );
  } else {
    const research: unknown = loadJson(researchPath, "research.json");
    const knownIds: Set<string> = new Set<string>();
    if (isObj(research)) {
      for (const id of collectSourceIds(research["primary_sources"])) knownIds.add(id);
      for (const id of collectSourceIds(research["secondary_sources"])) knownIds.add(id);
    }
    if (knownIds.size === 0) {
      failures.push(`FAIL: ${researchPath} contains no resolvable source_ids (primary_sources/secondary_sources)`);
    }
    const uniqueCited: Set<string> = new Set<string>(citedSourceIds);
    for (const id of uniqueCited) {
      if (!knownIds.has(id)) {
        failures.push(`FAIL: citation source_id "${id}" does not resolve to a source in ${researchPath}`);
      }
    }
    if (citedSourceIds.length === 0) {
      failures.push("FAIL: script has no citations at all — every material claim must carry a [S#] citation");
    }
  }

  // Report
  if (failures.length > 0) {
    const lines: string[] = [`FAIL — validate-script (${scriptPath})`];
    failures.forEach((f: string, i: number) => lines.push(`${i + 1}. ${f}`));
    die(lines);
  }
  console.log(`PASS — validate-script (${scriptPath})`);
  console.log("  acts: exactly 5");
  console.log(`  total_words: ${String(doc["total_words"])} (700–850)`);
  console.log("  narration: present in every act");
  console.log("  central_question: present");
  console.log(`  citations: ${citedSourceIds.length} citation(s), all resolve against ${researchPath}`);
  process.exit(0);
}

main();

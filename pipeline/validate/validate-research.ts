/**
 * Stage 1 gate — validate research.json
 *
 * Usage:
 *   bun pipeline/validate/validate-research.ts <path-to-research.json>
 *   node --experimental-strip-types pipeline/validate/validate-research.ts <path-to-research.json>
 *
 * Exit 0 + PASS summary on success; exit 1 + numbered FAIL list on failure.
 * Dependency-free: node built-ins only (no npm packages).
 */

import { readFileSync } from "node:fs";

interface SourceRec {
  source_id: string;
  priority: number;
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
      "Usage: bun pipeline/validate/validate-research.ts <path-to-research.json>",
    ]);
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch (e) {
    die([`FAIL: 1. file is not valid JSON: ${path} (${String(e)})`]);
  }
}

function collectSources(sources: unknown): SourceRec[] {
  const out: SourceRec[] = [];
  if (!Array.isArray(sources)) return out;
  for (const item of sources) {
    if (isObj(item) && typeof item["source_id"] === "string" && typeof item["priority"] === "number") {
      out.push({ source_id: item["source_id"], priority: item["priority"] });
    }
  }
  return out;
}

function main(): void {
  const args: string[] = process.argv.slice(2);
  if (args.length < 1) {
    die([
      "FAIL: 1. missing required argument: path to research.json",
      "Usage: bun pipeline/validate/validate-research.ts <path-to-research.json>",
    ]);
  }
  const path: string = args[0];
  const doc: unknown = loadJson(path);
  if (!isObj(doc)) {
    die([`FAIL: 1. ${path}: top level must be a JSON object`]);
  }
  const failures: string[] = [];

  // 1. primary_sources present, array, >= 2 items
  const primaryRaw: unknown = doc["primary_sources"];
  if (!Array.isArray(primaryRaw)) {
    failures.push("FAIL: primary_sources must be an array");
  } else if (primaryRaw.length < 2) {
    failures.push(`FAIL: primary_sources must have at least 2 items (found ${primaryRaw.length})`);
  }

  // 2. all primary_sources priorities are 1 or 2
  const primary: SourceRec[] = collectSources(primaryRaw);
  for (const s of primary) {
    if (s.priority !== 1 && s.priority !== 2) {
      failures.push(`FAIL: primary_sources entry "${s.source_id}" has priority ${s.priority} (must be 1 or 2)`);
    }
  }

  // 3. all documented_facts source_ids resolve to a source in research.json
  const secondary: SourceRec[] = collectSources(doc["secondary_sources"]);
  const knownIds: Set<string> = new Set<string>();
  for (const s of primary) knownIds.add(s.source_id);
  for (const s of secondary) knownIds.add(s.source_id);

  const facts: unknown = doc["documented_facts"];
  if (!Array.isArray(facts)) {
    failures.push("FAIL: documented_facts must be an array");
  } else {
    if (facts.length === 0) failures.push("FAIL: documented_facts must not be empty");
    facts.forEach((item: unknown, i: number) => {
      if (!isObj(item)) {
        failures.push(`FAIL: documented_facts[${i}] must be an object`);
        return;
      }
      const sid: unknown = item["source_id"];
      if (typeof sid !== "string" || sid.length === 0) {
        failures.push(`FAIL: documented_facts[${i}] is missing a source_id`);
      } else if (!knownIds.has(sid)) {
        failures.push(`FAIL: documented_facts[${i}] cites unknown source_id "${sid}" (not in primary_sources/secondary_sources)`);
      }
    });
  }

  // 4. asset_licenses present with license entries
  const licenses: unknown = doc["asset_licenses"];
  if (!Array.isArray(licenses)) {
    failures.push("FAIL: asset_licenses must be present and be an array");
  } else {
    licenses.forEach((item: unknown, i: number) => {
      if (!isObj(item)) {
        failures.push(`FAIL: asset_licenses[${i}] must be an object`);
        return;
      }
      const lic: unknown = item["license"];
      if (typeof lic !== "string" || lic.trim().length === 0) {
        failures.push(`FAIL: asset_licenses[${i}] has no license entry`);
      }
    });
  }

  // 5. core_claim length >= 20
  const claim: unknown = doc["core_claim"];
  if (typeof claim !== "string" || claim.length < 20) {
    const len: number = typeof claim === "string" ? claim.length : 0;
    failures.push(`FAIL: core_claim must be at least 20 characters (found ${len})`);
  }

  // Report
  if (failures.length > 0) {
    const lines: string[] = [`FAIL — validate-research (${path})`];
    failures.forEach((f: string, i: number) => lines.push(`${i + 1}. ${f}`));
    die(lines);
  }
  const primaryCount: number = Array.isArray(primaryRaw) ? primaryRaw.length : 0;
  console.log(`PASS — validate-research (${path})`);
  console.log(`  primary_sources: ${primaryCount} (all priority 1/2)`);
  console.log("  documented_facts: all source_ids resolve");
  console.log("  asset_licenses: present with license entries");
  console.log("  core_claim: >= 20 characters");
  process.exit(0);
}

main();

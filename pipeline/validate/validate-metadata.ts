/**
 * Stage 7 gate — validate metadata.json (YouTube package)
 *
 * Usage:
 *   bun pipeline/validate/validate-metadata.ts <path-to-metadata.json>
 *   node --experimental-strip-types pipeline/validate/validate-metadata.ts <path-to-metadata.json>
 *
 * Exit 0 + PASS summary on success; exit 1 + numbered FAIL list on failure.
 * Dependency-free: node built-ins only (no npm packages).
 */

import { readFileSync } from "node:fs";

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
      "Usage: bun pipeline/validate/validate-metadata.ts <path-to-metadata.json>",
    ]);
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch (e) {
    die([`FAIL: 1. file is not valid JSON: ${path} (${String(e)})`]);
  }
}

// A "Sources" section marker: a line whose first word (allowing markdown
// bullets/headings like "-", "#", "*") is "Sources".
const SOURCES_MARKER: RegExp = /(^|\n)[\s>#*\-–—]*sources\b/i;
// The synthetic-content disclosure marker phrase.
const DISCLOSURE_MARKER: RegExp = /reconstructed composite/i;

function main(): void {
  const args: string[] = process.argv.slice(2);
  if (args.length < 1) {
    die([
      "FAIL: 1. missing required argument: path to metadata.json",
      "Usage: bun pipeline/validate/validate-metadata.ts <path-to-metadata.json>",
    ]);
  }
  const path: string = args[0];
  const doc: unknown = loadJson(path);
  if (!isObj(doc)) {
    die([`FAIL: 1. ${path}: top level must be a JSON object`]);
  }
  const failures: string[] = [];

  // 1. title <= 70 characters
  const title: unknown = doc["title"];
  if (typeof title !== "string" || title.trim().length === 0) {
    failures.push("FAIL: title must be a non-empty string");
  } else if (title.length > 70) {
    failures.push(`FAIL: title must be at most 70 characters (found ${title.length})`);
  }

  // 2. description contains the Sources section marker and the disclosure marker
  const description: unknown = doc["description"];
  if (typeof description !== "string" || description.trim().length === 0) {
    failures.push("FAIL: description must be a non-empty string");
  } else {
    if (!SOURCES_MARKER.test(description)) {
      failures.push('FAIL: description must contain a "Sources" section marker (a line starting with "Sources")');
    }
    if (!DISCLOSURE_MARKER.test(description)) {
      failures.push(
        'FAIL: description must contain the synthetic-content disclosure marker phrase "Reconstructed composite" (or equivalent AI/synthetic-content disclosure sentence)',
      );
    }
  }

  // 3. chapters: at least 1, each with time_s >= 0 and a non-empty label
  const chapters: unknown = doc["chapters"];
  if (!Array.isArray(chapters)) {
    failures.push("FAIL: chapters must be an array");
  } else {
    if (chapters.length < 1) failures.push("FAIL: chapters must contain at least 1 entry");
    chapters.forEach((c: unknown, i: number) => {
      if (!isObj(c)) {
        failures.push(`FAIL: chapters[${i}] must be an object`);
        return;
      }
      const timeS: unknown = c["time_s"];
      const label: unknown = c["label"];
      if (typeof timeS !== "number" || timeS < 0) {
        failures.push(`FAIL: chapters[${i}].time_s must be a number >= 0`);
      }
      if (typeof label !== "string" || label.trim().length === 0) {
        failures.push(`FAIL: chapters[${i}].label must be a non-empty string`);
      }
    });
  }

  // 4. tags: at most 30 items, each <= 30 characters
  const tags: unknown = doc["tags"];
  if (!Array.isArray(tags)) {
    failures.push("FAIL: tags must be an array");
  } else {
    if (tags.length > 30) failures.push(`FAIL: tags must have at most 30 items (found ${tags.length})`);
    tags.forEach((t: unknown, i: number) => {
      if (typeof t !== "string" || t.trim().length === 0) {
        failures.push(`FAIL: tags[${i}] must be a non-empty string`);
      } else if (t.length > 30) {
        failures.push(`FAIL: tags[${i}] must be at most 30 characters (found ${t.length})`);
      }
    });
  }

  // 5. thumbnail_paths: exactly 2 entries
  const thumbs: unknown = doc["thumbnail_paths"];
  if (!Array.isArray(thumbs)) {
    failures.push("FAIL: thumbnail_paths must be an array of 2 paths");
  } else if (thumbs.length !== 2) {
    failures.push(`FAIL: thumbnail_paths must contain exactly 2 paths (found ${thumbs.length})`);
  } else {
    thumbs.forEach((t: unknown, i: number) => {
      if (typeof t !== "string" || t.trim().length === 0) {
        failures.push(`FAIL: thumbnail_paths[${i}] must be a non-empty string path`);
      }
    });
  }

  // 6. disclosure must be true (synthetic-content flag)
  const disclosure: unknown = doc["disclosure"];
  if (typeof disclosure !== "boolean") {
    failures.push("FAIL: disclosure must be a boolean");
  } else if (disclosure !== true) {
    failures.push("FAIL: disclosure must be true — the YouTube synthetic-content disclosure is mandatory");
  }

  // Report
  if (failures.length > 0) {
    const lines: string[] = [`FAIL — validate-metadata (${path})`];
    failures.forEach((f: string, i: number) => lines.push(`${i + 1}. ${f}`));
    die(lines);
  }
  const chapterCount: number = Array.isArray(chapters) ? chapters.length : 0;
  const tagCount: number = Array.isArray(tags) ? tags.length : 0;
  console.log(`PASS — validate-metadata (${path})`);
  console.log("  title: <= 70 characters");
  console.log('  description: contains "Sources" section and disclosure marker');
  console.log(`  chapters: ${chapterCount} (>= 1)`);
  console.log(`  tags: ${tagCount} (<= 30, each <= 30 chars)`);
  console.log("  thumbnail_paths: exactly 2");
  console.log("  disclosure: true");
  process.exit(0);
}

main();

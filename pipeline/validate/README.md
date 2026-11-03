# Pipeline Validators — The Unseen Past

Dependency-free TypeScript gate scripts (node built-ins only; no npm packages).
They run unchanged under **Bun** or **Node** (>= 22.6 with type stripping):

```
bun   pipeline/validate/validate-<name>.ts <file.json>
node --experimental-strip-types pipeline/validate/validate-<name>.ts <file.json>
```

Every validator exits `0` and prints a plain-text `PASS` summary on success, or
exits `1` with a numbered `FAIL: <reason>` list on failure. Missing/malformed
files are reported as a clear `FAIL` (never a stack trace).

---

## validate-research.ts — Stage 1 gate

Checks `research.json` against the Part 6 rules:

- `primary_sources` is an array with ≥ 2 items
- every `primary_sources[].priority` is 1 or 2
- every `documented_facts[].source_id` resolves to a `source_id` in
  `primary_sources` or `secondary_sources`
- `asset_licenses` present as an array, each entry with a non-empty `license`
- `core_claim` is at least 20 characters

```
bun pipeline/validate/validate-research.ts episodes/chimneys/research.json
```

Success output:

```
PASS — validate-research (episodes/chimneys/research.json)
  primary_sources: 3 (all priority 1/2)
  documented_facts: all source_ids resolve
  asset_licenses: present with license entries
  core_claim: >= 20 characters
```

Failure output:

```
FAIL — validate-research (episodes/chimneys/research.json)
1. FAIL: primary_sources must have at least 2 items (found 1)
2. FAIL: documented_facts[2] cites unknown source_id "S9" (not in primary_sources/secondary_sources)
```

## validate-script.ts — Stage 2 gate

Checks `script.json`:

- `acts` contains exactly 5 acts
- `total_words` is an integer between 700 and 850
- every act has non-empty `narration`
- `central_question` is present and non-empty
- every citation `source_id` resolves against a sibling `research.json`

The research file is located as: explicit 2nd argument → `research.json` in the
same directory as `script.json` → `research.json` one directory up.

```
bun pipeline/validate/validate-script.ts episodes/chimneys/script.json episodes/chimneys/research.json
bun pipeline/validate/validate-script.ts episodes/chimneys/script.json   # auto-find research.json
```

Success output:

```
PASS — validate-script (episodes/chimneys/script.json)
  acts: exactly 5
  total_words: 812 (700–850)
  narration: present in every act
  central_question: present
  citations: 14 citation(s), all resolve against episodes/chimneys/research.json
```

Failure output:

```
FAIL — validate-script (episodes/chimneys/script.json)
1. FAIL: total_words must be between 700 and 850 (found 663)
2. FAIL: citation source_id "S7" does not resolve to a source in episodes/chimneys/research.json
```

## validate-shots.ts — Stage 3 gate

Checks `shots.json`:

- `total_shots` between 80 and 120 and matches the `shots` array length
- every `duration_s` ≤ 4.0 (and > 0)
- every shot has a non-empty `visual_type`
- the sum of all `duration_s` equals 300 ± 0.5
- shots are contiguous and non-overlapping on the timeline (0.05s gap tolerance)

```
bun pipeline/validate/validate-shots.ts episodes/chimneys/shots.json
```

Success output:

```
PASS — validate-shots (episodes/chimneys/shots.json)
  total_shots: 92 (80–120)
  duration_s: every shot <= 4.0s
  visual_type: present on every shot (0 missing)
  total duration: 300.000s (300 ± 0.5)
  timeline: shots contiguous and non-overlapping
```

Failure output:

```
FAIL — validate-shots (episodes/chimneys/shots.json)
1. FAIL: shot S-041: duration_s 5.2 exceeds the 4.0s hard maximum
2. FAIL: sum of duration_s must be 300 ± 0.5 (found 296.800)
3. FAIL: gap between shots S-010 and S-011 (prev ends 32.0s, next starts 33.5s)
```

## validate-metadata.ts — Stage 7 gate

Checks `metadata.json` (YouTube package):

- `title` ≤ 70 characters
- `description` contains a `Sources` section marker (a line starting with
  `Sources`) and the synthetic-content disclosure marker phrase
  `Reconstructed composite`
- `chapters` has ≥ 1 entry, each with numeric `time_s` ≥ 0 and non-empty `label`
- `tags` ≤ 30 items, each ≤ 30 characters
- `thumbnail_paths` contains exactly 2 paths
- `disclosure` is `true` (mandatory YouTube synthetic-content flag)

```
bun pipeline/validate/validate-metadata.ts episodes/chimneys/metadata.json
```

Success output:

```
PASS — validate-metadata (episodes/chimneys/metadata.json)
  title: <= 70 characters
  description: contains "Sources" section and disclosure marker
  chapters: 5 (>= 1)
  tags: 18 (<= 30, each <= 30 chars)
  thumbnail_paths: exactly 2
  disclosure: true
```

Failure output:

```
FAIL — validate-metadata (episodes/chimneys/metadata.json)
1. FAIL: description must contain the synthetic-content disclosure marker phrase "Reconstructed composite" (or equivalent AI/synthetic-content disclosure sentence)
2. FAIL: thumbnail_paths must contain exactly 2 paths (found 1)
3. FAIL: disclosure must be true — the YouTube synthetic-content disclosure is mandatory
```

---

## Notes for maintainers

- The scripts import only node built-ins (`node:fs`) and type-check with:
  `bunx tsc --noEmit --strict --target es2022 --module esnext --moduleResolution bundler pipeline/validate/validate-*.ts`
  (`@types/node` is picked up from the workspace root `node_modules`).
- Each file is a self-contained ES module, so Node's type stripping executes it
  as ESM and Bun runs it unchanged.
- Schemas enforced upstream (by convention, not by these scripts) live in
  `schemas/*.schema.json`.

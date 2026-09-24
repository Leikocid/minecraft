---
type: "concept-rule"
node_id: "L0-infr-r003"
source_channel: "rollout"
analysis_version: 1
title: "Rule: `npm run build` must succeed from a clean clone; fixed file layout and ownership"
aliases: ["L0-infr-r003"]
is_a: ["rule"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 1212
tags: ["is_a:rule"]
level: 2
---
# Rule: `npm run build` must succeed from a clean clone; fixed file layout and ownership

**Links:** `part_of: ["L0-infr"]` · `is_a: ["rule"]`

No manual packaging steps, no machine-specific paths [C-7] — `scripts/build-clean-clone.sh` exists to prove this in isolation, separate from the everyday `npm run build`.

Fixed layout:
- `src/` — TS sources, single entry `src/main.ts` (+ `src/selftest/main.ts` for the dev-only self-check).
- `packs/behavior/`, `packs/resource/` — shipped packs; `packs/behavior/scripts/` is **build output**, gitignored, never hand-edited.
- `packs/selftest/`, `packs/gametest/` — dev-only, never shipped (see L0-infr-r004, L0-infr-r005).
- `scripts/*.mjs` — build/validate/BDS tooling; `tests/` — `node:test`; `docker/bds/` — the dedicated server; `dist/` — `andrew.mcaddon` + check logs, gitignored.

File ownership (who may write which file, from `constraints.md`):
- `packs/behavior/manifest.json`, `packs/resource/manifest.json` — only PACK-01; uuids are constant, never regenerated at build.
- `package.json` — created by INFRA-01; later tasks (BUILD-01, BDS-01) only add scripts, never rewrite ownership.
- `.env*` / secrets — none expected in this project; never committed.

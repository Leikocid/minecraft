---
type: "concept-entity"
node_id: "L0-infr-e001"
source_channel: "rollout"
analysis_version: 1
title: "Entity: `.mcaddon` release archive"
aliases: ["L0-infr-e001"]
is_a: ["entity"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 1202
tags: ["is_a:entity"]
level: 2
---
# Entity: `.mcaddon` release archive

**Links:** `part_of: ["L0-infr"]` · `is_a: ["entity"]`

**Attributes**
- `path`: `dist/andrew.mcaddon` (gitignored, rebuilt every `npm run build`)
- `contents`: exactly two top-level directories, `behavior` and `resource` (copied from `packs/behavior`, `packs/resource`); `selftest` and `gametest` are never present — asserted by `tests/selftest-pack.test.mjs`.
- `format`: a zip (`zip -r -X`, `.DS_Store` excluded) of the two pack directories.
- Each pack (`packs/behavior/manifest.json`, `packs/resource/manifest.json`) has a `header.uuid` (constant, PACK-01-owned, never regenerated) and a `header.version` triple that must equal `package.json`'s version — kept in sync by `scripts/set-version.mjs` across `package.json`, `package-lock.json`, and every manifest header/module/dependency version.
- `min_engine_version` in each manifest must equal `targets.mjs`'s `MIN_ENGINE_VERSION`; the behavior pack's script module depends on `@minecraft/server` at `SERVER_API_VERSION`.

**Identity rule**: the iPad treats a pack with the same uuid **and** the same version as already-imported — a content change with no version bump can silently fail to update on-device.

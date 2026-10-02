---
type: "concept-entity"
node_id: "L0-infr-e001"
source_channel: "rollout"
analysis_version: 5
title: "Entity: `.mcaddon` release archive"
aliases: ["L0-infr-e001"]
is_a: ["entity"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 530
size_chars: 1396
tags: ["is_a:entity", "relates_to:L0-infr-e005"]
level: 2
---
# Entity: `.mcaddon` release archive

**Links:** `part_of: ["L0-infr"]` · `is_a: ["entity"]` · `relates_to: ["L0-infr-e005"]`

**Attributes**
- `path`: `dist/andrew.mcaddon` (gitignored, rebuilt every `npm run build`)
- `contents`: exactly two top-level directories, `behavior` and `resource` (copied from `packs/behavior`, `packs/resource`); `selftest` and `gametest` are never present — asserted by `tests/selftest-pack.test.mjs`.
- **v2**: `behavior` now also contains a generated `structures/andrew/*.mcstructure` subtree (see `L0-infr-e005`) — this doesn't change the archive's top-level directory count or the existing packaging test, since it's already inside `packs/behavior` before zipping.
- `format`: a zip (`zip -r -X`, `.DS_Store` excluded) of the two pack directories.
- Each pack (`packs/behavior/manifest.json`, `packs/resource/manifest.json`) has a `header.uuid` (constant, PACK-01-owned, never regenerated) and a `header.version` triple that must equal `package.json`'s version.
- `min_engine_version` in each manifest must equal `targets.mjs`'s `MIN_ENGINE_VERSION`; the behavior pack's script module depends on `@minecraft/server` at `SERVER_API_VERSION`.

**Identity rule**: the iPad treats a pack with the same uuid **and** the same version as already-imported — a content change (including a template-only change) with no version bump can silently fail to update on-device.

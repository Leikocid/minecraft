---
type: "concept-process"
node_id: "L0-strf-p003"
source_channel: "rollout"
analysis_version: 2
title: "Process — placement via `structureManager.place`"
aliases: ["L0-strf-p003"]
is_a: ["process"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 2361
tags: ["is_a:process", "placement", "structureManager", "relates_to:L0-strf-r007", "relates_to:L0-strf-r008", "relates_to:L0-adr-tmpl"]
level: 2
---
# Process — placement via `structureManager.place`

**Links:** `part_of: ["L0-strf"]` · `is_a: ["process"]`

**Precondition.** Validation returned `valid`.

**Steps**
1. **Reserve.** Append an `InstanceRecord` `{id, def, origin, rot, state:"planned"}` to the owning shard (keyed by the origin's chunk) and **persist before touching the world**. From here on, the registry AABB blocks overlapping candidates, even across a restart.
2. **Pre-clear (optional per def).** When `def.clearVolume` is set, fill the rotated AABB with air using `dimension.fillBlocks` (stable) in slices of ≤ 32768 blocks. This removes trees and grass that would otherwise stay inside hollow parts of the template. The Airship needs this for its volume only; the Windmill needs it above ground level. Templates must also carry explicit air (`structure_void` only where terrain should remain).
3. **Revalidate (cheap).** Re-check the loaded gate and the registry overlap. If the placement was deferred (`pending` → later), re-run the whole validation, because players may have built in the meantime (`L0-strf-r007`).
4. **Place.** `world.structureManager.place(def.templateId, dimension, {x,y,z}, { rotation: ROT[rot], includeEntities: false, includeBlocks: true, animationMode: None })`.
5. **Mark.** Set `state:"placed"` and persist.
6. **Init.** Hand off to first-init (`L0-strf-p004`) in the same job.
7. **Linked follow-ups.** The `def.afterPlace` hook runs here. An example is the Windmill enqueueing its linked-Airship search for `airs`, exactly once per instance, guarded by `linkedTried` in the record.

**Errors**
- `place` throws because a chunk was unloaded mid-job (`LocationInUnloadedChunkError`): the record stays `planned`. It is retried when the chunk is next loaded, and first revalidated.
- The template is missing (`place` throws "structure not found"): log an error, mark the record `failed`, and disable the def for the session. The `bds:check` log gate fails on it.
- Unknown error: keep the record `planned` and retry at most 3 times per session, then mark it `failed`. A `failed` record still reserves its AABB.

**Resume rule.** On startup, every record in `planned` whose chunks are loaded is placed again. Placing the same template at the same origin and rotation is idempotent for blocks. A crash between `place` and the `placed` write is therefore harmless.

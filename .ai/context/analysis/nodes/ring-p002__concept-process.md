---
type: "concept-process"
node_id: "L0-ring-p002"
source_channel: "rollout"
analysis_version: 3
title: "Process · One queue step: protect → suppress → explode → restore"
aliases: ["L0-ring-p002"]
is_a: ["process"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 2343
tags: ["is_a:process", "explosion", "relates_to:L0-ring-ent2", "relates_to:L0-ring-ent3", "relates_to:L0-lgnd-p008", "relates_to:L0-ring-ad01", "relates_to:L0-ring-ad03", "relates_to:L0-ring-ad04"]
level: 2
---
# Process · One queue step: protect → suppress → explode → restore

**Links:** `part_of: ["L0-ring"]` · `is_a: ["process"]` · `relates_to: ["L0-ring-ent2", "L0-ring-ent3", "L0-lgnd-p008", "L0-ring-ad01", "L0-ring-ad03", "L0-ring-ad04", "L0-ring-p003"]`

This runs synchronously inside one queue tick for a batch B of ≤ `RING_MAX_BLASTS_PER_TICK` Queued Blasts (`ent2`), grouped by dimension.

1. **Drop the unloaded.** For each blast, if `dim.getBlock(point)` is undefined or throws `LocationInUnloadedChunkError`, drop it as lost (C-12).
2. **Resolve per blast:**
   - `centre` (`r010`);
   - `underwater`: the centre cell is `minecraft:water`/`flowing_water`, or a waterlogged block (`r007`);
   - `source`: `world.getEntity(ownerId)` if it is valid and `entity.dimension.id === dimensionId`, otherwise `undefined` (`L0-orbc-p003`, `r004`).
3. **Protect legendaries, batched per dimension** (`ad04`):
   - Call `protectLegendariesIn(dim, unionAABB(B, ±8), {avoid: attackFootprint ± 8, reason: "ring"})` once.
   - The margin is ±8 = 2 × power, the reach of explosion damage to item entities. Block breaking only reaches about ±5. The safe spot must clear a 37×37 footprint, so it needs a search radius ≥ 19 (`L0-ring-cx02`).
   - This must happen before any explosion in the batch (`L0-lgnd-r013` §2, `L0-lgnd-ad10` tier 1).
4. **Container snapshot.** Fallback only, enabled when `as02` fails. See `ent3`.
5. **Enter the window:**
   - `prev = world.gameRules.doTileDrops`.
   - If `prev`, set `world.gameRules.doTileDrops = false` (`ad01`).
6. **Explode, in `try`.** For each blast in B:
   ```ts
   dim.createExplosion(centre, 4, {
     breaksBlocks: !underwater,
     allowUnderwater: true,
     causesFire: false,
     source,
   })
   ```
   - Each call is wrapped in its own `try/catch`, so one failure is logged and skipped and the rest proceed.
   - The flags follow `ad03`. The engine plays each blast's own sound and particles (AC-12).
7. **`finally`:** `world.gameRules.doTileDrops = prev`. This happens unconditionally.
8. **Container fallback** (only if enabled). For each snapshotted container cell that is no longer a container, remove the *new* item entities within 1 block whose `typeId` is in its snapshot, up to the snapshot counts. Skip any where `isLegendaryItemEntity` holds.
9. **Report.** Add to the attack's counters: blasts, suppressed items and moved legendaries.

**Not done here:**
- No damage calculation: the engine applies TNT damage and knockback.
- No block list: the engine applies TNT resistance.
- No entity is spawned.

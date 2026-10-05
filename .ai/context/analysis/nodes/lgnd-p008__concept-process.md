---
type: "concept-process"
node_id: "L0-lgnd-p008"
source_channel: "rollout"
analysis_version: 7
title: "P-lgnd-008: `protectLegendariesIn(dimension, volume, opts?)`: move legendaries out of a volume that is about to be destroyed"
aliases: ["L0-lgnd-p008"]
is_a: ["process"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 3111
tags: ["v3-delta", "destruction-policy", "published-contract"]
level: 2
---
---
is_a: ["process"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad10", "L0-lgnd-r012", "L0-lgnd-r013", "L0-lgnd-ac19", "L0-lgnd-as12", "L0-pntr", "L0-ring", "L0-adr-ochg"]
---
# P-lgnd-008: `protectLegendariesIn(dimension, volume, opts?)`: move legendaries out of a volume that is about to be destroyed

**Signature.**
```
protectLegendariesIn(
  dimension: Dimension,
  volume: { min: Vector3; max: Vector3 },
  opts?: { avoid?: {min, max}; reason?: string },
) → { moved: number; handedBack: number }
```
- `volume` is inclusive block coordinates.
- `avoid` is an extra region the safe spot must be outside of. The Cannon passes the whole column or ring footprint.
- Callers: `pntr` (LMB) and `ring` (RMB), plus any future block-removing effect. It is synchronous, and callers call it in the same tick as, and before, their first block change.

**Steps.**
1. **Clamp** `volume` to `dimension.heightRange` and to loaded chunks. Unloaded parts are skipped: nothing there can be destroyed this tick (C-12).
2. **Containers.**
   - `dimension.getBlocks(volume, { includeTypes: CONTAINER_TYPES })`. The filtering is engine-side (`as12`).
   - For each block, read `getComponent("inventory").container`.
   - For each slot holding a stack where `defForStack` is set and there is a live mark: take the stack out (`setItem(i)`), then queue it for re-drop.
   - Unmarked copies stay and share the fate of the container.
3. **Ground items.**
   - `dimension.getEntities({ type: "minecraft:item", location: min, volume: max − min })`.
   - For each entity whose stack is a live marked legendary: queue its stack, then `remove()` the entity.
   - Tag the removal `protect` in the recovery watch set, so `p003` does not classify it as a loss.
4. **Safe spot**, computed once per call:
   - Start at the centre of `volume`'s XZ footprint and go outward in 1-block rings, up to 16 blocks, until a column outside both `volume` and `avoid` is found.
   - `getTopmostBlock` there must be a solid, non-liquid block with air above it and Y > `heightRange.min`.
   - The spot is 1 block above that top block.
5. **Re-drop** each queued stack with `spawnItem(stack, spot)`: the same stack, the same `id`, `gen` and `holder`. The new entity joins the watch set through `entitySpawn` as usual.
6. **No safe spot** (the End void, a column with no support within 16 blocks): hand the stack to `holder ?? owner` straight away (`addItem`, or owed if offline), with **no** `gen` bump because the original was removed, not lost. Count it as `handedBack` and log it. This is the only case where the item leaves the world. It is recorded as part of the C-16 deviation.
7. Log one line per call, `protect: moved=N handedBack=M reason=…`, only when N + M > 0.

**Cost.** This is one engine-filtered block query and one entity query per call. RMB calls it once per detonation, over an AABB of about 9³. It is never called per tick without a destructive action (C-5a′).

**Out of scope.** Legendaries nested inside shulker-box or bundle items (`cx12`). Players' own inventories: a player standing in the blast keeps their items, as in vanilla.

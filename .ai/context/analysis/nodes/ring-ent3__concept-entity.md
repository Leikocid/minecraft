---
type: "concept-entity"
node_id: "L0-ring-ent3"
source_channel: "rollout"
analysis_version: 5
title: "Entity · Drop-Suppression Window"
aliases: ["L0-ring-ent3"]
is_a: ["entity"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 1323
tags: ["is_a:entity", "drops", "relates_to:L0-ring-ad01", "relates_to:L0-ring-r006", "relates_to:L0-xasm7"]
level: 2
---
# Entity · Drop-Suppression Window

**Links:** `part_of: ["L0-ring"]` · `is_a: ["entity"]` · `relates_to: ["L0-ring-ad01", "L0-ring-r006", "L0-xasm7", "L0-ring-p002"]`

A transient, synchronous scope around the batch of explosions in one queue step (`p003`). It exists only inside one JS call stack and never spans a tick.

| Attribute | Type | Notes |
|---|---|---|
| `prevTileDrops` | bool | `world.gameRules.doTileDrops`, read on entry. Restored exactly, so an admin's `false` stays `false`. |
| `containerCells` | `{dim, pos, items: Map<typeId, count>}[]` | A snapshot of non-legendary container contents in the batch AABBs, taken after protection and before the explosions. Used only by the container fallback (`L0-ring-as02`). |
| `preItemIds` | `Set<string>` | The ids of item entities within 1 block of each `containerCells` pos. Fallback only. |

**Invariants**
- The window is entered and left in a `try/finally` inside the same synchronous call. Neither a `system.run` nor an `await` sits between the set and the restore. The world is therefore never saved with the toggled value (C-15 rank 1).
- A window never opens without at least one explosion inside it, so an empty queue causes no gamerule writes.
- The window changes only `doTileDrops`. It never touches `doMobLoot`, `doEntityDrops` or `keepInventory`.

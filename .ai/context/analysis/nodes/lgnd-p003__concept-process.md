---
type: "concept-process"
node_id: "L0-lgnd-p003"
source_channel: "rollout"
analysis_version: 2
title: "P-lgnd-003: Loss return (Void, lava, fire, cactus, explosion, despawn)"
aliases: ["L0-lgnd-p003"]
is_a: ["process"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 1949
tags: ["process", "void-return", "indestructibility", "CTR-011", "Q-020"]
level: 2
---
---
is_a: ["process"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ent4", "L0-lgnd-r005", "L0-lgnd-r011", "L0-lgnd-ad02", "L0-lgnd-ad03", "L0-lgnd-cx02"]
---
# P-lgnd-003: Loss return (Void, lava, fire, cactus, explosion, despawn)

New. There is no shipped counterpart. Implements Scythe §1 (*«не должно уничтожаться обычными способами; при падении в Void возвращается последнему владельцу»*) for **all** legendaries (Q-020 default a).

1. **Watch.** On `entitySpawn` of a `minecraft:item` whose stack is a live marked legendary: add its entity id to the watch set and record `{prefix, mark, holder, dimension}`. Start the watcher interval if the set was empty (`L0-lgnd-ad03`).
2. **Removal.**
   - On `world.beforeEvents.entityRemove` for a watched entity: snapshot the mark, then defer to `system.run` (before-events are read-only).
   - On each watcher tick (every 10 ticks): if a watched entity has `location.y < dimension.heightRange.min`, treat it as a Void loss **before** the engine kills it.
3. **Classify, one tick later:**
   - The instance `(id, gen)` appeared in some player's inventory via `playerInventoryItemChange` in that window → **pickup**. Update the holder and do nothing else.
   - The removal was tagged `retention` by `L0-lgnd-p002` → do nothing.
   - Otherwise → **lost**.
4. **Re-issue (one synchronous turn):** `gen := gen + 1` in the ledger. If `holder` is online, `addItem` the stack with the same id and the new gen, then send `returned`. If not, append to `andrew:<p>_owed`.
5. **Redeem owed** on `playerSpawn`/join, with the same token rules as `L0-lgnd-p002`.
6. **Stop.** Remove the entity from the watch set. Clear the interval when the set is empty.

**Not done:** the craft right is never reopened (Q-014, `L0-lgnd-r011`). Containers are not scanned (C-4). Any physical survivor of a mis-classified loss becomes stale (`L0-lgnd-r005`).

Unmarked (Creative) copies are not watched. They keep vanilla destruction.

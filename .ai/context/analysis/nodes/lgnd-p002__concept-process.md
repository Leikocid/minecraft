---
type: "concept-process"
node_id: "L0-lgnd-p002"
source_channel: "rollout"
analysis_version: 1
title: "P-lgnd-002: Death retention and restore (all registered weapons)"
aliases: ["L0-lgnd-p002"]
is_a: ["process"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 1764
tags: ["process", "death-retention"]
level: 2
---
---
is_a: ["process"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r008", "L0-lgnd-ent4", "L0-lgnd-p003"]
---
# P-lgnd-002: Death retention and restore (all registered weapons)

Generalised from `src/websword/retention.ts`. The two-path design is kept because the engine timing is undocumented.

**Retain (on `entityDie`, player only):**
1. Capture `location` and `dimension` before any deferral.
2. **Path A:** iterate the inventory container **and the off-hand slot** (Equippable `Offhand`). The shipped code scans only the container. The off hand is new with `allow_off_hand`. For **every** live marked stack of **every** registered weapon: append the mark to `andrew:<p>_pending`, then blank the slot. Durable first, blank second.
3. **Path B (next tick):** if the player is still valid, sweep `minecraft:item` entities within 8 blocks of the death spot. Each live marked legendary found is appended to pending (dedup by `id`) and removed. The removal is tagged `retention` so `L0-lgnd-p003` does not also treat it as a loss. If the player left, drops stay untouched and fall under loss return if they are later destroyed.
4. A **stale-generation** stack found on death is deleted, not retained (`L0-lgnd-r005`).

**Restore (on `playerSpawn`, both `initialSpawn` values; deferred one tick):**
1. Re-read pending, because the release pack and the GameTest pack may both arm this.
2. For each mark: if the inventory already holds the same `(id, gen)`, drop the token. Otherwise `addItem(stamp(new ItemStack(def.id), mark))`, spawn at the feet if full, and remove this element from pending in the same turn.
3. Send `def.messageKeys.returned` once per returned item.

Death in the Void is covered by path A. Path B finds nothing because there are no item entities.

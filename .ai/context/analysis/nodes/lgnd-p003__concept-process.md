---
type: "concept-process"
node_id: "L0-lgnd-p003"
source_channel: "rollout"
analysis_version: 7
title: "P-lgnd-003: Loss return (tier 3 of the destruction policy) — v3 target"
aliases: ["L0-lgnd-p003"]
is_a: ["process"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 2279
tags: ["v3-delta", "destruction-policy"]
level: 2
---
---
is_a: ["process"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ent2", "L0-lgnd-ent4", "L0-lgnd-r005", "L0-lgnd-r011", "L0-lgnd-r012", "L0-lgnd-ad02", "L0-lgnd-ad03", "L0-lgnd-ad11", "L0-lgnd-p008", "L0-lgnd-cx11"]
---
# P-lgnd-003: Loss return (tier 3 of the destruction policy) — v3 target

`src/legendary/recovery.ts`. As built it has a 40-tick watcher over the watch set, owner return and a single owed map. The v3 target adds `gen` (from `wpn2`), the holder (`ad11`) and the `protect` tag (`p008`).

1. **Watch.**
   - On `entitySpawn` and `entityLoad` of a `minecraft:item` whose stack is a **live** marked legendary: add it to the watch set with `{def, mark}`. The mark includes `holder`.
   - A stale-gen item entity is removed on sight and never watched.
   - The 40-tick interval starts on the first add (C-5a′ as widened by `L0-adr-lgnd`).
2. **Detect.**
   - **Void:** watcher tick, `y < heightRange.min`. The script removes the entity itself.
   - **Destroyed or despawned:** the entity is no longer valid at the next watcher tick, or `beforeEvents.entityRemove` fires (`as03`).
3. **Classify:**
   - The removal is tagged `retention` (`p002`) or `protect` (`p008`) → nothing.
   - The instance is found in an online player's inventory, or in the container at or below the spot → **pickup**. Update `holder` (`ent2`), and stop. This is the as-built heuristic.
   - Otherwise → **lost**.
4. **Re-issue**, in one synchronous turn:
   1. ledger `gen := gen + 1`;
   2. target = `holder ?? owner`;
   3. if the target is online: `addItem` the stack with the same `id`, the new `gen` and `holder = target`, then send `andrew.legendary.recovered`;
   4. otherwise append `{mark, reason, holderName}` to `owed[target]`.
5. **Redeem owed** on `playerSpawn`: each entry is granted once, with the token rules of `p002`.
6. **Stale survivor.** A copy that a hopper, allay or hopper-minecart took (mis-classified) now has an old `gen`. It cannot cast and is deleted on its first player-inventory event (`r005`). This closes the as-built duplication window (`cx09` item 2).
7. **Stop.** Unwatch the entity. Clear the interval when the set is empty.

**Not done.**
- The craft right is never reopened (`r011`).
- No container scan outside `p008`.
- Unmarked copies are never watched.

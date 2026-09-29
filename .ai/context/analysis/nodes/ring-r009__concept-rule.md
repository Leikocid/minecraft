---
type: "concept-rule"
node_id: "L0-ring-r009"
source_channel: "rollout"
analysis_version: 3
aliases: ["L0-ring-r009"]
is_a: ["rule"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 891
tags: ["is_a:rule", "cleanup", "relates_to:L0-orbc-p003", "relates_to:L0-ring-ac18"]
level: 2
---
**R-ring-009 · Nothing temporary survives the attack** (Orbital §15; C-19)

- `ring` spawns **no entities**. Charges belong to `orbc`, which removes them on detonation, Void, loss or timeout and sweeps orphans (`L0-orbc-p003`).
- After the last blast of an attack, all of the following hold:
  - no `andrew:orbital_charge` is tagged with that attack id;
  - no new `minecraft:item` from broken blocks or destroyed containers exists within the ring footprint ± 8 (`r006`);
  - `world.gameRules.doTileDrops` equals its pre-attack value;
  - the queue interval is cleared once the queue is empty.
- Mass RMB (3 players × 1 attack each) must not raise the item-entity count in the area by more than the vanilla mob/player drops of what the blasts killed.
- `ring`'s in-memory state per attack (the counters for the report) is deleted when the attack has no pending charges and no queued blasts.

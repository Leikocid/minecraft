---
type: "concept-acceptance-criterion"
node_id: "L0-magn-a08"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-magn-a08"]
is_a: ["acceptance-criterion"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 576
tags: ["is_a:acceptance-criterion", "ufo-ac-8", "channel:bds", "relates_to:L0-magn-rlim"]
level: 2
---
**UFO AC-8 (bds).**
- **GIVEN** a zone seeded with:
  - 3 iron ground items;
  - a chest with 4 iron stacks;
  - 2 iron golems and 1 minecart;
  - 3 iron blocks;
  - 2 iron ore;
- **WHEN** the magnet turns on,
- **THEN** exactly 10 elements are held: 3 ground items, then 4 stacks, then the 3 entities nearest first. No blocks are pulled and the ore is untouched.

**Second scenario.** With 1 ground item and 12 iron blocks at distinct distances, the item and the 9 nearest blocks are pulled, and the 3 farthest remain.

Players held at the same time do not reduce the count.

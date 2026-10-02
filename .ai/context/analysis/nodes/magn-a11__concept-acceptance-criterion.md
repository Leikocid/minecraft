---
type: "concept-acceptance-criterion"
node_id: "L0-magn-a11"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-magn-a11"]
is_a: ["acceptance-criterion"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 382
tags: ["is_a:acceptance-criterion", "ufo-ac-11", "channel:bds", "relates_to:L0-magn-rblk"]
level: 2
---
**UFO AC-11 (bds).**
- **GIVEN** iron_ore 20 blocks below the centre, enclosed in stone, and no other iron in the zone,
- **WHEN** the magnet turns on,
- **THEN**:
  - the ore cell becomes air;
  - one raw_iron entity is spawned there;
  - within 80 ticks it is within 1 block of its ring slot (saucer − 3, r 5);
  - the stone between them is unchanged (no other cell becomes air).

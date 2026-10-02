---
type: "concept-acceptance-criterion"
node_id: "L0-magn-a05"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-magn-a05"]
is_a: ["acceptance-criterion"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 451
tags: ["is_a:acceptance-criterion", "ufo-ac-5", "channel:bds", "relates_to:L0-magn-rply"]
level: 2
---
**UFO AC-5 (bds).**
- **GIVEN** the following players in the zone during the magnet:
  - C, in Survival, with a stack of iron_ingot in inventory and empty hands;
  - D, in Survival, wearing a full iron armour set with a dirt block in hand;
  - E, in Creative, holding an iron_sword;
  - F, in Spectator, holding an iron_sword;
- **WHEN** 60 ticks pass,
- **THEN** no player's y rises by more than 0.1 blocks, and no player is moved toward the saucer.

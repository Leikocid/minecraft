---
type: "concept-acceptance-criterion"
node_id: "L0-magn-a04"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-magn-a04"]
is_a: ["acceptance-criterion"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 559
tags: ["is_a:acceptance-criterion", "ufo-ac-4", "channel:bds", "relates_to:L0-magn-rply", "relates_to:L0-magn-aipd"]
level: 2
---
**UFO AC-4 (bds).**
- **GIVEN** two Survival players in the zone, A with `iron_ingot` in the main hand and B with `shears` in the off hand (`allow_off_hand` via `/replaceitem`),
- **WHEN** the magnet turns on,
- **THEN**:
  - both rise at ≤ 0.6 blocks per tick (per-tick displacement measured);
  - within (hover depth / 0.6 + 20) ticks, both are within 0.5 blocks of saucer − (0, 6, 0);
  - both stay within 0.5 blocks of it until release.
- An Adventure player behaves the same (`L0-xasm14`).

The iPad check that the lift looks smooth is in `L0-magn-aipd`.

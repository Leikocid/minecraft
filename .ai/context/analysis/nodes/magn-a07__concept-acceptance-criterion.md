---
type: "concept-acceptance-criterion"
node_id: "L0-magn-a07"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-magn-a07"]
is_a: ["acceptance-criterion"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 651
tags: ["is_a:acceptance-criterion", "ufo-ac-7", "channel:bds", "relates_to:L0-magn-rrel", "relates_to:L0-xasm16", "relates_to:L0-magn-aipd"]
level: 2
---
**UFO AC-7 (bds).**

**Case 1.**
- **GIVEN** a Survival player held at the hover target (≥ 34 blocks above the ground) for the full 60 s,
- **WHEN** the magnet goes off,
- **THEN** the player takes vanilla fall damage and dies (with 20 HP and no armour).

**Case 2.**
- **GIVEN** a player held by the same knockback mechanism for 60 s at a target only 2 blocks above the ground (a test hook lowers the target),
- **WHEN** the magnet goes off,
- **THEN** no damage is taken (`entityHurt` with cause fall is never seen). This proves that knockback holding does not accumulate fall distance.

The iPad check that the fall is visible is in `L0-magn-aipd`.

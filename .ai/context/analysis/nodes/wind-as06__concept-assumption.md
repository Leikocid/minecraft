---
type: "concept-assumption"
node_id: "L0-wind-as06"
source_channel: "rollout"
analysis_version: 2
title: "Assumption — a spawner-produced Vindicator carries an iron axe by vanilla default"
aliases: ["L0-wind-as06"]
is_a: ["assumption"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 727
tags: ["is_a:assumption", "CAN_ASSUME", "spawners", "needs-probe", "relates_to:L0-wind-r003", "relates_to:L0-strf-r010"]
level: 2
---
# Assumption — a spawner-produced Vindicator carries an iron axe by vanilla default

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-r003, L0-strf-r010]`

- Bedrock's vanilla Vindicator spawns holding an iron axe. A `mob_spawner` with `EntityIdentifier = minecraft:vindicator` should therefore satisfy §4.3/test 17 with no script.
- **Verify** in the `strf` probe: spawn 20 from the template spawner, assert all hold `minecraft:iron_axe` in the main hand.
- **Impact if wrong:** medium. Fallback: an `entitySpawn` handler equips an iron axe on Vindicators within 8 blocks of a registered Windmill/Airship spawner position (event-driven, no scan); recorded as a deviation. Shared with `airs`.

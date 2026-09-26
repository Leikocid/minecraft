---
type: "concept-acceptance-criterion"
node_id: "L0-strf-ac09"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-strf-ac09"]
is_a: ["acceptance-criterion"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 505
tags: ["is_a:acceptance-criterion", "verify:bds", "spawner"]
level: 2
---
**AC-strf-09 · Template spawners behave as vanilla** (`L0-strf-r010`; spec tests 17, 18, 29)

GIVEN a placed template with a `mob_spawner` for `minecraft:vindicator` in a dark room, WHEN a player stands within 8 blocks for 60 s, THEN ≥ 1 vindicator spawns, holding an iron axe. WHEN the room is lit to light 15 around the spawner, THEN no spawns occur within 60 s. WHEN the spawner is broken in survival, THEN no spawner item drops, XP orbs appear, and it is still absent after a restart.
**Verify:** bds.

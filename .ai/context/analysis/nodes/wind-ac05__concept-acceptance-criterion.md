---
type: "concept-acceptance-criterion"
node_id: "L0-wind-ac05"
source_channel: "rollout"
analysis_version: 5
title: "AC-wind-05 · Three floor spawners with the right mobs; the top Vindicator has an iron axe"
aliases: ["L0-wind-ac05"]
is_a: ["acceptance-criterion"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 451
tags: ["is_a:acceptance-criterion", "spec-test:17", "verify:bds", "spawners"]
level: 2
---
# AC-wind-05 · Three floor spawners with the right mobs; the top Vindicator has an iron axe

**Spec:** test 17, §4.3.

GIVEN a placed Windmill and a player (or SimulatedPlayer) near each spawner
THEN floor 1 spawns `minecraft:zombie_villager_v2`, floor 2 `minecraft:zombie`, floor 3 `minecraft:vindicator`
AND every Vindicator from the floor-3 spawner holds `minecraft:iron_axe` (sample ≥ 10)
AND breaking a spawner drops no spawner item and gives XP.

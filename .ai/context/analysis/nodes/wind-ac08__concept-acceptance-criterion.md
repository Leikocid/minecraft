---
type: "concept-acceptance-criterion"
node_id: "L0-wind-ac08"
source_channel: "rollout"
analysis_version: 2
title: "AC-wind-08 · Curing a field guard yields an ordinary Villager that stays ordinary"
aliases: ["L0-wind-ac08"]
is_a: ["acceptance-criterion"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 456
tags: ["is_a:acceptance-criterion", "spec-test:19", "verify:bds", "cure"]
level: 2
---
# AC-wind-08 · Curing a field guard yields an ordinary Villager that stays ordinary

**Spec:** §4.5 bullet 6, §9.9.

GIVEN a field guard
WHEN it is cured the vanilla way (Weakness + golden apple, wait for conversion)
THEN a `minecraft:villager` exists at its position with no `andrew:guard:*` tag and no structure-applied effect
AND after a restart and 5 min it is still a Villager (no script converts it back)
AND the guard count drops by one permanently.

---
type: "concept-acceptance-criterion"
node_id: "L0-wind-ac04"
source_channel: "rollout"
analysis_version: 2
title: "AC-wind-04 · 25 chests — 5 / 8 / 12 by floor — all reachable without breaking blocks"
aliases: ["L0-wind-ac04"]
is_a: ["acceptance-criterion"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 437
tags: ["is_a:acceptance-criterion", "spec-test:16", "verify:unit", "verify:bds", "chests"]
level: 2
---
# AC-wind-04 · 25 chests — 5 / 8 / 12 by floor — all reachable without breaking blocks

**Spec:** test 16, §4.3.

GIVEN a placed Windmill (any rotation)
THEN the AABB holds exactly 25 chests: 5 on floor 1, 8 on floor 2, 12 on floor 3
AND each chest is non-empty after init and was filled by `loot.fillChest` (5–12 attempts)
AND the template BFS (`L0-wind-r002`) reaches every chest access cell from outside the door with no block broken.

---
type: "concept-acceptance-criterion"
node_id: "L0-wind-ac03"
source_channel: "rollout"
analysis_version: 2
title: "AC-wind-03 · Size and identity of the Windmill in all 4 rotations"
aliases: ["L0-wind-ac03"]
is_a: ["acceptance-criterion"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 491
tags: ["is_a:acceptance-criterion", "spec-test:15", "verify:ipad", "verify:unit", "template"]
level: 2
---
# AC-wind-03 · Size and identity of the Windmill in all 4 rotations

**Spec:** test 15, §4.1, §2.

GIVEN the built `windmill.mcstructure`
THEN (unit) the plot is 35±2 × 35±2, the building ~15×15 base and ~30 tall, 1 wooden door on the rotor face, 3 floors, stair cells connected F1→F3
AND (BDS) placing it at 0/90/180/270 re-counts the same numbers in-world
AND (iPad, manual) it reads as an old abandoned stone-lower / wood-upper mill with a wooden roof and 4 still blades on the door side.

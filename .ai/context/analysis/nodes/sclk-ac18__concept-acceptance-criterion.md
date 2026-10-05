---
type: "concept-acceptance-criterion"
node_id: "L0-sclk-ac18"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-ac18"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 383
tags: ["acceptance-criterion", "T18", "bds", "durability", "node-test"]
level: 2
---
**AC-sclk-18 (T18) · No durability loss** · channels `bds` + node

GIVEN a Survival shooter, WHEN it fires 30 charged shots and lands 10 melee hits with the crossbow,
THEN:
- the stack's `minecraft:durability` component is absent (option A), or its damage is 0 (option B);
- the stack is the same item, not broken or replaced.

**Node:** the item JSON has no `minecraft:durability`.

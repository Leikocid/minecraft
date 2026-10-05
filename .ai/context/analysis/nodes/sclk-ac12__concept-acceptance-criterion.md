---
type: "concept-acceptance-criterion"
node_id: "L0-sclk-ac12"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-ac12"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 377
tags: ["acceptance-criterion", "T12", "bds", "no-explosion", "C-20"]
level: 2
---
**AC-sclk-12 (T12) · The crater does no explosion damage** · channel `bds`

GIVEN a bystander SimulatedPlayer standing 2 blocks from the impact cell, on a cell outside the crater box, WHEN a bolt hits the block,
THEN:
- the bystander records no `entityHurt` from any cause in the hit tick and the 20 ticks after it;
- no `minecraft:tnt` entity and no explosion event occurred.

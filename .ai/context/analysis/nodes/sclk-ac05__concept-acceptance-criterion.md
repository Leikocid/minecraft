---
type: "concept-acceptance-criterion"
node_id: "L0-sclk-ac05"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-ac05"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 447
tags: ["acceptance-criterion", "T05", "bds", "trail", "C-20"]
level: 2
---
**AC-sclk-05 (T05) · The trail harms nothing** · channel `bds`

GIVEN a bystander SimulatedPlayer standing 0.6 blocks beside the bolt's line (no collision), plus a column of glass and grass 0.6 blocks off the line, WHEN a bolt flies past both and ends in the Void or expires,
THEN:
- the bystander's health and position are unchanged (an `entityHurt` witness records none);
- no block within 2 of the line changed;
- the record ends as `expired`.

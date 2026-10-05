---
type: "concept-acceptance-criterion"
node_id: "L0-sclk-ac10"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-ac10"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 424
tags: ["acceptance-criterion", "T10", "bds", "sculk-patch"]
level: 2
---
**AC-sclk-10 (T10) · An entity hit makes a patch and no crater** · channel `bds`

GIVEN a target standing on a flat 9×9 stone floor, WHEN a bolt hits it,
THEN:
- no floor cell became air;
- 9 ≤ (sculk cells) ≤ 25, all within the 5×5 centred on the target's feet column and all on the top surface;
- at least one 5×5 cell is not sculk (irregular).

A second case: a target 10 blocks above the floor gets no patch (`xasm24`).

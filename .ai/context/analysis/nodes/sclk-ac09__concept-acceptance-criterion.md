---
type: "concept-acceptance-criterion"
node_id: "L0-sclk-ac09"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-ac09"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 410
tags: ["acceptance-criterion", "T09", "bds", "no-aoe", "C-20"]
level: 2
---
**AC-sclk-09 (T09) · Neighbours take nothing** · channel `bds`

GIVEN a target SimulatedPlayer and a bystander SimulatedPlayer 1.5 blocks beside it, plus a zombie 2 blocks behind it (`spawnWithoutBehaviors`), WHEN one bolt hits the target,
THEN:
- only the target loses health;
- the bystander and the zombie record no `entityHurt` during the hit tick and the 40 ticks after it (the patch placement included).

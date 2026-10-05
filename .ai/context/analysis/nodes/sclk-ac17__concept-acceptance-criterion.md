---
type: "concept-acceptance-criterion"
node_id: "L0-sclk-ac17"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-ac17"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 599
tags: ["acceptance-criterion", "T17", "bds", "multishot", "xcx22", "C-28"]
level: 2
---
**AC-sclk-17 (T17) · Three Multishot bolts, three full hits on one player** · channel `bds`

GIVEN a target SimulatedPlayer in full netherite with Protection IV at 40 HP (health boosted by an effect), placed 2 blocks in front of the shooter so that all three bolts connect within ≤ 2 ticks, WHEN one Multishot shot fires,
THEN:
- three entity-hit outcomes are logged for that target;
- its health drops by exactly 3 × D = 30, despite the invulnerability window (`xcx22`).

**In-test negative control:** the same volley with the `setCurrentValue` step disabled by a test flag must lose less than 30.

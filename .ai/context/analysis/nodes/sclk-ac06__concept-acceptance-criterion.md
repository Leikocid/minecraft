---
type: "concept-acceptance-criterion"
node_id: "L0-sclk-ac06"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-ac06"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 452
tags: ["acceptance-criterion", "T06", "bds", "damage"]
level: 2
---
**AC-sclk-06 (T06) · A direct hit deals exactly D, and no arrow damage** · channel `bds`

GIVEN an unarmoured target SimulatedPlayer at 20 HP, 8 blocks from the shooter, WHEN one bolt hits it,
THEN:
- its health is exactly `20 − SONIC_BOOM_DAMAGE` (10) after the hit tick, with exactly one `entityHurt` from the shooter;
- no `minecraft:arrow` entity existed during the test.

**Negative control:** with Power V on the crossbow the result is still 10.

---
type: "concept-acceptance-criterion"
node_id: "L0-sclk-ac13"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-ac13"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 365
tags: ["acceptance-criterion", "T13", "bds", "sculk", "persistent", "restart"]
level: 2
---
**AC-sclk-13 (T13) · Permanent sculk around the crater** · channel `bds`

GIVEN the crater of ac11, THEN:
- ≥ 8 exposed surface cells inside the 5×5 around the impact are `minecraft:sculk`;
- no `sculk_sensor`, `sculk_shrieker`, `sculk_catalyst` or `sculk_vein` is present in the box.

AND after a BDS restart (the restart harness), the same cells are still sculk.

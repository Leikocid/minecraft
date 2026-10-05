---
type: "concept-acceptance-criterion"
node_id: "L0-sclk-ac11"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-ac11"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 524
tags: ["acceptance-criterion", "T11", "bds", "crater", "node-test"]
level: 2
---
**AC-sclk-11 (T11) · A block hit carves an irregular crater ≤ 5×5×3** · channels `bds` + node

GIVEN a solid stone block 7×7×5, WHEN a bolt hits the top face centre,
THEN:
- every air cell created lies within the 5×5 footprint and ≤ 3 deep;
- the centre column is ≥ 2 deep;
- 12 ≤ (air cells) ≤ 75, and the footprint is not a full 5×5;
- no item entity spawned.

**Node:** `craterCells` is deterministic for a given seed and never leaves the box across 1000 seeds × 6 faces. Deny-list cells and liquids in the fixture stay.

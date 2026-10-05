---
type: "concept-acceptance-criterion"
node_id: "L0-sclk-ac15"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-ac15"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 507
tags: ["acceptance-criterion", "T15", "bds", "piercing", "cx01"]
level: 2
---
**AC-sclk-15 (T15) · Piercing cannot stay or act** · channels `bds` + node

GIVEN a crossbow stack with `piercing 4` + `multishot 1`, put into a SimulatedPlayer's inventory by script (this fires `playerInventoryItemChange`), THEN by the next tick:
- the stack has no `piercing`;
- it still has `multishot`.

AND a bolt fired by a stack that has Piercing (set in the same tick, before the strip) hitting two targets in a line damages only the first.

**Node:** the strip helper keeps the other enchantments.

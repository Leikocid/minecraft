---
type: "concept-acceptance-criterion"
node_id: "L0-sclk-ac03"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-ac03"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 354
tags: ["acceptance-criterion", "T03", "bds", "lgnd-callsite", "creative"]
level: 2
---
**AC-sclk-03 (T03) · Creative and `/give` do not spend the flag** · channel `bds`

GIVEN the `sk` flag is unset, WHEN `/give @s andrew:sculk_crossbow` runs and a copy is taken from the Creative inventory,
THEN:
- both stacks are usable crossbows (they fire bolts);
- the flag is still unset;
- a following Survival craft still succeeds as a first craft.

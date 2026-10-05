---
type: "concept-acceptance-criterion"
node_id: "L0-sclk-ac22"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-ac22"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 365
tags: ["acceptance-criterion", "regression", "orbital", "xcx25", "bds"]
level: 2
---
**AC-sclk-22 · The deny-list move changes nothing for the Orbital** · channels `bds` + node

GIVEN `PENETRATOR_KEEP` moved to `src/terrain/keep.ts`, THEN:
- the node set-equality test against the pre-move list passes;
- the Orbital LMB, penetrator and ring GameTests are green (blast-radius gate);
- a crossbow bolt hitting bedrock or a barrier leaves it in place.

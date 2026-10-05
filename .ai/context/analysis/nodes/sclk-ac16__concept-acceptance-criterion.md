---
type: "concept-acceptance-criterion"
node_id: "L0-sclk-ac16"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-ac16"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 415
tags: ["acceptance-criterion", "T16", "bds", "multishot", "C-26"]
level: 2
---
**AC-sclk-16 (T16) · Multishot: three independent bolts** · channel `bds`

GIVEN a Survival shooter with a Multishot crossbow and 10 arrows, aiming at a wall 15 blocks away, WHEN it fires one charged shot,
THEN:
- three bolts with distinct records exist;
- exactly one arrow was spent;
- three separate block-hit outcomes are logged, each with its own seed and its own crater/sculk job;
- no record resolves twice.

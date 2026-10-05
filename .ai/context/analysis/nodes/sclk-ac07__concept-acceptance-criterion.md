---
type: "concept-acceptance-criterion"
node_id: "L0-sclk-ac07"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-ac07"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 332
tags: ["acceptance-criterion", "T07", "bds", "difficulty"]
level: 2
---
**AC-sclk-07 (T07) · Difficulty does not change D** · channel `bds`

GIVEN the setup of ac06, WHEN it is repeated at `/difficulty easy` and at `/difficulty hard` (peaceful is skipped: it heals players and empties hostile structures),
THEN the target loses exactly D on each.

The test restores the original difficulty in `finally`.

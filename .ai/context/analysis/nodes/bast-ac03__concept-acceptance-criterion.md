---
type: "concept-acceptance-criterion"
node_id: "L0-bast-ac03"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-bast-ac03"]
is_a: ["acceptance-criterion"]
part_of: ["L0-bast"]
relates_to: ["L0-bast"]
priority: 530
size_chars: 250
tags: ["is_a:acceptance-criterion", "spec-test:53", "footprint", "rotation", "verify:unit", "verify:bds"]
level: 2
---
**AC-bast-03** (spec test 53)

GIVEN a generated Mini Bastion,
WHEN measured,
THEN its footprint is ~20×20, height ~10-12, with 2-3 levels;
AND across multiple instances, all four rotations (0°/90°/180°/270°) are observed.

**Source:** §14.7 test 53.

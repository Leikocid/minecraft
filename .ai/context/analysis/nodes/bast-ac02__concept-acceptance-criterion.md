---
type: "concept-acceptance-criterion"
node_id: "L0-bast-ac02"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-bast-ac02"]
is_a: ["acceptance-criterion"]
part_of: ["L0-bast"]
relates_to: ["L0-bast"]
priority: 530
size_chars: 279
tags: ["is_a:acceptance-criterion", "spec-test:52", "biome", "lava-ocean"]
level: 2
---
**AC-bast-02** (spec test 52)

GIVEN suitable terrain in any Nether biome,
WHEN a candidate rolls,
THEN generation proceeds regardless of biome identity;
AND GIVEN a candidate site over a lava ocean,
WHEN evaluated,
THEN generation never occurs there.

**Source:** §14.7 test 52.

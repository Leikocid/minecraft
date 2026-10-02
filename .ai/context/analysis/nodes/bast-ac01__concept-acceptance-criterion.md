---
type: "concept-acceptance-criterion"
node_id: "L0-bast-ac01"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-bast-ac01"]
is_a: ["acceptance-criterion"]
part_of: ["L0-bast"]
relates_to: ["L0-bast"]
priority: 530
size_chars: 264
tags: ["is_a:acceptance-criterion", "spec-test:51", "generation-rate", "verify:unit", "verify:bds"]
level: 2
---
**AC-bast-01** (spec test 51)

The rate belongs to `L0-strf-r002` §1 and is proven by `tests/structures-roll.test.mjs:148`.

GIVEN a statistically sufficient sample of suitable Nether chunks,
WHEN candidate generation runs,
THEN `StructureDef.chance = 0.05` (`src/structures/config.ts:27`) — no exact-match requirement is imposed on small samples.

**Source:** §14.7 test 51.

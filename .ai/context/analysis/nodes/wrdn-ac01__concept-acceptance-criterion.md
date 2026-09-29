---
type: "concept-acceptance-criterion"
node_id: "L0-wrdn-ac01"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-wrdn-ac01"]
is_a: ["acceptance-criterion"]
part_of: ["L0-wrdn"]
relates_to: ["L0-wrdn"]
priority: 530
size_chars: 243
tags: ["is_a:acceptance-criterion", "raw-ac:41", "verify:unit", "verify:bds"]
level: 2
---
The rate belongs to `L0-strf-r002` §1 and is proven by `tests/structures-roll.test.mjs:148`. GIVEN a statistically sufficient sample of new, suitable Overworld chunks, WHEN candidate generation runs on each, THEN `StructureDef.chance = 0.05` (`src/structures/config.ts:26`) — exact match is not required on a small sample. (Raw AC 41.)

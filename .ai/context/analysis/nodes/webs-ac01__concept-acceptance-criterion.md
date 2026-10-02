---
type: "concept-acceptance-criterion"
node_id: "L0-webs-ac01"
source_channel: "rollout"
analysis_version: 5
level: 2
aliases: ["L0-webs-ac01"]
is_a: ["acceptance-criterion"]
part_of: ["L0-webs"]
relates_to: ["L0-webs"]
priority: 520
size_chars: 436
tags: ["acceptance-criterion", "channel:bds", "channel:build", "item"]
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-r001"]
---
**AC-webs-01 (channel: bds+build).** GIVEN the exact shaped recipe (4× Cobweb + 1× Diamond Sword, empty corners), WHEN crafted, THEN the result is exactly 1× `andrew:web_sword` with melee damage equal to the server's vanilla Diamond Sword and infinite durability (no durability bar, never breaks after extended use). Source: spec §13 tests 2 & 5.

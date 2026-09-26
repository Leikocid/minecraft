---
type: "concept-acceptance-criterion"
node_id: "L0-strf-ac07"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-strf-ac07"]
is_a: ["acceptance-criterion"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 613
tags: ["is_a:acceptance-criterion", "verify:bds", "loaded-chunks", "C-12"]
level: 2
---
**AC-strf-07 · No write into unloaded chunks; pending candidates wait** (`L0-strf-r007`)

GIVEN a forced-positive roll whose footprint straddles the edge of the loaded area, WHEN discovery evaluates it, THEN no block in the footprint changes, no `InstanceRecord` is written, and the chunk's evaluated bit stays clear. WHEN the player then moves so all covered chunks are loaded, THEN the candidate is revalidated and placed at the same origin and rotation. If the player has built a planks wall inside the footprint in between, THEN it is rejected as `collision:signature` and the wall is intact.
**Verify:** bds.

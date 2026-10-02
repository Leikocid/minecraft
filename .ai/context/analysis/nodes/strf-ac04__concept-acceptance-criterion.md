---
type: "concept-acceptance-criterion"
node_id: "L0-strf-ac04"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-strf-ac04"]
is_a: ["acceptance-criterion"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 533
tags: ["is_a:acceptance-criterion", "verify:bds", "collision"]
level: 2
---
**AC-strf-04 · Collision cancels, and never damages** (`L0-strf-r006`; spec tests 50, 59)

GIVEN a candidate AABB overlapping (a) an existing `InstanceRecord` AABB, (b) a `minecraft:mob_spawner` 1 block outside the footprint (inside the margin), (c) a column of `deepslate_tiles` inside it, WHEN validation runs, THEN each is rejected with `collision:instance` / `collision:spawner` / `collision:signature`. The world blocks in the region stay byte-identical before and after (compared through `getBlock` snapshots).
**Verify:** bds.

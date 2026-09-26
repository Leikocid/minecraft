---
type: "concept-acceptance-criterion"
node_id: "L0-strf-ac02"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-strf-ac02"]
is_a: ["acceptance-criterion"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 497
tags: ["is_a:acceptance-criterion", "verify:bds", "rotation"]
level: 2
---
**AC-strf-02 · Rotation and local-point transform match in-world placement** (`L0-strf-r004`; spec tests 25, 43, 53)

GIVEN the probe template with declared chest, spawner and door points, WHEN `strf` places it at each rotation 0/90/180/270, THEN every declared point transformed by `rotateLocal` holds the expected block type. The occupied AABB equals the computed rotated AABB (no block outside it). Unit: 4×Rotate90 equals the identity, and `rotateLocal` is a bijection.
**Verify:** unit + bds.

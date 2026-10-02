---
type: "concept-rule"
node_id: "L0-strf-r004"
source_channel: "rollout"
analysis_version: 5
title: "Rule: rotation is chosen once, and one transform maps every template-local point"
aliases: ["L0-strf-r004"]
is_a: ["rule"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 1246
tags: ["is_a:rule", "rotation", "relates_to:L0-strf-as06", "relates_to:L0-strf-e001"]
level: 2
---
# Rule: rotation is chosen once, and one transform maps every template-local point

**Links:** `part_of: ["L0-strf"]` · `is_a: ["rule"]`

- `rot ∈ {0,1,2,3}` maps to `StructureRotation.None/Rotate90/Rotate180/Rotate270`. It is seeded per candidate (`L0-strf-r001`), stored in the `InstanceRecord`, and never recomputed (§2, §15; tests 25, 43, 53).
- The rotated size is `(W, D)` for 0/180 and `(D, W)` for 90/270. `origin` is always the **min corner of the rotated AABB** (see `L0-strf-as06` for the probe).
- Exactly one function, `rotateLocal(p: Vec3, size: Vec3, rot) → Vec3`, converts template-local points to offsets inside the rotated AABB. Template-local points include chest slots, spawner cells, guard spawn points, the marker centre, the treasure room and the Airship "not above the Windmill" exclusion. Body components must call it and never compute their own transforms.
- Unit tests: for each rotation, `rotateLocal` is a bijection on the box, and 4× Rotate90 equals the identity. A BDS test places the probe template in all 4 rotations and asserts that every declared chest point holds a `minecraft:chest` (probe item 2).
- Rotation is the only variation. No mirroring and no alternative templates (§2 "один фиксированный шаблон").

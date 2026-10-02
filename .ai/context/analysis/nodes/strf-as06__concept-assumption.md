---
type: "concept-assumption"
node_id: "L0-strf-as06"
source_channel: "rollout"
analysis_version: 5
title: "Assumption (CAN_ASSUME) — `structureManager.place` rotation keeps the given location as the min corner"
aliases: ["L0-strf-as06"]
is_a: ["assumption"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 744
tags: ["is_a:assumption", "can-assume", "rotation", "probe"]
level: 2
---
# Assumption (CAN_ASSUME) — `structureManager.place` rotation keeps the given location as the min corner

**Gap.** Whether Bedrock rotates a placed structure *within* its bounding box, with `location` staying the min corner of the rotated box, or around the origin block, is not documented in the KV.

**Assumption.** Rotation happens inside the bounding box. The placed blocks occupy `[loc, loc + rotatedSize − 1]`, as `/structure load … 90_degrees` does. `rotateLocal` is written for that convention.

**Impact if wrong.** Every chest, guard and marker point would be offset for 90/180/270. `rotateLocal` gets a per-rotation offset correction taken from probe item 2 and AC-strf-02. Bodies are unaffected because they only call `rotateLocal`.

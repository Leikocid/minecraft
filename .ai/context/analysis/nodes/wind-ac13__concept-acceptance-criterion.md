---
type: "concept-acceptance-criterion"
node_id: "L0-wind-ac13"
source_channel: "rollout"
analysis_version: 2
title: "AC-wind-13 · A normal candidate on rough terrain or colliding is cancelled, never moved or terraformed"
aliases: ["L0-wind-ac13"]
is_a: ["acceptance-criterion"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 421
tags: ["is_a:acceptance-criterion", "verify:bds", "normal-generation"]
level: 2
---
# AC-wind-13 · A normal candidate on rough terrain or colliding is cancelled, never moved or terraformed

**Spec:** §4.6, §9.2, §9.4.

GIVEN a forced roll (test hook) on a chunk with surface Δ > 3, and another on a chunk overlapping a village/spawner
THEN neither places a Windmill, no block in either plot changed, no neighbouring chunk gets a Windmill as a result
AND the log records reasons `uneven` and `collision:*`.

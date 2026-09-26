---
type: "concept-acceptance-criterion"
node_id: "L0-wind-ac17"
source_channel: "rollout"
analysis_version: 2
title: "AC-wind-17 · Overworld only, and all four rotations occur"
aliases: ["L0-wind-ac17"]
is_a: ["acceptance-criterion"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 375
tags: ["is_a:acceptance-criterion", "verify:bds", "dimension", "rotation"]
level: 2
---
# AC-wind-17 · Overworld only, and all four rotations occur

**Spec:** §2, §15, C-14.

GIVEN extended exploration of the Nether and End with the roll forced to succeed
THEN no Windmill is placed outside the Overworld
AND across ≥ 40 placed Windmills (forced rolls, Overworld), each rotation 0/90/180/270 occurs at least once, and chest/spawner counts match in every rotation.

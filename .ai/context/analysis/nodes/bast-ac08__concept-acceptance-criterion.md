---
type: "concept-acceptance-criterion"
node_id: "L0-bast-ac08"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-bast-ac08"]
is_a: ["acceptance-criterion"]
part_of: ["L0-bast"]
relates_to: ["L0-bast"]
priority: 530
size_chars: 277
tags: ["is_a:acceptance-criterion", "spec-test:58", "persistence", "verify:bds"]
level: 2
---
**AC-bast-08** (spec test 58)

GIVEN a Mini Bastion with guards killed, loot taken, and lava altered,
WHEN the server restarts,
THEN none of those changes revert — guards are not respawned, loot is not refilled, and altered lava/blocks stay altered.

**Source:** §14.7 test 58.

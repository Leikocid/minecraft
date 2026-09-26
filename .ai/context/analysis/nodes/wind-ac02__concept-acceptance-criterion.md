---
type: "concept-acceptance-criterion"
node_id: "L0-wind-ac02"
source_channel: "rollout"
analysis_version: 2
title: "AC-wind-02 · Restarts never create a second spawn Windmill, chests, spawners or guards"
aliases: ["L0-wind-ac02"]
is_a: ["acceptance-criterion"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 498
tags: ["is_a:acceptance-criterion", "spec-dod", "verify:bds", "idempotency"]
level: 2
---
# AC-wind-02 · Restarts never create a second spawn Windmill, chests, spawners or guards

**Spec:** §4.7.13, §6, §11 DoD 2 and 6.

GIVEN a world whose spawn Windmill is `done`
WHEN the server is restarted 3 times, including one kill (`SIGKILL`) during the search on a second fresh world
THEN each world has exactly one `windmill:S`; block counts in its AABB show 25 chests and 3 spawners; tagged guards ≤ 10
AND the killed-mid-search world completes the search after restart with one Windmill only.

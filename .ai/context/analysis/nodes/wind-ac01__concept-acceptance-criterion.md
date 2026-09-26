---
type: "concept-acceptance-criterion"
node_id: "L0-wind-ac01"
source_channel: "rollout"
analysis_version: 2
title: "AC-wind-01 · A new world has exactly one spawn Windmill, in the 5×5 area or within 500 blocks"
aliases: ["L0-wind-ac01"]
is_a: ["acceptance-criterion"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 624
tags: ["is_a:acceptance-criterion", "spec-test:14", "verify:bds", "spawn-windmill"]
level: 2
---
# AC-wind-01 · A new world has exactly one spawn Windmill, in the 5×5 area or within 500 blocks

**Spec:** test 14, §4.7.

GIVEN a fresh BDS world with the add-on and no player online
WHEN the server has run until `andrew:st:spawnWindmill.status` is terminal (≤ 5 min)
THEN status is `done`, the registry has exactly one `windmill:S`
AND its plot centre is inside the spawn chunk ±2 chunks, OR (only if no valid site existed there) within 500 blocks of spawn (horizontal)
AND `stage` in the record matches where it was found
AND no `andrew_ws_*` ticking area remains.
Run on ≥ 3 seeds including one with spawn next to ocean.

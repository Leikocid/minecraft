---
type: "concept-assumption"
node_id: "L0-wind-as02"
source_channel: "rollout"
analysis_version: 5
title: "Assumption — \"≤ 500 blocks\" and \"nearest\" use horizontal Euclidean distance from world spawn (x,z) to the plot centre"
aliases: ["L0-wind-as02"]
is_a: ["assumption"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 519
tags: ["is_a:assumption", "CAN_ASSUME", "spawn-windmill", "relates_to:L0-wind-r007"]
level: 2
---
# Assumption — "≤ 500 blocks" and "nearest" use horizontal Euclidean distance from world spawn (x,z) to the plot centre

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-r007, L0-wind-p002]`

- `d = hypot(cx − sx, cz − sz)`, Y ignored. World spawn = `world.getDefaultSpawnLocation()` x/z at first start (its Y may be a sentinel on a fresh world; it is not used).
- **Impact if wrong:** low. Chebyshev (square) distance would allow corners up to ~707 blocks; switching is one function.

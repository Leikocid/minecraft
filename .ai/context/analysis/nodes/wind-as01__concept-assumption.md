---
type: "concept-assumption"
node_id: "L0-wind-as01"
source_channel: "rollout"
analysis_version: 5
title: "Assumption — \"within 5×5 chunks\" means the plot centre lies in the 5×5-chunk square around the spawn chunk"
aliases: ["L0-wind-as01"]
is_a: ["assumption"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 668
tags: ["is_a:assumption", "CAN_ASSUME", "spawn-windmill", "relates_to:L0-wind-r007"]
level: 2
---
# Assumption — "within 5×5 chunks" means the plot centre lies in the 5×5-chunk square around the spawn chunk

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-r007, L0-wind-p002, L0-wind-ac01]`

- The square is the spawn chunk ±2 chunks (80×80 blocks). A 35×35 plot whose centre is inside it counts, even if its edge reaches into ring 3.
- Rationale: requiring the whole plot inside would leave only ~45×45 possible centres and make stage 1 fail more often for no gameplay benefit.
- **Impact if wrong:** low. If the client means "whole plot inside", stage 1 candidate generation shrinks; test 14's area check tightens. One constant.

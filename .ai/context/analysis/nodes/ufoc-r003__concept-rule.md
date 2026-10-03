---
type: "concept-rule"
node_id: "L0-ufoc-r003"
source_channel: "rollout"
analysis_version: 5
title: "R-ufoc-3 · Hover height"
aliases: ["L0-ufoc-r003"]
is_a: ["rule"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 770
tags: ["is_a:rule", "altitude", "relates_to:L0-adr-ufht", "relates_to:L0-sauc-r002"]
level: 2
---
# R-ufoc-3 · Hover height

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["rule"]` · `relates_to: ["L0-adr-ufht", "L0-sauc-r002", "L0-magn"]`

**Rule** (UFO §2, `L0-adr-ufht`):

`hoverY = min(centre.y + 40, ceiling − 15)`, where `ceiling = world.getDimension("overworld").heightRange.max`. On current Bedrock that is 320, so `hoverY` ≤ 305.

- It is computed once at arrival start and is part of every `onPhase` payload.
- `sauc` and `magn` never recompute it. `sauc` caps its legs at `min(hoverY + 10, ceiling − 4)` from the same `ceiling`.
- The magnet zone's top is `hoverY`, and its bottom is `centre.y − 20` (UFO §3, `magn`).
- With a centre at or above 276, `hoverY` is the cap and the saucer hovers less than 40 blocks above the centre. That is intended (`adr-ufht`).

---
type: "concept-glossary-term"
node_id: "L0-lgnd-gl11"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-gl11"]
is_a: ["glossary-term"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 516
tags: ["v3-delta"]
level: 2
---
**Protection pass (`protectLegendariesIn`)**

A synchronous framework call that a destructive effect makes **before** it removes blocks or explodes.
- It takes live marked legendaries out of the containers in a volume and off the ground in it.
- It re-drops them, as the same stack with the same `gen`, at a safe spot outside the volume.
- If no safe spot exists, it hands them to the holder.

This is tier 1 ("prevent") of the destruction policy (`L0-lgnd-p008`).

**Synonyms:** protect pass, legendary evacuation.

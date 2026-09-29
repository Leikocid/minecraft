---
type: "concept-glossary-term"
node_id: "L0-ring-gl05"
source_channel: "rollout"
analysis_version: 3
aliases: ["L0-ring-gl05"]
is_a: ["glossary-term"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 554
tags: ["is_a:glossary-term", "relates_to:L0-ring-r010", "relates_to:L0-ring-r008"]
level: 2
---
**Blast Centre / Protection Margin**

- **Blast Centre:** the explosion origin derived from the contact `point`. It is the middle of the cell above `point`, or of `point` itself when that cell is solid (`L0-ring-r010`).
- **Protection Margin:** ±8 blocks (2 × TNT power) around blast centres. It is the volume `protectLegendariesIn` must clear before a blast, because explosions damage item entities that far (`L0-ring-r008`, `L0-ring-cx02`).
- **Ring Footprint:** the 21 × 21 XZ box of the layout around the target. It is the base of the `avoid` region.

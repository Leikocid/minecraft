---
type: "concept-glossary-term"
node_id: "L0-scyt-gl04"
source_channel: "rollout"
analysis_version: 1
aliases: ["L0-scyt-gl04"]
is_a: ["glossary-term"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 405
tags: ["is_a:glossary-term", "tie-break"]
level: 2
---
**View-direction tie-break** (тай-брейк по направлению взгляда)

When two or more candidates are equally near (within ε = 0.01 block), the Scythe picks the one with the smallest angle between the owner's view direction and the line from the owner's eyes to the candidate's head. This is computed as the largest dot product. If that is also tied, it picks by ascending entity id (`L0-scyt-r002`, ASM-025).

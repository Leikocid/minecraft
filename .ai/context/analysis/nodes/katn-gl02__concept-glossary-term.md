---
type: "concept-glossary-term"
node_id: "L0-katn-gl02"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-katn-gl02"]
is_a: ["glossary-term"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 529
tags: ["glossary-term", "katana", "is_a:glossary-term"]
level: 2
---
**Trace (Katana)**

The server-side block ray from the use-time head location along the view direction, ≤ 20 blocks. It uses `includePassableBlocks:false, includeLiquidBlocks:false`.
- It stops at the first block the engine treats as collidable, or before an unreadable cell.
- Its end is the **endpoint E**: the hit point pulled back 0.3, or the point in the air at the range.

Not the Scythe's line of sight (`hasLineOfSight`), which treats every non-air, non-liquid block as blocking.

**Synonyms**: ability ray, teleport ray.

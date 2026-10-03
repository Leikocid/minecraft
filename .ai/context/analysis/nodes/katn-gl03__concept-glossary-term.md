---
type: "concept-glossary-term"
node_id: "L0-katn-gl03"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-katn-gl03"]
is_a: ["glossary-term"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 484
tags: ["glossary-term", "katana", "is_a:glossary-term"]
level: 2
---
**Safe cell**

A feet cell B where a standing player (2 cells high, centred) can be placed. It must:
- pass the column-ray fit check (`L0-katn-ad01`);
- contain no lava or fire;
- lie on the owner's side of the hit face;
- be reachable from the head by a clear ray;
- leave the head within 20 blocks of its start.

A cell in mid-air qualifies. "Owner's side" means the half-space of the hit-face plane that contains the head.

**Synonyms**: safe position, destination B, landing cell.

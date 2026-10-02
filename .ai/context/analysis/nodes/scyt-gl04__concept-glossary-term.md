---
type: "concept-glossary-term"
node_id: "L0-scyt-gl04"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-scyt-gl04"]
is_a: ["glossary-term"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 469
tags: ["is_a:glossary-term", "targeting", "tie-break", "delta:2026-09-26"]
level: 2
---
**Links:** `part_of: ["L0-scyt"]` · `is_a: ["glossary-term"]` · `relates_to: []`

**Gaze tie-break** (тай-брейк по направлению взгляда)

Within one tier, candidates up to 0.5 blocks farther than the nearest **visible** candidate count as tied. The one with the highest cosine between the owner's view direction and the owner→candidate direction (feet to feet) wins. On an exact tie the first in sort order wins; there is no id fallback (`L0-scyt-r002`, `TIE_EPSILON`).

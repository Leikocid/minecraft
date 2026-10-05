---
type: "concept-glossary-term"
node_id: "L0-lgnd-gl20"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-gl20"]
is_a: ["glossary-term"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 610
size_chars: 563
tags: ["v7", "glossary", "holder"]
level: 2
---
**Return target**

The player who receives a legendary after a tier-3 loss (Void, cactus, vanilla TNT, despawn) or a protect hand-back, and whose id keys the `<prefix>_owed` entry when offline. As built at 1.6.1 it is `mark.owner` (the crafter, or the `/give` target of an admin copy). After `LGND-HOLD` it becomes `holder ?? owner` (the last player whose inventory held the stack). GameTests read it through `returnTarget(mark)`.

**Synonyms**: "последний владелец" (spec wording, = last holder); not the same as **owner** (crafter) while the holder is unbuilt.

---
type: "concept-glossary-term"
node_id: "L0-pntr-gl02"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-pntr-gl02"]
is_a: ["glossary-term"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 456
tags: ["title:Detonation point", "is_a:glossary-term", "relates_to:L0-orbc"]
level: 2
---
**Detonation point**

The integer block cell where an Orbital charge triggers. It is either the first solid cell the falling charge touches, or the cell it spawned inside. It is supplied by `orbc` through `onDetonate`. It can differ from the **target block** the player aimed at, for example when a tree canopy or overhang is in the way. The LMB column starts here, not at the target.

**Synonyms:** trigger point, фактическая точка срабатывания (RU spec).

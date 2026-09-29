---
type: "concept-glossary-term"
node_id: "L0-pntr-gl03"
source_channel: "rollout"
analysis_version: 3
aliases: ["L0-pntr-gl03"]
is_a: ["glossary-term"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 519
tags: ["title:Survival-unbreakable block (keep list)", "is_a:glossary-term", "relates_to:L0-xasm6"]
level: 2
---
**Survival-unbreakable block**

A block a Survival player can never break, such as Bedrock, End Portal Frame, the active End Portal, End Gateway, Barrier and command blocks. The LMB keeps it but continues the column below it. In code it is `PENETRATOR_KEEP`, a fixed list, because stable 2.10.0 has no hardness query (`L0-xasm6`).

**Note:** Obsidian, Reinforced Deepslate and Ancient Debris are *not* in this set. They are hard but breakable.

**Synonyms:** keep list, engine-protected block, неразрушаемый в Survival.

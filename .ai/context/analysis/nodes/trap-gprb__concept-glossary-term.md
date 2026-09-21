---
type: "concept-glossary-term"
node_id: "L0-trap-gprb"
source_channel: "rollout"
aliases: ["L0-trap-gprb"]
part_of: ["L0-trap"]
is_a: ["glossary-term"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 986
tags: ["glossary","L0-trap"]
---

**Protected block** *(защищённый блок)* / **skipped cell**

A cell the ability refuses to overwrite. §6 names only examples — *«сундуки и аналогичные block entities»*, *«bedrock и другие явно защищённые»* — so the set is open and the working deny-list is **ASM-007 / Q-013**.

Current working definition: any cell containing an **entity**; any block carrying a **block entity** (chest, barrel, shulker box, hopper, furnace, brewing stand, sign, spawner, …); any **indestructible** block (bedrock, barrier, command block, end portal frame, …); and — by the deny-by-default rule — **anything not positively recognised as ordinary and replaceable** (R-006).

The asymmetry that sets the default: destroyed player storage is unrecoverable, a weak trap is a one-line tuning fix. So uncertainty always resolves to *skip*.

**Synonyms**: protected cell, skipped cell, non-replaceable block.
**Antonym**: *ordinary replaceable block* — air, fluids, grass, plants and other soft vanilla blocks.

---
type: "concept-assumption"
node_id: "L0-xasm25"
source_channel: "rollout"
analysis_version: 7
level: 1
title: "ASM-L0-25 · Crater contents"
aliases: ["L0-xasm25"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 610
size_chars: 1578
tags: ["v7", "sculk-crossbow", "CAN_ASSUME"]
---
---
title: "ASM-L0-25 · The crater drops nothing; liquids, deny-list blocks and unloaded cells are spared; containers spill"
aliases: ["L0-xasm25", "Crossbow crater drops and exclusions"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-adr-sctr", "L0-xcx25", "L0-xasm6", "L0-xq7"]
see_also: ["sculkcrossbowspecv1ruen-part-2"]
---
# ASM-L0-25 · Crater contents

**Gap.** §6 says "destruction is controlled by the script", but says nothing about drops, liquids, containers or unbreakable blocks.

**Assumption (CAN_ASSUME).**
- Crater cells become air **without item drops**. A drop-free carve fits "not a TNT explosion" and avoids a resource farm.
- **Liquids** are not removed. Water may flow into the crater.
- **Deny-list blocks** (bedrock, portals, command and structure blocks, barriers, reinforced deepslate, …; the shared list from `L0-xasm6`) stay.
- **Containers** removed by the carve **spill their contents**. This is an engine fact: `setType` spills containers even with `doTileDrops` false. Any legendary inside is first taken out by `protectLegendariesIn`.
- **Structure blocks** of the shipped structures (Warden City, Bastion, …) get no special protection. A crater is an ordinary world edit, like a player's pickaxe.
- In the Nether and the End the same rules apply. Sculk is placed in every dimension.

**Impact if wrong.**
- If drops are wanted: one flag in the carve (`setType` → `/setblock … destroy`), which raises the per-tick cost.
- If structures must be protected: a new protect-box rule that `strf` would own (a new L0 contradiction).

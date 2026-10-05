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
- **Deny-list blocks** stay. The list is `PENETRATOR_KEEP` (`src/orbital/penetrator-keep.ts`), 35 ids: bedrock, end portal, end portal frame, end gateway, barrier, `light_block` plus `light_block_0…15`, the three command blocks, structure block, structure void, jigsaw, allow, deny, border block, invisible bedrock, moving block, and both piston arm collision blocks.
- **Obsidian, reinforced deepslate, ancient debris and the Nether portal are carved like stone** — they are deliberately absent from the list, being hard but Survival-breakable (`xasm6`, `pntr-r003`). Spec §6 is silent on them; `r010` already ruled that the list keeps its Orbital meaning, and the operator has accepted the Cannon as it stands (ORBC-IPAD-01-AA).
- **Containers** removed by the carve **spill their contents**. This is an engine fact: `setType` spills containers even with `doTileDrops` false. Any legendary inside is first taken out by `protectLegendariesIn`.
- **Structure blocks** of the shipped structures (Warden City, Bastion, …) get no special protection. A crater is an ordinary world edit, like a player's pickaxe.
- In the Nether and the End the same rules apply. Sculk is placed in every dimension.

**Impact if wrong.**
- If drops are wanted: one flag in the carve (`setType` → `/setblock … destroy`), which raises the per-tick cost.
- If structures must be protected: a new protect-box rule that `strf` would own (a new L0 contradiction).

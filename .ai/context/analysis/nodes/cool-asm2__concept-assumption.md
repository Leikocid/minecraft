---
type: "concept-assumption"
node_id: "cool-asm2"
source_channel: "rollout"
analysis_version: 1
title: "A-2 · \"Ближайший видимый игрок\" means unobstructed line of sight within 20 blocks"
aliases: ["cool-asm2"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 706
tags: ["CAN_ASSUME", "scythe", "title:Visible = line of sight"]
---
# A-2 · "Ближайший видимый игрок" means unobstructed line of sight within 20 blocks

**Gap.** Scythe §3 says "nearest visible PLAYER in 20 blocks" while projectiles pass through all blocks; "visible" is not defined.

**Assumption (CAN_ASSUME).** Visible = a block raycast from the owner's head to the candidate's head is not blocked by a solid block, and the candidate is not hidden per A-1; same dimension; not the owner; alive; Survival/Adventure (spectators and creative players excluded).

**Impact if wrong.** If "visible" only means "not invisible", players behind walls would be valid targets (the projectiles can reach them); line-of-sight filtering would wrongly report "There is no player here".

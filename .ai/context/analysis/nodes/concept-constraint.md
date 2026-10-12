---
type: "concept-constraint"
node_id: "L0"
source_channel: "rollout"
analysis_version: 11
level: 0
title: "Global Constraints (v11)"
aliases: ["L0"]
is_a: ["constraint"]
priority: 650
size_chars: 4139
tags: ["v11", "pearl-rod", "teleport", "supersedes:L0-constraint@v10"]
---
---
title: "Global Constraints (v11)"
aliases: ["L0-constraint", "Constraints"]
is_a: ["constraint"]
part_of: ["L0"]
relates_to: ["L0", "L0-pear", "L0-uwbw", "L0-ench", "L0-adr-prbd"]
see_also: ["underwaterbowfinalspecv3ruen-part-4", "underwaterbowfinalspecv3ruen-part-5", "constraints"]
supersedes: ["L0-constraint@v10"]
---
# Global Constraints (v11)

**Carried unchanged:** C-1 … C-29, C-30′, C-31 … C-43, C-5a′, C-5d, C-5e, C-5f, C-7″, C-12′, C-20⁗, C-20⁵, C-20⁶. Spec v3 §1–§5 equal v2, so C-38 … C-43 and C-20⁶ are unchanged. The ones v11 leans on most:
- **C-2:** stable 2.10.0, no Experiments.
- **C-16:** the closest stable equivalent, with the limitation *reported*. v3's closing note extends this explicitly to "distant chunk loading".
- **C-38:** native systems are verified before anything is claimed. It now covers the fishing hook and chunk preloading as well as the enchanting table.
- **C-40:** recipe shape collisions. The Pearl Rod's ` P / R ` shape is checked against carrot-on-a-stick, warped-fungus-on-a-stick and every add-on recipe.

| ID | Constraint | Source |
|---|---|---|
| C-44 | *(new)* **A teleport is verified, never faked.** A scripted teleport to a stored location runs these steps in order:<br>1. Make the destination chunk loaded and ticking (a pooled ticking area, polled with `isChunkLoaded`, with a bounded timeout).<br>2. Re-read the target block and compare its typeId with the record.<br>3. Find a safe spot: two passable, non-harmful cells over a solid floor, with no lava, fire, magma, cactus, powder snow or sweet berry bush in the feet or head cell. Try the plate cell first, then its 8 horizontal neighbours.<br>4. Teleport.<br>5. Read the player's dimension and location back.<br>Only a matching read-back counts as success and clears the binding. Every other outcome sends the player a specific message and changes nothing else: the timeout, a pool exhausted, the plate missing or changed, no safe spot, a dimension refused, or the player dead or offline at the end. No distance cap is applied beyond the world border. Every ticking area is released on every path. | spec v3 §7, §8 |
| C-45 | *(new)* **Personal state is bound to a player's life, not to an item.** State the spec grants to "the player who did X", such as the Pearl Rod's binding, records the player id **and a life epoch** read from that player's persistent dynamic property. Each player death increments the epoch. The state is honoured only for the same id with the same epoch, so a death voids every copy everywhere, in an inventory, a chest, a drop or a stranger's hand, with no search. For any other holder the item behaves as unbound. Item-borne state survives a restart, logout, a chest and a drop, and stays valid only while its owner's epoch is unchanged. | spec v3 §7 |
| C-46 | *(new)* **A non-legendary scripted item never enters the legendary machinery.** Its token, mark and dynamic properties must not match `lgnd` `defForToken` or `defForItem`, or any retention, Void or recovery hook. It drops, despawns, burns and breaks under vanilla world rules. A shared token-swap helper extracted from `craftgate.ts` must leave the legendary gate's behaviour and scenarios unchanged. | spec v3 §6, §7 |
| C-20⁷ | *(extended)* v11 acceptance needs:<br>• the craft at fixed 3×3 positions, failing when shifted or in the 2×2 grid, and repeatable;<br>• durability damage 0 after N reels, including a hooked mob;<br>• a binding on **each** vanilla plate type, enumerated at runtime from `BlockTypes` (`*pressure_plate`), not hard-coded;<br>• one teleport, then the binding is cleared and the next use casts;<br>• a broken plate gives no teleport, and so does one replaced by another type;<br>• the owner's death voids the binding, including a rod picked up by a second SimulatedPlayer, and a transferred rod casts normally for its new holder;<br>• a far plate (≥ 10 K blocks) is reached through the preload;<br>• a forced preload failure gives no teleport and an error message;<br>• a restart keeps the binding and the epoch;<br>• unbound fishing still works.<br>Each bullet has a negative control (C-20). | spec v3 §8 |

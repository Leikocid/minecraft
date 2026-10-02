---
type: "concept-assumption"
node_id: "L0-ring-as04"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ring-as04"]
is_a: ["assumption"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 751
tags: ["is_a:assumption", "CAN_ASSUME", "probe:bds", "relates_to:L0-ring-ad03", "relates_to:L0-ring-r007"]
level: 2
---
**ASM-ring-04 · `breaksBlocks:false, allowUnderwater:true` in water deals full damage and still plays sound and particles**

**Assumption.** An explosion whose centre is in water, with these flags:
- changes no block;
- damages entities as on land;
- plays the normal explosion sound and particles.

**Probe.** Blast centred in a 5-deep pool, with a zombie 2 blocks away and a SimulatedPlayer at 4. Snapshot the blocks before and after.

**Impact if wrong.**
- If there is no sound underwater, add `dim.playSound("random.explode", centre)` for underwater blasts only (AC-12, ipad).
- If the damage is reduced by water, accept it as vanilla-consistent and note it (C-16). The spec says "normal TNT damage", and vanilla underwater TNT is the reference.

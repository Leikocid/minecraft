---
type: "concept-rule"
node_id: "L0-magn-rblk"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-magn-rblk"]
is_a: ["rule"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 995
tags: ["is_a:rule", "blocks", "relates_to:L0-magn-cxdp", "see_also:ufomagnetspecv1ruen-part-2"]
level: 2
---
**Rule (UFO §5 Blocks, U6, U3; AC-10, AC-11).**

**Built block.** A selected built iron block becomes `minecraft:air` plus **exactly one** item entity of that block's own item, spawned at the block centre. There is no vanilla drop for the block itself; U6 found that `setType(air)` drops nothing.

**Door.** An iron door is removed whole (both halves) and yields **one** `iron_door`. The lower half is removed, and the upper half goes with it (U6).

**Ore.** `iron_ore` and `deepslate_iron_ore` yield **one `raw_iron`** (like Survival mining without Fortune), never the ore block. The cavity remains as air.

**Underground.** Items born underground fly to their ring slot **through** stone. They move by teleport each tick with velocity cleared, so they neither collide nor fall (U3). This holds for ore 20 blocks deep (the zone floor is centre − 20).

**The hopper** is selected as a block only when empty (`L0-magn-adhp`); with anything in it, it is a container (`L0-magn-rcnt`).

**Other block entities.** No other block entity is ever removed by the magnet.

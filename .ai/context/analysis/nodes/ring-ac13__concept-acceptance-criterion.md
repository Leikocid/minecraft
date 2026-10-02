---
type: "concept-acceptance-criterion"
node_id: "L0-ring-ac13"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ring-ac13"]
is_a: ["acceptance-criterion"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 648
tags: ["is_a:acceptance-criterion", "verify:bds", "orbital-ac:13", "C-20", "relates_to:L0-ring-r004", "relates_to:L0-ring-as03"]
level: 2
---
**AC-ring-13 · TNT damage, including to the owner** (Orbital AC-13; `r004`; C-20) · **verify: bds**

GIVEN two SimulatedPlayers in Survival with 20 HP and no armour: owner A stands 2 blocks from the ring-5 line, and B stands 2 blocks from the ring-15 line, plus one zombie on ring 10. WHEN A fires RMB, THEN:
- A, B and the zombie each lose health in the range a vanilla primed TNT gives at the same distance (reference: a `minecraft:tnt` control run in the same pad);
- A's death message, if A died, attributes the blast;
- a control run with A's position switched to another dimension gives no error, and the blasts still happen with no `source`.

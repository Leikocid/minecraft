---
type: "concept-acceptance-criterion"
node_id: "L0-ring-ac18"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ring-ac18"]
is_a: ["acceptance-criterion"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 752
tags: ["is_a:acceptance-criterion", "verify:bds", "cleanup", "C-19", "relates_to:L0-ring-r009", "relates_to:L0-ring-r006", "relates_to:L0-ring-cx01"]
level: 2
---
**AC-ring-18 · No leftovers, and vanilla drops preserved** (Orbital §15; C-19; `r006`, `r009`) · **verify: bds**

GIVEN `keepInventory` false, a SimulatedPlayer B holding 5 diamonds on ring 10, 3 zombies on rings 5 and 15, and 4 pre-existing dirt item entities on ring 20. WHEN owner A fires RMB and B and the zombies die, THEN:
- 0 `andrew:orbital_charge` entities remain;
- B's 5 diamonds exist as item entities or were destroyed by a later blast, as in vanilla, and never by `ring` code (spy: 0 `remove()` calls on non-container-fallback items);
- the zombie loot and XP orbs were spawned;
- no block-drop items exist;
- the `minecraft:item` count within footprint ± 8 is at most the vanilla drops of what died, plus any surviving pre-existing dirt.

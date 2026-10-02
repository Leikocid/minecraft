---
type: "concept-rule"
node_id: "L0-ring-r004"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ring-r004"]
is_a: ["rule"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 1123
tags: ["is_a:rule", "damage", "relates_to:L0-ring-as03", "relates_to:L0-orbc-p003", "relates_to:L0-ring-ac13"]
level: 2
---
**R-ring-004 · TNT-equivalent entity damage, including the owner** (Orbital §10; AC-13)

- Each blast is `createExplosion(centre, 4, …)`. Power 4 is vanilla TNT, so damage, falloff, exposure (occlusion) and knockback are the engine's TNT values. `ring` computes no damage itself.
- **The owner is not exempt.** An owner standing in range takes normal TNT damage and can die from their own RMB.
- **`source` is the owner when resolvable.** It is resolved at blast time: the entity must be valid and in the blast's dimension. Otherwise `source` is omitted, and the blast still happens (`L0-orbc-p003`, AC-18). The source gives kill attribution only. It must never exempt the owner. If a BDS probe shows that `source` exempts it, drop `source` entirely (`L0-ring-as03`).
- **Other players** take the same damage whatever the PvP settings of the owner. The explosion follows the world `pvp` gamerule the way vanilla TNT does.
- Damage applies underwater too (`r007`).
- Legendary *item entities* are protected (`r008`). Players' own inventories are vanilla: armour durability and death drops are unaffected by `ring` (`r006`).

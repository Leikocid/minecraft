---
type: "concept-assumption"
node_id: "L0-lgnd-as14"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-as14"]
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 966
tags: ["v3-delta", "CAN_ASSUME"]
level: 2
---
---
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad09", "L0-lgnd-r015", "L0-lgnd-p009", "L0-xasm10"]
---
**ASM-lgnd-14: LMB with an off-hand Cannon does nothing. "Attack" is a main-hand action only.**

Orbital §7 shows the HUD for either hand. Orbital §6 gives two modes, but does not say which hand an attack comes from. Vanilla swings with the main-hand item, and `entityHitBlock` reports the main-hand context. An off-hand Cannon therefore:
- responds to **Use** only, through a main-hand legendary press (`as07`, hand priority);
- never responds to LMB.

**Impact if wrong.** If the client expects LMB to fire an off-hand Cannon while the main hand holds, for example, a pickaxe, `resolveActivation(player, "attack")` gains the off-hand fallback that `use` already has. That is one line. But mining with a pickaxe would then also fire the Cannon at every block you start to break, which is almost certainly unwanted. Confirm at the iPad DEMO.

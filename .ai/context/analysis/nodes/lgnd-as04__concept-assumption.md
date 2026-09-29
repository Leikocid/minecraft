---
type: "concept-assumption"
node_id: "L0-lgnd-as04"
source_channel: "rollout"
analysis_version: 3
aliases: ["L0-lgnd-as04"]
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 497
tags: ["assumption", "CAN_ASSUME", "indestructibility"]
level: 2
---
**ASM-lgnd-04: No stable item component makes a custom item entity immune to lava, fire, cactus or explosions.**

So "must not be destroyed by ordinary means" (Scythe §1) is realised as *destroyed, then immediately re-issued to the last holder*, not as physical immunity.

**Impact if wrong:** if such a component exists on 1.26.50 (C-1), fire, lava and explosions become prevention instead of recovery. Most gen bumps disappear, and the stale-copy surface shrinks. The Void path is still needed.

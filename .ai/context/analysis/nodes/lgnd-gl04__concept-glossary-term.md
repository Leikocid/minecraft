---
type: "concept-glossary-term"
node_id: "L0-lgnd-gl04"
source_channel: "rollout"
analysis_version: 3
aliases: ["L0-lgnd-gl04"]
is_a: ["glossary-term"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 685
tags: ["v3-delta", "reconciled"]
level: 2
---
**Busy (ability state)**

A durable deadline, `andrew:busy_<abilityKey>` in epoch ms, that runs from activation until the end of a multi-tick effect. The Scythe volley is the only one today (`L0-lgnd-ad07` §2). While busy:
- the ability is not ready;
- a repeat Use resolves to nothing, silently;
- the HUD keeps showing the weapon line. There is no separate "active" segment.

If the owner never clears it, for example after a crash, busy expires by itself at the deadline.

It is distinct from **cooldown** (`andrew:cd_<abilityKey>`), which the ability owner starts. The Orbital Cannon never sets busy: its cooldown starts at launch.

**States:** Ready → (Busy) → Cooldown or Ready.

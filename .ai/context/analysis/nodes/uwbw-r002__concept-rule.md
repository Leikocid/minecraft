---
type: "concept-rule"
node_id: "L0-uwbw-r002"
source_channel: "rollout"
analysis_version: 10
title: "R-uwbw-002 · Normal fire vs Super Fire"
aliases: ["L0-uwbw-r002"]
is_a: ["rule"]
part_of: ["L0-uwbw"]
relates_to: ["L0-uwbw"]
priority: 640
size_chars: 777
tags: ["v10", "underwater-bow", "rule", "fire", "C-43"]
level: 2
---
# R-uwbw-002 · Normal fire vs Super Fire

**Normal hit.**
- The target burns for `max(2 s, Flame duration)`; the two never add.
- Water may put it out, as vanilla does.
- Damage is vanilla `onFire`/`fireTick`.

**Armed hit.**
- **Super Fire** for exactly 5 s, 1 HP per second (5 ticks), cause `fireTick`, marked as scripted.
- It burns in water too. Fire Resistance and fire-immune mobs take 0.
- It places no fire block.
- A second armed hit refreshes it and never stacks.
- Vanilla fire on the same target inside the window adds no extra damage.

**The two must be distinguishable** (spec §5 bullet 2):
- a target in water after a normal hit stops burning within 1 s;
- a target in water after an armed hit loses 5 HP over 5 s.

**Source.** Spec v2 §1 and §5; C-43; `xasm38`.

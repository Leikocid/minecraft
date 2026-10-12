---
type: "concept-entity"
node_id: "L0-uwbw-earm"
source_channel: "rollout"
analysis_version: 10
title: "E-uwbw-arm · The armed charge and the armed shot"
aliases: ["L0-uwbw-earm"]
is_a: ["entity"]
part_of: ["L0-uwbw"]
relates_to: ["L0-uwbw"]
priority: 640
size_chars: 1232
tags: ["v10", "underwater-bow", "armed-charge", "entity"]
level: 2
---
# E-uwbw-arm · The armed charge and the armed shot

**Links.** relates_to: L0-xasm38, L0-xcx33, C-41, L0-uwbw-r001.

**The player's charge, `ub:armed`.** This is a per-player dynamic property. It persists through logout, restart and death, and it is independent of which bow is held.

| State | Condition | HUD |
|---|---|---|
| ready | not armed, no cooldown | `andrew.ub.ready` |
| armed | `ub:armed` = true | `andrew.ub.armed` |
| cooldown | cooldown timer > now | `andrew.ub.cooldown` (seconds left) |

Armed and cooldown are mutually exclusive: arming is refused during the cooldown.

**The arrow's mark, `ub:armedShot`.**
- **Set at the swap/tag** on the **first** arrow fired by a player whose `ub:armed` is true.
- **"First".** The player holds a `ub:pendingShot` id. While an armed arrow is in flight, later arrows are plain. If the armed arrow misses, the pending shot clears and the next arrow carries the mark again.
- **An arrow fired before arming is never marked.**
- **Multishot does not exist on a bow, and Infinity changes nothing.**

**Consumption.** `ub:armed` is cleared only by `L0-uwbw-r001`'s successful hit, in the same synchronous block that:
- starts the cooldown;
- plays the strike;
- starts Super Fire.

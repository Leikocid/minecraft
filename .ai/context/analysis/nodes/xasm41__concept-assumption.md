---
type: "concept-assumption"
node_id: "L0-xasm41"
source_channel: "rollout"
analysis_version: 11
level: 1
title: "ASM-L0-41 · \"The bobber strikes a pressure plate\" = the hook comes to rest in a plate cell"
aliases: ["L0-xasm41"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 650
size_chars: 1953
tags: ["v11", "pearl-rod", "CAN_ASSUME"]
---
---
title: "ASM-L0-41 · \"The bobber strikes a pressure plate\" = the hook comes to rest in a plate cell"
aliases: ["L0-xasm41", "Bobber strike definition"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-pear", "L0-adr-prbd"]
see_also: ["underwaterbowfinalspecv3ruen-part-2", "underwaterbowfinalspecv3ruen-part-4"]
---
# ASM-L0-41 · "The bobber strikes a pressure plate" = the hook comes to rest in a plate cell

**Class:** CAN_ASSUME.

**Gap.**
- The spec says "когда поплавок попадает именно в существующую нажимную плиту" (when the bobber lands precisely in an existing pressure plate), and "Только плиты, в которые действительно попал поплавок" (only plates the bobber actually hit).
- A plate is 1/16 of a block tall and has no collision box, so the hook cannot strictly "hit" it. The hook falls into the plate's cell and rests on the support block.

**Assumption.** The hook strikes the plate when **both** of these hold:
- its location is inside the cell of a block whose typeId ends in `pressure_plate`;
- its height above that cell's floor is ≤ 0.25, or it is on the ground or has stopped (|velocity| < 0.05).

The check runs every tick while the hook exists. These do not bind:
- a hook flying through a plate cell higher up;
- a hook on a block next to a plate;
- a hook stuck in an entity.

The binding records the **plate's** cell, not the support block.

**Hook ownership.** Only a hook cast from a marked rod can bind. It is identified either:
- by its projectile owner, if the probe shows it is readable; or
- by an `itemUse` from a marked-rod holder in the same tick as the hook's `entitySpawn`, matched to the nearest hook within 3 blocks of that player.

**Impact if wrong.**
- If the hook rests above the threshold, plates never bind. The probe measures the resting height per plate type.
- If vanilla hooks bounce off or pass through, a fast cast that skims a plate may bind. Lowering the threshold is a one-constant change.

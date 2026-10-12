---
type: "concept-rule"
node_id: "L0-uwbw-r001"
source_channel: "rollout"
analysis_version: 10
title: "R-uwbw-001 · Only a successful hit spends the charge"
aliases: ["L0-uwbw-r001"]
is_a: ["rule"]
part_of: ["L0-uwbw"]
relates_to: ["L0-uwbw"]
priority: 640
size_chars: 856
tags: ["v10", "underwater-bow", "rule", "C-41"]
level: 2
---
# R-uwbw-001 · Only a successful hit spends the charge

**Rule.** The armed charge is consumed, and the 600-tick cooldown started, **only** when **all** of these hold:
1. the arrow carries `ub:armedShot`;
2. it hit a **living entity**: it has `minecraft:health` and is not `armor_stand`, `boat`, `chest_boat`, `minecart*` or an item frame; the shooter itself does not count;
3. the hurt before-event saw `event.damage > 0`, was not cancelled, and was not swallowed by the hurt window or a shield.

**Everything else is a miss.** A miss keeps `ub:armed`, starts no cooldown and changes no HUD:
- a block, water or lava;
- a shield block;
- an invulnerable target;
- a despawned or removed arrow;
- an unloaded chunk.

**Targets.** Players and mobs both count (spec: "Целью может быть игрок или моб").

**Source.** Spec v2 §1 and §5 bullet 3; C-41; `xasm38`.

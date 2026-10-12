---
type: "concept-rule"
node_id: "L0-uwbw-r003"
source_channel: "rollout"
analysis_version: 10
title: "R-uwbw-003 · The armed hit is exactly 14 before armour"
aliases: ["L0-uwbw-r003"]
is_a: ["rule"]
part_of: ["L0-uwbw"]
relates_to: ["L0-uwbw"]
priority: 640
size_chars: 855
tags: ["v10", "underwater-bow", "rule", "damage", "C-29"]
level: 2
---
# R-uwbw-003 · The armed hit is exactly 14 before armour

**Rule.**
- The armed hit **replaces** the arrow's vanilla damage with 14 HP before armour. Power and crit are ignored. Armour, toughness, Protection, Projectile Protection and Resistance then apply as vanilla.
- The native event is rewritten to `afterArmour(14, defence)`; this is the post-armour value the before-event carries. There is no second `applyDamage` hit, which the hurt window would swallow.
- The value is exact and non-stacking (C-29). Against an unarmoured target it reads 14.00.
- **If the hit is lethal,** it is delivered via `applyDamage` with a source, so the totem works. A lethal before-event rewrite would eat the totem *and* kill.
- **Punch knockback** still applies. The strike visual deals 0 (C-30′).

**Source.** Spec v2 §1 ("14 HP (7 сердец) до брони"); C-29; `xasm38`.

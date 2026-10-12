---
type: "concept-acceptance-criterion"
node_id: "L0-uwbw-a006"
source_channel: "rollout"
analysis_version: 10
title: "AC-uwbw-006 (bds) · The armed hit is exactly 14 before armour, with a zero-damage strike"
aliases: ["L0-uwbw-a006"]
is_a: ["acceptance-criterion"]
part_of: ["L0-uwbw"]
relates_to: ["L0-uwbw"]
priority: 640
size_chars: 848
tags: ["v10", "underwater-bow", "bds", "damage", "C-29", "C-30"]
level: 2
---
# AC-uwbw-006 (bds) · The armed hit is exactly 14 before armour, with a zero-damage strike

**Links.** relates_to: L0-uwbw-r003, L0-uwbw-adex, L0-strm.

- **No armour.** GIVEN an armed hit on an unarmoured zombie at full HP, THEN the post-hit loss reads 14.00, whatever the draw, Power or crit.
- **Armour.** GIVEN iron and diamond + Protection IV targets, THEN the loss equals `afterArmour(14)` from the recorded formula, ± 0.01.
- **Lethal.** GIVEN a 10 HP sim player with a totem, THEN the totem pops and the player survives.
- **Strike.** `playStrikes` runs once per hit key. No `minecraft:lightning_bolt` entity exists, no other entity within 5 blocks loses HP, and no fire block is placed.
- **Player target.** The same holds on a sim player.
- **Negative control.** An unarmed full-draw hit on the same zombie reads the vanilla value (≠ 14).

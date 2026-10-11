---
type: "concept-assumption"
node_id: "L0-xasm34"
source_channel: "rollout"
analysis_version: 9
title: "ASM-L0-34 · Damage numbers"
aliases: ["L0-xasm34"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 630
size_chars: 1550
tags: ["v9", "above-water-trident", "CAN_ASSUME"]
level: 1
---
---
title: "ASM-L0-34 · Damage: vanilla trident values; +2 is before armour like C-29"
aliases: ["L0-xasm34", "Trident damage"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-trdt", "L0-adr-twlt", "L0-xcx26"]
see_also: ["abovewatertridentspecv1ruen-part-1", "abovewatertridentspecv1ruen-part-2"]
---
# ASM-L0-34 · Damage numbers

**Assumption (CAN_ASSUME).**
- **"Base damage as vanilla trident"** means the value measured on BDS 1.26.51.1 against a vanilla `minecraft:trident`, separately for melee and for a thrown hit. Expected: melee 9, thrown 8.
  - For melee, the custom item's `minecraft:damage` = measured − 1, because the hand base adds 1 (project measurement: 7 → 8).
  - For thrown hits, the projectile's impact damage is matched to the vanilla thrown trident.
  - Impaling is not promised to act on a custom item. The probe checks it, and it is reported if inert.
- **"+2 HP (one heart)"** is an `entityAttack` bonus **before** armour, Protection and Resistance, the same as the Storm Blade's +6 (C-29). It is not true damage. The spec does not say "ignores armour", and the project already has a proven path for this.
- **Who gets the bonus.** A "living entity" includes players and every mob with health. Armour stands, item frames, boats and minecarts get no bonus and no strike.

**Impact if wrong.**
- If Andrey wants +2 *true* damage, the bonus switches to the Sculk Crossbow's true-damage write (`sclk`). That changes one helper, and `xcx26` work is reused.
- If vanilla values differ from 9/8, only the data values change.

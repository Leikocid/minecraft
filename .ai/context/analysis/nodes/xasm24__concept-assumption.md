---
type: "concept-assumption"
node_id: "L0-xasm24"
source_channel: "rollout"
analysis_version: 7
level: 1
title: "ASM-L0-24 · Entity-hit scope and patch placement"
aliases: ["L0-xasm24"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 610
size_chars: 1512
tags: ["v7", "sculk-crossbow", "CAN_ASSUME"]
---
---
title: "ASM-L0-24 · What counts as a 'living entity' hit, and where the sculk patch goes"
aliases: ["L0-xasm24", "Crossbow entity-hit scope and patch placement"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-adr-sctr", "L0-xq7"]
see_also: ["sculkcrossbowspecv1ruen-part-1", "sculkcrossbowspecv1ruen-part-2"]
---
# ASM-L0-24 · Entity-hit scope and patch placement

**Gaps.** §5 says "a living entity" and "a sculk patch under the target". It does not say:
- what happens on a hit on an entity without health;
- what happens when the target is in the air (a jumping player, a flying mob, the UFO saucer).

**Assumption (CAN_ASSUME).**
- **Living** = the entity has `minecraft:health` and is not in Creative or Spectator.
  - A living hit deals D (C-28) and places a patch.
  - An entity hit on a non-living or immune entity (boat, minecart, the damage-immune saucer, a Creative player) deals no damage and places **no crater**. It still places a patch: the bolt "hit an entity".
- **The patch** is centred on the target's feet column. It is placed on the first solid full-block surface at most **6 blocks** below the feet. If there is none (a target in the air over the Void, a high flier, the saucer), **no patch** is placed.
- A patch never replaces liquids, containers or deny-list blocks (C-27).

**Impact if wrong.** Only placement rules change, in `sculkCells`. If the operator wants damage to non-living entities, armour stands would break, which then touches the `lgnd` stand rules.

---
type: "concept-architecture-decision"
node_id: "L0-magn-adar"
source_channel: "rollout"
analysis_version: 5
title: "ADR magn-adar · Mob and armour-stand iron armour is found with four tagging selector commands at magnet-on"
aliases: ["L0-magn-adar"]
is_a: ["architecture-decision"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 1408
tags: ["is_a:architecture-decision", "status:proposed", "U4b", "relates_to:L0-magn-pscn"]
level: 2
---
# ADR magn-adar · Mob and armour-stand iron armour is found with four tagging selector commands at magnet-on

**Context.**
- U4b: mobs have no `minecraft:equippable` component in API 2.10.0.
- `hasitem={item=X}` reads armour slots.
- A **list** in `hasitem` means all-of, not any-of.
- A selector's result is only visible to scripts as `successCount`.

**Decision.** At magnet-on, run four commands in the Overworld:

`tag @e[x=cx,y=cy,z=cz,r=R,type=!player,type=!item,hasitem={item=iron_helmet}] add andrew:ufo_iron`

The same command runs for `iron_chestplate`, `iron_leggings` and `iron_boots`.
- `R` covers the cylinder: √(50² + 40²) ≈ 64.
- `getEntities({tags:["andrew:ufo_iron"]})` then yields the candidates, with a cylinder filter and `undefined` filtering (C-22).
- The tag is removed from everyone at release and at world load.

**Cost.** Four commands, once per event, not per mob.

**Rejected alternatives.**
- **`testfor` per mob per item**, as the probe did. That is 4·N commands.
- **A list in `hasitem`.** It means all-of, so it is wrong.
- **`equippable` on mobs.** It does not exist in 2.10.0.
- **Reading armour each tick.** The selection is fixed at magnet-on anyway.

**Probe owed.**
- Whether `type=!item` together with `hasitem` is accepted on BDS 1.26.51.
- Whether a `hasitem` without `location` misses only hand slots, and not armour. U4b saw a hand sword not found without a slot.

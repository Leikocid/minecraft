---
type: "concept-process"
node_id: "L0-magn-pext"
source_channel: "rollout"
analysis_version: 5
title: "Materialising selected sources into item entities"
aliases: ["L0-magn-pext"]
is_a: ["process"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 1507
tags: ["is_a:process", "world-mutation", "relates_to:L0-magn-rdup", "relates_to:L0-magn-rblk", "relates_to:L0-magn-rcnt"]
level: 2
---
# Materialising selected sources into item entities

All steps follow the ordering in `L0-magn-rdup`: remove the source first, then spawn, and roll back if the spawn fails.

## Container stack (U5)
1. `c = block.getComponent("minecraft:inventory").container`, then `s = c.getItem(k)`. Re-read at extraction time; if the slot is now empty or no longer iron, skip it.
2. `c.setItem(k, undefined)`.
3. `dim.spawnItem(s, blockCentre + (0, 1, 0))`. If this throws, run `c.setItem(k, s)` and drop the candidate.
4. The container block and its non-iron slots are untouched.

## Built block (U6)
1. Resolve the item:
   - `block.getItemStack(1)`, falling back to the explicit block→item map (`L0-magn-asit`);
   - for a door, always `iron_door` × 1;
   - for an anvil, its own damage-state id.
2. For a door, address the **lower** half only. Removing it also removes the upper half (U6), so the upper half never yields a second item.
3. `block.setType("minecraft:air")`. U6: there is no vanilla drop for the block itself.
4. `spawnItem(item, blockCentre)`. If this throws, restore the saved permutation.

## Ore (U6, U3)
- Same as a built block, but the item is always `raw_iron` × 1, for both stone and deepslate ore, with no Fortune.
- The cavity stays as air.
- The item spawns inside the rock and later flies out through it (`L0-magn-phld`).

## Dependants
Blocks resting on or hanging from a removed block follow vanilla update rules (`L0-magn-cxdp`).

## Cost
At most 10 mutations, all in the magnet-on tick.

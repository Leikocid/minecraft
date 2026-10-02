---
type: "concept-entity"
node_id: "L0-magn-eirn"
source_channel: "rollout"
analysis_version: 5
title: "Iron classification (UFO §4)"
aliases: ["L0-magn-eirn"]
is_a: ["entity"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 2492
tags: ["is_a:entity", "iron-lists", "relates_to:L0-xasm15", "relates_to:L0-magn-adhp", "see_also:ufomagnetspecv1ruen-part-2"]
level: 2
---
# Iron classification (UFO §4)

Built once at module load from `ItemTypes.getAll()` / `BlockTypes.getAll()`, filtered by explicit id patterns (`L0-xasm15`). A GameTest asserts that every expected id resolves on 1.26.51; a missing id fails the build.

## IRON_ITEMS (ground items, container stacks, player hands)
- **Materials:** iron_ingot, iron_nugget, raw_iron, iron_block, raw_iron_block, iron_ore, deepslate_iron_ore.
- **Tools and weapons:** iron_sword, iron_pickaxe, iron_axe, iron_shovel, iron_hoe.
- **Armour:** iron_helmet, iron_chestplate, iron_leggings, iron_boots, iron_horse_armor.
- **Containers:** bucket and every `*_bucket` (water, lava, milk, powder_snow, every fish and axolotl/tadpole bucket).
- **Gear:** shears, flint_and_steel, compass, shield, crossbow.
- **Minecarts:** minecart, chest_minecart, hopper_minecart, tnt_minecart, command_block_minecart.
- **Rails:** rail, golden_rail, detector_rail, activator_rail.
- **Building items:** iron_door, iron_trapdoor, iron_bars, anvil, chipped_anvil, damaged_anvil, cauldron, hopper, heavy_weighted_pressure_plate, the iron chain id (`chain` or `iron_chain` on 1.26.51), lantern, soul_lantern.
- **Not included:** copper chains or lanterns, or any other non-iron variant.

## IRON_BLOCKS (built, priority class 4)
- iron_block, raw_iron_block, iron_bars, iron_door, iron_trapdoor;
- the four rails;
- anvil, chipped_anvil, damaged_anvil;
- cauldron (any fill or liquid; the block id is the same);
- heavy_weighted_pressure_plate, the iron chain, lantern, soul_lantern.
- **The hopper is deliberately absent** (`L0-magn-adhp`).

## IRON_ORE (class 5)
iron_ore, deepslate_iron_ore.

## CONTAINER_BLOCKS (class 2 source, not pulled themselves)
- chest, trapped_chest, barrel, hopper;
- furnace, blast_furnace, smoker;
- dispenser, dropper, brewing_stand;
- every placed shulker box id (undyed plus 16 colours).
- The crafter is excluded: it has no inventory in the API (U5).

## IRON_ENTITIES (class 3)
- `minecraft:iron_golem`, and every minecart entity type.
- Any mob or `armor_stand` wearing iron_helmet, iron_chestplate, iron_leggings or iron_boots, read through hasitem (`L0-magn-adar`).
- Ignored: iron in a mob's hand, and a horse's iron_horse_armor in its body slot. Not in the spec's slot list; an assumption, `L0-magn-asbd`.

## Scan types
The `getBlocks` `includeTypes` list is IRON_BLOCKS ∪ IRON_ORE ∪ CONTAINER_BLOCKS, about 40 ids. U7 measured 22 ids at 9 ms, so this list must be re-measured (`L0-magn-atps`).

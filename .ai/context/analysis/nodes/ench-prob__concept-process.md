---
type: "concept-process"
node_id: "L0-ench-prob"
source_channel: "rollout"
analysis_version: 10
title: "Process · The feasibility probe and its verdict (C-38)"
aliases: ["L0-ench-prob"]
is_a: ["process"]
part_of: ["L0-ench"]
relates_to: ["L0-ench"]
priority: 640
size_chars: 3767
tags: ["v10", "enchanting", "probe", "C-38", "checks-19136"]
level: 2
---
# Process · The feasibility probe and its verdict (C-38)

**is_a:** process · **part_of:** L0-ench · **relates_to:** L0-xcx32, L0-xq11, L0-adr-enrl, L0-xasm39, L0-ench-ac01, L0-ench-cx01

**Where.** On checks BDS (19136), in a private instance named after the full task id (see the three-BDS rule), as a distinct criterion set from the parallel `uwbw` probe. Scenarios go in `src/gametest/enchanting-probe.ts`. The probe builds nothing that ships.

## Q1 · What can a script see?
Record each signal as one of: present / absent / present-but-ambiguous.
1. **Before-events.** Enumerate `world.beforeEvents` in 2.10.0. Confirm there is no enchant, anvil or container-UI before-event. This is a static check of the typings in `node_modules/@minecraft/server`.
2. **`playerInventoryItemChange`.** Log `beforeItemStack` / `itemStack` enchantments when an enchanted stack arrives. Cover three paths that a script can drive: `/enchant` in place, a script `addEnchantment`, and a loot-style spawned stack that is picked up.
3. **XP level.** There is no XP-change event in stable, so the probe polls `player.level` in the shared `runInterval`. It records that a table use costs 1–3 levels **at the click**, while the item comes back to the inventory **later**, when the player takes it out (iPad observation O1).
4. **`enchantable`.** For every vanilla enchantable item, record `getComponent('minecraft:enchantable')`, its `slots`, and `canAddEnchantment` for every `EnchantmentTypes` entry. This is the parity source for `L0-ench-ac06`.

## Q2 · Can a SimulatedPlayer use the table?
The prior record says no: a SimulatedPlayer has no anvil or table screen (`src/gametest/sculk-enchant.ts:1-2`). The probe confirms it with a two-part scenario:
- `interactWithBlock` on an `enchanting_table`;
- an assertion that no enchantment and no level change occur within 40 ticks;
- a held-control negative witness: `/enchant` on the same player *does* change the stack.

**Verdict:** the hook's end-to-end channel is `ipad`. Only adapter internals (the re-roll function called directly on a stand-in stack, and the scrub that runs after it) are `bds`-reachable.

## Q3 · What does 1.26.51 already offer at the table?
This is iPad observation O2, with ≥ 10 table uses for each item, plus the `enchantable` data from Q1.4. Record:
- whether the Mace accepts table enchanting, and whether Wind Burst ever appears;
- whether a spear exists and is table-enchantable, and whether Lunge is offered (the spec says to leave it unchanged if so);
- whether Mending, Frost Walker, Soul Speed or Swift Sneak ever appear (expected: never; they are treasure).

**Output:** the exact "formerly table-inaccessible" set for each slot (`L0-ench-gl01`).

## Q4 · Can a table result be told from other sources?
Build a signature matrix. Its rows are: table, anvil + book, anvil + item, `/enchant`, loot pick-up, trade. Its columns are:
- the level drop (size, and when it happens);
- whether the stack is the same or new;
- whether other inventory items left (a book, or a second item);
- the lapis count;
- the rename (nameTag).

The expected finding is that anvil + book at a cost of 1–3 levels is ambiguous unless the probe also tracks the book leaving the inventory (`L0-ench-cx01`).

## Verdict document
Written into `src/enchanting/README.md` § Verdict. It must include:
- a one-line answer per question, with the scenario name or iPad observation id as evidence;
- the option table copied from `L0-adr-enrl`, with the cost of each option in player words;
- the explicit sentence: "the vanilla table's offers and preview cannot be changed on stable 2.10.0", if Q1 confirms it.

The verdict is then attached to `xq11`. Andrey is asked once (the `xq11` text). **No hook code is merged until he answers.**

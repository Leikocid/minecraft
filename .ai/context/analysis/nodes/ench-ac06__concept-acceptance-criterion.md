---
type: "concept-acceptance-criterion"
node_id: "L0-ench-ac06"
source_channel: "rollout"
analysis_version: 10
title: "AC-ench-06 · Engine parity of the data, always; the hook proof only if it is approved"
aliases: ["L0-ench-ac06"]
is_a: ["acceptance-criterion"]
part_of: ["L0-ench"]
relates_to: ["L0-ench"]
priority: 640
size_chars: 1316
tags: ["v10", "enchanting", "parity", "hook", "conditional:xq11", "channel:bds", "channel:ipad"]
level: 2
---
# AC-ench-06 · Engine parity of the data, always; the hook proof only if it is approved

**is_a:** acceptance-criterion · **part_of:** L0-ench · **relates_to:** L0-ench-r001, L0-ench-r002, L0-ench-r003, L0-ench-cx01

**Parity (always, `bds`).**
**GIVEN** BDS 1.26.51,
**WHEN** a scenario spawns each `ELIGIBILITY` item and calls `canAddEnchantment` for every `EnchantmentTypes` id (and for each `r002` pair, adds A and then asks about B),
**THEN** the engine's answers equal `roll.ts`'s eligibility table and conflict groups, minus curses and forbidden ids, with 0 mismatches. A mismatch is a negative control: flipping one table entry turns the scenario red.

**Hook (only if `xq11` = (a) or (b)).**
- **`bds`:** the adapter's apply function is called directly on a stand-in stack with a seeded RNG. The stack carries the roller result. Then the C-37 scrub still strips `loyalty` from a trident and `piercing` from the Sculk Crossbow in the same tick. A SimulatedPlayer cannot use a table (`ac01` Q2), so the table step itself is not on `bds`.
- **`ipad`:**
  - ≥ 20 table uses on Mace, boots and pickaxe show a rare at least once and a curse never;
  - an anvil + Mending book on a pickaxe is **not** re-rolled (`L0-ench-cx01`);
  - for (a), the preview/result mismatch is visible and is documented as a deviation.

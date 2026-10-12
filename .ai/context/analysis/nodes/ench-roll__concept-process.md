---
type: "concept-process"
node_id: "L0-ench-roll"
source_channel: "rollout"
analysis_version: 10
title: "Process · One roll of `rollEnchantments(request)`"
aliases: ["L0-ench-roll"]
is_a: ["process"]
part_of: ["L0-ench"]
relates_to: ["L0-ench"]
priority: 640
size_chars: 2603
tags: ["v10", "enchanting", "roller", "pure", "C-39"]
level: 2
---
# Process · One roll of `rollEnchantments(request)`

**is_a:** process · **part_of:** L0-ench · **relates_to:** L0-adr-enrl, L0-ench-r001, L0-ench-r002, L0-ench-r003, L0-ench-r004, L0-ench-r005, L0-ench-ent1

The module is `src/enchanting/roll.ts`. It imports nothing from `@minecraft/server`. All randomness comes from `request.rng: () => number` in [0, 1). Each step appends to `trace` (`L0-ench-ent1`).

1. **Eligible set** (`r001`, `r003`). `E` is computed as follows:
   - start from `ELIGIBILITY[itemId]`, the vanilla slot data for 1.26.51;
   - remove `binding` and `vanishing`;
   - remove `forbiddenFor(itemId)`, the union of `FORBIDDEN_ENCHANTMENTS` and the Sculk Crossbow's Piercing.

   If `E` is empty, return `[]` with `eligible:false`. Such a request is **not a valid generation** and does not count in the 20 % statistic.
2. **Partition.** `E` splits into:
   - `R`: the formerly table-inaccessible (treasure) members, from `gl01`;
   - `S`: the standard members.

   `R` is empty when the item has no eligible rare enchantment, and then the roll goes straight to step 4 with `rareStage:'none'`.
3. **The rare stage** (`r004`). There is one draw `u < 0.2`:
   - **hit:** pick one member of `R` uniformly. That is the guaranteed rare. `rareStage:'hit'`.
   - **miss:** `rareStage:'miss'`, and **no** member of `R` may appear in this result.
4. **The standard fill.** Draw the extra-enchantment count `k` (`L0-ench-asm1`). For each extra, pick uniformly from the allowed pool, which is `S`, plus `R` only if the stage hit. Members that conflict (`r002`) with anything already chosen are removed first. Stop early if the pool empties.
5. **Levels.**
   - **Wind Burst and Unbreaking** (`r005`): three independent draws, I < 0.7, II < 0.4 and III < 0.2, are all taken and recorded. The level is the highest success, or I if none succeeds. It is then capped by `min(vanillaMax, tierCap)`.
   - **Every other enchantment:** uniform over `1..min(vanillaMax, tierCap)` (`asm1`).
6. **The final guard.** Assert three things before returning:
   - no curse;
   - no forbidden id;
   - no conflicting pair.

   A failure throws: it is a programming error and is never silently repaired.

**Determinism.** The same seed gives the same `EnchantRoll` (`ac03` uses this). The tests' seeded RNG is a small inline mulberry32. The unseeded runs use `Math.random`.

**Who calls it.** Today only the tests do. After an approved option (a), the adapter calls it with the tier inferred from the level drop (1/2/3 → tier 1/2/3) and applies the result, and then the C-37 scrub runs on the stack anyway (`r003`).

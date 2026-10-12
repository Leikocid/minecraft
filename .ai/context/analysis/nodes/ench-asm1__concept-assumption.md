---
type: "concept-assumption"
node_id: "L0-ench-asm1"
source_channel: "rollout"
analysis_version: 10
title: "ASM-ench-1 · Roller details the spec leaves open"
aliases: ["L0-ench-asm1"]
is_a: ["assumption"]
part_of: ["L0-ench"]
relates_to: ["L0-ench"]
priority: 640
size_chars: 2031
tags: ["v10", "enchanting", "CAN_ASSUME"]
level: 2
---
# ASM-ench-1 · Roller details the spec leaves open

**is_a:** assumption · **part_of:** L0-ench · **relates_to:** L0-xasm39, L0-ench-roll, L0-ench-r005

**Assumptions (CAN_ASSUME).**
1. **The size of the standard pool.** A result has 1 enchantment plus up to 2 extras. Each extra is added with p = 0.3 · tier / 3, stopping at the first failure. This mirrors vanilla, where a higher cost means more enchantments, without the bookshelf cost, which is not observable after the fact.
2. **Other levels.** Enchantments other than Wind Burst and Unbreaking take a level uniform in `1..min(vanillaMax, tierCap)`. The spec sets a distribution only for those two.
3. **The guaranteed rare** is picked uniformly from `R`, and it is picked first, so a later pick can never displace it.
4. **No usefulness filter.** Mending and Unbreaking stay eligible on items without durability (legendaries) if their slot admits them.
5. **Spear Lunge.** If the probe finds Lunge already offered, it stays in the standard pool, keeps its vanilla level and is never treated as rare. If it is not offered, it is treated as rare like any treasure enchantment.
6. **SimulatedPlayer and the table.** We take as given that a SimulatedPlayer cannot use a table (`src/gametest/sculk-enchant.ts:1-2`). The probe confirms this, and the hook's end-to-end channel is then `ipad`.
7. **Tier inference** (only for option (a)): a level drop of 1, 2 or 3 maps to tier 1, 2 or 3.

**Impact if wrong.**
- **Different count or level shapes (1, 2):** only those tests' expected bands change. The §5 bullets are unaffected, because they constrain only the rare stage, curses, conflicts and the Wind Burst/Unbreaking levels.
- **A usefulness filter required (4):** the rare set for def #8 shrinks, possibly to `none`.
- **Lunge counted as rare (5):** one entry moves from `S` to `TREASURE`.
- **A SimulatedPlayer that can use the table (6):** `ac06`'s hook proof moves to `bds`, which is cheaper.
- **Tier ≠ level drop (7):** the cap in the adapter changes; the roller does not.

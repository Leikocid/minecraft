---
type: "concept-assumption"
node_id: "L0-xasm39"
source_channel: "rollout"
analysis_version: 10
title: "ASM-L0-39 · Recipes and enchanting semantics"
aliases: ["L0-xasm39"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 640
size_chars: 2667
tags: ["v10", "enchanting", "recipes", "CAN_ASSUME"]
level: 1
---
---
title: "ASM-L0-39 · Recipes and enchanting semantics: rocket flight, recipe shapes, the rare-stage unit, the 'context max', the Mace at the table"
aliases: ["L0-xasm39", "Recipes and enchanting semantics"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-uwbw", "L0-ench", "L0-adr-enrl", "L0-xcx32"]
see_also: ["underwaterbowmacefireworksenchantingspecv2ruen-part-2", "underwaterbowmacefireworksenchantingspecv2ruen-part-3"]
---
# ASM-L0-39 · Recipes and enchanting semantics

**Assumption (CAN_ASSUME).**

**Recipes**
- **The recipe shapes.**
  - **The Mace** is a 1×2 shaped recipe: Iron Block over Breeze Rod, anywhere in the 2×2 or 3×3 grid.
  - **The rockets** are a 1×2 shaped recipe: Paper over String.

  Neither collides with a vanilla recipe. Vanilla mace is Heavy Core over Breeze Rod; vanilla rockets are shapeless Paper + Gunpowder.
- **"Flight Duration 1".** Bedrock recipe JSON cannot attach firework NBT. **We assume a plain `minecraft:firework_rocket` result boosts an Elytra at flight 1**, as a Creative rocket with no data does. The `uwbw` probe verifies this. If it does not, the result is reported as a limitation (C-16), with no script workaround, because the script cannot write firework NBT in 2.10.0.

**Enchanting**
- **The unit of the 20 % stage** is one enchanting *result*: the enchantment set applied by one table use. It is not each of the three preview slots, because only the result is observable (`xcx32`). For a 1000+ test, a sample is a "valid generation" with at least one eligible rare enchantment for the item.
- **"Formerly table-inaccessible"** means the vanilla treasure set for the item's slot on 1.26.51: Mending, Frost Walker, Soul Speed, Swift Sneak, Wind Burst and any others, minus curses. The `ench` probe produces the exact list for that version.
- **"Context max"** means the vanilla maximum for the enchantment, further capped by the table tier: tier 1 ≤ I, tier 2 ≤ II, tier 3 = the vanilla max. Bookshelf counts are not observable after the fact.
- **The Mace at the table.** If 1.26.51 does not offer the Mace at the table (enchant slot `mace` not table-enchantable), Wind Burst via the table needs the hook itself. The probe records which.
- **Spear Lunge** is left as vanilla if the probe finds it is already offered.

**Impact if wrong.**
- **Rockets that land at flight 0 or 3:** the acceptance bullet is downgraded to a reported limitation.
- **A per-slot rare stage:** the roller's sampling unit changes. That is a small change, but the statistical test is rewritten.
- **A tier cap that must be the bookshelf-based vanilla cost:** that is not reachable after the fact, so it becomes a deviation.

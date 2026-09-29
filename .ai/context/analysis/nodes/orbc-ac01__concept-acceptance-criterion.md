---
type: "concept-acceptance-criterion"
node_id: "L0-orbc-ac01"
source_channel: "rollout"
analysis_version: 3
title: "AC-orbc-01 · Item components: no durability, not enchantable, punch damage, stack of 1 `[bds]`"
aliases: ["L0-orbc-ac01"]
is_a: ["acceptance-criterion"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 952
tags: ["is_a:acceptance-criterion", "channel:bds", "relates_to:L0-orbc-r001", "relates_to:L0-orbc-ent1", "item"]
level: 2
---
# AC-orbc-01 · Item components: no durability, not enchantable, punch damage, stack of 1 `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r001", "L0-orbc-ent1"]`

**GIVEN** `new ItemStack("andrew:orbital_cannon")`.

**THEN**
- `getComponent("minecraft:durability")` is undefined.
- `getComponent("minecraft:enchantable")` is undefined, or `canAddEnchantment` is false for sharpness and unbreaking.
- `maxAmount === 1`.
- A static JSON test asserts the absence of `damage`, `digger`, `use_modifiers` and `shooter`, and the presence of `icon: fishing_rod` and `menu_category.category: equipment`.
- **Punch:** P hits a zombie with the Cannon, and the health lost equals the loss from an empty-hand hit in the same setup (1.0). P uses the Cannon 50 times, and the stack is still the same instance with the same mark `id`, with no wear.
- The recipe JSON matches `r002`'s shape exactly (a static test).

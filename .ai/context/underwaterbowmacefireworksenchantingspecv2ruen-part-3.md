---
type: "raw-fragment"
node_id: "underwaterbowmacefireworksenchantingspecv2ruen-part-3"
source_channel: "raw-import"
level: null
aliases: ["underwaterbowmacefireworksenchantingspecv2ruen-part-3", "underwaterbowmacefireworksenchantingspecv2ruen"]
is_a: ["raw-fragment"]
priority: 640
size_chars: 2783
tags: ["performance", "digest", "requirements", "testing"]
source: "docs/Underwater_Bow_Mace_Fireworks_Enchanting_Spec_v2_RU_EN.docx"
embed_lines: "105-140"
embed_slice: "5-40"
---
Output: one vanilla Mace. Keep the original Heavy Core recipe. Unlimited crafting; vanilla durability, stats, and enchantments.

## 3. Additional vanilla Firework Rocket recipe

  -----------------------------------------------------------------------
  Empty                   Empty                   Empty
  ----------------------- ----------------------- -----------------------
  Empty                   Paper                   Empty

  Empty                   String                  Empty
  -----------------------------------------------------------------------

Output: three vanilla Firework Rockets, Flight Duration 1, usable for Elytra boosts. Keep existing recipes; unlimited crafting.

## 4. Expanded enchanting table

Goal: make all item-compatible vanilla enchantments available via the standard enchanting table, including treasure enchantments (Mending, Wind Burst on Mace, Swift Sneak, etc.). Never offer curses. Enforce vanilla maximum levels and mutual exclusions. Apply globally to eligible vanilla/custom items. Leave spear Lunge unchanged if already obtainable at the table in the target Bedrock version.

For each generated enchantment offer: 20% chance to include at least one eligible formerly table-inaccessible enchantment; otherwise 80% standard pool. If no eligible rare enchantments exist, use the standard pool. Unbreaking remains a normal enchantment but uses the special level rule.

For Wind Burst and Unbreaking, once that enchantment is selected, independently roll level I at 70%, level II at 40%, and level III at 20%; choose the highest successful level. If all rolls fail, use level I as fallback. These are independent probabilities, not additive shares. The 20% rare-enchantment selection is a separate stage. Respect any maximum level allowed by the enchanting context.

Bedrock feasibility: stable add-on APIs may not permit modifying the native enchanting-table algorithm/UI. Validate target-version support. Do not silently substitute a custom station or claim exact behavior if impossible; report constraints and seek approval for alternatives. Avoid experimental toggles where feasible.

## 5. Acceptance tests

• Both old and new Mace/Rocket recipes coexist and output real vanilla items.

• Underwater/lava arrow velocity, normal fire and Super Fire behave as specified.

• Charged misses do not start cooldown; successful hits start a 30-second cooldown.

• Across a large sample, eligible rare enchantments occur approximately 20% of the time; curses never occur.

• Wind Burst and Unbreaking use independent 70/40/20 level checks and highest-success selection.

• Mending and other eligible treasure enchantments can be offered; conflicts remain forbidden.

• Legendary bow uniqueness and recovery persist across world restarts.

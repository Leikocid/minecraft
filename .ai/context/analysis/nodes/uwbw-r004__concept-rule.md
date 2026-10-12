---
type: "concept-rule"
node_id: "L0-uwbw-r004"
source_channel: "rollout"
analysis_version: 10
title: "R-uwbw-004 · Recipe outputs and shape uniqueness"
aliases: ["L0-uwbw-r004"]
is_a: ["rule"]
part_of: ["L0-uwbw"]
relates_to: ["L0-uwbw"]
priority: 640
size_chars: 1046
tags: ["v10", "recipes", "rule", "C-40", "C-34"]
level: 2
---
# R-uwbw-004 · Recipe outputs and shape uniqueness

1. **The Mace and the rockets are pure vanilla ids** (`minecraft:mace` ×1, `minecraft:firework_rocket` ×3). They carry no lore, no `andrew:` look-alike and no script post-processing, and they keep vanilla durability, stats and enchantability. Crafting them is unlimited.
2. **Existing recipes keep working.** That means the vanilla Heavy Core Mace, the vanilla rockets with Gunpowder, and every `packs/behavior/recipes/*` recipe.
3. **No shape collides with any vanilla 1.26.51 recipe or any add-on recipe:**
   - ` R / BWB / S `;
   - `I / Z`;
   - `P / S`.

   This is enforced by a unit test that loads every `packs/behavior/recipes/*.json` and a checked-in vanilla shape list.
   - The bow recipe differs from the trident's ` G / BTB / G `.
   - `I / Z` differs from vanilla Heavy Core / Breeze Rod by ingredient.
4. **The bow craft returns exactly 2 empty buckets**, never 0, 4 or a water bucket (C-34). A blocked craft returns none.

**Source.** Spec v2 §1–§3 and §5 bullet 1; C-34; C-40.

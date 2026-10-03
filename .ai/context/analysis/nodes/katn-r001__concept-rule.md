---
type: "concept-rule"
node_id: "L0-katn-r001"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-katn-r001"]
is_a: ["rule"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 1166
tags: ["rule", "katana", "recipe", "item", "is_a:rule", "relates_to:L0-lgnd-p001", "relates_to:L0-xasm22"]
level: 2
---
---
title: "R-katn-001: Recipe, damage and durability"
is_a: ["rule"]
part_of: ["L0-katn"]
relates_to: ["L0-lgnd-p001", "L0-xasm22", "L0-katn-ent1"]
see_also: ["dragonkatanaspecv1ruen-part-1"]
---
**Rule.**
1. **Recipe.** It is a shaped 3×3 recipe:
   ```
   . G .
   P S P
   . G .
   ```
   G is `minecraft:golden_apple` (not the enchanted one), P is `minecraft:ender_pearl`, S is `minecraft:diamond_sword` (any damage or enchantment, none carried over, `L0-xasm22`).
   - The output is the craft token `andrew:dragon_katana_crafted`, never the item.
   - Gate, refund and broadcast are `L0-lgnd-p001`.
2. **Melee.** An ordinary hit deals exactly what a vanilla Diamond Sword deals in the same situation: no hidden bonus and no script damage (§4).
   - Vanilla enchantments for the sword slot apply as usual.
   - Melee is unaffected by the ability's cooldown (T14). The ability never runs on attack: the Katana def has no attack activation.
3. **Durability.** There is no durability component. Hits and uses never damage the item (T15).
4. **Ability harm.** The ability itself deals no damage to entities or blocks (§4, §8).

Source: Katana §2, §4, T04, T14, T15.

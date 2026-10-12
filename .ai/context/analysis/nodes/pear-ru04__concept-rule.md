---
type: "concept-rule"
node_id: "L0-pear-ru04"
source_channel: "rollout"
analysis_version: 11
title: "Rule: item invariants (durability, crafting, non-legendary)"
aliases: ["L0-pear-ru04"]
is_a: ["rule"]
part_of: ["L0-pear"]
relates_to: ["L0-pear"]
priority: 650
size_chars: 1435
tags: ["v11", "pearl-rod", "rule", "durability", "non-legendary", "C-46"]
level: 2
---
# Rule: item invariants (durability, crafting, non-legendary)

**Is a:** rule. **Part of:** L0-pear. **Relates to:** L0-xasm43, C-46, L0-lgnd, L0-ench.

1. **Infinite durability = damage held at 0.** A marked rod's `durability.damage` is written back to 0:
   - when a tracked hook ends (reel or release);
   - on bind;
   - on the shared interval's hand check, every 20 ticks for holders of a marked rod.

   A reel costs at most 5 durability (or 2 on a block hook), and the rod has 64, so it can never break between checks.
   - **Fallback** if the probe shows damage cannot be written back: re-issue a fresh marked rod carrying the same dynamic properties, enchantments and nameTag.
2. **Unlimited crafting.** There is no world flag and no counter, and the recipe never locks.
3. **Not legendary (C-46).**
   - The token and the marked rod return undefined from `defForToken`, `defForStack` and `isLegendaryStack` (the plan's "`defForItem`"; names as read in `src/legendary/registry.ts` during reduce v11).
   - No retention, Void recovery, despawn protection, refund or gate applies.
   - Death drops are vanilla, and keepInventory is honoured as vanilla.
4. **Enchanting.** The rod is a `minecraft:fishing_rod` for the `ench` roller: Lure, Luck of the Sea, Mending, Unbreaking. Enchanting must keep the mark, nameTag and binding; the `ench` result writes back the same stack with its properties intact.
5. **Transfer is free.** The rod can be dropped, traded, stored or given. A transfer never transfers the use of a binding (`L0-pear-ru01`).

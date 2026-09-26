---
type: "concept-assumption"
node_id: "L0-loot-asm3"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-loot-asm3"]
is_a: ["assumption"]
part_of: ["L0-loot"]
relates_to: ["L0-loot"]
priority: 530
size_chars: 792
tags: ["CAN_ASSUME", "is_a:assumption", "relates_to:L0-loot-p001", "relates_to:L0-loot-r005"]
level: 2
---
**Assumption (CAN_ASSUME):** "Compatible vanilla enchantments" (`L0-loot-r005`) is assumed to mean whatever the stable `@minecraft/server` enchantment API itself considers valid for that item (e.g. `ItemEnchantableComponent`/`EnchantmentTypes` rejecting an incompatible pairing), rather than this add-on hand-maintaining its own per-item compatibility matrix. Curses are filtered out explicitly by category before rolling, since the API itself won't refuse a curse as "incompatible" (curses are compatible with anything item-wise, just excluded by this spec).

**Impact if wrong:** if the stable API doesn't expose a compatibility check (only an apply-or-throw), the implementation needs a hand-maintained compatibility table instead — a larger but localized change to `L0-loot-p001` step 2c.

---
type: "concept-rule"
node_id: "L0-loot-r005"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-loot-r005"]
is_a: ["rule"]
part_of: ["L0-loot"]
relates_to: ["L0-loot"]
priority: 530
size_chars: 551
tags: ["is_a:rule", "relates_to:L0-loot-p001", "relates_to:L0-loot-e003"]
level: 2
---
**Rule:** "Enchanted" categories (Armor/Sword/Axe) roll random compatible vanilla enchantments; an item may carry several enchantments at once; allowed levels go up to the vanilla maximum per enchantment; curse enchantments (Curse of Binding, Curse of Vanishing) are excluded from the candidate pool.

**Rationale:** spec §3.3 third bullet ("случайные совместимые ванильные зачарования... Разрешены максимальные ванильные уровни. Проклятия исключены").

**Scope:** `L0-loot-p001` only. See `L0-loot-asm3` for the assumed compatibility-check mechanism.

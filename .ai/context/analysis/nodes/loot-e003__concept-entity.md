---
type: "concept-entity"
node_id: "L0-loot-e003"
source_channel: "rollout"
analysis_version: 2
title: "Entity: EquipmentRoll"
aliases: ["L0-loot-e003"]
is_a: ["entity"]
part_of: ["L0-loot"]
relates_to: ["L0-loot"]
priority: 530
size_chars: 705
tags: ["is_a:entity", "relates_to:L0-loot-p001", "relates_to:L0-loot-r004", "relates_to:L0-loot-r005"]
level: 2
---
# Entity: EquipmentRoll

The resolved output of an equipment-category attempt (armor/sword/axe, enchanted or not).

**Attributes:**
- `itemType` — helmet/chestplate/leggings/boots (armor only) or sword/axe
- `material` — iron (80%) or diamond (20%), rolled independently per attempt
- `armorSlot` — random slot, armor categories only; independent per attempt, duplicates allowed
- `enchantments[]` — empty for "Unenchanted…" categories; for "Enchanted…" categories, a set of compatible non-curse vanilla enchantments, each ≤ its vanilla max level (`L0-loot-r005`)

**Relationships:** produced by `L0-loot-p001` step 2c for equipment `LootCategory` rows; never appears on the vanilla path (`L0-loot-p002`).

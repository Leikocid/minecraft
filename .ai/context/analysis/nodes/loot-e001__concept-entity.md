---
type: "concept-entity"
node_id: "L0-loot-e001"
source_channel: "rollout"
analysis_version: 5
title: "Entity: LootCategory"
aliases: ["L0-loot-e001"]
is_a: ["entity"]
part_of: ["L0-loot"]
relates_to: ["L0-loot"]
priority: 530
size_chars: 1011
tags: ["is_a:entity", "relates_to:L0-loot-p001", "relates_to:L0-loot-r002"]
level: 2
---
# Entity: LootCategory

Represents one row of the custom weighted table (`L0-loot-r002`). Static configuration data, not persisted per-instance — the 13 rows are compiled into the add-on, not stored in world state.

**Attributes:**
- `id` — one of: sticks, logs, iron_ingot, copper_ingot, gold_ingot, diamond, golden_apple, armor_unenchanted, armor_enchanted, sword_unenchanted, sword_enchanted, axe_unenchanted, axe_enchanted (13 values)
- `weight` — positive integer, relative (not normalized to 100): 45 / 24 / 32 / 30 / 17 / 6 / 7 / 15 / 5 / 12 / 4 / 12 / 4 respectively
- `quantityRange` — [min, max] inclusive, or "1 item" for equipment categories
- `equipment` — boolean; true for the 6 armor/sword/axe categories
- `enchanted` — boolean; true for the 3 "Enchanted …" categories
- `maxSuccessesPerChest` — 1 for golden_apple, unbounded for all others

**Relationships:** consumed by `L0-loot-p001`; the enchanted-equipment rows also produce a `L0-loot-e003` (EquipmentRoll) describing their output shape.

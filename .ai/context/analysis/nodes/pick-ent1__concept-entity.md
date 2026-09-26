---
type: "concept-entity"
node_id: "L0-pick-ent1"
source_channel: "rollout"
analysis_version: 2
title: "Entity: MinersPickaxeItem"
aliases: ["L0-pick-ent1"]
is_a: ["entity"]
part_of: ["L0-pick"]
relates_to: ["L0-pick"]
priority: 520
size_chars: 1116
tags: ["is_a:entity", "relates_to:L0-pick-r001", "relates_to:L0-pick-r002", "relates_to:L0-pick-r005"]
level: 2
---
# Entity: MinersPickaxeItem

**Identifier:** `andrew:miners_pickaxe` (namespace `andrew:`, per project-wide naming rule).

**Attributes** (from `packs/behavior/items/miners_pickaxe.json`):
- `format_version`: 1.21.0
- `menu_category`: category `equipment`, group `itemGroup.name.pickaxe`
- `minecraft:display_name`: `item.andrew:miners_pickaxe.name` (localized RU/EN, see `packs/resource/texts/{en_US,ru_RU}.lang`)
- `minecraft:icon`: `andrew_miners_pickaxe`
- `minecraft:max_stack_size`: 1
- `minecraft:hand_equipped`: true
- `minecraft:enchantable`: `{ slot: "pickaxe", value: 10 }`
- `minecraft:digger`: `{ use_efficiency: true, destroy_speeds: [{ block: { tags: "query.any_tag('minecraft:is_pickaxe_item_destructible')" }, speed: 8 }] }`
- `minecraft:damage`: 4
- `minecraft:tags`: `["minecraft:is_pickaxe", "minecraft:is_tool"]`
- **No** `minecraft:durability` component (deliberate, see `L0-pick-r002`).

**Relationships:** produced by the recipe in `L0-pick-r005`; consumed as the trigger condition for the auto-smelt override in `L0-pick-r003`/`L0-pick-ent2`; its digger speed is governed by `L0-pick-r001`.

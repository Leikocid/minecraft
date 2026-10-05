---
type: "concept-entity"
node_id: "L0-sclk-ent1"
source_channel: "rollout"
analysis_version: 7
title: "E-sclk-1 · Item `andrew:sculk_crossbow` (option A, `adr-scbs`)"
aliases: ["L0-sclk-ent1"]
is_a: ["entity"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 1784
tags: ["entity", "item", "def-5", "creative"]
level: 2
---
# E-sclk-1 · Item `andrew:sculk_crossbow` (option A, `adr-scbs`)

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["entity"]` · `relates_to: ["L0-adr-scbs", "L0-sclk-r005", "L0-sclk-r008", "L0-lgnd"]`

File: `packs/behavior/items/sculk_crossbow.json`. It mirrors `dragon_katana.json`: format 1.21.90.

| Attribute | Value |
|---|---|
| `identifier` | `andrew:sculk_crossbow` |
| `menu_category` | `{category: "equipment", group: "minecraft:itemGroup.name.crossbow"}`: Creative "Снаряжение/Equipment", the search and `/give` |
| `display_name` | `item.andrew:sculk_crossbow.name` |
| `icon` | `andrew_sculk_crossbow` (an RP texture in a crossbow silhouette with sculk teal) |
| `max_stack_size` | 1 |
| `minecraft:shooter` | `ammunition: [{item: "minecraft:arrow", use_offhand: true, search_inventory: true, use_in_creative: true}]`, `charge_on_draw: true`, `max_draw_duration` = 1.25 s, or 0.5 s under the scripted Quick-Charge scheme (`as05`) |
| — load-bearing | `charge_on_draw: true` is what makes the item hold a loaded state; without it, and without `scale_power`, a bare tap fires a full-power bolt. `max_draw_duration` **is** the native fire-rate gate (`cx02`) |
| `minecraft:use_modifiers` | `use_duration` ≥ the draw time, `movement_modifier` 0.35 (like a crossbow) |
| `minecraft:enchantable` | `slot: "crossbow"`, value 1 (the vanilla crossbow's enchantability) |
| `minecraft:fire_resistant` | true (the item entity's fire immunity is `lgnd`'s, but this is the cheap first line) |
| `minecraft:durability` | **absent** (r008) |
| `allow_off_hand` | false (a shooter fires from the main hand only) |

**Identity.** Legendary by type id (`isLegendaryStack`, `registry.ts`). It carries the `lgnd` mark (`keyPrefix "sk"`, `L0-adr-sckp`; `sc` is the Scythe's) from the token swap. Creative and `/give` copies are unmarked test copies (`lgnd`).

**Token.** `andrew:sculk_crossbow_crafted` (`menu_category none`, the same name and icon).

**Option B fallback.** The item is a vanilla `minecraft:crossbow` with a dynamic-property mark. This entity is replaced, and `lgnd` re-opens.

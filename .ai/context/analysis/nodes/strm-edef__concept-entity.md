---
type: "concept-entity"
node_id: "L0-strm-edef"
source_channel: "rollout"
analysis_version: 8
title: "Storm Blade"
aliases: ["L0-strm-edef"]
is_a: ["entity"]
part_of: ["L0-strm"]
relates_to: ["L0-strm"]
priority: 620
size_chars: 2175
tags: ["v8", "storm-blade", "item", "def"]
level: 2
---
---
title: "Storm Blade def #6 and item"
is_a: ["entity"]
part_of: ["L0-strm"]
relates_to: ["L0-xasm32", "L0-adr-sckp", "L0-lgnd", "L0-scyt"]
governs_files: ["src/legendary/registry.ts", "packs/behavior/items/storm_blade.json", "packs/behavior/items/storm_blade_crafted.json"]
---
# Storm Blade

## Def #6 (`registry.ts`, an active def)
| Field | Value |
|---|---|
| itemId | `andrew:storm_blade` |
| keyPrefix | `sb` (unique among `ws sc oc dk sk`, per adr-sckp) |
| abilityKey | `storm_blade` |
| nameKey | `item.andrew:storm_blade` |
| cooldownTicks | 600 |
| craftTokenId | `andrew:storm_blade_crafted` |

## Item JSON (modelled on `scythe_of_calamity.json`)
- `minecraft:max_stack_size` 1, `hand_equipped` true, `allow_off_hand` true, `fire_resistant` true.
- `minecraft:damage`: **N from probe P6** (expected 7, the Bedrock diamond sword). It is never a hard-coded "spec" number.
- `minecraft:enchantable { slot: "sword", value: 10 }`, the diamond sword's enchantability.
- **No `minecraft:durability`**, so it is unbreakable, as on the Scythe.
- Tags `minecraft:is_sword` and `minecraft:is_tool`. Cobweb digger speed is optional; it is not required by the spec.
- `minecraft:icon` `andrew_storm_blade`. The RP texture is in `item_texture.json`.
- `menu_category { category: "equipment" }`, so it shows in Creative "Equipment".
- The token `storm_blade_crafted` has `menu_category none`, as the other tokens do.

## Lang
- RU: `item.andrew:storm_blade.name=Клинок бури`; EN: `Storm Blade`.
- HUD ready: «Клинок бури — Готово» / "Storm Blade — Ready".
- The broadcast uses the shared `lgnd` key with the localised name.

## Recipe (`recipes/storm_blade.json`)
`" L " / "WSW" / " L "`. L = `minecraft:lightning_rod`, W = `minecraft:wind_charge`, S = `minecraft:diamond_sword` → `andrew:storm_blade_crafted`. It unlocks on the lightning rod.
- Refund on a blocked craft: 2 rods, 2 wind charges, 1 diamond sword (the crossbow pattern).
- A diamond sword key matches any damage or enchant state. This is accepted: the input is consumed.

## State
There is no item-level state beyond the `lgnd` stamps (gen id, last holder). The cooldown is per-player under the `sb` prefix.

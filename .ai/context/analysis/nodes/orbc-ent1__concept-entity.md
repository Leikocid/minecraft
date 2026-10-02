---
type: "concept-entity"
node_id: "L0-orbc-ent1"
source_channel: "rollout"
analysis_version: 5
title: "Entity · Orbital Cannon item (`andrew:orbital_cannon`)"
aliases: ["L0-orbc-ent1"]
is_a: ["entity"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 1733
tags: ["is_a:entity", "relates_to:L0-orbc-r001", "relates_to:L0-orbc-r002", "relates_to:L0-xcx13", "relates_to:L0-adr-orbc"]
level: 2
---
# Entity · Orbital Cannon item (`andrew:orbital_cannon`)

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["entity"]` · `relates_to: ["L0-orbc-r001", "L0-orbc-r002", "L0-xcx13", "L0-adr-orbc"]`

## Item JSON (`packs/behavior/items/orbital_cannon.json`)
| Field | Value | Why |
|---|---|---|
| `identifier` | `andrew:orbital_cannon` | A custom item, because fishing is hard-wired into `minecraft:fishing_rod` (`xcx13`) |
| `menu_category.category` | `equipment` | Spec §4 |
| `menu_category.group` | none (`as07`) | There is no rod group to join |
| `display_name` | `item.andrew:orbital_cannon.name` | Lang |
| `icon` | `fishing_rod` (the vanilla atlas entry, **no custom texture**) | §2 |
| `hand_equipped` | true | Held rod-like (`xcx13`, iPad check) |
| `max_stack_size` | 1 | Legendary |
| `allow_off_hand` | true | The HUD shows the Cannon in either hand. See `L0-lgnd-cx08`. |
| `durability` | **absent** | Infinite durability |
| `enchantable` | **absent** | Neither the table nor the anvil accepts it |
| `damage` | **absent** (`as08`) | Empty-hand punch |
| `digger`, tool tags, `use_modifiers`, `shooter`, `throwable` | absent | No fishing, no mining speed, no use animation |

## `LegendaryDef` (in `src/legendary/registry.ts`, `L0-adr-orbc` §1)
- `itemId: andrew:orbital_cannon`, `keyPrefix: "oc"`, `abilityKey: "orbital_cannon"`.
- `nameKey: item.andrew:orbital_cannon`.
- `cooldownTicks: 600`, `craftGate: true`.
- `refund [[minecraft:tnt,4],[minecraft:fishing_rod,1]]`.
- `textPrefix: andrew.orbital`, `command: andrew:orbital`.

## Persistent keys (derived, owned by `lgnd`)
- Item: `andrew:oc_origin|owner|id|owner_name`.
- World: `andrew:oc_crafted|crafted_by`.
- Player: `andrew:oc_pending`, `andrew:cd_orbital_cannon`.

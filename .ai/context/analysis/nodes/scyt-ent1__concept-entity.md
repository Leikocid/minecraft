---
type: "concept-entity"
node_id: "L0-scyt-ent1"
source_channel: "rollout"
analysis_version: 1
title: "ScytheOfCalamity (item plus legendary registration)"
aliases: ["L0-scyt-ent1"]
is_a: ["entity"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1352
tags: ["is_a:entity", "item", "legendary"]
level: 2
---
# ScytheOfCalamity (item plus legendary registration)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["entity"]` · `relates_to: ["L0-sitm", "L0-lgnd", "L0-scyt-r009", "L0-scyt-p004"]`

## Static (behaviour pack JSON, owned by `L0-sitm`)
| Attribute | Value |
|---|---|
| identifier | `andrew:scythe_of_calamity` |
| display name key | `item.andrew:scythe_of_calamity.name`: RU «Коса бедствия», EN "Scythe of Calamity" |
| menu_category | `equipment`, group `itemGroup.name.sword` (`L0-sitm-asm3`) |
| icon | `andrew_scythe_of_calamity` (RP texture) |
| max_stack_size | 1 |
| hand_equipped / allow_off_hand | true / true |
| damage | 8 (Netherite parity, `L0-scyt-as03`) |
| enchantable | slot `sword`, value 10 |
| durability | none (infinite) |
| digger / tool tags | none |

## Registration (`LegendaryDef` in `L0-lgnd`)
| Attribute | Value |
|---|---|
| abilityKey | `scythe`, storage prefix `sc` |
| cooldownMs | 30 000 |
| lang keys | `andrew.scythe_of_calamity.{ready,cooldown,no_target,announce}` |
| craft flag | the Scythe's own world dynamic property, independent of the Web Sword |
| ability | `L0-scyt-p001` |
| isBusy | `L0-sprj` volley map lookup |

## Per-player persistent state (through `L0-lgnd`)
- `sc_cooldown_until`: epoch ms from `Date.now()`. Never ticks (CTR-lgnd-03 lesson).
- Nothing else. Volleys and busy live in memory only.

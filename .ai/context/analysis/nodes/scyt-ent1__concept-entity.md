---
type: "concept-entity"
node_id: "L0-scyt-ent1"
source_channel: "rollout"
analysis_version: 1
title: "ScytheOfCalamity (item plus `LegendaryDef`, as shipped)"
aliases: ["L0-scyt-ent1"]
is_a: ["entity"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1803
tags: ["is_a:entity", "item", "registry", "delta:2026-09-26"]
level: 2
---
# ScytheOfCalamity (item plus `LegendaryDef`, as shipped)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["entity"]` · `relates_to: ["L0-lgnd", "L0-sitm", "L0-scyt-r009", "L0-scyt-cx03"]`

## Static (behavior pack JSON)
| Attribute | Value |
|---|---|
| identifier | `andrew:scythe_of_calamity` |
| display name | `item.andrew:scythe_of_calamity.name`: «Коса бедствия» / "Scythe of Calamity" |
| menu_category | `equipment`, group **`itemGroup.name.hoe`** |
| icon | `andrew_scythe_of_calamity` |
| max_stack_size / hand_equipped | 1 / true |
| allow_off_hand | **absent** (`L0-scyt-cx03`) |
| damage | 8 (measured equal to netherite) |
| enchantable | slot `sword`, value 10 |
| durability | none, so infinite |
| tags / digger | `minecraft:is_tool`, `minecraft:is_hoe`; digger speed 8 on `is_hoe_item_destructible` |

## `SCYTHE_OF_CALAMITY` (`src/legendary/registry.ts`)
| Field | Value |
|---|---|
| keyPrefix | `sc`, giving `andrew:sc_{origin,owner,id,owner_name,crafted,crafted_by,pending}` and `andrew:sc_owed` |
| abilityKey | **`scythe_of_calamity`**, giving the cooldown property `andrew:cd_scythe_of_calamity` |
| cooldownTicks | 600 (30 s, stored as an epoch-ms deadline) |
| craftGate / refund | true / 2 golden apples, 2 obsidian, 1 diamond hoe |
| textPrefix | `andrew.scythe` → `.no_target`, `.first_craft`, `.craft_blocked`, `.returned`, `.admin_given`, `.reset` |
| command | `andrew:scythe` (admin give and reset) |

## Per-player state
- Cooldown deadline `andrew:cd_scythe_of_calamity` (epoch ms).
- Busy deadline (`busyKey`, epoch ms). It is set to launch + 11 s (220 ticks) as a crash bound and cleared at every volley end. It is a **dynamic property**, not memory-only.
- `andrew:hidden_until` (read when the player is a target; written by `/andrew:hide` or a future Shadow Blade).

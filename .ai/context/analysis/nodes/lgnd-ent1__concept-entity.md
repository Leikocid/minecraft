---
type: "concept-entity"
node_id: "L0-lgnd-ent1"
source_channel: "rollout"
analysis_version: 6
title: "LegendaryDef (static registry entry, `src/legendary/registry.ts`)"
aliases: ["L0-lgnd-ent1"]
is_a: ["entity"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 2614
tags: ["v3-delta"]
level: 2
---
---
is_a: ["entity"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p006", "L0-lgnd-r006", "L0-lgnd-ad07", "L0-lgnd-ad08", "L0-lgnd-ad09", "L0-adr-orbc", "L0-orbc"]
---
# LegendaryDef (static registry entry, `src/legendary/registry.ts`)

This replaces the pre-code shape (`registerLegendary`, `readyMode`, `ability` callback). Those were superseded by `ad07`: the registry is a `const` array, Ready is continuous for everyone, and each weapon subscribes itself.

| Field | Web Sword | Scythe | **Orbital Cannon (v3)** |
|---|---|---|---|
| `itemId` | `andrew:web_sword` | `andrew:scythe_of_calamity` | `andrew:orbital_cannon` |
| `keyPrefix` | `ws` (frozen) | `sc` (frozen) | `oc` |
| `abilityKey` | `web_sword` | `scythe_of_calamity` | `orbital_cannon`, one key shared by both modes (Orbital §6) |
| `nameKey` | `item.andrew:web_sword` | `item.andrew:scythe_of_calamity` | `item.andrew:orbital_cannon` |
| `cooldownTicks` | 600 | 600 | 600 |
| `craftGate` | true | true | true |
| `refund` | web ×4, diamond_sword ×1 | golden_apple ×2, obsidian ×2, diamond_hoe ×1 | `minecraft:tnt` ×4, `minecraft:fishing_rod` ×1 |
| `textPrefix` | `andrew.web_sword` | `andrew.scythe` | `andrew.orbital` |
| `command` | `andrew:websword` | `andrew:scythe` | `andrew:orbital` |
| **`activations`** (new) | `["use"]` | `["use"]` | `["use", "attack"]` |
| **`craftTokenId`** (new) | `andrew:web_sword_crafted` | `andrew:scythe_of_calamity_crafted` | `andrew:orbital_cannon_crafted` |

## Derived durable keys
- **World:** `andrew:<p>_crafted`, `andrew:<p>_crafted_by`, `andrew:<p>_owed` (a list, `ent4`), `andrew:<p>_gen:<id>` (`wpn2`, not yet built).
- **Player:** `andrew:<p>_pending`, `andrew:cd_<abilityKey>`, `andrew:busy_<abilityKey>`.
- **ItemStack:** `andrew:<p>_origin`, `_owner`, `_id`, `_owner_name`, `_gen`, `_holder`, `_holder_name` (`ent2`).

## Invariants
- `itemId`, `keyPrefix`, `abilityKey`, `command` and `craftTokenId` are each unique across the registry. A node test asserts this, because there is no runtime registration to throw.
- `keyPrefix` and `abilityKey` are frozen once a world has written them (`r006`). `oc` / `orbital_cannon` freeze with the first v3 world.
- `activations` is non-empty. `"attack"` is legal only for weapons whose module subscribes to an attack event (the Cannon, `L0-adr-orbc` §2).
- `refund` equals the recipe's ingredients. The recipe JSON is owned by the weapon's node, and a node test compares the two.
- The weapon calls `startCooldown` itself and only on a successful activation (`L0-adr-cast` §1). For the Cannon, that means in the same tick as its charges spawn (`L0-xasm10`).

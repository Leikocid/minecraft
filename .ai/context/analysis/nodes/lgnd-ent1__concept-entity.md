---
type: "concept-entity"
node_id: "L0-lgnd-ent1"
source_channel: "rollout"
analysis_version: 7
title: "LegendaryDef (static registry entry, `src/legendary/registry.ts`), v7"
aliases: ["L0-lgnd-ent1"]
is_a: ["entity"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 610
size_chars: 2347
tags: ["v7", "registry"]
level: 2
---
# LegendaryDef (static registry entry, `src/legendary/registry.ts`), v7

Related: L0-lgnd-ad07, L0-lgnd-ad14, L0-lgnd-ad15, L0-lgnd-ad16, L0-lgnd-cx15.

`LEGENDARIES` is a `const` array (`ad07` §1). Adding a weapon means appending an entry. Two variants (`ad15`):

## Common fields (every def)
| Field | Meaning | Unique across defs |
|---|---|---|
| `itemId` | the weapon's item type id | yes |
| `keyPrefix` | namespace of `keysFor(def)`: `andrew:<p>_origin|owner|id|owner_name|crafted|crafted_by|pending|gen|owed`, and `andrew:<p>_gen:<id>`. Frozen once a world ships (`r006`) | **yes** (`cx15`) |
| `nameKey` | item name translation key without `.name` | — |
| `craftGate` | whether the token gate applies | — |
| `craftTokenId` | what the recipe outputs (`ad08`) | yes |
| `refund` | items a blocked craft hands back | — |
| `textPrefix` | prefix of `first_craft`, `craft_blocked`, `returned`, `admin_given`, `reset` | yes |
| `command` | `<command> give [player]` / `reset` | yes |

## Active def only (`ActiveLegendaryDef`)
| Field | Meaning |
|---|---|
| `abilityKey` | timers `andrew:cd_<key>`, `andrew:busy_<key>`; unique across active defs |
| `cooldownTicks` | read by `startCooldown` |
| `hudKeys?` | the weapon's own HUD lang keys; absent = `andrew.legendary.ready|cooldown` |

## Passive def (`PassiveLegendaryDef`)
No `abilityKey`, `cooldownTicks` or `hudKeys`. `hasAbility(def)` is false.

## Registered (v7 target)
| # | Const | itemId | prefix | ability | Variant |
|---|---|---|---|---|---|
| 1 | `WEB_SWORD` | `andrew:web_sword` | `ws` | `web_sword`, 600 | active |
| 2 | `SCYTHE_OF_CALAMITY` | `andrew:scythe_of_calamity` | `sc` | `scythe_of_calamity`, 600 | active |
| 3 | `ORBITAL_CANNON` | `andrew:orbital_cannon` | `oc` | `orbital_cannon`, 600, own `hudKeys` | active |
| 4 | `DRAGON_KATANA` | `andrew:dragon_katana` | `dk` | `dragon_katana`, 600, own `hudKeys` | active |
| 5 | `SCULK_CROSSBOW` | `andrew:sculk_crossbow` | `sk` (proposed, `as18`) | — | passive |

## Invariants
- The uniqueness test covers `itemId`, `keyPrefix`, `craftTokenId`, `textPrefix`, `command` over all defs, and `abilityKey` over active defs.
- `LEGENDARY_TYPE_IDS` = every `itemId` and `craftTokenId`. Identity is **by type**; a def whose `itemId` is a vanilla id (`minecraft:*`) is forbidden while identity is type-based (`ad16` §Fallback).

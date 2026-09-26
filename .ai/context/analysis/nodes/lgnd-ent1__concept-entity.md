---
type: "concept-entity"
node_id: "L0-lgnd-ent1"
source_channel: "rollout"
analysis_version: 2
title: "LegendaryDef (registry entry)"
aliases: ["L0-lgnd-ent1"]
is_a: ["entity"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 2491
tags: ["entity", "registry"]
level: 2
---
---
is_a: ["entity"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p006", "L0-lgnd-r006", "L0-sitm", "L0-stgt"]
---
# LegendaryDef (registry entry)

One entry per legendary weapon. Registered at script load, before any event subscription fires. Immutable afterwards. Shape follows ADR-021 (`{ id, markPrefix, refundIngredients, announceKey, abilityKey, hud }`), made concrete.

| Attribute | Type | Web Sword | Scythe |
|---|---|---|---|
| `id` | item typeId | `andrew:web_sword` | `andrew:scythe_of_calamity` (ASM-021 at L0) |
| `markPrefix` | string, unique | `ws` (frozen, `L0-lgnd-r006`) | `sc` (`L0-lgnd-as02`) |
| `abilityKey` | string, unique | `web_sword` (= shipped `DEFAULT_ABILITY_KEY`) | `scythe_of_calamity` |
| `cooldownMs` | number | 30 000 (`COOLDOWN_TICKS` 600 × 50 ms) | 30 000 |
| `refundIngredients` | `[itemId, count][]` | `[web, 4]`, `[diamond_sword, 1]` (shipped `REFUND`) | `[golden_apple, 2]`, `[obsidian, 2]`, `[diamond_hoe, 1]` (recipe owned by `L0-sitm`) |
| `announceKey` | translate key | `andrew.web_sword.first_craft` | `andrew.scythe_of_calamity.first_craft` |
| `nameKey` | translate key | `item.andrew:web_sword` | `item.andrew:scythe_of_calamity` |
| `messageKeys` | blocked / returned / admin_given / reset / voided | `andrew.web_sword.*` (shipped + `voided`) | `andrew.scythe_of_calamity.*` (`L0-sitm`) |
| `hudKeys` | ready / cooldown / active | `andrew.web_sword.ready` / `.cooldown` (no `active`) | owned by `L0-sitm` |
| `readyMode` | `"once" \| "while-held"` | `once` (shipped) | `while-held` (Scythe §6) — see `L0-lgnd-cx01` |
| `ability` | `(player, hand) → "cast" \| "refused" \| "busy"` | trap entry in `trap.ts` | `L0-stgt` entry |

## Derived durable keys
Spelled only inside `src/legendary/state.ts`:
- **World:** `andrew:<p>_crafted`, `andrew:<p>_crafted_by`, `andrew:<p>_gen:<instanceId>`, `andrew:<p>_owed`.
- **Player:** `andrew:<p>_cooldown_until`, `andrew:<p>_pending`.
- **ItemStack:** `andrew:<p>_origin`, `_owner`, `_id`, `_owner_name`, `_gen`, `_holder`.

## Invariants
- `id`, `markPrefix` and `abilityKey` are each unique across the registry. A duplicate throws at load.
- Registration after the first event dispatch throws. A late weapon would miss its death/craft events.
- `ability` returns `"cast"` only when the weapon's own logic succeeded (ADR-017 generalised).
- The ability owner decides when to call `start()`. The Web Sword calls it at placement. The Scythe calls it at volley resolution with ≥ 1 hit (ASM-017, ADR-025).

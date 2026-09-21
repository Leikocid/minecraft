---
type: "concept-entity"
node_id: "L0-item-ent1"
source_channel: "rollout"
title: "Entity: `andrew:web_sword`"
aliases: ["L0-item-ent1"]
part_of: ["L0-item"]
is_a: ["entity"]
relates_to: ["L0-item"]
analysis_version: 2
priority: 510
size_chars: 1974
tags: ["entity","item","web-sword"]
level: 2
---

**Links** — `part_of: ["L0-item"]` · `is_a: ["entity"]` · `relates_to: ["L0-once", "L0-keep", "L0-cool"]`

# Entity: `andrew:web_sword`

The shared entity of the whole L0 decomposition. This component defines its **static** shape; siblings attach **runtime** state to the same identifier (see decomposition-plan reduce pass §1).

## Static attributes owned by `L0-item`

| Attribute | Value | Source |
|---|---|---|
| Identifier | `andrew:web_sword` | namespace decision (project-level) |
| Base parity | Diamond Sword damage value; vanilla-compatible enchantments | §1 |
| Durability | Component **omitted** (infinite, unbreakable) | §1; precedent `miners_pickaxe.json` |
| `minecraft:enchantable` | `{ "slot": "sword", "value": <TBD> }` | §1; ASM-005/Q-007 |
| `minecraft:hand_equipped` | `true` | parity with any equippable weapon |
| `minecraft:max_stack_size` | `1` | parity with pickaxe / weapon convention |
| `minecraft:icon` | `andrew_web_sword` | §11 (RP half) |
| `menu_category` | `{ "category": "equipment", "group": "<sword-equivalent>" }` | §1, `L0-item-r002` |
| `minecraft:tags` | assumed `["minecraft:is_sword", "minecraft:sword", "minecraft:weapon"]` | ASM-item-2 (`L0-item-asm2`) |
| `minecraft:display_name` | `item.andrew:web_sword.name` | §10 |

## Runtime state attached by siblings (not defined here, listed for traceability)

| State | Owner | Nature |
|---|---|---|
| One-per-world craft flag | `L0-once` | World-scoped dynamic property (ADR-005) — not on the item instance |
| Per-instance ownership/provenance marker | `L0-keep` | Item-instance dynamic property, **blocked on Q-006** |
| Per-player cooldown key | `L0-cool` | Player-scoped service state (ADR-007), keyed by ability, not by item stack |

## Invariant

Any change to the static attributes above (e.g. damage value, enchant slot) must be reconciled against sibling expectations at L0 — a silent local change here can break `L0-trap`'s damage-parity assumption or `L0-qatg`'s AC-6.

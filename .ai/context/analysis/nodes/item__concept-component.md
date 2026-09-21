---
type: "concept-component"
node_id: "L0-item"
source_channel: "rollout"
title: "Item Definition, Recipe & Localization"
aliases: ["L0-item"]
part_of: ["L0"]
is_a: ["component"]
relates_to: ["L0"]
analysis_version: 2
priority: 510
size_chars: 3624
tags: ["component","item","recipe","localization","web-sword"]
level: 1
---

# Item Definition, Recipe & Localization

**Links** — `title: Item Definition, Recipe & Localization` · `aliases: ["L0-item"]` · `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-once", "L0-keep", "L0-trap", "L0-cool", "L0-qatg"]` · `see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2"]`

## Responsibility

Owns everything about `andrew:web_sword` that exists **before any Script API logic runs**: the static item component definition, the crafting recipe, the Resource Pack presence (icon, display name), and the full RU/EN translate-key catalogue that this item — and every sibling component that emits a runtime message — draws from. Spec sections owned: §1 (Core), §2 (Recipe), §7 (Passive Behavior), §10 (Localization), and the Resource Pack half of §11 (Technical Architecture).

## Inputs

- Web Sword spec §1, §2, §7, §10, §11 (`webswordspecv1ruen-part-1`, `-part-2`)
- Shipped platform precedent this component extends, not reinvents (C-10): `packs/behavior/items/miners_pickaxe.json`, `packs/behavior/recipes/miners_pickaxe.json`, `packs/resource/texts/{en_US,ru_RU}.lang`, `packs/resource/textures/item_texture.json`
- Vanilla Diamond Sword's documented component shape (damage, enchant slot, tags) — not present anywhere in this repo, so treated as an assumption (`L0-item-asm2`), not a copyable source

## Outputs

- `packs/behavior/items/web_sword.json` — item definition
- `packs/behavior/recipes/web_sword.json` — shaped recipe
- `packs/resource/textures/items/andrew_web_sword.png` + an `item_texture.json` entry — icon
- `packs/resource/texts/ru_RU.lang` / `en_US.lang` — the `item.andrew:web_sword.name` pair **plus every other key any sibling component needs** (first-craft announcement, cooldown readout)

## What this component does NOT own

- The one-per-world craft gate, its persistent flag, and the broadcast trigger (`L0-once`) — this component defines the recipe's *shape*; whether a craft is *allowed to complete* is decided elsewhere.
- Any dynamic property, ownership marker, or death-retention logic (`L0-keep`).
- The active-ability handler, targeting, and cobweb placement (`L0-trap`) — this component only guarantees that a **plain melee hit** does nothing beyond vanilla Diamond Sword damage (§7).
- The cooldown timer and actionbar readout (`L0-cool`).

## Ownership rule inherited from the decomposition plan

Per `concept-decomposition-plan`: *"Localization ownership is central, use is distributed."* This component is the **sole writer** of `.lang` entries; `L0-once` and `L0-cool` are consumers that must request keys from here rather than hardcoding literals (C-9, ADR-009). This component must reconcile the sibling key list, not merely publish its own item name.

## Key open risk

Q-007 / ASM-005 (parent, `MUST_ASK`): does `minecraft:enchantable` actually function on an item with **no** `minecraft:durability` component on this Bedrock build? The pickaxe (`slot: "pickaxe"`) encodes the identical hypothesis, but Stage 1 never recorded the empirical outcome. The sword repeats the shape with `slot: "sword"`. Verify before or alongside implementation — see `L0-item-asm1`.

## Relation to siblings

`L0-once`, `L0-keep`, `L0-cool` and `L0-trap` all attach behavior/state to the **same entity** this component defines (`andrew:web_sword`) — per the decomposition plan's reduce pass: *"`andrew:web_sword` is the single shared entity — `L0-item` defines it, the others attach state to it."* Any attribute conflict between this component's static definition and a sibling's runtime expectation must be reconciled at L0, not silently overridden here.

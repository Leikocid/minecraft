---
type: "concept-entity"
node_id: "L0-uwbw-eitm"
source_channel: "rollout"
analysis_version: 10
title: "E-uwbw-itm · The Underwater Bow item and def #8"
aliases: ["L0-uwbw-eitm"]
is_a: ["entity"]
part_of: ["L0-uwbw"]
relates_to: ["L0-uwbw"]
priority: 640
size_chars: 1821
tags: ["v10", "underwater-bow", "def-8", "entity"]
level: 2
---
# E-uwbw-itm · The Underwater Bow item and def #8

**Links.** relates_to: L0-lgnd, L0-xasm38, L0-sclk.

**Item `andrew:underwater_bow`** (BP `packs/behavior/items/underwater_bow.json`):
- `minecraft:shooter`: ammunition `minecraft:arrow` (plain, tipped and spectral; `use_offhand`, `search_inventory`), `max_draw_duration` as a vanilla bow (1.0 s), **no `charge_on_draw`** (that would make it a crossbow);
- `minecraft:use_modifiers` / `minecraft:use_animation` `bow`;
- `minecraft:enchantable` slot `bow`, value as the vanilla bow (1);
- **no `minecraft:durability`** (infinite durability), max stack 1;
- `minecraft:allow_off_hand`, only if probe row 9 passes;
- `minecraft:icon`, `minecraft:display_name` `item.andrew:underwater_bow.name`;
- a Creative menu entry (`equipment`, group `itemGroup.name.bow`).

**RP.** An icon plus 3 pull-stage textures, and an attachable with the vanilla bow's pull animation. Every Molang comparison is parenthesised. RU/EN lang for the name, the HUD (ready / armed / cooldown) and the craft messages.

**Token `andrew:underwater_bow_crafted`.** `menu_category: none` (so `hasitem` cannot see it). It is exchanged by `craftgate`.

**Def #8 (`ActiveLegendaryDef`).**
- `itemId` `andrew:underwater_bow`;
- `keyPrefix` `ub`, `abilityKey` `ub`;
- `cooldownTicks` 600;
- `craftGate` true, `craftTokenId` the token;
- `craftReturn` `[["minecraft:bucket", 2]]`;
- `refund`: 1 lightning rod, 1 bow, 2 water buckets, 1 sand, with **no** extra empty buckets (the trident's exchange rule);
- `hudKeys` `{ready, armed, cooldown}`;
- command `andrew:bow`.

**State keys.**
- **Player:** `ub:armed` (boolean, persistent) and the `ub` cooldown timer.
- **Arrow:** `ub:armedShot`, `ub:shooter` and `ub:flame` (the Flame seconds, copied from the bow at the swap).
- **Item:** the legendary mark (lgnd).

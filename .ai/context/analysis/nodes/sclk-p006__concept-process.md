---
type: "concept-process"
node_id: "L0-sclk-p006"
source_channel: "rollout"
analysis_version: 7
title: "P-sclk-006 · Craft wiring (crossbow call site of the `lgnd` craft gate)"
aliases: ["L0-sclk-p006"]
is_a: ["process"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 1701
tags: ["process", "recipe", "craft-token", "lgnd-callsite"]
level: 2
---
# P-sclk-006 · Craft wiring (crossbow call site of the `lgnd` craft gate)

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["process"]` · `relates_to: ["L0-lgnd", "L0-lgnd-r001", "L0-xasm26", "L0-sclk-ent1", "L0-sclk-ac01", "L0-sclk-ac02", "L0-sclk-ac03"]`

The `sclk` side is data only. The gate itself (token → weapon swap, one craft per world, the refund, the broadcast) is `lgnd` and is not restated (R-lgnd-001).

1. `packs/behavior/recipes/sculk_crossbow.json`: `minecraft:recipe_shaped`, tag `crafting_table`.
   - Pattern `[" E ", "DCD", " E "]` with E = `minecraft:echo_shard`, D = `minecraft:deepslate` and C = `minecraft:crossbow`.
   - The result is `andrew:sculk_crossbow_crafted` ×1, the token, with `menu_category: none`.
   - Deepslate is the plain block. Cobbled, polished and tiles do not match.
2. `packs/behavior/items/sculk_crossbow_crafted.json`: the same name key and icon as the weapon, max stack 1, mirroring `dragon_katana_crafted.json`.
3. Def #5 in `registry.ts`, written by the `lgnd` v7 task:
   - `itemId: "andrew:sculk_crossbow"`, `keyPrefix: "sk"` (not `sc`, which is the Scythe's; `L0-adr-sckp`), `craftGate: true`, `craftTokenId: "andrew:sculk_crossbow_crafted"`;
   - `refund: [[echo_shard,2],[deepslate,2],[crossbow,1]]`;
   - text prefix `andrew.sculk_crossbow`, an operator command, and **no ability block** (`xcx24`).
4. Lang (RU/EN), owned here:
   - `item.andrew:sculk_crossbow.name` = «Скалковый арбалет» / "Sculk Crossbow";
   - a tooltip line (Sonic Boom bolt, no Piercing);
   - `andrew.sculk_crossbow.first_craft`, `craft_blocked`, `returned`, `admin_given`, `reset`.

**Engine fact.** `hasitem` on the token is a syntax error (menu_category none), so the GameTests read the token through the inventory API.

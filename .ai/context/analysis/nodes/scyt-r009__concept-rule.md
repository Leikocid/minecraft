---
type: "concept-rule"
node_id: "L0-scyt-r009"
source_channel: "rollout"
analysis_version: 1
title: "R-scyt-009 — Item stats and recipe (as shipped)"
aliases: ["L0-scyt-r009"]
is_a: ["rule"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1243
tags: ["is_a:rule", "item", "recipe", "delta:2026-09-26"]
level: 2
---
# R-scyt-009 — Item stats and recipe (as shipped)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-sitm", "L0-sitm-adr2", "L0-scyt-cx03", "L0-scyt-ent1"]`

Source: spec §1–2. Files: `packs/behavior/items/scythe_of_calamity.json`, `…/recipes/scythe_of_calamity.json`. GameTest: `scythe_melee_matches_netherite`.

**Item as shipped:**
- Id `andrew:scythe_of_calamity`. Names «Коса бедствия» / "Scythe of Calamity".
- `minecraft:damage: 8`, measured equal to a vanilla netherite sword.
- No `minecraft:durability` component, so durability is infinite.
- Enchantable: slot `sword`, value 10 (`decision-scythe-enchantments-slot-sword`).
- `max_stack_size 1`, `hand_equipped true`.
- **Deviations from `L0-sitm-adr2`/`asm3`:** menu group `itemGroup.name.hoe`; tags `minecraft:is_tool` and `minecraft:is_hoe`; a `minecraft:digger` at speed 8 on `is_hoe_item_destructible` blocks.
- **No `minecraft:allow_off_hand`** (`L0-scyt-cx03`).
- Melee hits trigger no ability.

**Recipe:** shaped, crafting table, `" G " / "OHO" / " G "` with G = golden apple, O = obsidian, H = diamond hoe, giving 1× Scythe. It unlocks with a diamond hoe. The one-per-world gate refunds 2 golden apples, 2 obsidian and 1 diamond hoe (`registry.ts`).

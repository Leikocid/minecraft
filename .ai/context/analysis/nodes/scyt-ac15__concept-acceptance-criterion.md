---
type: "concept-acceptance-criterion"
node_id: "L0-scyt-ac15"
source_channel: "rollout"
analysis_version: 1
title: "AC-scyt-15 — Item, melee and durability (§1, §9 DoD, as shipped)"
aliases: ["L0-scyt-ac15"]
is_a: ["acceptance-criterion"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1047
tags: ["is_a:acceptance-criterion", "channel:bds", "channel:ipad", "delta:2026-09-26"]
level: 2
---
# AC-scyt-15 — Item, melee and durability (§1, §9 DoD, as shipped)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-scyt-r009", "L0-scyt-cx03", "L0-sitm"]`

- **BDS** (`scythe_melee_matches_netherite`, green): a melee hit on a cow removes as much health as a vanilla netherite sword.
- **BDS:** a melee hit starts no cooldown, spawns no volley and does not set busy.
- **BDS:** there is no durability component, so repeated hits cause no loss.
- **BDS:** selftest `scythe-enchantable`: engine accepts `sharpness` and refuses `efficiency` (`canAddEnchantment`); the enchanting-table and anvil UI are not exercised on BDS.
- **Open (`L0-scyt-cx03`):** the item carries `is_hoe`/`is_tool` tags and a hoe digger. Whether Use on grass tills is **not verified**; hoe-only enchantments (efficiency, fortune, silk_touch) are refused by the engine (measured 2026-09-29). Do not assert "does not till" until `cx03` is decided.
- **iPad (C-9):** the item appears in Creative under Equipment → **Hoes** (group `itemGroup.name.hoe`) and in search. The names are «Коса бедствия» / "Scythe of Calamity". The icon renders. `/andrew:scythe` gives a copy.

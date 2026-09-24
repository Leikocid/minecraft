---
type: "concept-acceptance-criterion"
node_id: "L0-scyt-ac15"
source_channel: "rollout"
analysis_version: 1
title: "AC-scyt-15 — Item, melee and durability (§1, §9 DoD)"
aliases: ["L0-scyt-ac15"]
is_a: ["acceptance-criterion"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 802
tags: ["is_a:acceptance-criterion", "item", "melee", "channel:bds", "channel:ipad"]
level: 2
---
# AC-scyt-15 — Item, melee and durability (§1, §9 DoD)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-scyt-r009", "L0-sitm", "L0-scyt-r008"]`

- **BDS:** a melee hit on a zombie with the Scythe removes as much health as a hit with a vanilla `netherite_sword`. After 500 hits the item has no durability loss.
- **BDS:** a melee hit starts no cooldown, spawns no projectiles and does not set busy.
- **BDS:** the enchanting table and anvil accept Sharpness and Fire Aspect, and reject Efficiency.
- **BDS:** Use on grass or dirt does not till it (no hoe tag).
- **iPad (C-9):** the item shows in Creative under Equipment → Swords and in search. The names are «Коса бедствия» / "Scythe of Calamity". The icon renders. `/give @s andrew:scythe_of_calamity` works.

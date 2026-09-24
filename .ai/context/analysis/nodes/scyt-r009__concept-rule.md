---
type: "concept-rule"
node_id: "L0-scyt-r009"
source_channel: "rollout"
analysis_version: 1
title: "R-scyt-009 — Item stats and recipe"
aliases: ["L0-scyt-r009"]
is_a: ["rule"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1240
tags: ["is_a:rule", "item", "recipe", "melee"]
level: 2
---
# R-scyt-009 — Item stats and recipe

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-sitm", "L0-sitm-adr1", "L0-sitm-adr2", "L0-scyt-ent1", "L0-lgnd"]` · source: Scythe §1, §2.

**Item:**
- Id `andrew:scythe_of_calamity`. Names: RU «Коса бедствия», EN "Scythe of Calamity".
- Melee damage equals the Netherite Sword: `minecraft:damage: 8`. That is the shipped Web Sword's diamond-parity value 7, plus the vanilla step of +1 from diamond to netherite, which gives a Bedrock total of 9 against diamond's 8 (`L0-scyt-as03`). Check it on BDS by hitting an armour stand or zombie with both swords.
- Infinite durability: no `minecraft:durability` component.
- Enchantable, with slot `sword` (`L0-sitm-adr1`, resolves `cool-ctr2`).
- No `minecraft:digger` and no tool tags (`L0-sitm-adr2`), so there is no tilling and no digger trap.
- `minecraft:allow_off_hand: true`, for the hand-priority rule (`L0-lgnd`).
- Max stack size 1.
- Melee hits trigger no ability, no cooldown and no projectiles.

**Recipe** (shaped, `andrew:scythe_of_calamity`, crafting table), giving 1× Scythe:
```
 .  G  .      G = minecraft:golden_apple (not enchanted)
 O  H  O      O = minecraft:obsidian
 .  G  .      H = minecraft:diamond_hoe
```
The empty corners must stay empty. The one-per-world gate, refund and announcement come from `L0-lgnd` (`L0-scyt-p004`).

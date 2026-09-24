---
type: "concept-rule"
node_id: "L0-scyt-r003"
source_channel: "rollout"
analysis_version: 1
title: "R-scyt-003 — No target costs nothing"
aliases: ["L0-scyt-r003"]
is_a: ["rule"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 809
tags: ["is_a:rule", "no-target", "cooldown", "localization"]
level: 2
---
# R-scyt-003 — No target costs nothing

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-scyt-p001", "L0-lgnd", "CTR-017"]` · source: Scythe §3, §8 test 1.

**Rule:** if no candidate survives `L0-scyt-r001`, then:
- show the localized message «Здесь нет игрока» / "There is no player here" (key `andrew.scythe_of_calamity.no_target`, both `ru_RU` and `en_US`, C-4) to **the owner only**;
- start **no** cooldown, set **no** busy, spawn **no** projectiles, and make **no** world change;
- the ability stays ready. An immediate second press searches again.

**Channel:** the owner's action bar, held for about 2 s through `L0-lgnd`'s `hud.hold`, so the steady Ready HUD does not overwrite it in the next pass (CTR-017). If `hud.hold` is not available, fall back to `sendMessage` (chat).

---
type: "concept-rule"
node_id: "L0-scyt-r003"
source_channel: "rollout"
analysis_version: 5
title: "R-scyt-003 — A miss costs nothing"
aliases: ["L0-scyt-r003"]
is_a: ["rule"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 866
tags: ["is_a:rule", "targeting", "cooldown", "delta:2026-09-26"]
level: 2
---
# R-scyt-003 — A miss costs nothing

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-scyt-p001", "L0-lgnd", "L0-scyt-gl06"]`

Source: spec §3 and §8 test 1, `decision-scythe-targets-mobs` (text change). GameTest: `andrew:scythe_no_target_no_cooldown`.

**Rule:** if `selectTarget` returns nothing (no visible player **and** no visible mob in range), then:
- the owner's action bar shows `{ translate: "andrew.scythe.no_target" }`: RU «Здесь нет цели», EN "There is no target here". The old "no player" wording is gone;
- no cooldown, no busy, no projectiles and no world change happen;
- an immediate second press searches again.

**Channel as shipped:** `player.onScreenDisplay.setActionBar` directly. There is no `hud.hold`, so the steady HUD may overwrite the message on its next pass. This is a cosmetic risk that has not been measured.

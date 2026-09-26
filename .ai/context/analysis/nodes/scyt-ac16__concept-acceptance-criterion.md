---
type: "concept-acceptance-criterion"
node_id: "L0-scyt-ac16"
source_channel: "rollout"
analysis_version: 2
title: "AC-scyt-16 — Action Bar state in either hand, and hand priority (§6)"
aliases: ["L0-scyt-ac16"]
is_a: ["acceptance-criterion"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 831
tags: ["is_a:acceptance-criterion", "hud", "hands", "channel:bds"]
level: 2
---
# AC-scyt-16 — Action Bar state in either hand, and hand priority (§6)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-lgnd", "CTR-017", "CTR-012"]`

**GIVEN** O holds the Scythe in the main hand **or** the off hand,
**THEN** the action bar shows «Готово» / "Ready" while the Scythe is ready, "active" while a volley flies, and the remaining seconds during the cooldown. The remaining seconds count down to 0 and then return to Ready.

**GIVEN** O holds a ready Web Sword in the main hand and a ready Scythe in the off hand,
**WHEN** O presses Use on a valid Web Sword target,
**THEN** only the Web Sword fires.

**AND GIVEN** the Web Sword is on cooldown, **WHEN** O presses Use, **THEN** the Scythe fires. If CTR-012 rules off-hand activation infeasible, this half is dropped and noted.

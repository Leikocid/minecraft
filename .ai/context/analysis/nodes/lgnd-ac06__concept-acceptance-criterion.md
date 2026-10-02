---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac06"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-lgnd-ac06"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 825
tags: ["v3-delta", "reconciled"]
level: 2
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r007", "L0-lgnd-p005", "L0-lgnd-ad07", "L0-lgnd-cx08"]
---
**AC-lgnd-06: Two-hand Action Bar, three weapons.** Channel: `build` (stubbed HUD test) + `ipad` (visual; needs `allow_off_hand`, `cx08`).

GIVEN P holds a ready Orbital Cannon in the main hand and a Web Sword with 12 s left in the off hand
WHEN the HUD renders
THEN P's bar shows "Orbital Cannon — Ready" and then "Web Sword — 12s", in P's client language, using `andrew.legendary.ready` / `andrew.legendary.cooldown`,
AND "Ready" stays on while the item is held (continuous, decision-legendary-ready-hud),
AND a player holding no legendary receives no `setActionBar` call.

This replaces the v1 clause "Web Sword-only rawtext equals 0.3.0", which the continuous-Ready decision retired.

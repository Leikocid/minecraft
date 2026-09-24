---
type: "concept-acceptance-criterion"
node_id: "L0-lgnd-ac06"
source_channel: "rollout"
analysis_version: 1
aliases: ["L0-lgnd-ac06"]
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 657
tags: ["acceptance-criterion", "channel:build", "channel:ipad", "hud"]
level: 2
---
---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r007", "L0-lgnd-p005"]
---
**AC-lgnd-06: Two-hand Action Bar.** Channel: `build` (stubbed HUD test) + `ipad` (visual).

GIVEN P holds a ready Scythe in the main hand and a Web Sword with 12 s left in the off hand
WHEN the HUD renders
THEN P's bar shows the Scythe "Ready" segment and then the Web Sword "12" segment, in P's client language,
AND a player holding no legendary receives no `setActionBar` call,
AND a player holding only the Web Sword in the main hand receives exactly the 0.3.0 rawtext: the shipped HUD cases in `tests/web-sword-cooldown.test.mjs` pass unmodified.

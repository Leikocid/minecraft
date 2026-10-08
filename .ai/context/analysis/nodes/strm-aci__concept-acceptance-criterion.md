---
type: "concept-acceptance-criterion"
node_id: "L0-strm-aci"
source_channel: "rollout"
analysis_version: 8
title: "AC strm-aci (ipad, manual; reopen after every epic merge)"
aliases: ["L0-strm-aci"]
is_a: ["acceptance-criterion"]
part_of: ["L0-strm"]
relates_to: ["L0-strm"]
priority: 620
size_chars: 1288
tags: ["v8", "storm-blade", "channel:ipad", "manual"]
level: 2
---
---
title: "AC strm-aci · Operator checks on the iPad (ipad)"
is_a: ["acceptance-criterion"]
part_of: ["L0-strm"]
relates_to: ["L0-strm-rvis", "L0-strm-edef", "L0-strm-ercp"]
---
# AC strm-aci (ipad, manual; reopen after every epic merge)

1. **The trace and the strikes read as lightning** to the operator: a visible straight line and three distinct strikes on the active, one on a passive proc, with thunder heard at the point. If the operator says it does not read as lightning, that opens the adr-sblt B follow-up.
2. **The icon** shows in the hotbar and inventory. It is not the missing-texture placeholder.
3. **The HUD line** shows «Клинок бури — Готово» in RU and "Storm Blade — Ready" in EN, then counts down after a Use (long-press).
4. **The Creative "Equipment" tab** contains the Storm Blade. The token is not listed.
5. **The recipe book** shows the Storm Blade recipe (holding a lightning rod), and Elytra (feather) and Totem (gold ingot). Shift-crafting the blade from the book on a world that already has one is refused, with a refund.
6. **A real totem pop.** A crafted totem saves the operator from a lethal fall, with the vanilla animation and effects.
7. **An elytra glide.** A crafted elytra deploys and glides from a jump off a height, and firework boosting works.

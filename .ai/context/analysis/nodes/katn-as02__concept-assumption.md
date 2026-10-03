---
type: "concept-assumption"
node_id: "L0-katn-as02"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-katn-as02"]
is_a: ["assumption"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 943
tags: ["assumption", "CAN_ASSUME", "katana", "ipad", "input", "is_a:assumption"]
level: 2
---
---
title: "AS-katn-02 · Aim is the server view direction, also for a tap on a block"
is_a: ["assumption"]
part_of: ["L0-katn"]
relates_to: ["L0-katn-p001", "L0-katn-ac09", "L0-webs"]
---
**Gap.** On the iPad without a crosshair, a tap can land anywhere on screen, and `playerInteractWithBlock` reports the tapped block. The spec says only "the point the player looks at".

**Assumption (CAN_ASSUME).**
- Both triggers trace along `getViewDirection()` from `getHeadLocation()`, the screen centre.
- The tapped block is ignored as an aim point. It is only within vanilla reach (about 6 blocks), so it cannot express a 20-block jump, and mixing the two would give two aim models.

**Impact if wrong.** If the operator wants "tap a block = go there", a block-tap branch uses `event.block` + `faceLocation` as the endpoint, still capped and safety-checked. It is limited to reach, a small local change, and checked on the iPad (`L0-katn-ac09` §5).

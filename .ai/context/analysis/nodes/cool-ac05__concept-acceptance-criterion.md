---
type: "concept-acceptance-criterion"
node_id: "L0-cool-ac05"
source_channel: "rollout"
aliases: ["L0-cool-ac05"]
part_of: ["L0-cool"]
is_a: ["acceptance-criterion"]
relates_to: ["L0-cool"]
analysis_version: 2
priority: 510
size_chars: 405
tags: ["acceptance-criterion","performance","L0-cool"]
level: 2
---

**AC-COOL-5.** GIVEN no player on the server is currently holding an item registered with the cooldown service, WHEN the actionbar render interval fires, THEN it performs no per-player read or write work beyond its own holder-filter check — verifiable by a GameTest asserting the loop short-circuits on an empty holder set.

Source: C-4; decomposition plan's per-tick scoping note. Grounded in R-cool-004.

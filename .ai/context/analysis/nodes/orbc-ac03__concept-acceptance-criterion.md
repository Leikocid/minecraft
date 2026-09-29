---
type: "concept-acceptance-criterion"
node_id: "L0-orbc-ac03"
source_channel: "rollout"
analysis_version: 3
title: "AC-3 · With no block within 10, nothing fires and no cooldown starts `[bds]`"
aliases: ["L0-orbc-ac03"]
is_a: ["acceptance-criterion"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 801
tags: ["is_a:acceptance-criterion", "channel:bds", "orbital-ac-3", "relates_to:L0-orbc-r004"]
level: 2
---
# AC-3 · With no block within 10, nothing fires and no cooldown starts `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r004", "L0-orbc-r003"]`

**GIVEN**
- a SimulatedPlayer P in Survival, holding the Cannon, with no cooldown;
- P facing open sky, with the nearest block along the view ray 11 or more blocks away. A variant looks at water only, or at tall grass with air behind it within 10.

**WHEN** P uses the item (RMB) and attacks (LMB, a forced `entityHitBlock` path).

**THEN**
- No `andrew:orbital_charge` exists in the dimension.
- `andrew:cd_orbital_cannon` on P is unset or unchanged.
- No chat or title message was sent to P.
- An immediate retry facing a block at distance 9.5 **succeeds**: one charge exists and the cooldown is set.

---
type: "concept-acceptance-criterion"
node_id: "L0-sprj-ac07"
source_channel: "rollout"
analysis_version: 1
title: "AC-sprj-07 — Three hits total 9 HP true damage, including while airborne (§8 test 7)"
aliases: ["L0-sprj-ac07"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 594
tags: ["is_a:acceptance-criterion", "channel:bds", "spec-test:7"]
level: 2
---
# AC-sprj-07 — Three hits total 9 HP true damage, including while airborne (§8 test 7)

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-sprj-r003", "L0-sprj-as01", "L0-sprj-as02"]` · channel: `bds`

**GIVEN** an armoured target at 20 HP, no absorption, 8 blocks from the owner, with fall damage disabled for the test (`falldamage false`) so it does not mix into the reading,
**WHEN** all 3 projectiles hit, the 2nd and 3rd while the target is in the air,
**THEN** `volley.hits == 3`, the target's health is exactly 11.0, and the outcome is `COMPLETED`.

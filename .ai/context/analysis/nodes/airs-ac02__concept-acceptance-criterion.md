---
type: "concept-acceptance-criterion"
node_id: "L0-airs-ac02"
source_channel: "rollout"
analysis_version: 2
title: "AC — two opposite doors, no assisted ground access"
aliases: ["L0-airs-ac02"]
is_a: ["acceptance-criterion"]
part_of: ["L0-airs"]
relates_to: ["L0-airs"]
priority: 530
size_chars: 406
tags: ["is_a:acceptance-criterion", "access", "doors", "verify:unit", "verify:bds"]
level: 2
---
# AC — two opposite doors, no assisted ground access

**Links:** `part_of: ["L0-airs"]` · `is_a: ["acceptance-criterion"]`

**GIVEN** a placed Airship, **WHEN** its lower hull is inspected, **THEN** it has exactly 2 doors on opposite sides, and there is no ladder, staircase, lift, waterfall, or teleporter connecting it to the ground. Reaching it is left entirely to the player.

(Spec §5.2; raw test 26.)

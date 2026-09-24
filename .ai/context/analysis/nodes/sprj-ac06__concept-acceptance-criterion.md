---
type: "concept-acceptance-criterion"
node_id: "L0-sprj-ac06"
source_channel: "rollout"
analysis_version: 1
title: "AC-sprj-06 — One hit = 3 HP true damage + a launch of about 10 blocks (§8 test 6)"
aliases: ["L0-sprj-ac06"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 791
tags: ["is_a:acceptance-criterion", "channel:bds", "spec-test:6"]
level: 2
---
# AC-sprj-06 — One hit = 3 HP true damage + a launch of about 10 blocks (§8 test 6)

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-sprj-r003", "L0-sprj-p003", "L0-sprj-as04"]` · channel: `bds`

**GIVEN** a target at 20 HP with no effects, in full Netherite armour with Protection IV on every piece,
**WHEN** exactly one projectile hits (the other two are removed via the core in the test harness),
**THEN** the target's health reads exactly 17.0 immediately after the hit, before landing.

**AND GIVEN** the same target **without** armour on flat ground,
**WHEN** one hit lands,
**THEN** the maximum Y reached is 8–12 blocks above the hit Y (ASM-019), **AND** the fall damage on landing is non-zero and matches vanilla fall damage for that height.

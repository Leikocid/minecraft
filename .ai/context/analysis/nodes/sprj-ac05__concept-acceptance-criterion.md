---
type: "concept-acceptance-criterion"
node_id: "L0-sprj-ac05"
source_channel: "rollout"
analysis_version: 1
title: "AC-sprj-05 — Exactly 3 projectiles, through blocks, no block changes (§8 test 5)"
aliases: ["L0-sprj-ac05"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 732
tags: ["is_a:acceptance-criterion", "channel:bds", "spec-test:5"]
level: 2
---
# AC-sprj-05 — Exactly 3 projectiles, through blocks, no block changes (§8 test 5)

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-sprj-r001", "L0-sprj-r002", "L0-sqat"]` · channel: `bds` (GameTest) + `ipad` (visual)

**GIVEN** a target sealed in a 3×3×3 obsidian shell, with a glass pane and a closed door on the line between owner and target, 10 blocks away,
**WHEN** the owner activates the Scythe,
**THEN** the volley record holds exactly 3 projectiles (released on ticks +0, +4, +8), at least one reaches the target, **AND** a type-hash of every block within the 20-block sphere is identical before and after, **AND** no new entities of any type exist in that sphere after the volley.

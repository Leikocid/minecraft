---
type: "concept-acceptance-criterion"
node_id: "L0-sprj-ac13"
source_channel: "rollout"
analysis_version: 1
title: "AC-sprj-13 — Completion and expiry outcomes (§5 normal completion, ASM-018)"
aliases: ["L0-sprj-ac13"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 775
tags: ["is_a:acceptance-criterion", "channel:bds", "cooldown"]
level: 2
---
# AC-sprj-13 — Completion and expiry outcomes (§5 normal completion, ASM-018)

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-sprj-ent3", "L0-sprj-r005", "L0-sprj-ad03"]` · channel: `build` (pure-core unit tests) + `bds`

**GIVEN** the pure volley core,
- **WHEN** 1 projectile hits and 2 expire inside the leash → **THEN** `COMPLETED` and `commitCooldown` is emitted.
- **WHEN** all 3 expire inside the leash with 0 hits (the target is moved faster than 0.5 block/tick for 200 ticks) → **THEN** `EXPIRED_NO_HIT`, no `commitCooldown` event.
- **WHEN** a hit and a leash crossing happen in the same step → **THEN** `ESCAPED_AFTER_HIT` (`L0-sprj-r008`).
- **WHEN** 3 hits land → **THEN** `COMPLETED` in the same step as the third hit.

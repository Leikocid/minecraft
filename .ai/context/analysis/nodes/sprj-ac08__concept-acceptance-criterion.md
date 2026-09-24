---
type: "concept-acceptance-criterion"
node_id: "L0-sprj-ac08"
source_channel: "rollout"
analysis_version: 1
title: "AC-sprj-08 — Escape before the first hit cancels with no cooldown (§8 test 8)"
aliases: ["L0-sprj-ac08"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 761
tags: ["is_a:acceptance-criterion", "channel:bds", "spec-test:8"]
level: 2
---
# AC-sprj-08 — Escape before the first hit cancels with no cooldown (§8 test 8)

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-sprj-r004", "L0-sprj-r005"]` · channel: `bds`

**GIVEN** a volley launched at a target 15 blocks away,
**WHEN** the target is teleported 25 blocks from `launchPoint` before any projectile connects (the owner stays put, then separately: the owner moves 10 blocks toward the target and the target is placed 21 blocks from `launchPoint`),
**THEN** in both cases, in the same tick: every projectile is `GONE`, the outcome is `ESCAPED_NO_HIT`, the target's health is unchanged, `cooldown.isBusy` is false, `cooldown.isReady` is true, **AND** an immediate second activation launches a new volley.

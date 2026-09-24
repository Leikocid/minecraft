---
type: "concept-acceptance-criterion"
node_id: "L0-scyt-ac03"
source_channel: "rollout"
analysis_version: 1
title: "AC-scyt-03 — A player hidden by Shadow Blade is not chosen (§8 test 3)"
aliases: ["L0-scyt-ac03"]
is_a: ["acceptance-criterion"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 712
tags: ["is_a:acceptance-criterion", "spec-test:3", "shadow-blade", "blocked:CTR-014"]
level: 2
---
# AC-scyt-03 — A player hidden by Shadow Blade is not chosen (§8 test 3)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-scyt-r001", "CTR-014", "ASM-024"]`

**GIVEN** owner O, with player H at 5 blocks for whom `isHiddenByShadowBlade(H)` returns true, and player V at 10 blocks, both visible,
**WHEN** O presses Use,
**THEN** the lock is on V. If V is absent, the no-target message appears and there is no cooldown.

**Verification today:** a unit or GameTest injects a predicate stub that returns true for H. End-to-end verification with a real Shadow Blade is **blocked** by CTR-014 / Q-020. Record this AC as "verified at the seam". Do not report it as fully passed.

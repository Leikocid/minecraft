---
type: "concept-acceptance-criterion"
node_id: "L0-scyt-ac04"
source_channel: "rollout"
analysis_version: 1
title: "AC-scyt-04 — Equal distance: the view-direction tie-break decides (§8 test 4)"
aliases: ["L0-scyt-ac04"]
is_a: ["acceptance-criterion"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 721
tags: ["is_a:acceptance-criterion", "spec-test:4", "tie-break", "channel:bds"]
level: 2
---
# AC-scyt-04 — Equal distance: the view-direction tie-break decides (§8 test 4)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-scyt-r002"]`

**GIVEN** owner O at (0, y, 0) facing +X, with player P1 at (10, y, 0) and player P2 at (0, y, 10). Both are exactly 10 blocks away and visible.
**WHEN** O presses Use,
**THEN** the lock is on P1, and the log shows `tieBroken = true`.

**AND WHEN** O turns to face +Z and presses again, after the cooldown or after an escape with no hit,
**THEN** the lock is on P2.

**Edge:** P1 at 10.000 and P2 at 10.005 still count as tied, within ε = 0.01. P1 at 10.0 and P2 at 10.5 are not tied, so P1 wins on distance whatever the view direction.

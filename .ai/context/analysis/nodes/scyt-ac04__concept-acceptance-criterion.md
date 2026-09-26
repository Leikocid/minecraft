---
type: "concept-acceptance-criterion"
node_id: "L0-scyt-ac04"
source_channel: "rollout"
analysis_version: 1
title: "AC-scyt-04 — Near-equal distance (within 0.5): the gaze decides (§8 test 4)"
aliases: ["L0-scyt-ac04"]
is_a: ["acceptance-criterion"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 910
tags: ["is_a:acceptance-criterion", "spec-test:4", "channel:unit", "delta:2026-09-26"]
level: 2
---
# AC-scyt-04 — Near-equal distance (within 0.5): the gaze decides (§8 test 4)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-scyt-r002", "L0-scyt-gl04"]`

Pure table test: `pickTarget` rows in `tests/scythe-targeting.test.mjs`.

**GIVEN** owner O at (0,y,0) facing +X, with player P1 at (10,y,0) and player P2 at (0,y,10). Both are visible.
**WHEN** O presses Use, **THEN** the lock is on P1.
**AND WHEN** O faces +Z and presses again (after the cooldown, or after a volley with no hit), **THEN** the lock is on P2.

**Edges:**
- P1 at 10.0 and P2 at 10.4 → tied (ε = 0.5), so the gaze decides.
- P1 at 10.0 and P2 at 10.6 → not tied, so P1 wins whatever the gaze.
- A nearer **occluded** P0 at 9.8 does not open the window: the window anchors on P1 (the nearest visible).
- The tie-break never crosses tiers: a mob that is tied in distance with a player never wins.

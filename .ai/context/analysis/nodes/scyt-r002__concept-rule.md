---
type: "concept-rule"
node_id: "L0-scyt-r002"
source_channel: "rollout"
analysis_version: 1
title: "R-scyt-002 — Player tier first, then nearest, then the owner's gaze within ε 0.5"
aliases: ["L0-scyt-r002"]
is_a: ["rule"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1307
tags: ["is_a:rule", "targeting", "tie-break", "mob-targeting", "delta:2026-09-26"]
level: 2
---
# R-scyt-002 — Player tier first, then nearest, then the owner's gaze within ε 0.5

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-scyt-p001", "L0-scyt-ad04", "L0-scyt-gl04", "L0-scyt-gl07"]`

Source: spec §3 and §8 tests 2/4, `decision-scythe-targets-mobs`. Code: `pickTarget`, `TIE_EPSILON = 0.5`.

**Order:**
1. **Tier:** every player candidate ranks ahead of every mob candidate, however near the mob is. A mob can win only when no player is **visible**.
2. **Distance:** within a tier, the smallest 3D distance from the owner's feet wins.
3. **Tie window:** it is anchored on the nearest **visible** candidate of the winning tier. Candidates up to `nearest + 0.5` blocks count as tied. An occluded candidate neither wins nor widens the window.
4. **Gaze:** among the tied candidates, the one with the highest cosine between `owner.getViewDirection()` and (candidate feet − owner feet) wins.
5. **Exact gaze tie:** the first one in sort order wins, because a strict `>` is used. There is **no** id fallback.

**Laziness:** `isVisible` runs nearest first, and scanning stops once a candidate lies beyond the window or in the lower tier after a hit. Raycasts are the only costly step.

**Once only:** the target is fixed at activation, and projectiles never switch targets (§4).

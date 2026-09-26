---
type: "concept-rule"
node_id: "L0-scyt-r007"
source_channel: "rollout"
analysis_version: 1
title: "R-scyt-007 — 20-block horizontal pursuit radius around the frozen launch point"
aliases: ["L0-scyt-r007"]
is_a: ["rule"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1175
tags: ["is_a:rule", "leash", "cooldown", "delta:2026-09-26"]
level: 2
---
# R-scyt-007 — 20-block horizontal pursuit radius around the frozen launch point

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-scyt-ad05", "L0-sprj-r005", "L0-scyt-gl08"]`

Source: spec §5, `L0-scyt-ad05`. Code: `outOfRadius`, `PURSUIT_RADIUS = 20`. GameTests: `scythe_out_of_radius_no_cooldown`, `scythe_out_of_radius_after_hit_cooldown`.

**Rule:**
- `launchPoint` is the owner's location at `launchVolley`, and it never moves afterwards.
- Every tick, **before** projectiles move, the volley ends with `out_of_radius` if `hypot(target.x − lp.x, target.z − lp.z) > 20`. The distance is **horizontal only**; Y is ignored.
- Cooldown at the end (`cooldownVerdict`): **≥ 1 hit → the full 30 s; 0 hits → none**. The same split applies to every end reason (`spent`, `out_of_radius`, `timeout`, `target_invalid`, `error`). The cooldown is never pro-rated.

**Asymmetry with targeting:** targeting (r001) measures **3D** distance from the owner's location. The leash measures **horizontal** distance from the launch point. A target 19 blocks out and 15 blocks below is not a candidate, but a locked target launched 30 blocks up stays inside the leash.

---
type: "concept-rule"
node_id: "L0-scyt-r008"
source_channel: "rollout"
analysis_version: 5
title: "R-scyt-008 — Only the locked target can be hit"
aliases: ["L0-scyt-r008"]
is_a: ["rule"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 608
tags: ["is_a:rule", "projectile", "delta:2026-09-26"]
level: 2
---
# R-scyt-008 — Only the locked target can be hit

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-scyt-r002", "L0-scyt-ad04"]`

Source: spec §4. Code: `step`, which compares projectiles only against `volley.target`.

**Rule:** a projectile's hit test uses only the locked target's aim point (feet + 1.0). Every other entity in the path is neither damaged nor launched, and it does not absorb the projectile: other players, other mobs, the owner, armour stands and items all pass untouched. The locked target may itself be a mob (`L0-scyt-ad04`). The ability never damages the owner.

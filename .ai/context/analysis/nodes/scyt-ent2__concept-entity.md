---
type: "concept-entity"
node_id: "L0-scyt-ent2"
source_channel: "rollout"
analysis_version: 1
title: "TargetLock (transient result of P-scyt-001)"
aliases: ["L0-scyt-ent2"]
is_a: ["entity"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1229
tags: ["is_a:entity", "targeting", "transient"]
level: 2
---
# TargetLock (transient result of P-scyt-001)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["entity"]` · `relates_to: ["L0-scyt-p001", "L0-sprj"]`

This is the hand-off record from targeting to `L0-sprj.launchVolley`. It is created once per successful press and never persisted.

| Attribute | Type | Notes |
|---|---|---|
| ownerId | string | `Player.id`. It is an id, not a handle, so it survives handle invalidation checks. |
| targetId | string | The selected candidate's `Player.id`. |
| dimensionId | string | The owner's dimension at activation. The target must share it. |
| launchPoint | Vector3 | The owner's `location` at activation, frozen. It is the leash centre. |
| spawnPoint | Vector3 | `launchPoint + (0, 1.62, 0)`: eye height, where the projectiles appear. |
| distance | number | Distance from launch point to target at lock time, ≤ 20. Used for diagnostics and ACs. |
| tieBroken | boolean | True if `r002`'s view-angle tie-break decided the choice. Logged in GameTests. |

## Candidate (internal to P-scyt-001)
`{ player, distance, viewDot, visible, hidden }`. It is built for each player that `getPlayers` returns and is discarded after selection.

**Invariant:** `targetId ≠ ownerId`, and `distance ≤ 20`.

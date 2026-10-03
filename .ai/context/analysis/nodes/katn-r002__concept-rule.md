---
type: "concept-rule"
node_id: "L0-katn-r002"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-katn-r002"]
is_a: ["rule"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 1117
tags: ["rule", "katana", "teleport", "server-authority", "is_a:rule", "relates_to:L0-xasm18"]
level: 2
---
---
title: "R-katn-002: Server-authoritative 20-block cap, same dimension, no block edits"
is_a: ["rule"]
part_of: ["L0-katn"]
relates_to: ["L0-xasm18", "L0-katn-p001", "L0-katn-ent2"]
see_also: ["dragonkatanaspecv1ruen-part-2", "dragonkatanaspecv1ruen-part-3"]
---
**Rule** (C-24).
- The destination is computed only from the server's `getHeadLocation()` and `getViewDirection()` at the moment of use. No client-supplied point is ever read.
- **Cap.** The resulting head position lies within 20.0 blocks of the use-time head: `|B + (0,1.62,0) − H| ≤ 20`. Aim further than 20 is **clamped**, not refused (`L0-xasm18`).
- **Dimension.** The teleport is always in the player's current dimension. A teleport is never attempted into another dimension's chunks.
- **No edits.** The ability never calls `setType`, `setPermutation`, `fillBlocks` or any command that changes blocks. If no cell fits, there is no teleport. Space is never created.
- **Facing.** The teleport keeps the use-time rotation.
- **Particles.** Particles are never a source of truth for position (§11).

Source: Katana §5, §6, §11, §14; T05, T06, T10.

---
type: "concept-rule"
node_id: "L0-katn-r003"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-katn-r003"]
is_a: ["rule"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 1319
tags: ["rule", "katana", "trace", "unloaded-chunks", "is_a:rule", "relates_to:L0-adr-ktob"]
level: 2
---
---
title: "R-katn-003: Obstacle semantics of the trace"
is_a: ["rule"]
part_of: ["L0-katn"]
relates_to: ["L0-adr-ktob", "L0-katn-ad01", "L0-katn-cx01", "L0-xasm21"]
see_also: ["dragonkatanaspecv1ruen-part-2"]
---
**Rule.** The trace stops at the first block that the engine's block ray reports with `includePassableBlocks: false, includeLiquidBlocks: false` (`L0-adr-ktob`).
- **Do not stop it:** water, lava, air, and passable blocks (grass, flowers, torches, signs, ladders, carpet, cobweb; to be confirmed by probe (2)).
- **Stop it:** full blocks and partial-collision blocks (slabs, stairs, fences, walls, glass panes, doors). The Katana stops short rather than risk a stuck player.
- **Unreadable = solid.** A point of the segment in an unloaded chunk (`dimension.getBlock` returns `undefined` or throws) or outside `dimension.heightRange` ends the trace just before it.
- The Katana never phases through a stopping block. The landing cell is always reached from the head by a clear ray.
- A Web Sword trap does not hold the player: cobweb is passable (`L0-xasm21`). The UFO magnet does not cancel the ability.

These semantics deliberately differ from the Scythe's `hasLineOfSight` (any non-air, non-liquid block blocks). Each module's README names the difference.

Source: Katana §5, §13; T07, T08; C-12, C-24.

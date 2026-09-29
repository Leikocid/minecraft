---
type: "concept-acceptance-criterion"
node_id: "L0-pntr-ac06"
source_channel: "rollout"
analysis_version: 3
aliases: ["L0-pntr-ac06"]
is_a: ["acceptance-criterion"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 654
tags: ["title:AC-10 (bds) · One sound, 20-tick wave, nothing left behind", "is_a:acceptance-criterion", "channel:bds", "orbital-ac:10", "constraint:C-19", "relates_to:L0-pntr-p003", "relates_to:L0-pntr-r009"]
level: 2
---
**GIVEN** a spy wrapped around `dimension.playSound` and `dimension.spawnParticle` in the gametest build.
**WHEN** one LMB detonates on a 140-layer column.
**THEN**:
- `playSound` was called exactly once, with `random.explode`, at the detonation point, in the detonation tick;
- `spawnParticle` calls span exactly 20 consecutive ticks starting at the detonation tick;
- the per-tick call count is ≤ 16;
- the particle y-coordinates are non-increasing across ticks, and the last tick includes `bottom`;
- 25 ticks after detonation, no `pntr` job is running, and the entity count in the column AABB equals the pre-attack count minus entities that fell out.

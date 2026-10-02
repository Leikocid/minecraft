---
type: "concept-rule"
node_id: "L0-sauc-r002"
source_channel: "rollout"
analysis_version: 5
title: "R-sauc-2 · Flight-path geometry and timing"
aliases: ["L0-sauc-r002"]
is_a: ["rule"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 1262
tags: ["is_a:rule", "flight-path", "U8", "relates_to:L0-sauc-p001", "relates_to:L0-sauc-as04"]
level: 2
---
# R-sauc-2 · Flight-path geometry and timing

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["rule"]` · `relates_to: ["L0-sauc-p001", "L0-sauc-as04", "L0-ufoc"]`

**Rule** (UFO §2 table, AC-2):

| Leg | From | To | Duration |
|---|---|---|---|
| Arrival | horizontal distance 90 from the centre on bearing θ, at `hoverY + 10` | hover point `(centre, hoverY)` | 400 ticks (20 s) |
| Hover | hover point | hover point | 1200 ticks (60 s), set by `ufoc` |
| Departure | hover point | horizontal distance 90 on bearing θ + 180°, at `hoverY + 10` | 300 ticks (15 s) |

After that the saucer is removed in the same tick.

**Constraints.**
- The horizontal distance from the centre stays ≤ 90 on every tick, and so never exceeds the 100-block U8 limit (C-12′). The 100 is read as horizontal (`as04`).
- θ is uniform in [0, 2π). The departure bearing is exactly opposite.
- The motion is continuous: the position step is ≤ 0.5 blocks per tick on every leg. The fastest step is at the middle of an eased leg, and stays under 0.5 blocks per tick for both legs.
- `hoverY` comes from `ufoc`: centre + 40, capped at ceiling − 4. `sauc` never recomputes it.
- The arrival and departure height is `min(hoverY + 10, ceiling − 4)`, so the hull never rises above the build limit and stays reachable by a charge in every phase (`L0-adr-ufht`, which resolves `sauc-cx01`).
- Nothing in the world changes the path: the saucer has no physics or collision, and it passes through terrain (UFO §7).

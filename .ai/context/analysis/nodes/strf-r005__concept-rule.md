---
type: "concept-rule"
node_id: "L0-strf-r005"
source_channel: "rollout"
analysis_version: 2
title: "Rule: footprint-validity profiles (the whole footprint, never only the centre)"
aliases: ["L0-strf-r005"]
is_a: ["rule"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 1620
tags: ["is_a:rule", "validity", "footprint", "relates_to:L0-xasm4", "relates_to:L0-strf-as02", "relates_to:L0-airs", "relates_to:L0-wind"]
level: 2
---
# Rule: footprint-validity profiles (the whole footprint, never only the centre)

**Links:** `part_of: ["L0-strf"]` · `is_a: ["rule"]`

Validation always samples the **whole rotated footprint** (§5.4 "проверять не только центральную точку"). Thresholds are per-def constants in one table:

| Profile | Used by | Condition to be valid |
|---|---|---|
| `dryLand` | Windmill, Airship, Warden City (surface) | liquid surface samples ≤ `maxLiquidShare` (Windmill 5 %, Airship 10 % (`L0-strf-as02`), Warden City 0 % at the centre and the 8-point ring); no sample on ice-over-water in an ocean/river biome |
| `flat` | Windmill (normal gen) | `max(surfaceY) − min(surfaceY) ≤ 3` over the 35×35 plot; leaves/logs count as obstacles, so the surface uses the first non-leaf, non-log solid block (`L0-xasm4` §4) |
| `altitude` | Airship | `maxSurfaceY` includes trees and leaves (§5.4 "рельеф/деревья"); `bottomY = maxSurfaceY + c`, `c` seeded in [40,70]; if `bottomY+H−1 > top`, retry with `c = 40`; still too high → reject |
| `depth` | Warden City | seeded top Y in [−45, −35]; the whole AABB is above `min+1`; the centre column above is `dryLand` |
| `netherFloor` | Bastion | see `L0-strf-r013` |

- Normal generation **never terraforms** (§4.6). Only `wind`'s spawn path may prepare terrain.
- "Open water" includes rivers, oceans, lakes and swamp water at the surface. The Windmill's own water ditches in its template are irrelevant because validation runs before placement.
- Reject reasons are enumerated (`liquid`, `uneven`, `ceiling`, `floor`, `lavaOcean`, `collision:<kind>`, `unloaded`) and counted (`L0-strf-p002`).

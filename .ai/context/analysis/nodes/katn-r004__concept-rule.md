---
type: "concept-rule"
node_id: "L0-katn-r004"
source_channel: "rollout"
analysis_version: 6
aliases: ["L0-katn-r004"]
is_a: ["rule"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 1556
tags: ["rule", "katana", "safe-position", "is_a:rule", "relates_to:L0-xasm19"]
level: 2
---
---
title: "R-katn-004: Safe standing cell"
is_a: ["rule"]
part_of: ["L0-katn"]
relates_to: ["L0-xasm19", "L0-adr-ktob", "L0-katn-ad01", "L0-katn-as01", "L0-katn-as03", "L0-katn-cx01"]
see_also: ["dragonkatanaspecv1ruen-part-2"]
---
**Rule.** A candidate feet cell `F` is safe when all of these hold:
1. **Fits** (`L0-katn-ad01`): the feet cell `F` and the head cell `F+up` are each free (air, water, or a block the column ray passes).
2. **Not a hazard** (`L0-katn-as03`): neither cell is lava, fire or soul fire. A powder-snow, sweet-berry or magma *floor* is allowed: the spec forbids only suffocation and walls.
3. **Owner's side**: the centre of `F` is on the head's side of the hit-face plane, when there was a hit.
4. **Reachable**: a clear ray (same flags) runs from `H` to the centre of the head cell of `F`.
5. **In range**: `|centre(F) + (0,1.62,0) − H| ≤ 20`.

**Order** (`L0-xasm19`, nearest first): the desired feet cell; then cells back along the ray in 0.5-block steps; at each step the offsets +1 and +2 up and ±1 to the side (perpendicular to `d` in the horizontal plane). The first safe one wins. The search stops at the player's own cell. Nothing safe → refusal: no teleport, no cooldown.

- **Placement.** Teleport to the cell centre (x+0.5, y, z+0.5). A 0.6-wide hitbox centred in a free cell cannot overlap the neighbouring full blocks.
- **Pose.** No crawling or lying pose is simulated; a standing 2-high fit is required (§6).
- **Air.** A cell in the air is a valid B (fall protection covers it).

Source: Katana §5, §6; T07, T09.

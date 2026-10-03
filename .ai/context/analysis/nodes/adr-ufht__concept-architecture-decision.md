---
type: "concept-architecture-decision"
node_id: "L0-adr-ufht"
source_channel: "rollout"
analysis_version: 4
title: "ADR-L0-ufht · Saucer flight height cap"
aliases: ["L0-adr-ufht"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 580
size_chars: 1550
tags: ["v4", "status:accepted", "ufo", "relates_to:L0-sauc", "relates_to:L0-ufoc", "relates_to:L0-orbc", "relates_to:L0-sauc-cx01", "relates_to:L0-sauc-r002", "relates_to:L0-adr-ufoi"]
level: 2
---
---
title: "ADR-L0-ufht · Saucer flight height is capped at ceiling − 4 on every leg, so every phase is shootable"
aliases: ["L0-adr-ufht"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-sauc", "L0-ufoc", "L0-orbc", "L0-sauc-cx01", "L0-sauc-r002", "L0-sauc-r001", "L0-adr-ufoi"]
status: accepted
resolves: ["L0-sauc-cx01"]
---
# ADR-L0-ufht · Saucer flight height cap

**Context (`L0-sauc-cx01`).** This spans three nodes:
- `ufoc` caps `hoverY` at ceiling − 15.
- `sauc` flies arrival and departure at `hoverY + 10`.
- Shipped `orbc` spawns charges at ≤ `heightRange.max − 1`.

With a centre at Y ≥ 276, the arrival and departure legs run above the build limit, where no charge can reach them. That breaks AC-15 ("in any phase"). The saucer would also be teleported above the build limit, which has not been probed.

**Decision.** This is option (a) of `sauc-cx01`.
- Arrival and departure fly at `min(hoverY + 10, ceiling − 4)`.
- `hoverY` itself stays `ufoc`'s value (centre + 40, capped at ceiling − 15).
- `sauc-r002` was amended in place.
- `orbc` is unchanged: option (c) would break the additive-only stance of `L0-adr-ufoi`.

**Out of scope.** The positional limit is not a phase limit and is not a defect. A charge spawns at target + 60, so on ordinary terrain the arrival hull at centre + 50…53 is reachable only from targets no lower than about 7 blocks below the centre.

**For the `ufoc` re-run.** The hover cap and the leg cap use the same `ceiling` (the Overworld `heightRange.max`). `sauc` never recomputes `hoverY`.

---
type: "concept-rule"
node_id: "L0-sauc-r001"
source_channel: "rollout"
analysis_version: 5
title: "R-sauc-1 · Hull hit test: a charge's swept segment against a cylinder of r 6 × h 3, in any phase"
aliases: ["L0-sauc-r001"]
is_a: ["rule"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 1416
tags: ["is_a:rule", "hull", "shoot-down", "relates_to:L0-sauc-as01", "relates_to:L0-adr-ufoi"]
level: 2
---
# R-sauc-1 · Hull hit test: a charge's swept segment against a cylinder of r 6 × h 3, in any phase

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["rule"]` · `relates_to: ["L0-sauc-p002", "L0-sauc-p003", "L0-sauc-as01", "L0-adr-ufoi"]`

**Rule.** A charge hits the saucer in a tick when all of the following hold:
1. `attack.dimensionId` is the Overworld.
2. The horizontal distance between the charge column `(x, z)` and the saucer position `(sx, sz)` **in that tick** is ≤ 6.0.
3. The vertical segment `[to.y, from.y]` swept this tick overlaps the hull band `[sy, sy + 3]`, closed at both ends (`as01`).

The test holds in every phase while the saucer entity exists: arrival, magnet, departure, and the downed fall (`as05`).

**Why a segment.** Charges fall 1 block per tick, so a point test at the charge position could miss nothing at today's speed. But `FALL_SPEED` is a tunable, and the sweep keeps the test exact at any speed, the same way the block-contact sweep does.

**Saucer position.** The test uses the position the saucer holds when the flight loop runs. The order of `ufoc`'s interval relative to the orbital interval is not fixed. A ≤ 0.225 block-per-tick lag during arrival is accepted: the hull edge tolerance is effectively ±0.25.

**Not a hit:**
- A charge column at a horizontal distance greater than 6.
- A charge whose whole fall lies above or below the band.
- Charges in the Nether or the End.

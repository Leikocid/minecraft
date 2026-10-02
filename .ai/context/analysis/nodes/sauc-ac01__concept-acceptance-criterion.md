---
type: "concept-acceptance-criterion"
node_id: "L0-sauc-ac01"
source_channel: "rollout"
analysis_version: 5
title: "AC-sauc-1 (bds · UFO AC-2, path half) · The saucer comes in from 90 blocks, hovers at the centre + 40, and leaves 90 blocks the opposite way"
aliases: ["L0-sauc-ac01"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 1196
tags: ["is_a:acceptance-criterion", "channel:bds", "UFO-AC-2", "relates_to:L0-sauc-r002", "relates_to:L0-sauc-p001"]
level: 2
---
# AC-sauc-1 (bds · UFO AC-2, path half) · The saucer comes in from 90 blocks, hovers at the centre + 40, and leaves 90 blocks the opposite way

**GIVEN**
- a flat Overworld test area with a `tickingarea` covering 100 blocks around the centre (`as04`);
- 2 simulated players (C-20′);
- `/andrew:ufo come` (or the `ufoc` test seam) at real phase durations.

**WHEN** the event runs to its end.

**THEN**
- At the spawn tick, exactly one `andrew:ufo_saucer` exists:
  - horizontal distance from the centre = 90 ± 0.5;
  - y = `hoverY` + 10 ± 0.1.
- At arrival + 400 ticks, the saucer is within 0.1 of `(centre.x + 0.5, hoverY, centre.z + 0.5)`, with `hoverY` = centre.y + 40.
- It holds there through the magnet.
- At release + 300 ticks:
  - the last sampled position is 90 ± 0.5 horizontal on the bearing opposite the spawn (the dot product of the unit bearings ≤ −0.99);
  - in the next tick no `andrew:ufo_saucer` exists.
- On every sampled tick, the horizontal distance is ≤ 100 and the step between ticks is ≤ 0.5.
- The saucer stays valid for the whole ~95 s.

**Negative control:** the same scenario with the departure leg forced to the same bearing must fail the opposite-bearing assertion.

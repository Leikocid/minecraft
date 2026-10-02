---
type: "concept-assumption"
node_id: "L0-magn-asfl"
source_channel: "rollout"
analysis_version: 5
title: "magn-asfl · Elements fly to their ring slot at ≤ 1.5 blocks per tick"
aliases: ["L0-magn-asfl"]
is_a: ["assumption"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 675
tags: ["is_a:assumption", "CAN_ASSUME", "status:assumed", "relates_to:L0-magn-phld"]
level: 2
---
# magn-asfl · Elements fly to their ring slot at ≤ 1.5 blocks per tick

**Assumption.**
- The spec sets 0.6 blocks per tick for **players** only. For elements it says just "fly to their places".
- Ore can sit 60 blocks below the ring (centre − 20 → hover − 3), and the zone edge is ~50 blocks away horizontally.
- At 1.5 blocks per tick, the worst path of ~80 blocks takes ~2.7 s, about 5 % of the 60 s magnet. The flight is still visible on iPad as a stream rising into the cloud.

**Impact if wrong.**
- If the speed is too slow, far elements arrive late and look sluggish.
- If it is instantaneous, the "flying" visual is lost (the iPad DoD).
- Only one constant changes.

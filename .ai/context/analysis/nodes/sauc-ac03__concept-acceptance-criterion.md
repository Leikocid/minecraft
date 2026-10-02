---
type: "concept-acceptance-criterion"
node_id: "L0-sauc-ac03"
source_channel: "rollout"
analysis_version: 5
title: "AC-sauc-3 (bds · UFO AC-15) · A Cannon charge through the hull shoots the saucer down in any phase"
aliases: ["L0-sauc-ac03"]
is_a: ["acceptance-criterion"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 2208
tags: ["ufo", "shoot-down", "bds", "orbital-v1.4.4"]
level: 2
---
# AC-sauc-3 (bds · UFO AC-15) · A Cannon charge through the hull shoots the saucer down in any phase

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-sauc-r001", "L0-sauc-r004", "L0-sauc-p002", "L0-sauc-as05", "L0-sauc-as06", "L0-orbc", "L0-ring"]`

**GIVEN**
- 2 simulated players: shooter A on the ground, and B, held by the magnet with an iron ingot.
- A aims at a ground block whose column is ≤ 6 from the saucer axis. The block is ≤ 25 from A's eye, and **≥ 7 for RMB** (Orbital v1.4.4, `RING_MIN_RANGE`; a nearer RMB aim is refused silently and would leave the scenario with nothing to test).
- Block snapshots of the 13 × 13 column under the saucer and of 8 blocks around the blast point.

**WHEN** A fires once per phase (arrival, magnet, departure) and once per mode (LMB, RMB). The phases need separate scenarios; the modes can be parametrised.

**THEN**
- Every charge whose column is ≤ 6 from the axis ends `"intercepted"`, with no column or ring effect. For RMB that is the centre plus the ring-3.5 columns inside the hull (`as06`), counted through `observeChargeEnds`.
- On the same tick, `ufoc` is released and B and the pulled items start falling (magnet phase only).
- The saucer descends for ≤ 60 ticks, then it is gone.
- At the blast:
  - **LMB:** no block in either snapshot changed.
  - **RMB:** the RMB columns outside the hull detonate normally at their ring power (7 → 2, 10.5 and 14 → 1). Ring 7's craters reach into the 13 × 13 snapshot. So for RMB the check is a diff of the 8-block blast area from the tick before the blast to the tick after it, plus "no `onDetonate` for an intercepted offset".
  - No player's health drops **in the blast tick**.
  - Exactly 8 `diamond` and 1 `totem_of_undying` item entities appear within 2 blocks of the blast point.
- One `andrew.ufo.shot_down` message with A's name reaches both A and B.
- `ufoc`'s next arrival = shot time + 15 min ± 1 s.

**Sub-cases:**
- *Two charges cross in one tick* (an RMB salvo does this): one reward, one broadcast.
- *An LMB charge 7 from the axis*: no shoot-down, and a normal detonation.
- *A charge crossing during the fall*: absorbed, with no second reward (`as05`).

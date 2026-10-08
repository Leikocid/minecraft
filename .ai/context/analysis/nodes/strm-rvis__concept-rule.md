---
type: "concept-rule"
node_id: "L0-strm-rvis"
source_channel: "rollout"
analysis_version: 8
title: "Rule: spectacle never acts (C-30)"
aliases: ["L0-strm-rvis"]
is_a: ["rule"]
part_of: ["L0-strm"]
relates_to: ["L0-strm"]
priority: 620
size_chars: 1122
tags: ["v8", "storm-blade", "visuals", "C-30", "deviation"]
level: 2
---
---
title: "Storm visuals are particles and sound only"
is_a: ["rule"]
part_of: ["L0-strm"]
relates_to: ["L0-adr-sblt", "L0-strm-pprb"]
---
# Rule: spectacle never acts (C-30)

- No `minecraft:lightning_bolt` is spawned or summoned, and the id does not appear in `src/storm/`. A grep check enforces this.
- A **strike** is a vertical column (~6 blocks above the point down to the point) of spark and flash particles from the P4 list, plus `ambient.weather.lightning.impact` at the point.
  - The active plays **3** strikes, staggered ≤ 6 ticks.
  - The passive plays **1**.
- The **trace** is wind and spark particles every ~0.5 block from the eye to the hit or stop point. It is drawn once.
- Visuals cause no damage, fire, knockback, mob conversion or block change. They add no entity, so the entity count in the test volume is unchanged.
- The work is scheduled on the shared `runInterval` (memory: `runJob` stalls). There is no work after the last strike (C-5f analogue).
- The deviation "lightning drawn with particles, not a vanilla bolt" is recorded under C-16 in the deviations doc. Spec §05 explicitly allows it.

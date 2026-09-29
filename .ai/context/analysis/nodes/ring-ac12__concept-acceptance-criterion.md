---
type: "concept-acceptance-criterion"
node_id: "L0-ring-ac12"
source_channel: "rollout"
analysis_version: 3
aliases: ["L0-ring-ac12"]
is_a: ["acceptance-criterion"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 747
tags: ["is_a:acceptance-criterion", "verify:bds", "orbital-ac:12", "relates_to:L0-ring-r003", "relates_to:L0-ring-ad02"]
level: 2
---
**AC-ring-12 · The charges are independent, and every one explodes separately** (Orbital AC-12; `r003`) · **verify: bds**

GIVEN a stepped target: the half of the ring footprint with x < 0 is raised 6 blocks, so the inner charges land 6 ticks or more before the outer ones. WHEN RMB is fired, THEN:
- each charge's x and z never change during its flight: it is sampled every tick, and the tolerance is 0.001;
- no charge is removed before its own contact tick, as `orbc` reports;
- the number of `createExplosion` calls equals the number of charges that detonated, and is never merged;
- `report.maxBlastsInTick` ≤ 48.

Run it again with a spy on `createExplosion`: the call count per attack equals `layout().length` minus voided and lost charges.

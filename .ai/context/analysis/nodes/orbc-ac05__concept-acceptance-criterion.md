---
type: "concept-acceptance-criterion"
node_id: "L0-orbc-ac05"
source_channel: "rollout"
analysis_version: 5
title: "AC-5 · A charge spawned inside a solid block detonates at once `[bds]`"
aliases: ["L0-orbc-ac05"]
is_a: ["acceptance-criterion"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 611
tags: ["is_a:acceptance-criterion", "channel:bds", "orbital-ac-5", "relates_to:L0-orbc-r008"]
level: 2
---
# AC-5 · A charge spawned inside a solid block detonates at once `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r008", "L0-orbc-p002"]`

**GIVEN**
- a stone block placed exactly at the computed spawn cell (T.y + 60; Nether T.y + 10) above target T;
- the stub effect, which records `(point, tick)`.

**WHEN** P fires at T.

**THEN**
- `onDetonate` is called once, in the activation tick, with `point` equal to the stone block's location.
- No charge entity remains one tick later.
- A control run with air at the spawn cell detonates at T (the top contact) after ≥ 1 tick.

---
type: "concept-acceptance-criterion"
node_id: "L0-orbc-ac07"
source_channel: "rollout"
analysis_version: 5
title: "AC-orbc-07 · A charge falling into the Void vanishes with no effect and keeps the cooldown `[bds]`"
aliases: ["L0-orbc-ac07"]
is_a: ["acceptance-criterion"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 686
tags: ["is_a:acceptance-criterion", "channel:bds", "relates_to:L0-orbc-r009"]
level: 2
---
# AC-orbc-07 · A charge falling into the Void vanishes with no effect and keeps the cooldown `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r009", "L0-orbc-r005"]`

**GIVEN**
- In the End: a single block T at y = 60 with nothing below it.
- The test calls the core's `spawnCharge` hook directly at a column offset one block beside T, so the column is empty down to `heightRange.min`.

**WHEN** the charge falls.

**THEN**
- No `onDetonate` is called.
- The entity is gone once its Y would pass below `heightRange.min`.
- P's cooldown remaining is still greater than 0.
- No `andrew:orbital_charge` entity remains in the dimension.

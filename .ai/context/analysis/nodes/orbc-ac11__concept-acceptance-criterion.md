---
type: "concept-acceptance-criterion"
node_id: "L0-orbc-ac11"
source_channel: "rollout"
analysis_version: 5
title: "AC-orbc-11 · No leftovers and no idle loop `[bds]`"
aliases: ["L0-orbc-ac11"]
is_a: ["acceptance-criterion"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 857
tags: ["is_a:acceptance-criterion", "channel:bds", "relates_to:L0-orbc-p003", "C-19", "C-5a"]
level: 2
---
# AC-orbc-11 · No leftovers and no idle loop `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-p003", "L0-orbc-p002", "L0-orbc-ad02"]`

**GIVEN** three players each fire RMB in the same tick, using a stub `ring.layout` that returns `STUB_RMB_COLUMNS` = 160 (not the real 201) columns.

**THEN**
- 480 charges exist in the spawn tick.
- Once every charge has detonated or voided, the count of `andrew:orbital_charge` is 0, and the core's registry holds 0 attacks.
- The job handle is released. `system.clearJob` was reached, or the generator returned.
- The mean added script time per tick while the charges are live stays within the budget `ring` publishes (C-5a′). It is measured with `system.currentTick` deltas against a control run.
- A world startup with a pre-placed `andrew:orbital_charge`, left over from a crash, removes it within 1 s.

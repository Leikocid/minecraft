---
type: "concept-assumption"
node_id: "L0-ring-as08"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ring-as08"]
is_a: ["assumption"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 661
tags: ["is_a:assumption", "CAN_ASSUME", "relates_to:L0-ring-r010", "relates_to:L0-orbc-r014"]
level: 2
---
**ASM-ring-08 · The blast centre is the cell above the contact block**

**Assumption.** A landed charge explodes as if it were TNT resting on the contact block, with its centre at `point + (0.5, 1.5, 0.5)`. It uses `point` itself only when the cell above is solid (`r010`). §10 says only "falls to the first block". The resting position is the natural reading, and it matches what the iPad player sees: the TNT touches the ground, then explodes.

**Impact if wrong.** If the blast is meant to be *in* the contact block, the craters come out ~1 block deeper and the seabed checks move one cell down. It is a one-line change in `r010`, with no effect on budgets.

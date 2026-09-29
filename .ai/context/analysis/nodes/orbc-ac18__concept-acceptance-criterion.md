---
type: "concept-acceptance-criterion"
node_id: "L0-orbc-ac18"
source_channel: "rollout"
analysis_version: 3
title: "AC-18 · The owner dying, logging out or changing dimension does not cancel charges `[bds]`"
aliases: ["L0-orbc-ac18"]
is_a: ["acceptance-criterion"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 730
tags: ["is_a:acceptance-criterion", "channel:bds", "orbital-ac-18", "relates_to:L0-orbc-r010"]
level: 2
---
# AC-18 · The owner dying, logging out or changing dimension does not cancel charges `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r010", "L0-orbc-p003"]`

**GIVEN**
- P fires RMB at a target 1 block high with the stub effect, so the fall is about 30 ticks.
- Observer Q stands near the target and keeps the area loaded.

**WHEN**, in three separate runs, P is killed, disconnected, or teleported to the Nether one tick after firing.

**THEN**
- In every run, every charge reaches `onDetonate`, at the same points as a control run where P does nothing.
- The ownerId passed equals P's id.
- The detonations happen in the Overworld.
- No charge appears in P's new dimension.

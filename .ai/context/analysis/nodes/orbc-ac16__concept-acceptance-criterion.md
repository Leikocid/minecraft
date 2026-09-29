---
type: "concept-acceptance-criterion"
node_id: "L0-orbc-ac16"
source_channel: "rollout"
analysis_version: 3
title: "AC-16 · The shared 30 s cooldown starts at once and blocks both modes `[bds]`"
aliases: ["L0-orbc-ac16"]
is_a: ["acceptance-criterion"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 788
tags: ["is_a:acceptance-criterion", "channel:bds", "orbital-ac-16", "relates_to:L0-orbc-r005", "C-20"]
level: 2
---
# AC-16 · The shared 30 s cooldown starts at once and blocks both modes `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r005", "L0-orbc-r006"]`

**GIVEN** two SimulatedPlayers, P and Q, each holding a Cannon with no cooldown, and a target within 10.

**WHEN** P fires RMB at tick t.

**THEN**
- In tick t, before any charge has moved, P's `remainingTicks` is between 599 and 600.
- At t+20, P's LMB and RMB each create **no** new charge, and the charge count is unchanged.
- At t+20, Q's RMB succeeds. Q's cooldown is independent (C-20).
- At t+600, P's LMB succeeds.
- Reverse order: the first shot is LMB, and RMB is blocked.
- The cooldown is set even if the charge later voids or its chunk unloads (covered by `ac07` and `ac19`).

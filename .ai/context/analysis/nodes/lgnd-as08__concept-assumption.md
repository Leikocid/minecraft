---
type: "concept-assumption"
node_id: "L0-lgnd-as08"
source_channel: "rollout"
analysis_version: 1
aliases: ["L0-lgnd-as08"]
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 384
tags: ["assumption", "CAN_ASSUME", "busy", "hand-priority"]
level: 2
---
**ASM-lgnd-08: "Main hand on cooldown" (Scythe §6) also covers "main hand busy".**

So while a Scythe volley is in flight, a ready off-hand Web Sword fires on the next Use press.

**Impact if wrong:** if busy should swallow the press instead, one condition in `L0-lgnd-p004` changes and ac05's busy variant flips. In gameplay terms, the player could not web-trap a target mid-volley.

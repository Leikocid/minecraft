---
type: "concept-architecture-decision"
node_id: "L0-ufoc-ad03"
source_channel: "rollout"
analysis_version: 5
title: "ADR-ufoc-3 · The in-flight marker lives inside `andrew:ufo_next_ms` (value 0)"
aliases: ["L0-ufoc-ad03"]
is_a: ["architecture-decision"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 1452
tags: ["is_a:architecture-decision", "restart", "C-23", "status:accepted", "relates_to:L0-ufoc-cx01", "relates_to:L0-adr-ufom"]
level: 2
---
# ADR-ufoc-3 · The in-flight marker lives inside `andrew:ufo_next_ms` (value 0)

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-ufoc-cx01", "L0-adr-ufom", "L0-ufoc-ent1", "L0-ufoc-p003"]`

**Status: accepted** at reduce v5 (`L0-adr-ufrs`, which resolves `L0-ufoc-cx01`).

**Context.**
- UFO §10: after a restart mid-event, the next arrival is 15 min after the restart.
- To know at load that an event was in flight, something must survive the restart.
- `L0-adr-ufom` §2 and C-23 allow exactly two durable properties. `adr-ufom` §4 read a transient `andrew:ufo_active` flag, which could only work if it were durable; `L0-adr-ufrs` amends it.

**Decision.**
- At arrival start, `ufoc` writes `next_ms = 0`. Every end path overwrites it with now + 15 min.
- At `worldLoad`, a value of `0` means the event was interrupted, so `next_ms` = now + 15 min (`p003`).
- `0` cannot collide with a real epoch value or with the "absent → first join" state.

**Why not past-due inference?**
- A due `next_ms` with no session also happens while the event waits for an Overworld player.
- A restart in that state must not add 15 min. It should fire as soon as a player is in the Overworld.

**Rejected.**
- A third durable property `andrew:ufo_active`. It works, but contradicts C-23's "only the schedule and the enable flag".
- Writing `next_ms = start + 95 s + 15 min` at arrival start. After a restart that fires sooner than "15 min after the restart".

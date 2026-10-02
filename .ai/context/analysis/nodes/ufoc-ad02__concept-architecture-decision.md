---
type: "concept-architecture-decision"
node_id: "L0-ufoc-ad02"
source_channel: "rollout"
analysis_version: 5
title: "ADR-ufoc-2 · One period-1 `runInterval` with an idle divider"
aliases: ["L0-ufoc-ad02"]
is_a: ["architecture-decision"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 1292
tags: ["is_a:architecture-decision", "performance", "C-5d", "relates_to:L0-adr-ufom", "relates_to:L0-ufoc-r004"]
level: 2
---
# ADR-ufoc-2 · One period-1 `runInterval` with an idle divider

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-adr-ufom", "L0-ufoc-r004", "L0-ufoc-p002"]`

**Context.** `L0-adr-ufom` §3 wants two cadences: a clock check every 100 ticks while idle, and every tick with a saucer. C-5d wants one shared interval. `runInterval` cannot change its period.

**Decision.**
- `registerUfo` creates exactly one `system.runInterval(step, 1)` at load.
- `step` keeps a counter:
  - with no session, it returns unless `counter % 100 === 0`, and then runs the idle check (`p001`);
  - with a session, it runs `p002` every tick.
- The idle cost is one modulo and one branch per tick.

**Rejected.**
- Clearing the interval and re-creating it at a different period on each transition. That means two creation paths and a risk of leaking a duplicate interval, and it breaks "one shared interval" during the hand-over tick.
- A 100-tick interval plus a second 1-tick interval while active. That is two intervals, which C-5d rules out.
- `runJob` for the active phase. Its start stalls the next tick by 15–30 ms (measured).

**Note for tests:** GameTest continuations run before intervals within a tick, so phase-duration assertions measure from the continuation tick.

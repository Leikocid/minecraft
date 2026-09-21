---
type: "concept-rule"
node_id: "L0-once-r004"
source_channel: "rollout"
aliases: ["L0-once-r004"]
part_of: ["L0-once"]
is_a: ["rule"]
relates_to: ["L0-once"]
analysis_version: 2
level: 2
priority: 510
size_chars: 1548
tags: ["rule","concurrency","race","multiplayer","C-5","L0-once"]
---

**R-004 — Simultaneous crafts by two players yield exactly one success.**

Source: §9 — *«Два игрока не должны иметь возможность обойти one-per-world crafting из-за одновременного крафта.»* · C-5 (dedicated-multiplayer safety).

When two or more players complete a Web Sword craft in the same tick or in adjacent ticks:

- **Exactly one** claims the flag, keeps the sword, and triggers the announcement.
- **All others** are treated as blocked second crafts and follow `L0-once-pblk`.
- Which one wins is **unspecified and need not be fair** — the spec requires only that the gate cannot be bypassed. First-observed wins.

**Mechanism.** The flag read and the flag write must occur in a single synchronous handler invocation with no `await`, no promise, no `runTimeout` and no deferral between them. The Bedrock script host runs one event handler to completion before dispatching the next, so an uninterrupted read-check-write *is* the atomic claim (ASM-015, ADR-011). Introducing any asynchrony into that window re-opens the race.

**Anti-pattern to reject in review:** reading the flag in one handler and writing it from a queued callback, a `system.run`, or after an `await`. It will pass every single-player test and fail only under real concurrency — exactly the case C-5 says must be tested on BDS rather than in a single-player world.

**Rationale.** C-7 states "no known dup paths" absolutely. A craft race is the cheapest dup path in the design and the one a coordinated pair of players will find first.

**Verified by:** `L0-once-accp5`.

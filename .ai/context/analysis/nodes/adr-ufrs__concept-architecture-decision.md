---
type: "concept-architecture-decision"
node_id: "L0-adr-ufrs"
source_channel: "rollout"
analysis_version: 5
level: 1
title: "ADR-L0-ufrs · The restart in-flight marker lives inside `andrew:ufo_next_ms`"
aliases: ["L0-adr-ufrs"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 580
size_chars: 2909
tags: ["v5", "status:accepted", "ufo", "restart", "C-23", "resolves:L0-ufoc-cx01", "amends:L0-adr-ufom", "relates_to:L0-ufoc", "relates_to:L0-sauc", "relates_to:L0-magn", "relates_to:L0-adr-ufom", "relates_to:L0-ufoc-ad03", "relates_to:L0-ufoc-cx01", "relates_to:L0-xcx17"]
---
---
title: "ADR-L0-ufrs · The restart in-flight marker is `andrew:ufo_next_ms = 0`; `L0-adr-ufom` §4 is amended and C-23 stays at two durable properties"
aliases: ["L0-adr-ufrs"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-ufoc", "L0-sauc", "L0-magn", "L0-adr-ufom", "L0-ufoc-ad03", "L0-ufoc-cx01", "L0-ufoc-p003", "L0-ufoc-ac03", "L0-xcx17", "L0-xasm17"]
requires: ["L0-adr-ufom"]
resolves: ["L0-ufoc-cx01"]
status: accepted
---
# ADR-L0-ufrs · The restart in-flight marker lives inside `andrew:ufo_next_ms`

**Context (`L0-ufoc-cx01`).**
- `L0-adr-ufom` §2 and C-23 allow exactly two durable world properties: `andrew:ufo_next_ms` and `andrew:ufo_enabled`.
- `L0-adr-ufom` §4 says that at world load, `next_ms` becomes now + 15 min "if an event had been running, recorded by a transient `andrew:ufo_active` flag".
- A value read at load must have been written before the restart. So that flag is either durable, which breaks §2 and C-23, or in memory, which makes it always false at load. In the second case UFO §10 ("the next arrival is 15 min after a restart") never applies.
- `ufoc` proposed option (a) as its autopilot default and left the decision to L0, because the fix amends an L0 ADR.

**Decision.** Option (a), as written in `L0-ufoc-ad03`, which is now **accepted**:
1. When an arrival starts, `ufoc` writes `next_ms = 0`. Every way an event ends (departure, `downed`, `stop`, `abort`) overwrites it with now + 15 min.
2. At `worldLoad`, `next_ms === 0` means an event was interrupted, so it is rewritten to now + 15 min (`L0-ufoc-p003` step 3).
3. **`L0-adr-ufom` §4 is amended** to: "…then `next_ms` is set to now + 15 min if it holds the in-flight marker `0` (`L0-adr-ufrs`)." There is no `andrew:ufo_active` property, in memory or durable.
4. C-23 and `L0-adr-ufom` §2 are unchanged. The durable state is still the schedule and the enable flag. The marker is a reserved value of the schedule, not a third property.

**Why (a).**
- C-23 holds literally, and no L0 constraint text changes.
- `0` cannot clash with a real epoch value or with the "absent → first join" state (`L0-xasm14`).
- Past-due inference (option "no marker") is wrong. A due `next_ms` with no session also happens while the event waits for an Overworld player, and a restart in that state must not add 15 min (`L0-ufoc-ad03`).

**Rejected.**
- (b) A third durable property `andrew:ufo_active`. It works, but it costs an amendment to C-23 for no behavioural gain.
- (c) Dropping the rule. That breaks UFO §10.

**Consequences.**
- `sauc` and `magn` are not affected. Neither one reads or writes the schedule.
- The proof is `L0-ufoc-ac03` case 2: seed `next_ms = 0`, restart on the checks instance (19136), and assert `next_ms` ∈ [load + 900 000, load + 905 000]. Its red proof is a build without the load-time marker branch. It counts as "automated on BDS" under the still-open reading of `L0-xcx17`.

---
type: "concept-assumption"
node_id: "L0-sauc-as05"
source_channel: "rollout"
analysis_version: 5
title: "AS-sauc-5 · The hull keeps absorbing charges during the downed fall; the interceptor is removed only at the blast"
aliases: ["L0-sauc-as05"]
is_a: ["assumption"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 833
tags: ["is_a:assumption", "CAN_ASSUME", "shoot-down", "relates_to:L0-sauc-r001", "relates_to:L0-sauc-r004", "relates_to:L0-adr-ufoi"]
level: 2
---
# AS-sauc-5 · The hull keeps absorbing charges during the downed fall; the interceptor is removed only at the blast

**Assumption.**
- §8 says "any phase — arrival, magnet or departure". It is silent on the 3 s fall after a shoot-down.
- `L0-adr-ufoi` already accepts that one RMB salvo can lose several charges to a hull.
- Reading: while the saucer entity exists, including the fall, a crossing charge is absorbed (no ring or column effect) but does not re-trigger (`r004` latch).
- The interceptor is unregistered in the blast tick.

**Impact if wrong.**
- If the client expects charges to pass through a falling wreck, a salvo fired right after the shoot-down loses its effect on the cells under the wreck.
- The change is one condition: `downed` makes the interceptor return `false`. `ac03` has a sub-case pinned to this choice.

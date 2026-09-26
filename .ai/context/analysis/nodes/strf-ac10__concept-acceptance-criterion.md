---
type: "concept-acceptance-criterion"
node_id: "L0-strf-ac10"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-strf-ac10"]
is_a: ["acceptance-criterion"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 500
tags: ["is_a:acceptance-criterion", "verify:bds", "performance", "C-5b"]
level: 2
---
**AC-strf-10 · The tick budget holds under exploration** (`L0-strf-p005`)

GIVEN 2 players flying in straight lines at elytra speed through fresh terrain for 5 minutes with all four defs registered, WHEN `strf` runs, THEN: no server tick exceeds 50 ms because of `strf` (per `Date.now()` instrumentation in the job); the discovery interval does 0 block reads; the job is idle (not scheduled) whenever the queue is empty; the BDS log has no watchdog / "script took too long" warnings.
**Verify:** bds.

---
type: "concept-acceptance-criterion"
node_id: "L0-ufoc-ac03"
source_channel: "rollout"
analysis_version: 5
title: "AC-ufoc-3 · UFO AC-1 (the timer survives a restart) and AC-17 (`disable` persists), `bds-check` restart scenario"
aliases: ["L0-ufoc-ac03"]
is_a: ["acceptance-criterion"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 979
tags: ["is_a:acceptance-criterion", "ufo-ac-1", "ufo-ac-17", "channel:bds", "bds-check-restart", "relates_to:L0-xcx17", "relates_to:L0-ufoc-ad03"]
level: 2
---
# AC-ufoc-3 · UFO AC-1 (the timer survives a restart) and AC-17 (`disable` persists), `bds-check` restart scenario

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-xcx17", "L0-xasm13", "L0-ufoc-ad03", "L0-ufoc-r006"]`

These run on the checks instance (19136), never on production or QA. They are counted as "automated on BDS" pending `L0-xcx17`.

**Case 1: pause.**
- GIVEN: seed `next_ms = T` in the future.
- WHEN: restart the server.
- THEN: a selftest probe reads `next_ms === T`.

**Case 2: in flight.**
- GIVEN: seed `next_ms = 0`.
- WHEN: restart.
- THEN: `next_ms` ∈ [load time + 900 000, load time + 900 000 + 5 000].

**Case 3: disabled.**
- GIVEN: run `/andrew:ufo disable` as op, and seed `next_ms` in the past.
- WHEN: restart.
- THEN: `andrew:ufo_enabled === false`, and no `andrew:ufo` entity has appeared after 200 ticks with a player connected.

**Red proof.** A build without the load-time marker handling fails case 2.

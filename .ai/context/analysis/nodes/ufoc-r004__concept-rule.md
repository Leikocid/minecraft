---
type: "concept-rule"
node_id: "L0-ufoc-r004"
source_channel: "rollout"
analysis_version: 5
title: "R-ufoc-4 · One event, Overworld only, one interval, fixed tick order"
aliases: ["L0-ufoc-r004"]
is_a: ["rule"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 1186
tags: ["is_a:rule", "invariant", "C-5d", "relates_to:L0-adr-ufpc", "relates_to:L0-ufoc-ad02"]
level: 2
---
# R-ufoc-4 · One event, Overworld only, one interval, fixed tick order

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["rule"]` · `relates_to: ["L0-adr-ufpc", "L0-adr-ufom", "L0-ufoc-ad02", "L0-ufoc-p002"]`

**Rule** (UFO §2, §11; C-5d; AC-3):
1. At most one session, and therefore at most one saucer, exists in the world. An arrival never starts while a session exists, from the schedule or from `come`.
2. The event exists only in the Overworld. The centre, the saucer and the zone are always in `minecraft:overworld`. Players in the Nether or the End are never candidates and never make an arrival start.
3. All UFO world mutation runs inside the one UFO `runInterval`:
   - phase changes;
   - the saucer step;
   - the magnet scan, hold and release.

   The only exception is `sauc`'s charge absorption inside `orbc`'s step (`adr-ufpc`).
4. `ufoc`, `sauc` and `magn` create no `runTimeout`, no `runJob` and no second interval. The command defers its work through one `system.run` (`p004`).
5. Order within a tick: latch → liveness → advance phase → `saucerStep` → `magnetStep`.
6. With no session, a tick costs one counter check, and the clock and properties are read every 100 ticks.

---
type: "concept-process"
node_id: "L0-ufoc-p001"
source_channel: "rollout"
analysis_version: 5
title: "P-ufoc-1 · Schedule and arrival trigger"
aliases: ["L0-ufoc-p001"]
is_a: ["process"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 1832
tags: ["is_a:process", "schedule", "relates_to:L0-ufoc-r001", "relates_to:L0-ufoc-r002", "relates_to:L0-xasm14"]
level: 2
---
# P-ufoc-1 · Schedule and arrival trigger

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["process"]` · `relates_to: ["L0-ufoc-ent1", "L0-ufoc-r001", "L0-ufoc-r002", "L0-ufoc-r006", "L0-xasm14"]`

**First join.** On `playerSpawn` with `initialSpawn`, if `andrew:ufo_next_ms` is absent, `ufoc` writes `next_ms = now() + U(600 000, 1 200 000)` (`L0-xasm14`). A spawn while `next_ms` is present changes nothing.

**Idle check.** This runs inside the shared interval, every 100th tick, with no session (`ad02`):
1. If `enabled === false`, return.
2. If `next_ms` is absent or `0`, return. A value of `0` without a session cannot happen after `p003`.
3. If `now() < next_ms`, return.
4. Read `env.overworldPlayers()`. This lists valid, live Overworld players only: unreadable sim-player entries and dead players are skipped (`r002`). If the list is empty, return. The arrival stays due and is retried on the next check (UFO §2, "waits").
5. **Start the arrival:**
   1. pick the target and centre (`r002`), and compute `hoverY` (`r003`);
   2. create the session (`ent2`) with a fresh `eventId`;
   3. write `next_ms = 0` (in-flight marker, `ad03`);
   4. call `onPhase("arrival", …)`. `sauc` spawns the saucer, 90 blocks out at the capped leg height;
   5. send the arrival notice (`r005`).

   From the next tick the interval runs at full rate (`p002`).

**End of event.** Every end path calls `endEvent(reason)`:
- the departure completes;
- the `downed` phase ends;
- `stop`;
- `abort`.

`endEvent` sends `onPhase("pause", …)`, drops the session and writes `next_ms = now() + PAUSE_MS`. For a shoot-down, `next_ms` is written at `reportShotDown` time (`adr-ufpc`). `endEvent` then leaves it as it is, so the 15 min run from the shot.

**`come` path** (`p004`): steps 4 and 5 with `source = command`. It skips the enable and time checks.

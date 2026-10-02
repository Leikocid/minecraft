---
type: "concept-rule"
node_id: "L0-ufoc-r001"
source_channel: "rollout"
analysis_version: 5
title: "R-ufoc-1 · Schedule timing"
aliases: ["L0-ufoc-r001"]
is_a: ["rule"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 1061
tags: ["is_a:rule", "schedule", "C-21", "relates_to:L0-ufoc-ent1", "relates_to:L0-ufoc-as03"]
level: 2
---
# R-ufoc-1 · Schedule timing

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["rule"]` · `relates_to: ["L0-ufoc-ent1", "L0-ufoc-p001", "L0-ufoc-as03", "L0-xasm14"]`

**Rule** (UFO §2, §8, §10; AC-1):
1. **First arrival** = first join + U[10, 20] min of real time. The draw is uniform and is made once, when `next_ms` is written.
2. **Next arrival** = the end of the departure + exactly 15 min. After a shoot-down, it is the shot + 15 min.
3. **Restart mid-event:** the next arrival is the restart + 15 min.
4. **Restart in a pause:** the stored `next_ms` holds, so the timer survives the restart.
5. **Due with no Overworld player:** the arrival waits and starts at the first check after such a player is present. Missed arrivals do not accumulate.
6. **Durable times** are epoch ms from `env.now()`, which is `Date.now` in the product. A tick count or `getAbsoluteTime` must never be used (C-21).

**Precision:** the idle check runs every 100 ticks, so an arrival may start up to 5 s late, or more under lag (`as03`). Phase durations are counted in ticks (`ad01`).

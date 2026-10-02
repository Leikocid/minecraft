---
type: "concept-acceptance-criterion"
node_id: "L0-ufoc-ac01"
source_channel: "rollout"
analysis_version: 5
title: "AC-ufoc-1 · UFO AC-1 (first-arrival window), GameTest on a scaled clock"
aliases: ["L0-ufoc-ac01"]
is_a: ["acceptance-criterion"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 758
tags: ["is_a:acceptance-criterion", "ufo-ac-1", "channel:bds", "gametest", "relates_to:L0-ufoc-r001", "relates_to:L0-ufoc-ad01"]
level: 2
---
# AC-ufoc-1 · UFO AC-1 (first-arrival window), GameTest on a scaled clock

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-ufoc-r001", "L0-ufoc-ad01", "L0-xasm14"]`

**GIVEN** a world where `andrew:ufo_next_ms` is absent, a core built on the scaled test clock, and the `random` stub returning 0, then 1, then 0.5,
**WHEN** a simulated Overworld player makes its first join and the test clock advances,
**THEN:**
- `next_ms` equals join + 600 000 for `random` 0, join + 1 200 000 for 1, and join + 900 000 for 0.5;
- no arrival starts before `next_ms`;
- the arrival starts within 100 ticks after the clock passes `next_ms`.

**Negative control:** a second `initialSpawn` while `next_ms` is present does not change it.

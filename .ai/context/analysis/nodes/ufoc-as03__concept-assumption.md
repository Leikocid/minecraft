---
type: "concept-assumption"
node_id: "L0-ufoc-as03"
source_channel: "rollout"
analysis_version: 5
title: "AS-ufoc-3 · \"Exactly 15 minutes\" allows the 5 s idle-check granularity"
aliases: ["L0-ufoc-as03"]
is_a: ["assumption"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 793
tags: ["is_a:assumption", "timing", "tolerance", "relates_to:L0-ufoc-r001", "relates_to:L0-ufoc-ac02"]
level: 2
---
# AS-ufoc-3 · "Exactly 15 minutes" allows the 5 s idle-check granularity

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-ufoc-r001", "L0-ufoc-ac02", "L0-ufoc-ad02"]`

**Assumed.**
- AC-1's "exactly 15 minutes" is met when the arrival starts within the next idle check after `next_ms`. That is [15 min, 15 min + 100 ticks], or about 5 s at 20 TPS.
- Phases count ticks (`ad01`), so under lag a 20 s arrival lasts more than 20 s of wall time. AC-2 is asserted in ticks: 400/1200/300.

**Impact if wrong.**
- If the operator wants second-exact arrivals, the idle divider drops to 20 ticks. That costs nothing measurable.
- If AC-2 is meant in wall seconds under lag, the phases would have to switch to ms deadlines, and the flight would jump. That reverses `ad01`.

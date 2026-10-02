---
type: "concept-acceptance-criterion"
node_id: "L0-ufoc-ac02"
source_channel: "rollout"
analysis_version: 5
title: "AC-ufoc-2 · UFO AC-1 (+15 min after a departure or shoot-down), GameTest on a scaled clock"
aliases: ["L0-ufoc-ac02"]
is_a: ["acceptance-criterion"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 820
tags: ["is_a:acceptance-criterion", "ufo-ac-1", "channel:bds", "gametest", "relates_to:L0-ufoc-p001", "relates_to:L0-ufoc-as03"]
level: 2
---
# AC-ufoc-2 · UFO AC-1 (+15 min after a departure or shoot-down), GameTest on a scaled clock

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-ufoc-p001", "L0-ufoc-p002", "L0-ufoc-as03", "L0-adr-ufpc"]`

**GIVEN** a live event on the scaled clock with a stub saucer, with short tick durations,
**WHEN**:
- (a) the departure completes;
- (b) the stub calls `reportShotDown` during the magnet phase;
- (c) `reportShotDown` is called twice with the same `eventId`;

**THEN:**
- (a) `next_ms` = the end tick's `now()` + 900 000;
- (b) `next_ms` = the shot's `now()` + 900 000, and `onPhase("release")` comes on the next UFO tick, not inside the caller;
- (c) the second call changes nothing;
- in every case the next arrival starts within 100 ticks after `next_ms`, and not before it.

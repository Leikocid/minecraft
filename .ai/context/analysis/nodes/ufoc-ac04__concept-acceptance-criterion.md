---
type: "concept-acceptance-criterion"
node_id: "L0-ufoc-ac04"
source_channel: "rollout"
analysis_version: 5
title: "AC-ufoc-4 · UFO AC-2 (timing half), GameTest with real durations"
aliases: ["L0-ufoc-ac04"]
is_a: ["acceptance-criterion"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 1000
tags: ["is_a:acceptance-criterion", "ufo-ac-2", "channel:bds", "gametest", "real-durations", "relates_to:L0-ufoc-p002", "relates_to:L0-ufoc-r003"]
level: 2
---
# AC-ufoc-4 · UFO AC-2 (timing half), GameTest with real durations

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-ufoc-p002", "L0-ufoc-r003", "L0-sauc-ac01"]`

**GIVEN** the product duration table (400/1200/300 ticks) and a recording stub consumer,
**WHEN** the event is started with `come` for a simulated player standing on a block at Y = c,
**THEN:**
- `onPhase` is called in the order arrival → magnet → release → departure → pause;
- the magnet starts 400 ± 1 ticks after arrival;
- the release and the departure start in the same tick, 1200 ± 1 ticks later;
- the pause comes 300 ± 1 ticks after that;
- every payload carries the same `eventId` and `hoverY = min(c + 40, 316)`;
- `saucerStep` is called on every active tick, and `magnetStep` only during the magnet phase, after `saucerStep`.

**Second case:** a platform at Y = 290 gives `hoverY = 316`.

The geometry half of AC-2 (90 blocks out, the saucer reaches the hover point) belongs to `sauc`.

---
type: "concept-acceptance-criterion"
node_id: "L0-ufoc-ac05"
source_channel: "rollout"
analysis_version: 5
title: "AC-ufoc-5 · UFO AC-3 (Overworld only, waits, one saucer) and AC-18 (no saucer after a restart)"
aliases: ["L0-ufoc-ac05"]
is_a: ["acceptance-criterion"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 1123
tags: ["is_a:acceptance-criterion", "ufo-ac-3", "ufo-ac-18", "channel:bds", "gametest", "bds-check-restart", "relates_to:L0-ufoc-r004", "relates_to:L0-ufoc-p003"]
level: 2
---
# AC-ufoc-5 · UFO AC-3 (Overworld only, waits, one saucer) and AC-18 (no saucer after a restart)

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-ufoc-r004", "L0-ufoc-p003", "L0-xasm17"]`

**AC-3, GameTest:**
- **GIVEN** `next_ms` in the past and the only simulated player in the Nether, **THEN** no arrival starts for 300 ticks. **WHEN** the player teleports to the Overworld, **THEN** the arrival starts within 100 ticks, centred on that player.
- **GIVEN** a live event, **WHEN** `come` runs again, **THEN** it is refused and there is still exactly one session. The stub saucer counts as 1.
- The centre, `onPhase` and the saucer are always in `minecraft:overworld`.

**AC-18, `bds-check` restart on 19136:**
1. Start an event with `come` at a centre more than 200 blocks from spawn, so it is outside the spawn chunks.
2. Restart during the magnet phase.
3. The selftest probe finds 0 entities tagged `andrew:ufo` at load, and still 0 after a ticking area loads the saucer's chunk.
4. Entities tagged `andrew:ufo_iron` have lost the tag.
5. `next_ms` is about load time + 15 min.

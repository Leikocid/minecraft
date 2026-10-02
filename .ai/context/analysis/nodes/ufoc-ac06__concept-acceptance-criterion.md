---
type: "concept-acceptance-criterion"
node_id: "L0-ufoc-ac06"
source_channel: "rollout"
analysis_version: 5
title: "AC-ufoc-6 · UFO AC-17 (commands are operator-only and have their effects)"
aliases: ["L0-ufoc-ac06"]
is_a: ["acceptance-criterion"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 1031
tags: ["is_a:acceptance-criterion", "ufo-ac-17", "channel:bds", "gametest", "relates_to:L0-ufoc-p004", "relates_to:L0-ufoc-ad04"]
level: 2
---
# AC-ufoc-6 · UFO AC-17 (commands are operator-only and have their effects)

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-ufoc-p004", "L0-ufoc-ad04", "L0-ufoc-r006"]`

**GIVEN** the command is registered at `GameDirectors`:
- **non-op:** `/andrew:ufo come` from a non-operator player on the checks instance is refused by the engine, no session starts, and `andrew:ufo_enabled` is unchanged after `disable`;
- **op `come`:** a session starts, targeting the invoker;
- **op `stop`** during the magnet phase: `onPhase("release")` comes on the next tick, then `pause`, with no saucer left and `next_ms` = now + 15 min;
- **op `disable`:** the flag is false and no scheduled arrival starts while `next_ms` is due;
- **op `enable`:** the flag is true, and an overdue `next_ms` moves to now + 15 min.

The non-op case runs as a `bds-check` with a real client or a deop'd player, because GameTest simulated players are operators. The rest run in GameTest. Persistence across a restart is `ac03`.

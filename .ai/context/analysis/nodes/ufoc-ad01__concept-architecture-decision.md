---
type: "concept-architecture-decision"
node_id: "L0-ufoc-ad01"
source_channel: "rollout"
analysis_version: 5
title: "ADR-ufoc-1 · Environment seam (clock, durations, players); phases in ticks, schedule in epoch ms"
aliases: ["L0-ufoc-ad01"]
is_a: ["architecture-decision"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 1719
tags: ["is_a:architecture-decision", "testability", "clock-seam", "relates_to:L0-xasm13", "relates_to:L0-xcx17"]
level: 2
---
# ADR-ufoc-1 · Environment seam (clock, durations, players); phases in ticks, schedule in epoch ms

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-xasm13", "L0-xcx17", "L0-ufoc-r001", "L0-ufoc-ac01"]`

**Context.**
- AC-1 spans 10–20 min of real time, and the suite cannot wait that long (`L0-xcx17`).
- Product packs see simulated players only as unreadable entries, so a product-side `getAllPlayers()` never shows a GameTest player in the Overworld. Without a seam, AC-3 ("waits for a player") and every arrival test would be untestable.
- Smooth flight needs per-tick steps.

**Decision.**
- `createUfoCore(env)` takes an `env` with these members:
  - `now(): number`;
  - `durations: {arrival, magnet, departure, downed}` in ticks, plus `PAUSE_MS` and `FIRST_MIN_MS`/`FIRST_MAX_MS`;
  - `overworldPlayers(): Player[]`;
  - `random(): number`;
  - `store`, the dynamic-property store.
- The product binds `Date.now`, the spec values (400/1200/300/60 ticks; 900 000 / 600 000 / 1 200 000 ms), `world.getAllPlayers()` filtered as in `r002`, and `Math.random`.
- GameTest binds a scaled clock: a test-owned offset added to `Date.now`, which the test advances. It also binds a player provider that returns its simulated players.
- One AC-2 scenario keeps the real tick durations.
- **Phase timing** counts interval ticks. **Schedule timing** compares `now()` against `next_ms`.

**Rejected.**
- Phases on epoch ms. Under lag the saucer would jump to catch up, and a GameTest could not step it tick by tick.
- A schedule on ticks. It breaks across restarts (C-21).
- Patching `Date.now` globally in GameTest. That leaks into `lgnd` cooldowns and `orbc` running in the same pack.

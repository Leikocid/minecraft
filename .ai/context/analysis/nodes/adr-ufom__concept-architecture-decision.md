---
type: "concept-architecture-decision"
node_id: "L0-adr-ufom"
source_channel: "rollout"
analysis_version: 4
level: 1
title: "ADR-L0-ufom · The UFO is its own module on one shared interval, with an epoch-ms schedule and no mid-flight persistence"
aliases: ["L0-adr-ufom"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 580
size_chars: 2177
tags: ["status:accepted", "relates_to:L0-ufoc", "relates_to:L0-sauc", "relates_to:L0-magn", "v4"]
---
---
title: "ADR-L0-ufom · The UFO is its own module on one shared interval, with an epoch-ms schedule and no mid-flight persistence"
aliases: ["L0-adr-ufom"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-ufoc", "L0-sauc", "L0-magn", "L0-lgnd", "L0-adr-ufoi"]
governs_files: ["src/ufo/", "src/main.ts", "src/gametest/main.ts"]
see_also: ["ufomagnetspecv1ruen-part-1", "ufomagnetspecv1ruen-part-4"]
status: accepted
---
# ADR-L0-ufom · The UFO is its own module on one shared interval, with an epoch-ms schedule and no mid-flight persistence

**Context.**
- UFO §1 calls the event standalone.
- §2 wants the schedule to survive restarts.
- §10 says an interrupted event is never resumed.
- §11 asks for one shared `runInterval` and a single zone scan.
- The project already has the same patterns for weapons: `src/orbital/` with one flight interval, and cooldowns in `Date.now()` ms.

**Decision.**
1. **Module.** All UFO code lives in `src/ufo/`, registered from `src/main.ts` like `registerOrbitalCannon`, with GameTest scenarios in `src/gametest/`. `ufoc`, `sauc` and `magn` are files in it, not packs.
2. **Durable state.** It consists only of two world dynamic properties:
   - `andrew:ufo_next_ms` (epoch ms, C-21);
   - `andrew:ufo_enabled`.

   "First join" is recorded when `andrew:ufo_next_ms` is absent (`L0-xasm14`).
3. **One interval.**
   - With no saucer, the interval checks the clock every 100 ticks.
   - With a saucer, it runs every tick: phase → saucer step → magnet step.
   - The zone scan runs synchronously once, at magnet-on.
4. **Restart.** On `worldLoad` (startup), entities tagged `andrew:ufo` (the saucer and the beam) are removed. Then `next_ms` is set to now + 15 min if an event had been running, recorded by a transient `andrew:ufo_active` flag.

**Rejected alternatives.**
- *Persist the phase and resume.* This contradicts §10, and the held elements' state cannot be rebuilt.
- *A tick-based or `getAbsoluteTime` schedule.* That clock breaks across restarts or a frozen daylight cycle (`lgnd-cx03`).
- *A separate behavior pack for events.* It would split the build and the GameTest harness for no gain (`L0-xasm9` reading).

---
type: "concept-contradiction"
node_id: "L0-xcx20"
source_channel: "rollout"
analysis_version: 4
title: "CX-L0-20 · `L0-ufoc` is missing from run v4"
aliases: ["L0-xcx20"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 580
size_chars: 1803
tags: ["v4","status:open","category:coverage-gap","target:L0-ufoc","severity:high","relates_to:L0-ufoc","relates_to:L0-sauc","relates_to:L0-magn","relates_to:L0-adr-ufpc","relates_to:L0-xcx17","resolved"]
level: 1
closed_at: 2026-10-03
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-xcx20
---

---
title: "CX-L0-20 · `ufoc` failed in run v4: UFO ACs 1, 2 (timing), 3, 17 and 18 have no owner, and `sauc`/`magn` depend on it"
aliases: ["L0-xcx20"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-ufoc", "L0-sauc", "L0-magn", "L0-adr-ufpc", "L0-adr-ufom", "L0-xcx17", "L0-xasm13", "L0-xasm14"]
status: open
category: coverage-gap
---
# CX-L0-20 · `L0-ufoc` is missing from run v4

**What is missing.** The orchestrator roster has `L0-ufoc` as *ran and failed*. These items therefore have no child artifacts:
- **UFO ACs:**
  - AC-1: the first arrival after 10–20 min, the next 15 min after a departure, surviving a restart;
  - AC-2, timing half: 20 / 60 / 15 s;
  - AC-3: no Overworld player means waiting, and the 150-block notice;
  - AC-17: the enable flag persists;
  - AC-18: no saucer after a mid-event restart.
- **Mechanics:**
  - the schedule;
  - target and centre selection;
  - the `hoverY` formula, for which only `L0-adr-ufht` fixes the cap;
  - the `/andrew:ufo` commands;
  - RU/EN messages;
  - the clock seam (`L0-xasm13`).
- **`L0-xcx17`** (how the restart and real-time ACs count as "automated") stays unresolved. It targets `ufoc`.

**What already stands in for it:**
- `L0-adr-ufom`: module, durable state and the one interval.
- `L0-adr-ufpc`: the phase contract that `sauc` and `magn` consume, fixed at this reduce.
- `L0-adr-ufht`: the flight-height cap.

The `ufoc` re-run must implement these as given. It does not re-derive them.

**Blocking.** This blocks Stage 6 step 2 (`ufoc` with a stub saucer). Steps 3 and 4 (`sauc`, `magn`) can be planned against `L0-adr-ufpc`, but they cannot merge before `ufoc`. Step 1 (`lgnd` v4) is not blocked.

**Action.** Re-run `L0-ufoc` alone, with the same prompt plus `L0-adr-ufpc`, `L0-adr-ufht` and `L0-xasm17` as inputs.

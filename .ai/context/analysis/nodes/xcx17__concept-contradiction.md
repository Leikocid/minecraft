---
type: "concept-contradiction"
node_id: "L0-xcx17"
source_channel: "rollout"
analysis_version: 4
level: 1
title: "CX-L0-17 · UFO DoD: \"every BDS-checkable AC automated in GameTest\" vs ACs that need 10–20 real minutes or a server restart"
aliases: ["L0-xcx17"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 580
size_chars: 1532
tags: ["status:open", "category:assumption-gap", "target:L0-ufoc", "severity:medium", "relates_to:L0-ufoc", "relates_to:L0-xasm13", "relates_to:L0-xcx7", "see_also:ufomagnetspecv1ruen-part-4", "v4"]
---
---
title: "CX-L0-17 · UFO DoD: \"every BDS-checkable AC automated in GameTest\" vs ACs that need 10–20 real minutes or a server restart"
aliases: ["L0-xcx17"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-ufoc", "L0-sauc", "L0-xasm13", "L0-xcx7"]
see_also: ["ufomagnetspecv1ruen-part-3", "ufomagnetspecv1ruen-part-4"]
status: open
category: assumption-gap
---
# CX-L0-17 · UFO DoD: "every BDS-checkable AC automated in GameTest" vs ACs that need 10–20 real minutes or a server restart

- **UFO §14.** Every acceptance test that can be checked on BDS is automated in GameTest.
- **ACs with real-time spans:**
  - AC-1: the first arrival after 10–20 min, the next after 15 min, and the timer surviving a restart.
  - AC-2: a full cycle of 20 + 60 + 15 s.
- **ACs that need a server restart:** AC-17 (`disable` persists) and AC-18 (no saucer left after a mid-event restart).
- **Engine facts:**
  - A GameTest cannot restart the server.
  - Simulated players do not survive a restart.
  - A real 15–20 min wait per scenario is not a usable suite.

**Resolution (proposed, `L0-xasm13`):**
- `ufoc` reads time through an injectable clock and duration table. GameTests run the logic on a scaled clock, and one scenario keeps real phase durations for AC-2.
- The restart ACs run as `bds-check` restart scenarios on the checks instance (port 19136). They seed the world state, restart, and assert through a selftest probe.

These count as "automated on BDS" but are not GameTest. This needs operator acceptance of that reading.

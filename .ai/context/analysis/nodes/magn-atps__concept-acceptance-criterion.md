---
type: "concept-acceptance-criterion"
node_id: "L0-magn-atps"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-magn-atps"]
is_a: ["acceptance-criterion"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 403
tags: ["is_a:acceptance-criterion", "ufo-dod-tps", "channel:bds", "relates_to:L0-xasm16"]
level: 2
---
**UFO DoD, "the event does not drop TPS" (bds).**
- **GIVEN** a zone with ≥ 200 chests, a full scan type list, 2 players and 10 + 2 elements,
- **WHEN** a full magnet phase runs,
- **THEN**:
  - the magnet-on tick cost (scan + selection + extraction) is logged and is ≤ 12 ms;
  - the mean per-tick hold step is ≤ 2 ms and p99 ≤ 5 ms;
  - all three numbers are written to the task's run-check artifact.

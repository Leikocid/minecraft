---
type: "concept-assumption"
node_id: "L0-lgnd-as10"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-as10"]
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 530
size_chars: 950
tags: ["is_a:assumption"]
level: 2
---
---
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-cx09", "L0-lgnd-p003", "L0-lgnd-ad03", "L0-lgnd-cx06"]
---
**ASM-lgnd-10: A 40-tick loss check is fast enough to catch the Void before the engine kills the item. A hopper is the only non-player collector that matters.**

`recovery.ts` checks the watched entities every 40 ticks (2 s). An item that falls below `heightRange.min` is assumed to still exist at the next check, and the code removes it itself. The pickup heuristic looks only at players and at the container at the spot or one block below.

**Impact if wrong:**
- **The engine kills Void items within 2 s.** Classification then falls to "vanished from the ground", which gives the same outcome: the item is returned. Only the log line differs, so the impact is low.
- **Allays, hopper minecarts or hopper chains matter in practice.** A duplicate becomes possible (`cx09` item 2).

This must be measured on BDS 1.26.51.x.

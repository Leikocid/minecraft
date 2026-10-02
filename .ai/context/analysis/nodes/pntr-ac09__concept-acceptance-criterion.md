---
type: "concept-acceptance-criterion"
node_id: "L0-pntr-ac09"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-pntr-ac09"]
is_a: ["acceptance-criterion"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 404
tags: ["title:C-14 (bds) · Column at a chunk edge never force-loads", "is_a:acceptance-criterion", "channel:bds", "constraint:C-14", "relates_to:L0-pntr-r008"]
level: 2
---
**GIVEN** a detonation cell on the x-edge of a loaded chunk whose neighbour chunk is unloaded (outside the tick range).
**WHEN** the LMB detonates.
**THEN**:
- the cells in the loaded chunk are removed;
- the cells in the unloaded chunk are unchanged when that chunk is later loaded;
- `report.skippedUnloaded > 0`;
- no error propagates out of the job;
- no ticking area or dynamic property was created.

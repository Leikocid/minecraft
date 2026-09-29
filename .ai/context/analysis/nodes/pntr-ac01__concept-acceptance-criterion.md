---
type: "concept-acceptance-criterion"
node_id: "L0-pntr-ac01"
source_channel: "rollout"
analysis_version: 3
aliases: ["L0-pntr-ac01"]
is_a: ["acceptance-criterion"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 857
tags: ["title:AC-7 (bds) · Irregular ~5×5 column to the bottom", "is_a:acceptance-criterion", "channel:bds", "orbital-ac:7", "relates_to:L0-pntr-r001", "relates_to:L0-pntr-r002"]
level: 2
---
**GIVEN** an Overworld test area of stone from y=80 down to bedrock. It contains a 3×3 water pocket at y=40 and a bedrock block placed at y=20 in the column centre, and the column is seeded with a fixed `attackId`.
**WHEN** an LMB charge detonates on the stone at y=80.
**THEN**, after the removal job reports done:
- every cell of `planColumn(attackId)` between y=80 and `heightRange.min` that was stone is air;
- no cell outside the plan changed (except by liquid flow);
- the 3×3 core is air on every layer, and at least one layer is not a perfect 5×5 square;
- per-layer removed counts are within 9…33;
- the placed bedrock at y=20 and the bottom bedrock are still bedrock;
- the stone directly below the placed bedrock (y=19) is air, so the column did not stop;
- the water cells are still water or have flowed; none were turned into air by the script.

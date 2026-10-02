---
type: "concept-acceptance-criterion"
node_id: "L0-pntr-ac02"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-pntr-ac02"]
is_a: ["acceptance-criterion"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 618
tags: ["title:AC-7 (bds) · Works in Nether and End; keep list holds", "is_a:acceptance-criterion", "channel:bds", "orbital-ac:7", "relates_to:L0-pntr-r002", "relates_to:L0-xasm6"]
level: 2
---
**GIVEN** three test columns:
- (a) Nether: netherrack from y=100 to 0, with a lava cell at y=50;
- (b) End: end stone, with an `end_portal_frame` and a `barrier` placed in the column;
- (c) Overworld: a waterlogged oak fence in the column.

**WHEN** an LMB detonates on the top of each.

**THEN**:
- (a) all netherrack in the plan down to y=0 is gone, the Nether bottom bedrock and the lava remain, and the column reaches y=0;
- (b) the frame and the barrier remain, and the end stone below them is gone;
- (c) the fence cell is `minecraft:water`.

The unit test for `PENETRATOR_KEEP` equals the `xasm6` list exactly.

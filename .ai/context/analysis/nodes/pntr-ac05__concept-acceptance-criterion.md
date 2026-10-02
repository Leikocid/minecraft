---
type: "concept-acceptance-criterion"
node_id: "L0-pntr-ac05"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-pntr-ac05"]
is_a: ["acceptance-criterion"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 722
tags: ["title:AC-9 (bds) · No direct damage; environment still harms", "is_a:acceptance-criterion", "channel:bds", "orbital-ac:9", "relates_to:L0-pntr-r006"]
level: 2
---
**GIVEN**:
- a zombie and simulated player B standing on the detonation surface inside the plan, each at full health;
- a cow on a 1-block ledge beside the column but outside the plan;
- the owner A standing 6 blocks away.

**WHEN** the LMB detonates.

**THEN**:
- in the detonation tick and the next tick, no entity receives damage (no `entityHurt` event with any cause from `pntr`), and the cow and A do not move;
- the zombie and B then fall and take fall damage (`entityHurt` with cause `fall`);
- if lava is placed at the rim, an entity that ends up in it takes `lava` damage.

Note: the simulated player is only valid on the gametest pack (memory: SimulatedPlayer limits). Real-player feel belongs to `L0-pntr-ac08`.

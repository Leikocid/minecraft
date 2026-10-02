---
type: "concept-acceptance-criterion"
node_id: "L0-orbc-ac06"
source_channel: "rollout"
analysis_version: 5
title: "AC-6 · Entities do not stop falling charges `[bds]`"
aliases: ["L0-orbc-ac06"]
is_a: ["acceptance-criterion"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 860
tags: ["is_a:acceptance-criterion", "channel:bds", "orbital-ac-6", "relates_to:L0-orbc-r008"]
level: 2
---
# AC-6 · Entities do not stop falling charges `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r008"]`

**GIVEN**
- target T on flat stone.
- In T's column, between T+5 and T+15, three things lie in the charge's path:
  - a second SimulatedPlayer Q in Creative flight;
  - a named `minecraft:cow` (summoned with a name, so it persists) kept in place with a slowness effect;
  - a boat.

**WHEN** P fires at T with the stub effect.

**THEN**
- `onDetonate.point` equals T, not Q's, the cow's or the boat's position.
- The charge's Y, sampled per tick, decreases monotonically through the entities' Y.
- Q, the cow and the boat are not displaced by the charge. Their position change is below 0.05 while it passes.

**Variant:** water 5 deep above T. `point` equals T (the stone floor), not the water surface.

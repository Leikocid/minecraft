---
type: "concept-rule"
node_id: "L0-ring-r010"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ring-r010"]
is_a: ["rule"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 884
tags: ["is_a:rule", "geometry", "relates_to:L0-orbc-r014", "relates_to:L0-orbc-r008", "relates_to:L0-ring-as08"]
level: 2
---
**R-ring-010 · The explosion centre is where a landed TNT would sit**

`orbc` passes `point`, the solid contact cell (`L0-orbc-r014`). `ring` maps it to the explosion centre:
- **Normal case.** The cell above `point` is not solid, which covers air, liquid and plants. The centre is `(x+0.5, y+1.5, z+0.5)`: the middle of the TNT block resting on the contact block. This matches vanilla TNT, which explodes from its own cell, and it makes the crater bite into the surface instead of starting one block deep.
- **Buried case.** The cell above `point` is solid, as with a spawn inside a solid block (`L0-orbc-r008`) or a charge under an overhang. The centre is `(x+0.5, y+0.5, z+0.5)`: the middle of `point` itself.
- Solidity uses the same `isContact` predicate as `orbc`, so the two components agree on what "solid" means.
- Underwater classification (`r007`) reads the centre's cell.

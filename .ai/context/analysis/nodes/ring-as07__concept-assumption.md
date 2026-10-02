---
type: "concept-assumption"
node_id: "L0-ring-as07"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ring-as07"]
is_a: ["assumption"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 623
tags: ["is_a:assumption", "CAN_ASSUME", "relates_to:L0-ring-r003", "relates_to:L0-ring-r006"]
level: 2
---
**ASM-ring-07 · World TNT primed by a ring blast is ordinary vanilla TNT**

**Assumption.**
- `minecraft:tnt` blocks in the world that a ring blast primes behave exactly as vanilla:
  - they explode ~4 s later;
  - they can push each other;
  - they drop blocks, because `doTileDrops` has been restored by then;
  - they can chain.
- "Each charge is independent" (§10) is about the Cannon's own charges only.

**Impact if wrong.** If the client expects the world's TNT to be neutralised, `ring` must remove TNT blocks in the blast volume beforehand. That breaks "TNT-like" behaviour and costs another block query per step.

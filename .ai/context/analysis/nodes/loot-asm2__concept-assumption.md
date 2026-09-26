---
type: "concept-assumption"
node_id: "L0-loot-asm2"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-loot-asm2"]
is_a: ["assumption"]
part_of: ["L0-loot"]
relates_to: ["L0-loot"]
priority: 530
size_chars: 879
tags: ["CAN_ASSUME", "is_a:assumption", "relates_to:L0-loot-p002", "relates_to:L0-strf"]
level: 2
---
**Assumption (CAN_ASSUME):** `L0-loot-p002` assumes the stable mechanism for applying a vanilla loot table to a chest is `Dimension.runCommand("loot insert <pos> loot <tableId> ...")` (or an equivalent `Entity`/`Dimension` command call), since the stable `@minecraft/server` Script API (pinned 2.10.0 per `constraints.md`) has no direct "fill container from loot table" method. This is exactly the open probe question the `strf` component owes per the L0 decomposition plan v2 reduce section ("is `/loot insert` with vanilla chest tables available through `runCommand`").

**Impact if wrong:** if the probe finds `/loot insert` unavailable or behaves differently on 1.26.51.1, `L0-loot-p002`'s only step needs a different stable-API mechanism — this would not change `L0-loot-r006`/`r007`/the entities, only the process's step 2. Medium impact, contained to one process artifact.

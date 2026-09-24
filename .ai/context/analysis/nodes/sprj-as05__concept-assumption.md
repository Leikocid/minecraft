---
type: "concept-assumption"
node_id: "L0-sprj-as05"
source_channel: "rollout"
analysis_version: 1
title: "ASM (sprj-05) — The visual starts with a vanilla particle; a custom RP particle is `L0-sitm`'s asset"
aliases: ["L0-sprj-as05"]
is_a: ["assumption"]
part_of: ["L0-sprj"]
relates_to: ["L0-sprj"]
priority: 520
size_chars: 1381
tags: ["is_a:assumption", "CAN_ASSUME", "visual", "particles", "ownership"]
level: 2
---
# ASM (sprj-05) — The visual starts with a vanilla particle; a custom RP particle is `L0-sitm`'s asset

`CAN_ASSUME` · **Links:** `part_of: ["L0-sprj"]` · `is_a: ["assumption"]` · `relates_to: ["L0-sitm", "L0-sqat", "ADR-023"]`

**Assumed.**
- The first implementation draws each projectile with one vanilla particle identifier chosen by an iPad look-test, from candidates such as `minecraft:endrod` or `minecraft:shulker_bullet`-like trails, spawned every tick at `pos`.
- If the look-test fails, a custom `andrew:calamity_bolt` particle JSON and texture are added to the Resource Pack. That asset is owned by `L0-sitm`, the RP owner. It is not listed in `L0-sitm`'s L0 scope, which is a gap for L0 to route. This component only references the identifier through one constant.
- Particles spawned inside solid blocks are hidden by the client. That is accepted: the projectile "reappears" when it emerges, which reads as passing through.

**Basis.** ADR-023 names both options and no owner for the RP particle. The decomposition plan's `sitm` row lists icon, JSON, recipe and lang only.

**Impact if wrong.** If no vanilla particle is readable on the iPad at 20 blocks, a custom particle becomes mandatory. That adds RP work to `L0-sitm` and one more iPad verification step (C-11). The final fallback is ADR-023 option (b), a dummy entity, which re-opens C-14's load-time cleanup.

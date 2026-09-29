---
type: "concept-rule"
node_id: "L0-pntr-r006"
source_channel: "rollout"
analysis_version: 3
aliases: ["L0-pntr-r006"]
is_a: ["rule"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 771
tags: ["title:No direct entity damage", "is_a:rule", "relates_to:L0-adr-ochg", "source:orbital-§9", "ac:9"]
level: 2
---
**Rule R-pntr-6 · No direct damage; environment stays live.**
- `pntr` never calls `applyDamage`, `createExplosion`, `applyKnockback`, `teleport` or `kill` on any entity, and never runs `/damage` or `/kill`.
- Entities inside or above the column are not moved by the effect. They fall under vanilla gravity once their support is gone.
- Secondary harm is expected and must **not** be suppressed: fall damage, lava flowing in, drowning, suffocation from sand or gravel falling in, and mobs dropping into the Void at the End's bottom.
- The owner is treated like everyone else: no damage from the effect itself, and normal fall damage if they stand over the target.

Rationale: Orbital §9, "LMB does not deal direct damage… may receive ordinary secondary damage", and AC-9.

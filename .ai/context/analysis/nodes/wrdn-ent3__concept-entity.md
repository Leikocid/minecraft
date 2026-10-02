---
type: "concept-entity"
node_id: "L0-wrdn-ent3"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-wrdn-ent3"]
is_a: ["entity"]
part_of: ["L0-wrdn"]
relates_to: ["L0-wrdn"]
priority: 530
size_chars: 729
tags: ["is_a:entity", "sculk", "shrieker"]
level: 2
---
## WrdnShrieker

Exactly 2 per `MiniWardenCityInstance` (`L0-wrdn-ent1`).

**Attributes**
- `slot` — `central` or `far`; fixed per template, rotated with the instance.
- `positionOffset` — position relative to the template anchor.
- Warden-summon state (warning level, cooldown, `can_summon`) is **not** duplicated here — it is left to vanilla Sculk Shrieker behavior/state so the mob behaves exactly like a naturally-generated one (`L0-wrdn-rul5`). This entity only tracks placement, not runtime AI state.

**Invariant:** never more than 2 per instance; no `WrdnShrieker` record ever transitions to or spawns a tracked Warden entity — Warden appearance is pure vanilla mechanic, out of this entity's lifecycle (`L0-wrdn-rul5`).

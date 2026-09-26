---
type: "concept-assumption"
node_id: "L0-webs-as03"
source_channel: "rollout"
analysis_version: 2
level: 2
title: "ASM-webs-03 — \"Entities\" in the protected-block filter includes non-player mobs, not only players `CAN_ASSUME`"
aliases: ["L0-webs-as03"]
is_a: ["assumption"]
part_of: ["L0-webs"]
relates_to: ["L0-webs"]
priority: 520
size_chars: 1011
tags: ["CAN_ASSUME", "assumption", "protected-blocks"]
---
---
is_a: ["assumption"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-r004"]
---
# ASM-webs-03 — "Entities" in the protected-block filter includes non-player mobs, not only players `CAN_ASSUME`

**Assumed.** Decision Q-013's "клетки с живой сущностью не трогаются" (cells with a living entity are left untouched) is read as applying to any living entity — hostile/passive mobs included — not only players, matching the raw spec §6's unqualified "не удалять... сущности".

**Basis.** Neither §6 nor Q-013 restricts this to players; the general phrasing ("живая сущность" / "entities") and the project's broader "don't remove entities" posture (also seen in `L0-lgnd`'s scope) both point to an entity-type-agnostic rule.

**Impact if wrong.** If only players should block placement, cells with mobs (e.g. a cow standing in the volume) would additionally be filled around the mob today but could instead legitimately overwrite/displace it under a narrower reading — changes `L0-webs-r004`'s entity branch only. Low.

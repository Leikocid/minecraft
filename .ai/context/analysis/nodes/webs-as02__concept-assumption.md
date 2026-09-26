---
type: "concept-assumption"
node_id: "L0-webs-as02"
source_channel: "rollout"
analysis_version: 2
level: 2
title: "ASM-webs-02 — A cell that is already Cobweb counts as satisfied, not skipped `CAN_ASSUME`"
aliases: ["L0-webs-as02"]
is_a: ["assumption"]
part_of: ["L0-webs"]
relates_to: ["L0-webs"]
priority: 520
size_chars: 1110
tags: ["CAN_ASSUME", "assumption", "trap"]
---
---
is_a: ["assumption"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-ent3", "L0-webs-r005"]
---
# ASM-webs-02 — A cell that is already Cobweb counts as satisfied, not skipped `CAN_ASSUME`

**Assumed.** If a candidate cell already contains `minecraft:web` before the cast runs, it requires no write and counts toward the trap's success count (`TrapCube.successCount`, `L0-webs-ent3`) — it is not treated as a "protected"/skip cell.

**Basis.** Neither the raw spec nor Q-011/Q-013/Q-017 addresses pre-existing Cobweb explicitly; treating "already correct" as success (rather than as a no-op skip) is the reading consistent with the ability's stated goal ("form a trap") and with Q-017's zero-cells wording ("ни одна из 27 клеток не заменена" — replaced-or-already-right, not narrowly "newly written").

**Impact if wrong.** If the owner wants pre-existing Cobweb to count as "skipped" like a protected cell, repeated casts into a partially-webbed area could flip from success to `no-room` (`L0-webs-ac06`) purely from earlier casts — a behavior change to `L0-webs-r005`, not to the cube geometry itself. Medium.

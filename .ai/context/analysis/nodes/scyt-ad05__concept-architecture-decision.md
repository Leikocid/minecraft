---
type: "concept-architecture-decision"
node_id: "L0-scyt-ad05"
source_channel: "rollout"
analysis_version: 1
title: "ADR-scyt-05 — The pursuit leash is horizontal (XZ) only"
aliases: ["L0-scyt-ad05"]
is_a: ["architecture-decision"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 888
tags: ["is_a:architecture-decision", "leash", "delta:2026-09-26"]
level: 2
---
# ADR-scyt-05 — The pursuit leash is horizontal (XZ) only

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-scyt-r007", "L0-sprj"]`

Status: **implemented** (`outOfRadius`). No separate decision record exists; the rationale is in the code comment.

**Context.** Spec §5 says the target must stay within 20 blocks of the launch point. Each hit throws the target about 10 blocks up (`r006`), and three stacked hits reach about 30 blocks above the launch point.

**Decision.** Measure `hypot(dx, dz)` against 20, and ignore Y.

**Rejected.** A 3D sphere, which the earlier `L0-scyt-r007` and `L0-sprj` design used. The weapon's own launch would abort its own volley after the second or third hit.

**Consequence.** Falling or climbing never breaks the leash, so escape is horizontal only. Targeting stays 3D (`r001`), which is an accepted asymmetry.

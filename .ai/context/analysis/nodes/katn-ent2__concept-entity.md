---
type: "concept-entity"
node_id: "L0-katn-ent2"
source_channel: "rollout"
analysis_version: 6
title: "E-katn-2: FallFlag and TeleportPlan"
aliases: ["L0-katn-ent2"]
is_a: ["entity"]
part_of: ["L0-katn"]
relates_to: ["L0-katn"]
priority: 600
size_chars: 1534
tags: ["entity", "katana", "fall-damage", "is_a:entity"]
level: 2
---
---
title: "E-katn-2: FallFlag and TeleportPlan (in-memory, per activation)"
is_a: ["entity"]
part_of: ["L0-katn"]
relates_to: ["L0-katn-p001", "L0-katn-p002", "L0-adr-ktfl", "L0-xasm20"]
---
# E-katn-2: FallFlag and TeleportPlan

**FallFlag**: one per player at most, in a module `Map<playerId, FallFlag>`. It is never persisted.

| Attribute | Type | Meaning |
|---|---|---|
| `until` | epoch ms | `Date.now() + 10_000` at arm time (C-21, `L0-xasm20`) |
| `dimId` | string | dimension of B; a mismatch consumes the flag |

States: *absent* → armed (successful teleport) → absent (consumed by landing, liquid, climb, glide, death, dimension change, logout or expiry; or protected landing done). Re-arming replaces it.

**TeleportPlan**: the pure result of the trace and search. It is built in `src/katana/plan.ts` with no engine imports, so node tests can cover it with a fake block reader.

| Attribute | Type | Meaning |
|---|---|---|
| `origin` | Vector3 | A, feet location at use |
| `head` | Vector3 | H, head location at use |
| `dir` | Vector3 | unit view direction at use |
| `endpoint` | Vector3 | E, hit point pulled back 0.3, or `H + maxDistance·dir` |
| `hitFace` | Direction \| undefined | face of the stopping block |
| `stoppedBy` | `"block" \| "unreadable" \| "range"` | why the trace ended |
| `feet` | Vector3 \| undefined | chosen cell centre (B); undefined → refused |

Invariant: if `feet` is set, then `|feet + (0,1.62,0) − head| ≤ 20` and `feet` lies on the owner's side of the hit-face plane (`L0-katn-r004`).

---
type: "concept-entity"
node_id: "L0-scyt-ent3"
source_channel: "rollout"
analysis_version: 5
title: "ScytheActivationOutcome — press outcomes and volley `EndReason` (as shipped)"
aliases: ["L0-scyt-ent3"]
is_a: ["entity"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1278
tags: ["is_a:entity", "outcome", "delta:2026-09-26"]
level: 2
---
# ScytheActivationOutcome — press outcomes and volley `EndReason` (as shipped)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["entity"]` · `relates_to: ["L0-scyt-p001", "L0-scyt-p002", "L0-scyt-r007"]`

**Press level** (`targeting.ts`):
| Outcome | When | Cooldown | Visible |
|---|---|---|---|
| ignored | Same player already handled this tick, or not a Scythe stack | – | nothing |
| not dispatched | `resolveActivation` did not pick the Scythe (cooldown, busy, hand priority) | unchanged | HUD |
| `NO_TARGET` | `selectTarget` returned nothing | **none** | «Здесь нет цели» |
| `LAUNCHED` | A target was found → `launchVolley` | see below | log line |

**Volley `EndReason`** (`volley-rules.ts`). The verdict is always `hits > 0 ? full : none`:
| Reason | Trigger |
|---|---|
| `spent` | All 3 fired and none are still flying |
| `out_of_radius` | Horizontal distance > 20 from launchPoint |
| `timeout` | age > 200 ticks |
| `target_invalid` | The target is invalid, in another dimension, or at hp ≤ 0 (includes a kill by the Scythe) |
| `error` | A tick threw. `volleyTickErrors()` counts these |

**No `OWNER_INVALID`:** if the owner dies or leaves, the volley flies on from the launch point. The cooldown is written only if the owner is still valid at hit 1 or at the end.

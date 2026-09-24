---
type: "concept-process"
node_id: "L0-scyt-p003"
source_channel: "rollout"
analysis_version: 1
title: "P-scyt-003 — Invalidation and cleanup"
aliases: ["L0-scyt-p003"]
is_a: ["process"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1904
tags: ["is_a:process", "cleanup", "C-7"]
level: 2
---
# P-scyt-003 — Invalidation and cleanup

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["process"]` · `relates_to: ["L0-sprj", "L0-sprj-ac10", "L0-sprj-ac11", "L0-sprj-ac14", "C-7", "ASM-023"]` · source: Scythe §7 bullet 6, §8 test 10, §9 DoD.

## Triggers, and what they do
Each trigger only **marks** the volley. `L0-sprj-r008` step 1 resolves the mark on the next loop tick.
| Trigger | Event (stable 2.10.0) | Outcome | Cooldown |
|---|---|---|---|
| Target dies | `afterEvents.entityDie` (target id) | `TARGET_INVALID` | full 30 s if hits ≥ 1, otherwise none |
| Target logs out | `afterEvents.playerLeave` (target id) | `TARGET_INVALID` | same split on hits |
| Target changes dimension | `afterEvents.playerDimensionChange` | `TARGET_INVALID` | same split |
| Owner dies, logs out or changes dimension | same events (owner id) | `OWNER_INVALID` | if hits ≥ 1, it is already committed at the first hit (`L0-sprj-ad01`) |
| Target leaves Survival/Adventure | detected at re-check (`L0-sprj-as03`) | `TARGET_INVALID` | split on hits |
| Server restart or script reload | none. Volleys are memory-only (virtual projectiles). | nothing to clean up | a cooldown already committed at a hit survives |

## Cleanup guarantees
- Projectiles are script records, not entities. Removing the record removes the projectile. No `kill`, tag sweep or load-time scan is needed.
- Busy is in-memory. It is cleared on every resolution path, including the exception handler, and a restart clears it too.
- The `runInterval` handle is cleared in the same tick the last volley ends.
- Event subscriptions are permanent and cheap: each one is an id lookup in the volley map. They are not per-volley subscriptions.

## Anti-pattern (rejected)
Spawning `minecraft:shulker_bullet` or a custom projectile entity and despawning it on these events. Rejected because a crash or an unloaded chunk leaves orphans, which violates C-7.

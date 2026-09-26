---
type: "concept-process"
node_id: "L0-scyt-p003"
source_channel: "rollout"
analysis_version: 1
title: "P-scyt-003 — Invalidation and cleanup (polled, not event-driven)"
aliases: ["L0-scyt-p003"]
is_a: ["process"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1438
tags: ["is_a:process", "cleanup", "delta:2026-09-26"]
level: 2
---
# P-scyt-003 — Invalidation and cleanup (polled, not event-driven)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["process"]` · `relates_to: ["L0-scyt-ent3", "C-7", "L0-sprj"]`

Code: `liveHealth`, `end`, `launchOrigin`. GameTest: `scythe_cleanup_on_target_death`.

**Mechanism:** no event subscriptions. Every tick re-checks `target.isValid`, the target's dimension and hp > 0.
| Situation | Result | Cooldown |
|---|---|---|
| Target dies (Scythe kill or other cause) | `target_invalid` on the same or next tick | full if hits ≥ 1, else none |
| Target player leaves / changes dimension, mob despawns or unloads | `target_invalid` | same split |
| Owner dies, leaves or changes dimension | the volley **continues**; new projectiles launch from launchPoint + 1.2 | armed at hit 1 if the owner was valid then; at the end only if the owner is valid |
| Server restart or script reload | volleys and intervals vanish (memory only) | a cooldown written at hit 1 survives. Busy is a property with an 11 s deadline, so it expires on its own |

**Guarantees:**
- Projectiles are positions, not entities, so there are no orphans (C-7).
- Every end path clears the interval and removes the volley from `active`.
- `activeVolleyCount()` and `activeProjectileCount()` expose leaks to tests.

**Gap:** an owner who is invalid at the end keeps a stale busy until its 11 s deadline passes. Busy is not cleared, because `clearBusy` needs a valid handle.

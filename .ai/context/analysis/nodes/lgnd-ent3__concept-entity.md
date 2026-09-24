---
type: "concept-entity"
node_id: "L0-lgnd-ent3"
source_channel: "rollout"
analysis_version: 1
title: "AbilityState: cooldown record + busy flag (per player × abilityKey)"
aliases: ["L0-lgnd-ent3"]
is_a: ["entity"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 1888
tags: ["entity", "cooldown", "busy"]
level: 2
---
---
is_a: ["entity"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r003", "L0-lgnd-r009", "L0-lgnd-ad05", "L0-sprj", "L0-stgt"]
---
# AbilityState: cooldown record + busy flag (per player × abilityKey)

## Cooldown deadline (durable)
- Player dynamic property `andrew:<prefix>_cooldown_until` holds the epoch **millisecond** at which the ability is ready again.
- **Clock:** `Date.now()`, as shipped. `world.getAbsoluteTime()` stops with `dodaylightcycle false` (measured on BDS 1.26.51.1: it stayed at 385 while `currentTick` ran 1445 → 1465). `system.currentTick` restarts at zero with the script engine. Both are forbidden for deadlines.
- A missing or non-number value reads as 0, i.e. ready. A leftover tick-based value also reads as long expired.
- The Web Sword keeps `andrew:ws_cooldown_until`, so a sword cooling at upgrade time stays cooling.

## Busy flag (volatile)
- In-memory `Set<"playerId|abilityKey">` inside the cooldown module (ADR-025).
- Set by `setBusy(player, key, true)` when a multi-tick ability starts (a Scythe volley). Cleared by `setBusy(..., false)` on resolution.
- After a restart the set is empty, so busy = false. Volleys do not survive a restart (C-14).
- Also cleared on `playerLeave` for that player, as a safety net behind ASM-023.

## API (the only one; `L0-lgnd-r001`)
| Call | Semantics |
|---|---|
| `isReady(p, k)` | `!isBusy(p, k) && remaining(p, k) == 0`. Never mutates. |
| `isBusy(p, k)` | busy-set membership. |
| `setBusy(p, k, on)` | the only busy writer. |
| `start(p, k)` | deadline = now + `def.cooldownMs`. Does not check readiness. Callers: the ability owner only. |
| `remaining(p, k)` | ms left, clamped ≥ 0. The HUD shows whole seconds rounded up. |

Compatibility exports keep their shipped names and behaviour: `isReady(player, abilityKey = "web_sword")`, `startCooldown`, `remainingTicks`, `DEFAULT_ABILITY_KEY` (`L0-lgnd-ad06`).

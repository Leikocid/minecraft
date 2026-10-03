---
type: "concept-entity"
node_id: "L0-lgnd-ent3"
source_channel: "rollout"
analysis_version: 6
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
- Player dynamic property `andrew:cd_<abilityKey>` holds the epoch **millisecond** at which the ability is ready again (`registry.ts` `cooldownKey`).
- **Clock:** `Date.now()`, as shipped. `world.getAbsoluteTime()` stops with `dodaylightcycle false` (measured on BDS 1.26.51.1: it stayed at 385 while `currentTick` ran 1445 → 1465). `system.currentTick` restarts at zero with the script engine. Both are forbidden for deadlines.
- A missing or non-number value reads as 0, i.e. ready. A leftover tick-based value also reads as long expired.
- The 0.3.x key `andrew:ws_cooldown_until` is not read. A sword cooling at the 0.3.x→0.4.0 upgrade reads ready (≤ 30 s lost once, accepted by `L0-adr-wpn2`, `cx07`).

## Busy flag (durable)
- A durable `andrew:busy_<abilityKey>` deadline (`ad07` §2, `cooldown.ts:61-71`), not an in-memory Set.
- Set by `setBusy(player, key, durationMs)` when a multi-tick ability starts (a Scythe volley). Cleared on resolution or once the deadline passes.
- Survives a restart (unlike the pre-`ad07` in-memory design).
- Also cleared on `playerLeave` for that player, as a safety net behind ASM-023.

## API (the only one; `L0-lgnd-r001`)
| Call | Semantics |
|---|---|
| `isReady(p, k)` | `remaining(p, k) == 0`. Never mutates (`cooldown.ts:39-41`). |
| `isBusy(p, k)` | busy-deadline membership. |
| `setBusy(p, k, durationMs)` | the only busy writer. |
| `start(p, k)` | deadline = now + `def.cooldownMs`. Does not check readiness. Callers: the ability owner only. |
| `remaining(p, k)` | ms left, clamped ≥ 0. The HUD shows whole seconds rounded up. |

Compatibility exports keep their shipped names and behaviour: `isReady(player, abilityKey = "web_sword")`, `startCooldown`, `remainingTicks`, `DEFAULT_ABILITY_KEY` (`L0-lgnd-ad06`).

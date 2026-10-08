---
type: "concept-process"
node_id: "L0-strm-pact"
source_channel: "rollout"
analysis_version: 8
title: "Active ability flow"
aliases: ["L0-strm-pact"]
is_a: ["process"]
part_of: ["L0-strm"]
relates_to: ["L0-strm"]
priority: 620
size_chars: 2510
tags: ["v8", "storm-blade", "active"]
level: 2
---
---
title: "Storm Blade active: Use → trace → one hit → three strikes → cooldown"
is_a: ["process"]
part_of: ["L0-strm"]
relates_to: ["L0-strm-rdmg", "L0-strm-rcd", "L0-strm-rvis", "L0-strm-adtr", "L0-xasm31", "L0-katn"]
---
# Active ability flow

1. **Trigger.** `itemUse` → `resolveActivation(player)`. It returns the blade's slot under C-15 hand priority: a ready main hand beats the off hand, and the off hand fires if the main hand is on cooldown.
   - If it returns another def or `undefined`, stop. No cooldown is spent.
2. **Validity** (`L0-strm-rcd`). The player must be alive and not spectating, the eye's chunk must be loaded, and the stack must be live (not stale).
   - Otherwise stop silently. The HUD keeps showing the seconds left.
3. **Block trace.**
   - `head = player.getHeadLocation()`, `dir = getViewDirection()`.
   - Call the Katana's exported `trace(world, head, dir)` with `TRACE_FLAGS` and a range of **10**, clamped to **Euclidean** 10 (`maxDistance` counts cell steps).
   - Result: `stop` = the first solid-block hit point, or `head + 10·dir`.
   - Passable blocks and liquids do not stop the trace (xasm31).
4. **Entity pick.**
   - `dimension.getEntitiesFromRay(head, dir, { maxDistance: |stop − head| })`. Exclude the wielder, entities without `minecraft:health`, items, XP orbs, and dead or removed entities.
   - Take the **nearest** hit whose distance is less than the block stop, or none.
   - The decision is made once, on the server (C-26). A second entity behind it is never touched.
5. **Damage.** If there is a target, `stormDamage(target, 10, wielder)` (`L0-strm-rdmg`). The point is the target's hit location (or its body centre).
6. **Visuals** (`L0-strm-rvis`):
   - the trace is drawn from head to point (or to `stop` on a miss) as particles every ~0.5 block;
   - three strikes at the point, each a particle column with the impact sound, staggered over ≤ 6 ticks from the shared interval.
7. **Cooldown.** Write `cooldownTicks = 600` for def #6 on **every valid release**, whether it hit, missed or stopped at a wall at 0.5 blocks. The HUD switches from «Клинок бури — Готово» / "Storm Blade — Ready" to the seconds left.

## Ordering notes
- Steps 3–7 run synchronously in the event tick. Only the visual stagger is deferred, and it uses captured coordinates, never re-reading the target.
- If the target dies from step 5, the visuals still play at the captured point.
- The off-hand activation uses the same flow. The off hand has no passive (`L0-strm-ppas`).

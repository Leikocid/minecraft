---
type: "concept-contradiction"
node_id: "L0-uwbw-cx01"
source_channel: "rollout"
analysis_version: 10
title: "CX-uwbw-01 · ADR-ubfl's \"exactly 14 through `raiseHit`\" vs what `raiseHit` does"
aliases: ["L0-uwbw-cx01"]
is_a: ["contradiction"]
part_of: ["L0-uwbw"]
relates_to: ["L0-uwbw"]
priority: 640
size_chars: 1830
tags: ["v10", "underwater-bow", "status:resolved", "resolved-by:L0-adr-ubfl@reduce-v10", "code-vs-adr", "damage"]
level: 2
---
# CX-uwbw-01 · ADR-ubfl's "exactly 14 through `raiseHit`" vs what `raiseHit` does

**Links.** relates_to: L0-adr-ubfl, L0-strm, L0-uwbw-r003, L0-uwbw-adex, L0-xasm38.

**Side A.** The planning documents describe the armed hit as a rewrite to exactly 14 through `raiseHit`:
- `L0-adr-ubfl` §3: "the hurt before-event rewrites the hit to exactly 14 before armour, through `strm` `raiseHit` with an opt-in `causes: [projectile]`";
- the plan row says the same;
- `xasm38` says the 14 **replaces** vanilla arrow damage.

**Side B, verified in code** (`src/storm/damage.ts:315-345`). `raiseHit(event, damage)` is the Storm Blade's **additive** passive:
1. It returns early unless `damageSource.cause === entityAttack`. It has no `causes` parameter, so a projectile hit is never raised.
2. It computes `bonus = afterArmour(damage, defence)` and plans `event.damage + bonus`. The hit *grows* by 14; it does not become 14.

Called as the ADR says, even with a `causes` opt-in, an armed arrow would deal vanilla arrow damage + 14 (for example 9 + 14 at full draw), not the 14 that C-29 and `xasm38` require.

**Impact.** This changes the `strm` seam. A `causes` option alone is not enough; a *replace* mode is needed (`L0-uwbw-adex`). The Storm Blade's behaviour must not move (plan reduce seam: "`raiseHit`'s projectile cause is opt-in only").

**Proposed resolution** (for reduce, not self-applied to ADR-ubfl):
- Split the shared core of `raiseHit` (defence read, `planRaise` lethal/totem handling, report and emit) into an internal function.
- Add `setHit(event, preArmour, {causes})`, which targets `afterArmour(preArmour)` as the absolute post-armour damage.
- Leave `raiseHit`'s signature and behaviour unchanged.

**Closes when** ADR-ubfl §3 is amended to name `setHit` (or equivalent), and probe row 5 confirms the exact readings.

**Resolved at reduce v10.** `L0-adr-ubfl` §2–§3 were amended in place to name the replace-mode `setHit` (`L0-uwbw-adex`) and the tagged-vanilla-arrow default (`L0-uwbw-adfl`). The Storm Blade scenarios gate the merge. Probe row 5 still has to confirm the exact readings on BDS.

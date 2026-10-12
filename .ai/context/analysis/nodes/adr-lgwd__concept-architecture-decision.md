---
type: "concept-architecture-decision"
node_id: "L0-adr-lgwd"
source_channel: "rollout"
analysis_version: 10
level: 1
title: "ADR-L0-lgwd · Widening `lgnd` and `strm` for the Underwater Bow"
aliases: ["L0-adr-lgwd"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 640
size_chars: 2489
tags: ["v10", "underwater-bow", "legendary", "cross-component", "status:accepted"]
---
---
title: "ADR-L0-lgwd · The legendary framework widens for an armed ability without a lgnd re-run"
aliases: ["L0-adr-lgwd", "lgnd widening for armed abilities"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-uwbw", "L0-strm", "L0-magn", "L0-sclk", "L0-adr-ubfl", "L0-uwbw-adex", "L0-uwbw-cons", "L0-xcx33", "L0-xasm38"]
requires: ["L0-lgnd"]
governs_files: ["src/legendary/registry.ts", "src/legendary/cooldown.ts", "src/legendary/hands.ts", "src/storm/damage.ts"]
---
# ADR-L0-lgwd · Widening `lgnd` and `strm` for the Underwater Bow

**Context.** The plan's reduce rule said: record the bow's `lgnd` touch points as an ADR if they stay within def fields plus one HUD key; otherwise schedule a v11 `lgnd` re-run. `L0-uwbw` lists the touch points, and `L0-uwbw-adex` adds a `strm` touch point that the plan did not foresee. As read during reduce at v10:
- `hudKeys` is `{ ready: string; cooldown: string }` (`src/legendary/registry.ts:45`);
- `raiseHit` handles `entityAttack` only and adds to the hit (`src/storm/damage.ts`).

**Decision (accepted at reduce).**
1. **The HUD.** `hudKeys` gains an optional `armed?: string`. The seven shipped defs do not set it and render as before.
2. **The cooldown start.** Def #8 does **not** claim Use through `resolveActivation`. The bow's own module arms on sneak + the start of Use and calls the existing `startCooldown` from the armed hit's after-event. **No new def flag**: a `cooldownOn: "hit"` field is unnecessary while only one def needs it.
3. **The damage.** `src/storm/damage.ts` gains `setHit` beside `raiseHit`. They share an internal core, and `raiseHit`'s signature and behaviour are frozen.
4. **Gates.** Every merge touching (1)–(3) runs these scenarios as distinct criterion sets on the checks server:
   - the `lgnd` legendary scenarios;
   - the `magn` legendary scenarios, now including def #8;
   - the `sclk` legendary scenarios;
   - the Storm Blade scenarios.

**Consequence.** These are one optional field, one call site and one sibling function. **`lgnd` is not re-run at v11.** A second armed legendary would revisit (2) as a def field.

**Rejected.**
- **A v11 `lgnd` re-run.** The change is smaller than the threshold the plan set.
- **Letting `resolveActivation` claim Use for the bow.** Use is the draw; the bow could not shoot (`xcx33`).
- **Changing `raiseHit` to accept projectile causes.** That moves the Storm Blade's contract and still adds rather than replaces (`L0-uwbw-cx01`).

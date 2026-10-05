---
type: "concept-architecture-decision"
node_id: "L0-lgnd-ad07"
source_channel: "rollout"
analysis_version: 7
title: "AD-lgnd-07: As-built framework shape (recorded from code, supersedes parts of ad04/ad05/ad06)"
aliases: ["L0-lgnd-ad07"]
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 530
size_chars: 3163
tags: ["is_a:architecture-decision", "as-built"]
level: 2
---
---
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad04", "L0-lgnd-ad05", "L0-lgnd-ad06", "L0-lgnd-ent1", "L0-lgnd-ent3", "L0-sprj"]
---
# AD-lgnd-07: As-built framework shape (recorded from code, supersedes parts of ad04/ad05/ad06)

**Context.** `LG-CORE-01-AA`, `LG-KEEP-02-AA` and `SC-TGT-01-AA` shipped `src/legendary/` with choices that differ from the pre-code design. This record states what is now true, so downstream nodes do not plan against the old design.

## Decision (as built)
1. **Static registry.** `LEGENDARIES` is a `const` array in `registry.ts`. There is no `registerLegendary()` and no late-registration guard; adding a weapon means editing the array. This supersedes the `ent1` "register at load" invariant.
2. **Busy is a durable deadline.**
   - `setBusy(player, key, durationMs)` writes `andrew:busy_<key>` = now + ms.
   - The Scythe arms it for the volley timeout plus 20 ticks and clears it on every volley end.
   - A crash therefore leaves busy set for at most about one volley timeout.
   This supersedes `ad05` (memory-only `Set`). The failure `ad05` rejected, a permanently stuck busy state, cannot happen because the deadline expires.
3. **Timer keys** are `andrew:cd_<abilityKey>` and `andrew:busy_<abilityKey>`, not `andrew:<prefix>_cooldown_until`. See `cx07`.
4. **No central dispatcher.**
   - Each ability module subscribes to `itemUse` and `playerInteractWithBlock` and does its own per-tick de-duplication.
   - Before acting, it checks `resolveActivation(player)?.def === ownDef`.
   - Priority is still decided once, in `hands.ts`: main if ready and not busy, else off if ready and not busy.
   - A ready main hand that then refuses does not fall through, because the resolver answers before the ability runs. That keeps `ad04`'s semantics.
   - Two copies of one weapon share an ability key. If main is not ready, off is not ready either.
5. **No shims.** `src/websword/{state,cooldown,craftgate,retention,commands}.ts` were removed, and imports point at `src/legendary/`. The commands are per def (`/andrew:websword`, `/andrew:scythe`); there is no `/andrew:legendary`. This supersedes `ad06` and `p007` naming.
6. **One HUD vocabulary.** `andrew.legendary.ready` and `andrew.legendary.cooldown` take the weapon name as `%s`. Ready is shown continuously (decision-resolve-l0-lgnd-cx01). There is no `active` segment while busy: the bar shows "Ready" during a volley.

## Rejected (by the implementation)
- **Memory-only busy.** A plain deadline needs no `playerLeave` cleanup and can be read by the GameTest pack.
- **One dispatcher with ability handlers returning `cast|refused|busy`.** It would have meant rewriting `trap.ts`'s event wiring. Every current consumer shares the resolver, so the priority rule still has a single owner.

## Consequences
- `r001`'s "a weapon module may not subscribe to `itemUse`" is violated by design. Only the *decision* is centralised.
- `ac13`'s "after restart busy is false" becomes "after restart busy expires within its deadline".
- `ac13`'s "HUD shows `active`" does not hold.
- `ac11`'s grep guard needs `registry.ts|recovery.ts|hidden.ts` added.

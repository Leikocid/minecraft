---
type: "concept-architecture-decision"
node_id: "L0-lgnd-ad12"
source_channel: "rollout"
analysis_version: 5
title: "AD-lgnd-12: As-built v1.4.x framework shape (recorded from code, 2026-10-02; supersedes parts of ad09/ad10)"
aliases: ["L0-lgnd-ad12"]
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 580
size_chars: 3665
tags: ["as-built", "v1.4.x", "reconciliation"]
level: 2
---
---
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad07", "L0-lgnd-ad08", "L0-lgnd-ad09", "L0-lgnd-ad10", "L0-lgnd-ad11", "L0-xcx9", "L0-xcx10", "L0-xcx11", "L0-lgnd-cx09", "L0-lgnd-cx10", "L0-lgnd-cx11"]
---
# AD-lgnd-12: As-built v1.4.x framework shape (recorded from code, 2026-10-02; supersedes parts of ad09/ad10)

**Context.** Since `ad07`, the `src/legendary/` commits are:
- `3dfcc84` GEN-01
- `26784ba` FIREPROOF-01
- `9fc3d34` CRAFTGATE-01
- `b71f826` OFFHAND-01
- `8ffe8fd` PROTECT-01
- `f7488d6` RETAIN-01
- `f77976c` DELTA-01
- `160efc8` ORBC-ITEM-01
- `5a68b84`, the v1.4.2 fix "a legendary destroyed in the tick it appeared is no longer lost"
- `d600743`, the drop-swing quickfix

This record states what is true in code, so planners stop reading v3 "not started" text.

## Shipped (verified in code)
| v3 item | As built |
|---|---|
| gen guard | `bumpGen`/`ledgerGen`/`isLive`/`isStale` (`state.ts:71-96`); stale stacks voided in inventory and off hand (`retention.ts:126-163`) |
| owed list | `OwedLedger` with `withOwed`/`withoutOwed` (`rules.ts:176-228`) |
| off-hand read | `offhandOf`/`setOffhand` (`state.ts:166-188`); all three item JSONs declare `minecraft:allow_off_hand` |
| pending list | `parsePending`/`withPending` (`rules.ts:128-158`); every marked copy is retained (RETAIN-01) |
| craft tokens | `defForToken`, `tokenDecision` (`registry.ts:98`, `rules.ts:65`) |
| third def | `ORBITAL_CANNON` in `LEGENDARIES` (`registry.ts:70-87`) |
| prevent tier | `protectLegendariesIn(dimension, volume, {avoid, reason}) → {moved, handedBack}` (`recovery.ts:550`), over `HOLDER_TYPES` **blocks** plus ground items; frames broken open with `setblock … destroy` |
| ring drop-suppression exemption | `isLegendaryItemEntity(entity)` (`recovery.ts:636`), for live marked `minecraft:item` only |
| fire/lava | **prevented, not returned**: `minecraft:fire_resistant` on all three items (FIREPROOF-01; GameTests `legendary_survives_fire`/`_lava`). Return tier 3 now covers only cactus, vanilla TNT, despawn and the Void. |
| same-tick loss | **Departure tracking** (`inFlight`, `recovery.ts:106-320`): an instance that leaves a player's slot right after a drop swing (±2 ticks) is resolved after a grace period. The search covers watched entities, every player's inventory and off hand, and **block** containers in a box around the departure cell. If it is found nowhere, it is lost and returned. A departure with no swing is never a loss (a shulker item or ender chest store). |

## NOT as designed
1. **No `holder`.** Neither `state.ts` nor `rules.ts` has a holder field. `lost()` and the protect hand-back target `mark.owner` (`recovery.ts:440`, `:748`), and owed is keyed by owner. `ad11`, `ac18` and the holder clauses of `ac01`/`ac08`/`ac09` are **unbuilt**. `L0-xcx11` stays open.
2. **No `mode` on the resolver.** `resolveActivation(player)` (`hands.ts:35`) is Use-priority only. The Cannon applies "LMB is main-hand only" itself (`orbital/activation.ts:123-126`), and stops a second activation in the same tick with a per-player `lastActivationTick` latch (`:129`). That supersedes `ad09` items 1, 2 and 5, and it is the latch `ad09` rejected (c). Priority still has one owner, `hands.ts`. `ac16`'s `resolveActivation(P, "attack")` reads as `activate(P, "lmb")`.
3. `isLegendaryItemEntity` is mark-based, and there is **no stack-level predicate**. `ad13` adds one.

**Rejected.** Rewriting the v3 artifacts as if they were built. That hides the unbuilt holder from the planners.

**Consequence.**
- `L0-xcx9` and `L0-xcx10` close against code and GameTests.
- `L0-xcx11` narrows to the target field only (`cx11`).

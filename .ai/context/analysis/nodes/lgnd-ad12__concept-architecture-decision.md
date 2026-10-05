---
type: "concept-architecture-decision"
node_id: "L0-lgnd-ad12"
source_channel: "rollout"
analysis_version: 7
title: "AD-lgnd-12: As-built framework shape up to 1.4.4 (recorded from code 2026-10-03; supersedes parts of ad09/ad10)"
aliases: ["L0-lgnd-ad12"]
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 600
size_chars: 2800
tags: ["v6", "as-built", "as-built-1.4.4"]
level: 2
---
---
is_a: ["architecture-decision"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad07", "L0-lgnd-ad08", "L0-lgnd-ad09", "L0-lgnd-ad10", "L0-lgnd-ad11", "L0-lgnd-ad13", "L0-xcx9", "L0-xcx10", "L0-xcx11", "L0-lgnd-cx09", "L0-lgnd-cx11", "L0-lgnd-cx14"]
---
# AD-lgnd-12: As-built framework shape up to 1.4.4 (recorded from code 2026-10-03; supersedes parts of ad09/ad10)

**Context.** The `src/legendary/` commits are:
- GEN-01 `3dfcc84`
- FIREPROOF-01 `26784ba`
- CRAFTGATE-01 `9fc3d34`
- OFFHAND-01 `b71f826`
- PROTECT-01 `8ffe8fd`
- RETAIN-01 `f7488d6`
- DELTA-01 `f77976c`
- ORBC-ITEM-01 `160efc8`
- the same-tick-loss fix `5a68b84`
- the drop-swing quickfix `d600743`
- the UFO `isLegendaryStack`
- **1.4.4:** the Void-minecart holder return (`2c1a383` tests, `83b9ffd` fix, merge `0a9d2b5`)

## Shipped (verified in code)
| Item | As built |
|---|---|
| gen guard | `bumpGen`/`isLive`/`isStale` (`state.ts`); stale stacks are voided in the inventory and the off hand |
| owed and pending lists | `OwedLedger`, `parsePending`/`withPending` (`rules.ts`) |
| off hand | `heldLegendaries` reads both hands (`hands.ts:18`); every item JSON has `allow_off_hand` |
| hand priority | `resolveActivation(player)` (`hands.ts:35`): main if ready and not busy, else off. **No `mode`.** |
| craft tokens | `defForToken` (`registry.ts`), with the gate in `craftgate.ts` |
| type predicate | `isLegendaryStack` over `LEGENDARY_TYPE_IDS`, which is built from `LEGENDARIES` |
| prevent tier | `protectLegendariesIn` (`recovery.ts:587`) over the `HOLDER_TYPES` blocks plus ground items |
| fire and lava | prevented by `fire_resistant` |
| same-tick loss | departure tracking (`inFlight`); it opens only after a `DropItem` swing |
| Void holder | `VOID_HOLDER_TYPES` = `chest_minecart`, `hopper_minecart` (`recovery.ts:135`). `beforeEvents.entityRemove` below the floor collects the live marks, and `system.run` calls `lost()` for each |
| chunk unload | a watched entity whose chunk is unloaded is re-watched via `entityLoad`, not lost (`recovery.ts:326`) |

## NOT as designed (still true)
1. **No `holder`.** `lost()` returns to `w.mark.owner` (`recovery.ts:477`). The protect hand-back and the owed list use `mark.owner` (`:785-787`). `ad11`, `ac18` and the holder clauses of `ac01`/`ac08`/`ac09` are unbuilt, and `L0-xcx11` stays open.
2. **No `mode` on the resolver.** The Cannon's LMB rule and its per-player same-tick latch stay in `orbital/activation.ts`. This supersedes `ad09` items 1, 2 and 5. The Katana does not need `mode`: it is Use only.
3. **Armour stand in the Void** is not covered (`cx14`).

**Rejected.** Rewriting `ad09`/`ad11` as if built.

**Consequence.**
- `L0-xcx9` and `L0-xcx10` are closed.
- `L0-xcx11` is narrowed to the target field.
- A minecart Void loss is now in tier 3 (return).

---
type: "concept-architecture-decision"
node_id: "L0-trdt-adcl"
source_channel: "rollout"
analysis_version: 9
title: "ADR-trdt-adcl · The custody ledger and the exact lgnd touch points (settles `L0-xcx30`)"
aliases: ["L0-trdt-adcl"]
is_a: ["architecture-decision"]
part_of: ["L0-trdt"]
relates_to: ["L0-trdt"]
priority: 630
size_chars: 3986
tags: ["above-water-trident", "custody", "lgnd-touch-points", "settles:xcx30", "status:proposed"]
level: 2
---
# ADR-trdt-adcl · The custody ledger and the exact lgnd touch points (settles `L0-xcx30`)

**Links.** is_a: architecture-decision. relates_to: L0-adr-twth, L0-xcx30, L0-xasm32, L0-lgnd, L0-magn, L0-trdt-ecus, L0-trdt-pfbk.

**Context.** While a copy flies or returns, it is an entity that `lgnd` does not guard. `lgnd` already has a generation ledger (`state.ts`: `bumpGen`, `isLive`). Any stale copy is voided on sight (`voidStale`, `watch()`). Its private `lost()` (`recovery.ts`) bumps the generation and then does one of two things:
- it `grant`s the copy to the mark's holder when they are `reachable` (online and alive);
- otherwise it writes the per-def **owed** ledger, which `redeemOwed` pays out on the next `playerSpawn`.

That one function already covers delivery to a dead holder and to an offline holder.

**Decision.**
1. **Custody record** (`L0-trdt-ecus`):
   - It lives in a world dynamic property owned by `src/trident/custody.ts`.
   - It is keyed by a `throwId`, which every custody entity also carries as an entity dynamic property.
   - It does not rely on `Entity.id` staying the same across a restart.
2. **Order inside one sync block:**
   1. write the record (with the mark and its look);
   2. clear the hand slot;
   3. spawn and launch;
   4. store the `entityId`.

   If the turn dies before step 2, the record exists and the copy is still in the hand. Fallback delivery then bumps the generation, so the held copy goes stale and is voided. That leaves exactly one live copy.
3. **Normal return:**
   - It re-inserts an in-memory clone of the thrown `ItemStack`, scrubbed. The order is: the selected slot if it is empty, then `addItem`, then `spawnItem` at the feet (a marked drop is protected by `recovery.watch`).
   - The insert, the entity removal and the record deletion happen in one sync block.
   - A mark that is not live at arrival is never inserted.
4. **Every fallback** (offline, dead, other dimension, entity unresolvable or removed, caps, restart) calls `deliverToLastHolder(def, record.mark, how)`.
   - Unmarked Creative copies are inserted only into an online, alive thrower. Otherwise they are dropped at the last entity position, or lost, as vanilla does to unmarked copies.

**lgnd touch points (complete list).**

| # | Where | Change | Proof |
|---|---|---|---|
| T1 | `registry.ts` | `TRIDENT` def entry plus `LEGENDARIES` | lgnd scenarios with def #7 |
| T2 | `recovery.ts` | **export** `lost` as `deliverToLastHolder`, body unchanged | custody fallback scenarios |
| T3 | `recovery.ts` departure watch (`inFlight`) | none: it is resolved only with a DropItem swing within `DROP_SWING_WINDOW_TICKS`, so a release is ignored | throw, then 40 ticks with no `left an inventory` log and no extra copy |
| T4 | `retention.ts` `entityDie` | none: the slot is empty, so nothing is stashed | thrower dies mid-flight |
| T5 | `recovery.ts` `watch()` | none: types other than `minecraft:item` are skipped | stale-entity restart scenario |
| T6 | `ufo/magnet-select.ts` | none: ground items are `minecraft:item` only, and holders need a `hasitem` tag or an iron type | magnet legendary scenarios with def #7 and a custody entity in the zone |
| T7 | `state.ts` helpers (`getMark`, `withLook`, `isLive`, `markItem`, `isItemOf`) | read-only reuse | unit tests |

This is the delivery entry point plus no scan exclusion. `xasm32` is widened by one export, as `xcx30` allows. The craftgate refund is a separate change (`L0-trdt-cx01`).

**Rejected alternatives.**
- **Putting the copy into the owed ledger at throw time and redeeming it on return.** `redeemOwed` runs only on spawn, and an owed entry shows as debt in `lgnd` diagnostics while the trident is in flight.
- **Adding a `custody` place to lgnd's "is there a copy" logic.** It needs new scan hooks in recovery, retention and magnet, which breaks `xasm32` beyond `xcx30`'s allowance.
- **Trusting `Entity.id` across a restart.** It is unverified; the `throwId` property costs nothing.

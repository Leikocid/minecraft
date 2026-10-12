---
type: "concept-contradiction"
node_id: "L0-xcx30"
source_channel: "rollout"
analysis_version: 10
level: 1
title: "CX-L0-30 · An in-flight legendary vs the framework invariant"
aliases: ["L0-xcx30"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 630
size_chars: 2104
tags: ["v9","above-water-trident","status:resolved","scope-overlap","framework-invariant","resolved"]
closed_at: 2026-10-11
closed_reason: resolved_by_decision
closed_by_ref: decision-resolve-l0-xcx30
---

---
title: "CX-L0-30 · An in-flight legendary vs the 'def entry only' framework invariant"
aliases: ["L0-xcx30", "Trident custody vs lgnd"]
is_a: ["contradiction"]
part_of: ["L0"]
relates_to: ["L0-trdt", "L0-lgnd", "L0-magn", "L0-xasm32", "L0-adr-twth", "L0-adr-trlg", "L0-trdt-adcl"]
see_also: ["abovewatertridentspecv1ruen-part-1", "abovewatertridentspecv1ruen-part-2"]
governs_files: ["src/legendary/retention.ts", "src/legendary/recovery.ts", "src/legendary/craftgate.ts", "src/legendary/state.ts", "src/legendary/registry.ts"]
target_node: "L0"
status: resolved
---
# CX-L0-30 · An in-flight legendary vs the framework invariant

**Status: resolved at the v9 reduce by `L0-adr-trlg`.**

**Invariant (v7/v8, `xasm32`):**
- A new legendary adds one `registry.ts` entry plus its `main.ts` subscriptions.
- `lgnd` guards a copy in an inventory slot, in a container, or as a dropped item entity.

**The trident spec (§02, §03)** throws the weapon and forbids duplicates, loss, and a held copy plus an in-flight copy at once. While the copy flies or returns, it is a projectile or a return entity, which is none of the places `lgnd` guards. The open cases were:
- death mid-flight;
- the thrower logging off;
- the Void;
- a chunk unload with a stale entity that reloads;
- "is there a copy" scans.

**Resolution.** `L0-trdt-adcl` names the complete touch-point list T1–T7:
- **T1:** the def entry.
- **T2:** an export of the private `lost()` as `deliverToLastHolder`, body unchanged. It already covers a reachable holder (grant) and an unreachable one (owed, redeemed on spawn).
- **T3–T6 need no code.** The departure watch needs a DropItem swing, retention finds an empty slot, and `watch()` and the magnet skip anything that is not `minecraft:item`. Each has a named GameTest.
- **T7:** read-only reuse of the `state.ts` helpers.

That is a delivery entry point and **zero** scan exclusions, within the stated allowance, so `lgnd` is not re-run at v10. A stale custody entity is handled on the trident side: the `throwId` has no record, so it is removed, and the generation bump voids any stale copy.

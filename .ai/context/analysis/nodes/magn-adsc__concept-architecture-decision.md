---
type: "concept-architecture-decision"
node_id: "L0-magn-adsc"
source_channel: "rollout"
analysis_version: 5
title: "ADR magn-adsc · One `getBlocks` when the zone is fully loaded; otherwise one call per loaded chunk column"
aliases: ["L0-magn-adsc"]
is_a: ["architecture-decision"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 1430
tags: ["is_a:architecture-decision", "status:proposed", "U7", "C-5d", "C-12", "relates_to:L0-xasm16"]
level: 2
---
# ADR magn-adsc · One `getBlocks` when the zone is fully loaded; otherwise one call per loaded chunk column

**Context.**
- C-5d and UFO §11 ask for **one** `getBlocks` with `includeTypes` at magnet-on (U7: 101 × 101 × 61 in 9 ms).
- C-12′ asks to skip unloaded chunks silently.
- U7 ran on a fully loaded area. A `getBlocks` volume that touches an unloaded chunk is expected to throw (unprobed).
- The target may have walked away during the 20 s arrival, leaving part of the r 50 zone unloaded.

**Decision.**
1. Test every 16 × 16 chunk column that intersects the zone box with `dimension.isChunkLoaded`. There are about 49 columns.
2. If all are loaded, make **one** `getBlocks(box, {includeTypes})` call, as the spec says.
3. If not, call `getBlocks` once per loaded column, at most 49 calls. Total cells never exceed the single call's.
4. Wrap each call in try/catch; a throw skips that column.
5. Filter all results by the cylinder.

**Rejected alternatives.**
- **Always one call, with the error ignored.** Any unloaded chunk would lose the whole block, container and ore scan.
- **Per-column calls always.** That adds avoidable overhead in the common case.
- **Spreading the scan over ticks with `runJob`.** Starting it stalls 15–30 ms (C-5d), and the selection must be atomic.

**Probe owed.** Whether `getBlocks` throws, or silently skips, on unloaded chunks in 2.10.0. If it skips, step 1 collapses to the single call.

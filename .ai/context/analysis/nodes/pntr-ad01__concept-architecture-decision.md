---
type: "concept-architecture-decision"
node_id: "L0-pntr-ad01"
source_channel: "rollout"
analysis_version: 3
title: "ADR-pntr-1 · Per-cell scan + `setType` in one top-down `runJob`"
aliases: ["L0-pntr-ad01"]
is_a: ["architecture-decision"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 1680
tags: ["title:ADR-pntr-1 · Per-cell scan + setType in one top-down runJob", "is_a:architecture-decision", "status:proposed", "relates_to:L0-adr-ochg", "relates_to:L0-pntr-p002", "relates_to:L0-pntr-cons"]
level: 2
---
# ADR-pntr-1 · Per-cell scan + `setType` in one top-down `runJob`

**Status:** proposed.

**Context.**
- Removal must look instant (Orbital §9, AC-10) and stay inside the tick budget (C-5a′).
- Each cell needs its own decision: keep list, liquid, waterlogged, or container needing legendary protection.
- Orbital §12 recommends "compute the list and remove in batches".

**Decision.**
- One `system.runJob` generator per attack.
- It visits the planned cells top-down and calls `getBlock`, `classify` and the action for each one.
- It yields every N cells, starting at N = 512 and tuned on BDS.

**Rejected alternatives.**
1. **`dimension.fillBlocks(volume, air, {blockFilter: {excludeTypes: KEEP ∪ liquids}})` per band row.** This is natively fast and stable in 2.10.0. But it would turn waterlogged blocks into air, deleting water against §9, and it gives no hook for legendary protection in containers. It is kept as an **optimisation candidate**: a hybrid where the per-cell pass handles only containers and waterlogged cells and `fillBlocks` handles the rest. Adopt it only if the probe in `L0-pntr-as03` fails PN-1.
2. **A synchronous loop in the detonation tick.** Up to ~9,600 `setType` calls in one tick risks a multi-hundred-ms spike (C-5a′) and hurts multiplayer (C-15 rank 3).
3. **Removal paced to the 1 s particle wave.** It looks cinematic but contradicts §9 ("all blocks removed at once; the wave then passes").
4. **`/fill … replace` via `runCommand`.** It has the same waterlogging and container problems as option 1, and commands are harder to budget.

**Consequences.** The per-cell cost dominates. Throughput is assumption `L0-pntr-as03` and must be measured.

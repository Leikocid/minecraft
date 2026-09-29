---
type: "concept-component"
node_id: "L0-pntr"
source_channel: "rollout"
analysis_version: 3
title: "LMB penetrator (`pntr`)"
aliases: ["L0-pntr"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 540
size_chars: 3728
tags: ["title:LMB penetrator — the ~5×5 column effect", "is_a:component", "relates_to:L0-orbc", "relates_to:L0-lgnd", "relates_to:L0-ring", "relates_to:L0-adr-ochg", "relates_to:L0-xasm6", "relates_to:L0-xcx10", "see_also:orbitalcannonspecv1ruen-part-2", "see_also:orbitalcannonspecv1ruen-part-3", "see_also:orbitalcannonspecv1ruen-part-4", "not-implemented", "stage5"]
level: 1
---
# LMB penetrator (`pntr`)

**Status.** Analysis only. `src/orbital/` does not exist yet (checked 2026-09-29). Stage 5 order: `lgnd` delta → `orbc` → **`pntr`** → `ring`.

## Responsibility
This component is the *effect* half of the Orbital Cannon's LMB mode (Orbital §9, §12; ACs 7–10). `orbc` owns input, the target lock, the cooldown, the charge entity, its fall and the detonation. `pntr` starts when `orbc` calls `onDetonate(dimension, point, ownerId, mode="lmb")` and owns everything after that:

1. **Plan** an irregular, roughly 5×5 vertical column. It runs from the detonation cell down to `dimension.heightRange.min` (`L0-pntr-r001`).
2. **Classify** each cell as *keep* (air, liquids, Survival-unbreakable; `L0-pntr-r002`) or *remove* (everything else, including Obsidian, Nether portal, containers and spawners; `L0-pntr-r003`). A kept cell never ends the column.
3. **Protect legendaries** in container cells before removal through `lgnd`'s `protectLegendariesIn` (`L0-pntr-r005`).
4. **Remove** the blocks with no drops (`L0-pntr-r004`), batched top-down in one bounded `system.runJob` job that looks instant (`L0-pntr-p002`, `L0-pntr-cons`).
5. **Present** the effect with exactly one loud explosion sound at detonation and a ~1 s top-down particle wave (`L0-pntr-p003`).
6. Deal **no direct damage** (`L0-pntr-r006`). Fall, lava and suffocation happen naturally.

## Inputs
- From `orbc`: `dimension`, the integer detonation `point` (the solid cell the charge touched, or the cell it spawned inside), `ownerId` and `attackId`. The attack id seeds the irregularity.
- From `lgnd`: `protectLegendariesIn(dimension, volume, {avoid})`, specified in `L0-lgnd-p008` under the shared contract `L0-adr-oprt`. `pntr` passes the column footprint over its full height, once per attack, before its first `setType`. Item frames in the column are handled by `lgnd` (`L0-adr-oprt` §3).
- Engine: `dimension.heightRange`, `Dimension.getBlock`, `Block.setType`, `Block.isWaterlogged`/`setWaterlogged`, `BlockInventoryComponent`, `Dimension.playSound`, `Dimension.spawnParticle`, `system.runJob` (all stable in 2.10.0).

## Outputs
- World mutation: column cells set to `minecraft:air` (or to water for waterlogged cells; `L0-pntr-as04`).
- Legendaries from column containers, re-dropped outside the column by `lgnd`.
- One sound event, a bounded particle job and an optional debug/gametest report `{attackId, cellsScanned, cellsRemoved, cellsKept, ticksUsed}`.
- No entities of its own. `pntr` spawns nothing that outlives the attack (C-19).

## Not owned here
- Cooldown, target lock, the charge's look and fall, the Void and unload rules: `orbc`.
- Loss return, the craft gate and the holder field: `lgnd`.
- The TNT-like explosion, damage and drop suppression: `ring`. `pntr` never calls `createExplosion` (`L0-adr-ochg` §4).

## Key decisions and open items
- `L0-pntr-ad01`: a per-cell scan plus `setType` in one top-down `runJob`, rather than `fillBlocks` or a synchronous loop.
- `L0-pntr-ad02`: a deterministic seeded mask with a 3×3 core that is always removed and ragged rims that change per band.
- `L0-pntr-ad03`: a particle wave as a separate 20-tick bounded job with capped emitters.
- `L0-pntr-cx01` (open): legendaries in **item frames** cannot be protected on stable 2.10.0.
- Assumptions `L0-pntr-as01`…`as08` cover things to probe on BDS, such as throughput, container spill, liquid flow and waterlogging.

## Sibling overlap
- `ring` shares the charge contract and the legendary protection call, but has opposite block rules: `ring` follows TNT resistance, while `pntr` ignores it.
- The `xasm6` keep list is `pntr`-only. `ring` needs no list because the engine explosion enforces resistance.
- Structure blocks (C-13) are ordinary, so LMB can core the Warden City monument (Reinforced Deepslate is removed under `xasm6`) and structure chests. Structure persistence rules allow this.

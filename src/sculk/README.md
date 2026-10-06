# Sculk Crossbow

`registerSculkCrossbow()` (`index.ts`) arms the bolt pipeline, the block-hit crater and the entity hit. `src/main.ts` and the GameTest pack each arm their own copy:
the release pack reads no owner on a SimulatedPlayer's arrow, so the GameTest copy is the one the scenarios drive.

## `bolt.ts` — shot → bolt, flight, trail, expiry (`L0-sclk-p002`, `p003`, `ent2`, `ent3`)

**The swap.** `world.afterEvents.entitySpawn` for a `minecraft:arrow` is the trigger. There is no `projectileShoot` in
2.10.0, and the arrow spawns in the press tick with its owner and velocity readable (probe P1, 16/16). The swap happens
when the owner is a `Player` holding a live `andrew:sculk_crossbow` in the **main hand** (`heldLegendaries`, so a stale
copy does not fire bolts). In the same tick it:
1. spawns `andrew:sculk_bolt` at the arrow's location;
2. sets the arrow's owner on it and shoots it with the arrow's velocity (`uncertainty` 0);
3. removes the arrow.

The bolt is spawned first, so an engine refusal leaves the vanilla arrow flying instead of eating the shot. An arrow with no
readable owner (a dispenser's, a skeleton's) is not ours and is left alone silently.

**`BoltRecord`.** It lives in a module `Map` keyed by the bolt's id and is never persisted (`L0-sclk-ad03`). Its fields:
- the owner's id and name;
- the dimension;
- a 32-bit `seed`, logged at launch;
- `bornTick`;
- the velocity as shot;
- `volleyId` / `volleyIndex`;
- `lastPos`.

A record ends **once**, as one of `entity` / `block` / `expired`. The hit handlers delete the record before anything acts, so a
second event for the same bolt is a no-op (`R-sclk-001`). `observeBolts(fn)` hands every launch, trail segment and ending
to its observers. The damage, crater and sculk tasks hang off those endings. This module only reports what the bolt hit.

**The entity** (`packs/behavior/entities/sculk_bolt.json`) is the probe's `bolt_roh`, measured in P2:
- runtime `minecraft:snowball`;
- gravity 0.05, inertia 0.99, liquid inertia 0.6 — the arrow's own values, path Δ 0.00 over 10+ ticks;
- `impact_damage` 0 without knockback, plus `remove_on_hit`;
- `damage_sensor` all → no;
- format 1.26.0 and no `minecraft:pushable`.

The RP (`packs/resource/entity/sculk_bolt.entity.json`) is an echo-shard billboard on the vanilla item-sprite
geometry. How it looks is an iPad check (`L0-sclk-ac23`).

**The loop.** One `system.runInterval(step, 1)` serves every bolt (deviation 4). It is created by the first launch and cleared when the
last record ends, so with no bolt in the air the module runs nothing periodic (`K-sclk-1`). It is never a `runJob`. Each
tick, for each record:
1. **Gone.** The entity has been invalid for 2 steps with no hit event → `expired gone`. The grace exists because a bolt
   that `remove_on_hit` takes off reads invalid in the interval before that tick's hit event reaches the script. Without
   it every wall hit ended as `gone` (measured: all four hits in the first run).
2. **Void.** `y < heightRange.min` → `expired void`.
3. **Unloaded.** The bolt's chunk, or the chunk of `location + velocity`, is not loaded → `expired unloaded`. The y of
   both reads is clamped into the dimension.
4. **Lifetime.** Age ≥ `BOLT_LIFETIME_TICKS` = 100 → `expired lifetime`.
5. **Stalled.** The bolt kept its exact position for 2 steps → `expired stalled` (deviation 3).
6. **Trail.** Otherwise, if the bolt moved, the trail is drawn on `lastPos → location`: ⌈segment length⌉ points, at most
   `TRAIL_PER_TICK` = 3. The particle is `minecraft:sonic_explosion` (`L0-sclk-ad02`).

A hit draws the last segment, to the hit point, before its ending. An expired bolt is removed and has no outcome: no
damage, no crater, no sculk.

**Reload.** A bolt that comes back through `entityLoad` is removed on sight, whether or not it has a record (C-23).

### Deviations (C-16)

1. **Multishot is fanned by the script.** The custom shooter's native Multishot fires three arrows in one tick for one arrow
   of ammo, but with no fan: yaw spread under 1°, all three in one cell (probe P1). The n-th arrow one owner fires in one
   tick is turned by `MULTISHOT_YAW_DEGREES` = 0 / −10 / +10° about the vertical axis. Speed and the vertical component
   are kept. Each of the three is its own bolt with its own record.
2. **The bolt keeps `remove_on_hit`.** `L0-sclk-ent2` leaves it out and has the script remove the bolt. Measured (probe
   P2/P2c): without it the bolt passes through the target, walls and bedrock, raising one event per block.
3. **"Leaving the loaded chunks" also covers chunks that are loaded but no longer ticked.** `L0-sclk-p003` checks only
   that the chunk is loaded.
   - Measured in the End: a level bolt stopped at 65 blocks, inside a chunk `isChunkLoaded` called loaded. It hung there
     until the lifetime cap took it at age 100, drawing a ring in place every tick.
   - Past the simulation distance a chunk keeps its entities but does not tick them. A ticked bolt always moves:
     gravity alone moves it, and so does water. So a bolt that keeps its exact position for 2 steps has left the
     simulated area, and it is removed with no outcome.
4. **The interval is the module's own.** `L0-sclk-p003` drives the bolts from "the add-on's shared `runInterval`", but no
   such interval exists: the only add-on-wide one is the HUD's, every 10 ticks, and it runs whether or not anyone
   shoots. The bolt loop is one interval for every bolt, alive only while a record is or while a rider has work.
   The carve queue rides it (`rideBoltLoop`), so the interval outlives the last bolt only while a crater is still
   queued.
5. **A block hit carries a snapshot, not the live `Block`.** The `block` of a `block` event holds the type, cell and
   dimension read in the hit tick (`HitBlock`). A live `Block` read a tick later would already show the crater: the
   hit cell is always carved.

## `carve.ts`, `crater-plan.ts` — block hit → crater and sculk (`L0-sclk-p005`, `adr-sctr`, `ad04`, `ent4`, `r003`, `r004`, `r010`)

**The plan** (`crater-plan.ts`, pure, `tests/sculk-carve.test.mjs`) is made in the hit tick from the impact cell, the
hit face and the bolt's `seed`. The face plane spans a 5×5 footprint; layer `k` is `k` cells into the block from the
impact cell.
- **Crater.** Each of the 25 columns gets a depth 0–3 from an ellipsoid with semi-axes ≈ (2.5, 2.5, 3). Each column's
  radius is jittered ±20 % and its depth ±0.5 by `seed`. The inner 3×3 is always ≥ 2 deep, so the impact cell and the
  one behind it always go. If no column came out at 0, one corner is set to 0, so the footprint is never a full 5×5.
  Cells that are air, liquid, on the deny list or unloaded are left out. A bolt whose impact block is kept, liquid or
  unloaded carves nothing (`p005` step 1).
- **Sculk.** Corners never get sculk, and about 30 % of the rest of the outer ring is left bare by `seed`. In every
  other column the search comes in from 3 cells outside the face, treating planned crater cells as air. It stops at
  the first cell that is not air or passable. That cell turns to sculk if it is a solid full block and the cell before
  it is air or passable, and its layer is −2 or deeper. So the crater floor and the rim turn to sculk, and the crater
  walls stay as they are.

**The queue** (`carve.ts`). One job per hit, FIFO, crater cells before sculk cells. Each job drains on the bolt
interval at `CARVE_BUDGET_PER_TICK` = 300 cells a tick across all jobs. SCLK-PROBE-01 §4 measured 300 `getBlock` +
`setType` at 6–16 ms, with ticks staying at 50–55 ms and first stretching at 2400. A hit runs what the tick's budget
allows inline, so a single volley lands in the hit tick. Every cell is checked again at write time:
- a crater cell that is now air, liquid, kept or unloaded is skipped;
- a sculk cell that is no longer a solid full block with an exposed face is skipped.

Writes are `Block.setType` only: never `createExplosion` and never `fillBlocks`. `fillBlocks` erases a container's
contents with no spill (probe P4), and its 32 768-cell cap never comes into play here. A job logs
`sculk: crater <bolt> done: crater n/N cells, sculk m/M cells at … seed …`, and `observeCarves` hands the report to
GameTests.

### Deviations (C-16)

1. **"Solid full block" is read from water.** Stable 2.10.0 has no "is solid" query. A cell is `solid` when water
   cannot pass it (`isLiquidBlocking`) and it cannot be waterlogged (`canContainLiquid`). A slab, a stair and a fence
   can be waterlogged, and a flower or a torch lets water through. A block with an inventory, a holder in
   `HOLDER_TYPES`, or a full block with state of its own (`NOT_SCULK`: spawners, jukebox, beehive, piston,
   suspicious sand, …) is never turned to sculk.
2. **lgnd protection runs in every tick a job writes**, not only in the hit tick (`ad04`, `p005` step 4). It covers
   the plan's box plus one layer out of the face. Over a queued job, a legendary dropped into the zone after the hit
   is still taken out first, and so is one lying on the cells about to go.
3. **When lgnd refuses the zone**, nothing was moved: a crafter with no script inventory, a frame that would not
   break, or an unloaded chunk. The holder and frame cells of that job then stay, and the rest is carved (the
   penetrator's PN-5).
4. **Side effects that are the engine's, not the crater's:**
   - a frame anywhere in the zone is broken open by lgnd and its item drops, as with the Orbital rings;
   - a container in a crater cell spills its ordinary contents on `setType` (`xasm25`);
   - a flower on a surface turned to sculk pops as an item (probe P5).
   Carved cells themselves drop nothing.
5. **No entity is touched.** Falling into the crater is a drop of at most 3 blocks, and fall damage on this engine is
   drop − 3. A player on a carved rim column takes none (`sculk_carve_no_damage`).

**Proof.** The node half is `tests/sculk-carve.test.mjs`: bounds over 1000 seeds × 6 faces, determinism, the skip
rules, the budget, FIFO order, protection order, and write-time re-checks. The BDS half is `src/gametest/sculk-carve.ts`:
- `sculk_carve_crater_bounds` (ac11);
- `sculk_carve_no_damage` (ac12);
- `sculk_carve_sculk_survives_reload` (ac13, chunk reload);
- `sculk_carve_keep_list` (ac22);
- `sculk_carve_legendary_survives`.

The shared deny list is `src/terrain/keep.ts` (`tests/terrain-keep.test.mjs`).

## `hit.ts`, `patch.ts` — entity hit → fixed damage and a sculk patch (`L0-sclk-p004`, `r002`, `r004`, `adr-scdm` §3, `xasm24`)

**Damage.** `SONIC_BOOM_DAMAGE` = 10 HP is the Warden's boom on Normal (`xasm23`), the same at every difficulty. Every direct
hit on a living target takes exactly D: absorption first, then health. Armour, Protection and a raised shield do not
reduce it. The mechanism is the one diagnose-CNTR-X22 and -X23 measured; it is not the shipped Scythe pattern:
- the cause is `sonicBoom`. `projectile` throws without a projectile entity, and a raised shield cancels `entityAttack`.
  `sonicBoom` passes armour, Protection and the shield, credits `damagingEntity` (the bolt's owner while it is valid)
  and lets a totem save;
- if hp ≤ D, one `applyDamage(hp + 100)` kills inside a window and through a shield;
- otherwise `applyDamage(D)` gives the flash, the sound and the exact damage. Inside the engine's hurt window (10 ticks
  from the last hit that landed) it takes 0 or the difference, so health is then written to hp − D. The write is made
  **only inside a window the script knows of**:
  - the crossbow's own hits that took health, or that landed on a target with the absorption effect;
  - any `entityHurt` on the target, from any source.

  Outside a window a write would take D a second time from health after `applyDamage` took it from absorption.
  `setWindowWrite(false)` turns the write off. Only the T17 negative control uses it.

**Living** = it has `minecraft:health` and is not a Creative or Spectator player, an armour stand, an end crystal, a boat or
a minecart (`xasm24`). Any other entity hit gets no damage and still gets the patch. A target that is already gone ends
with neither.

**Patch** (`patch.ts`, pure, `tests/sculk-hit.test.mjs`). The patch uses the crater's ragged footprint (`sculkColumns(seed)`):
5×5, no corners, about 30 % of the outer ring bare. It is centred on the target's feet column. In each column it takes the
first cell met coming down from one cell above the feet that is not air or passable. That cell turns to sculk if it is
`solid` and has air or a passable block above it. The search goes at most 6 cells below the feet. So a step beside the
target gets sculk, a wall two high stays bare, and a target 7 or more above the ground gets no patch. The plan has no
crater cells. It rides the carve queue as a `patch` job (`queueCarve`), with the same budget and the same write-time
re-checks, and logs `sculk: patch <bolt> done: …`.

### Deviations (C-16)

1. **A patch runs no `protectLegendariesIn`.** `p004` step 5 queues it "behind" the protect pass. But a patch removes no cell
   and never writes a holder, a frame or a container, so there is nothing to protect. The pass itself would break every
   frame in the box and empty legendaries out of chests next to the target. A frame is a cell, so that would also break
   T10's "no cell removed".
2. **Bolts 2 and 3 of a volley take their D from health, even when absorption is left.** Stable 2.10.0 cannot read
   absorption. Inside the window `applyDamage` takes nothing, so the write is the only way to deal D. It still takes D
   once per bolt, and the first bolt of the window takes D from absorption first.
3. **A plant on a cell that turns to sculk pops**, as it does on the crater's sculk.

**Proof.** The node half is `tests/sculk-hit.test.mjs`. It covers the patch planner over 1000 seeds, and the damage decision
against an engine model built from the X22 measurements: the window, absorption, the shield, the lethal path,
non-living targets and the negative control. The BDS half is `src/gametest/sculk-hit.ts`:
- `sculk_hit_fixed_damage` (ac06, ac07, absorption);
- `sculk_hit_armour_shield` (ac08, with entityAttack controls);
- `sculk_hit_multishot_window` (ac17, a real Multishot volley and its negative control);
- `sculk_hit_only_target` (ac09);
- `sculk_hit_patch_no_crater` (ac10);
- `sculk_hit_kill_credit`.

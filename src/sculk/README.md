# Sculk Crossbow

`registerSculkCrossbow()` (`index.ts`) arms the bolt pipeline, the block-hit crater, the entity hit and the Piercing strip. `src/main.ts` and the GameTest pack each arm their own copy:
the release pack reads no owner on a SimulatedPlayer's arrow and no SimulatedPlayer on an inventory event, so the GameTest copy is the one the scenarios drive.

The legendary rules (one craft, death, hazards, the Void) are `src/legendary`'s, with no crossbow code; `src/legendary/README.md` lists the crossbow's scenarios.

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

## `enchant.ts` — Piercing never stays (`L0-sclk-r005`, `ad01`, `adr-scpi`; T15)

Slot `crossbow` gives the item Quick Charge and Multishot from the vanilla table and anvil, and Piercing with them. Any
`andrew:sculk_crossbow` stack that carries Piercing loses it:
- on `playerInventoryItemChange`, for the slot the event names. This covers `setItem`, `addItem`, a pickup, a chest
  transfer, the craft-token delivery and an in-place `/enchant`;
- on `playerHotbarSelectedSlotChange`, for the newly selected slot and the off hand. No inventory event names the off hand.

The strip reads the live slot, removes `piercing` and nothing else, and writes the stack back with its mark. That write
raises a second event, which finds nothing to strip. It logs `sculk: stripped piercing <level> from <player> …`, and
`observeStrips` hands each strip to GameTests. A vanilla `minecraft:crossbow` is never touched. No XP is refunded.

### Deviations (C-16)

1. **Piercing is removed, not refused.** T15 says Piercing "cannot be applied". What the engine does not allow:
   - stable 2.10.0 has no before-event for an anvil or an enchanting table: `WorldBeforeEvents` has none, and
     `playerInteractWithBlock` can only keep the block from opening, which would also take away the Quick Charge and
     Multishot §8 allows;
   - the slot-`crossbow` item admits Piercing exactly as the vanilla crossbow does (CNTR-SCLK-CX01 §1:
     `canAddEnchantment`, `/enchant`, `enchant_with_levels`).

   So a stack leaves the anvil or the table with Piercing, and loses it in the tick it reaches the inventory (a pickup:
   the tick it is picked up). Measured on BDS (`sculk_enchant_piercing_stripped`): on six entry paths the strip lands
   in the tick of the event that reports the stack.
   - **The cost to the player.** Piercing from a table roll or an anvil book is removed with no refund. The table does
     offer it: `enchant_with_levels 30` put Piercing on the crossbow in 520 of 800 rolls (65 %), and as the only
     enchantment in 154 of 800 (19 %). Over levels 1–30 it was 561/800 (70 %) and 335/800 (42 %) (CNTR-SCLK-CX01 §1,
     §4). A roll of Piercing alone leaves the crossbow bare.
   - **Not measured on BDS:** the anvil and table screens themselves, because a SimulatedPlayer has no container-screen
     API. That a result taken from them reaches the inventory through `playerInventoryItemChange` is an iPad check.
2. **The off hand is stripped on the next hotbar change, not on arrival.** A crossbow put straight into the off hand
   keeps Piercing until its holder changes the hotbar slot (`sculk_enchant_piercing_hand_change`). Piercing never acts
   meanwhile: bolts are fired only from the main hand, and a bolt resolves once (`R-sclk-001`).
3. **Multishot never reaches the strip.** The engine refuses Piercing on a stack with Multishot, and Multishot on a
   stack with Piercing (CNTR-SCLK-CX01 §2: `/enchant piercing` answers success=0; 0 of 2 800 table rolls carried both).
   So a Multishot crossbow passes untouched (`multishot_untouched`, `multishot_enchant_piercing_refused`), and T15's
   "Quick Charge and Multishot stay" is proven on two stacks, not one.

**Proof.** The node half is `tests/sculk-enchant.test.mjs`: the strip itself, the event and hand triggers, the off hand,
no loop on the second event, and the live-slot read. The BDS half is `src/gametest/sculk-enchant.ts`:
- `sculk_enchant_piercing_stripped` (ac15): six entry paths, a Multishot crossbow, a refused `/enchant` and a vanilla control;
- `sculk_enchant_piercing_hand_change`: the off hand, through a hotbar change.

## `packs/resource/attachables/sculk_crossbow.json` — the crossbow in hand and its draw (SCLKUI-CHARGE-01)

**The method is the probe's** (`docs/feedback/probe-crossbow-look.md`): an attachable on the custom id (Q2), driven by
the two draw queries Q3 measured live on `andrew:sculk_crossbow` (the "2а" row of its summary). Nothing else is read.

```
v.draw = (v.loaded > 0) ? 1 : (((q.main_hand_item_use_duration > 0) && (q.main_hand_item_max_duration > 0))
  ? math.clamp(1 - q.main_hand_item_use_duration / q.main_hand_item_max_duration, 0, 1) : 0)
```

`main_hand_item_use_duration` is the engine's own count of the use session's remaining ticks: 24 at +1 … 1 at +24, and 0
from +25, the tick of `complete@+25`, which is when `charge_on_draw` loads the item (`max_draw_duration` 1.25 s). So the
pull grows 0.04 → 0.96 over the draw and, on the tick the charge completes, goes to the loaded state (below), or
home if the session did not load. It has no timer of its own: the
animation is an expression per bone with no keyframes, no length and no `anim_time`. `main_hand_item_max_duration` is
25 throughout.

**The model** (`models/entity/sculk_crossbow.geo.json`) is drawn here, not taken from Mojang. Every face samples one
pixel of the item's own icon, so the colours are the icon's: stock `§3` teal, limbs and butt dark sculk, string `§b`
aqua. It is symmetric across the stock. The draw (`animations/sculk_crossbow.animation.json`) only slides bones toward
the butt by `v.draw` × a fixed distance:
- the string, in 1-px segments, from straight behind the limbs to a V whose centre reaches the latch;
- the limbs, three steps a side, bending back more toward the tips.

There are no rotations, so the draw does not depend on the engine's rotation signs.

**Placement in hand** is not measured: BDS draws nothing, and the probe's kit is not yet seen on the iPad.
- The root bone is bound to the hand slot (`q.item_slot_to_bone_name(c.item_slot)`). The engine takes 24 px off a
  bound bone in y (Bedrock Wiki, Attachables; Mcblend docs), so the grip is modelled at y 24, where the hand pivot
  lands.
- Third person: no transform. The stock points the way the hand faces.
- First person: the stock is turned 90° about x onto the forearm, the way the fist points. Microsoft's attachable
  guide says first person needs its own animation. The angle is derived, not measured.

**Proof.**
- `tests/sculk-crossbow-attachable.test.mjs`:
  - evaluates the attachable's own Molang on the measured sessions: no enchantment, Quick Charge I and III, a
    firing press, and a bow in the main hand;
  - pins the query set and that the animations have no timer;
  - checks the bracket rule: the client binds `&&` tighter than `==`;
  - checks the colours against the icon's pixels, the symmetry, and that the string stays one piece at every draw.
- `scripts/validate.mjs` (`checkAttachables`) resolves the attachable's item, geometry, animations, controller keys,
  bones and texture on every build.

### Deviations (C-16)

1. **No draw animation in the inventory.** The client cannot change a custom item's icon by its state:
   - `minecraft:icon` has no state keys: the parser checks the map (it rejects a map without `default`), and the
     server code compares only `default` and `dyed` (probe Q1);
   - an attachable never touches the icon (Q2);
   - `flipbook_textures.json` is documented for blocks only and has no state field (Q5);
   - `dyeable` gives one second picture and its tint, not frames (Q4).

   Only the hand is animated.
2. **"Loaded" is read from the session's shape, not asked.** For this id no query tells loaded from rest:
   `item_is_charged` reads 0, and `get_animation_frame` reads 0 where the vanilla crossbow reads 4 (Q3). The loaded
   state below and its own deviations follow from that.
3. **A firing press shows one tick of draw.** That press opens a session too (`start@+0 … release@+1`, Q3), so the
   string drops from the latch to 1/25 of the way for one tick, then home.
4. **In the off hand the crossbow follows the main hand's use.** The queries are the main hand's. A bow drawn there
   moves it by 12/72000 (Q3 bow row), i.e. not at all. Other items in use there are not measured.
5. **Quick Charge starts the pull part-way.** Quick Charge shortens the session by 5 ticks a level and leaves
   `main_hand_item_max_duration` at 25, so a QC I draw starts at 0.24 and a QC III draw at 0.64. Each still ends
   with its session (measured, probe report addendum). **Such a copy never loads:** the session ends at +20 / +10,
   before the 25-tick charge gate, and the next press fires nothing (SimulatedPlayer on BDS). This is an open defect
   of the item (`use_duration` = `max_draw_duration`, SCLK-PRESS-01), not of the attachable.
6. **This attachable draws no enchantment glint.** Whether the engine adds one over an attachable is not measured:
   an iPad check.

## The loaded state — a bolt on the stock until the shot (SCLKUI-LOADED-01)

It is the third state of the same attachable, after rest and the draw: the same two queries, the same geometry and
the same render controller. The attachable keeps two readings of `main_hand_item_use_duration` from frame to frame:
`v.ud_first`, the session's first value, and `v.ud_last`, the last frame's. When the value returns to 0:
- the crossbow is shown **loaded** if the session ran out from full length: its last value was ≤ 1 and its first
  ≥ `main_hand_item_max_duration` − 1. That is `complete@+25`, the tick `charge_on_draw` loads;
- a release leaves a larger last value (`release@+k`, ud = 25 − k), and a Quick Charge session starts short (20 / 10),
  so neither shows a load.

Any value above 0 takes the state off. The press that fires a loaded crossbow opens its session in the tick of the
shot (`start@+0` with `bolt@+0`), so the bolt leaves the stock in that tick. A press held on after the shot draws
again and ends loaded, as the engine reloads (an arrow spent, the next tap fires).

While loaded, `v.draw` is 1: the string sits on the latch and the limbs stay bent. The `bolt` bone is shown by
`part_visibility` on `v.loaded`. It has no timer: the variables only hold engine readings, and none is computed from
itself.

**The bolt** (`bolt` bone) is drawn here, from icon pixels like the rest of the model, and reads as the bolt the
crossbow fires, an echo shard:
- a dark sculk shaft on the stock's centre line, nocked on the string held at the latch;
- an aqua shard head standing 2 px out past the front;
- three sculk fins at the back.

There is no wood, flint or white feather of the vanilla arrow.

**Proof.**
- `sculk_look_loaded_sessions` (`src/gametest/sculk-look.ts`) drives the product crossbow on BDS through 12 kinds of
  session and pins each one's shape and the engine's answer: an arrow spent at the load, and a shot on the next tap.
  The sessions are a full draw, releases at +1/+12/+23/+24, a held firing press, a hotbar switch, no arrows in
  Survival and in Creative, Creative with arrows, and Quick Charge I/III.
- `tests/sculk-crossbow-attachable.test.mjs` runs the same shapes through the attachable's own Molang at 1 and 3
  frames a tick. Every session ends in the engine's state except the two below, which are pinned as such.

### Deviations (C-16)

1. **A release one tick short of the charge looks loaded.** `release@+24` (ud = 1) reads like a full draw's last
   tick, and the engine leaves the crossbow empty. The next press fires nothing and takes the look off.
2. **A draw with no arrows in Survival looks loaded.** The custom shooter runs the whole session (`start` ud 25,
   `complete@+25`) and loads nothing: no arrow spent, and the next tap fires nothing. The attachable has no query for
   ammunition. The cause is in the item, not the look: the vanilla crossbow does not draw without arrows. A fix has
   to refuse such a draw and still let a loaded crossbow with no arrows left fire, so it is out of this task.
3. **Whether the look survives the crossbow leaving the hand is not measured.** The engine keeps the load across a
   hotbar switch (measured). The latch lives in the attachable's variables, and BDS cannot show what the client keeps
   when the crossbow is put away and taken back, after a death, a rejoin, or on another player's screen. If the client
   rebuilds the attachable, a loaded crossbow comes back looking empty until its shot.
4. **A Quick Charge copy never looks loaded**, because it never loads (deviation 5 of the draw). If that defect is
   fixed, `sculk_look_loaded_sessions` goes red on `quick_charge_*`, and the full-length check has to follow.
5. **In the off hand the crossbow follows the main hand's sessions** (deviation 4 of the draw). A vanilla crossbow
   drawn in the main hand runs the same 25-tick session, so an off-hand Sculk Crossbow then looks loaded.
6. **Below 20 frames a second the last tick can be missed.** The latch has to see the session's last value, 1. A
   client that skips it sees a real load as empty.
7. **The hotbar icon does not show the load** (deviation 1 of the draw).

### On the iPad (Andrew)

First and third person, Survival, arrows in the inventory:
1. The crossbow is a 3-D crossbow in the hand, pointing forward, not the flat icon.
2. While the press is held, the string slides back into a V and the limbs bend, for 1.25 s.
3. On the charge the string stays on the latch, and a bolt with an aqua shard head lies on the stock.
4. The loaded look holds for as long as you wait, until the press.
5. The press fires, and the bolt is gone from the stock at once.
6. Let go before the 1.25 s are up: the string goes home and no bolt appears.
7. Loaded, switch the hotbar away and back: does the bolt come back (deviation 3)? Then fire to check it was loaded.
8. The hotbar icon does not change.

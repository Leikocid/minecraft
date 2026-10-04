# Dragon Katana

## `plan.ts` — where the jump lands

`planTeleport(player.dimension, A, H, d)` returns the `TeleportPlan` of `L0-katn-ent2`: the trace, the endpoint and the
chosen feet cell, or `feet: undefined` for a refusal (no teleport, no cooldown). It imports `@minecraft/server` for
types only. It reads a dimension through four members (`heightRange`, `isChunkLoaded`, `getBlock`, `getBlockFromRay`),
so `tests/katana-plan.test.mjs` runs it on a fake reader built to the probe numbers below. It never writes a block
(`L0-katn-r002`).

Order (`L0-katn-p001` steps 4–7, `L0-katn-r004`):
1. readability walk;
2. trace;
3. endpoint E;
4. desired feet cell: the cell above the block on a floor hit, `E − eye` otherwise;
5. candidates from nearest. At each 0.5-block step back along the ray, the plan tries the cell, then +1 and +2 up, then
   ±1 to the side. The search stops at the player's own cell.

A candidate is taken if all five hold:
1. it is within 20;
2. it is on the owner's side of the hit face;
3. `standsSafely` holds;
4. a clear ray runs from H to its head cell;
5. it is not the player's own cell.

## `activation.ts` — the press

`registerDragonKatana()` (`index.ts`) arms the input; `src/main.ts` and the GameTest pack each arm their own copy. The
order is `L0-katn-p001`:
1. press: `itemUse` (air) or `itemStartUseOn` (a block), one activation per player per tick;
2. hand: `resolveActivation(player)`; anything but the Katana, or the Katana on cooldown, is a silent no-op;
3. snapshot: A, H, d, rotation and dimension, read once;
4. `planTeleport`; `feet: undefined` is a refusal;
5. `player.teleport(B, { rotation })`, without `dimension` (`L0-lgnd-r017` §3);
6. `startCooldown(player, "dragon_katana")`, only after the teleport returned. There is no busy window.

`observeActivations` hands every activation that reached step 4 to its observers in the same tick, after the teleport
and the cooldown. A refusal (`jumped: false`) writes nothing; it leaves one line in the server log and none in chat
(`L0-katn-r005`).

Measured on BDS 1.26.51.1 (`src/gametest/katana.ts`): the feet read back at B in the press tick, the yaw is kept, and
29 999 ms of cooldown are left. The tapped block is never the aim (`L0-katn-as02`): a use on the floor 1 block ahead
jumps 19 blocks along the view.

### Deviations (C-16)

1. **The off hand casts only behind a main-hand legendary.** `L0-katn-ac03` "Off hand" asks the Katana in the off hand
   to jump with the main hand empty.
   - Measured (`katana_empty_main_no_cast`): with the main hand empty, `useItemInSlot`, `useItemInSlotOnBlock`,
     `interactWithBlock` on stone and on a noteblock, and `interact` raise no script event, 0 in 10 presses.
   - That is `L0-lgnd-as07`, and `L0-lgnd-r004` already says an empty or non-legendary main hand never casts the off
     hand.
   - So the off-hand Katana fires when the main hand holds a legendary that is not ready. It makes the same T05 jump
     (`katana_offhand_behind_main`). A ready main-hand legendary wins the press even when it then refuses.
2. **The block input is `itemStartUseOn`.** `L0-katn-p001` §1 names `playerInteractWithBlock`. For a custom item used
   on a block the engine raises neither that nor `itemUse`, only `itemStartUseOn` (CNTR-XCX14).

## `fall.ts` — the one-shot fall flag (`L0-adr-ktfl`, `L0-katn-p002`, `L0-katn-r006`)

Every jump that returned arms `{ player, until: now + 10 s, dimId }` in a module `Map`; a new jump replaces the entry.
It is never a dynamic property. One `system.runInterval(…, 1)` exists only while the map is not empty. Per flag and
tick:
1. gone, dead, another dimension, or past `until` → dropped;
2. the arm tick and the two after it are skipped (deviation 1);
3. on the ground, in water, in lava (feet or head cell), climbing or gliding → dropped, the first qualifying landing.
   "On the ground" is `isOnGround` **and** a solid within 0.75 under the hitbox;
4. falling, and a solid within `max(2, ceil(|vy|) + 1)` below the feet → `teleport(location, { rotation })`, which
   zeroes the stored fall (KATA-PROBE-01 P1), then dropped unless 3 or more is left (deviation 2).

Nothing touches damage: no `resistance`, no `slow_falling`, no heal. `src/gametest/katana-fall.ts` measures T11, T12,
expiry, a mob hit and lava under the flag, and the same landing with the watcher off.

Measured on BDS 1.26.51.1 (`katana-fall` RESULT and MEASURE lines):
- 15 blocks up, watcher off: 12.0 fall damage; watcher on: reset 3.00 up, none.
- The next ordinary 10-block drop: 7.0. A drop from rest deals drop − 3.
- 30 blocks up at 4 HP: reset 1.49 up, no fall damage.
- 152 blocks up at 4 HP: resets 4.79 and 1.45 up, no fall damage.
- A flag in the air ends at 10.1 s. A zombie hit (3.0) and lava (3.0) under the flag hurt as usual.

### Deviations (C-16)

1. **`isOnGround` is not trusted alone.** `L0-katn-p002` §2 consumes the flag on the first `isOnGround` tick.
   - Measured (`katana_fall_one_shot`): after a jump from a perch to B 15 blocks up, a SimulatedPlayer reads
     `isOnGround=true` and `vy 0.00` at +1 and +2 ticks, and starts to fall at +3.
   - As written, the rule consumed every flag at +1, and the landing hurt (12.0, the same as with no watcher).
   - So the state flags wait out those two ticks, and the ground also needs a solid under the hitbox. The ground check
     holds however long a live client keeps reporting A's ground. Water, climbing and gliding rely on the two ticks
     alone. A live client is not measured; that is iPad only.
2. **A reset that leaves 3 or more keeps the flag for a second reset.** `L0-katn-p002` §2 drops the flag in the reset
   tick.
   - The reset zeroes the velocity, so the player falls what is left from rest, and a drop of more than 3 hurts.
   - The look-ahead is sized so that no tick skips past the ground. At `|vy|` above 2 (falls over ~40 blocks) the
     reset can therefore come 3 to 5 blocks up. Measured: 4.79 from 152 blocks.
   - The next falling tick has a look-ahead of 2, so the second reset comes under 2 blocks up and drops the flag.
3. **The ground is read under the whole hitbox.** One ray from the centre and four from just inside the corners. A
   centre ray alone misses the ledge a player lands on with the edge of its hitbox.
4. **A ray runs two cells past the look-ahead.** A part-block is caught only as the ray leaves its cell (P3).

## Not the Scythe's line of sight (`L0-adr-ktob`, `L0-katn-r003`)

The two notions are different on purpose, and neither module calls the other.

- **Scythe.** `hasLineOfSight` (`src/scythe/targeting.ts`) walks the cells between two heads with `getBlock`. Every block
  that is not air and not a liquid blocks the view: grass, a flower, cobweb, glass, a slab. That is right for "can I see
  the target".
- **Katana.** The obstacle is whatever the engine's own block ray stops at, with
  `includePassableBlocks: false, includeLiquidBlocks: false`:
  - grass, flowers, cobweb, carpet, water and lava pass;
  - stone, slabs, fences and glass panes stop it.

  No list of solid ids exists anywhere. A flower three blocks ahead would end a Scythe-style jump; it does not end the
  Katana's.

## Deviations confirmed by KATA-PROBE-01 (C-16)

Measured on BDS 1.26.51.1, see `docs/feedback/probe-katana.md`. `plan.ts` follows the measurement where it contradicts
the recorded decision.

1. **`maxDistance` is a budget of cell steps, not blocks.** `L0-adr-ktob` §1 says `maxDistance: 20`.
   - Measured (P2b): stone 16.40 and 13.16 blocks out on a diagonal takes 24 steps, and with 20 the ray misses it. The
     Katana would pass through the wall.
   - The plan walks the segment cell by cell and passes the exact step count. It then cuts at a Euclidean 20 itself,
     measured to the hit point.
2. **The fit column is 2 long and ends inside the cell below.** `L0-katn-ad01` §1 says 2−2ε.
   - Measured (P3): 2−2ε misses a bottom slab in the feet cell.
   - A hit in the cell below is the floor and does not count.
   - The fallback in ad01's Consequences, two horizontal rays at y+0.1 and y+1.9, is refuted as well (no hit even on
     stone) and is not used.
3. **Block rays never see fire.** `decision-katana-landing-above-lava-unsafe` names fire for the downward ray.
   - Measured (P4): with both flags true, the ray returns the block under `fire` or `soul_fire`.
   - So the hazard check reads the first block met **and** the block above it.
   - The lava half of the decision holds as written. A downward ray runs whenever the column ray found no floor, so air
     over lava, over fire, or over two empty cells and then lava is refused.
4. **A part-block entered mid-cell is caught only as the ray leaves its cell (P3).** Every ray that judges a cell
   therefore ends past it:
   - the trace runs one cell beyond its end when that cell is readable;
   - the column ray ends inside the cell below;
   - the reach ray ends in the candidate's head cell, which the column ray has already cleared.
5. **A ray never hits inside an unloaded chunk.** Measured (P5): it gives no hit or throws `LocationInUnloadedChunkError`,
   depending on the world state; 0 hits in 12 rays.
   - So "unreadable = solid" (`L0-adr-ktob` §2) is decided before the ray: `isChunkLoaded` once per chunk, and the height
     range, along the segment.
   - The trace ends 0.05 short of the first unreadable cell, with `stoppedBy: "unreadable"`.
   - A ray that throws anyway refuses the jump instead of guessing where the solid is.
6. **Liquids are met only with both flags true.** `L0-adr-ktob`:54 says they are skipped only with
   `includeLiquidBlocks: false`.
   - Measured (P4): `includeLiquidBlocks: true` alone still passes lava down to the stone.
   - The trace flags themselves are as recorded: 11 of 11 blocks behaved as stated (P2). The hazard ray sets both flags.

## Other deviations

- **Eye height comes from the snapshot, not 1.62.**
  - A SimulatedPlayer's head is 1.52 above its feet (WSWD-FACE-01 measurement).
  - The desired cell is `E − (H − A)`. The head keeps that offset, so the cap `|B + (0, eye, 0) − H| ≤ 20` is checked
    as `|B − A| ≤ 20`.
  - A move that changes y keeps 1e-4 in hand, because positions are single-precision.
- **`faceLocation` is the hit point's fractional part.** On a full Up, East or South face it reads 0, and the plan reads
  that 0 as 1 (WSWD-FACE-01 measurement).
- **Part-collision blocks stop the trace and do not fit** (`L0-adr-ktob` §4). This covers slabs, fences and panes. The
  Katana stops short rather than risk a stuck player.
- **The player's own cell is never a landing.** A boxed-in player is refused, not teleported in place.
- **Side offsets need a horizontal view.** Looking straight up or down, the search tries only the up offsets.

# Pearl Rod («Перовый сокровятель»)

Spec v3 §6–§8. The Pearl Rod is not a custom item: it is a real vanilla `minecraft:fishing_rod` carrying the dynamic
property `andrew:pearl_rod` (the rod id). A custom item cannot fish, and §6 asks for a rod that "при обычной рыбалке
работает как удочка" (fishes like a normal rod). It is not a legendary either (C-46): crafting is unlimited, and it
drops, burns, despawns and changes hands like any vanilla item.

## `item.ts`: the craft and the durability (`L0-pear-pr01`, `L0-pear-ru04`, `L0-xasm43`)

The decisions live in `item-rules.ts`, which has no engine import; `tests/pearl-item.test.mjs` runs it under node.
`registerPearlItem()` runs at script load. `src/main.ts` arms one copy and the GameTest pack (`src/gametest/pear-item.ts`)
arms its own, because the release pack cannot read a SimulatedPlayer.

**Recipe.** `packs/behavior/recipes/pearl_rod.json` is a shaped crafting-table recipe written as a full 3×3:
`[" P ", " R ", "   "]`, with an ender pearl above a fishing rod and every other cell empty. Bedrock keeps blank rows and
columns (probe Q8), so the positions are fixed.

**Token.** A recipe cannot put a mark on a vanilla item, and a plain rod arriving in an inventory looks exactly like a
pickup. So the recipe outputs `andrew:pearl_rod_token`. That is a custom item: hidden from the Creative menu, stacks to 1,
named "Pearl Rod" / «Перовый сокровятель», with its own icon (`tools/draw-pearl-rod.mjs`; previewed in
`docs/feedback/pearl-rod-token-look.png`). The recipe book and the crafting output slot show it.
- `playerInventoryItemChange` reports the token, and the token is swapped on the next tick, in its own slot. The swap
  queues players per tick and reads each inventory once.
- The swap writes `makePearlRod()`: a new `fishing_rod` with nameTag «Перовый сокровятель», lore `Pearl Rod` / `unbound`,
  a fresh `andrew:pearl_rod` id and damage 0.
- A stack of n tokens gives n rods. Rods that find no room are spawned at the player's feet.
- A token outside a player inventory (in a crafter, a hopper, a chest or on the ground) stays a token until a player
  picks it up.

**Durability.** "Бесконечная прочность" (infinite durability) means damage held at 0. A vanilla rod has 384 durability
on Bedrock, and a ground reel costs 2 (probe Q7). A marked rod's `durability.damage` is written back to 0 on three paths:
1. **In `afterEvents.itemUse`**, for a cast and for a reel. The reel's damage is already on the rod when the event
   arrives, so it is zeroed in the same tick.
2. **One tick later** (`REPAIR_AFTER_USE_TICKS`), on the same slot. This catches damage the engine might apply after the
   event. In the 100-cast run it never found anything to repair.
3. **The hand check**, every 20 ticks, on each player's selected slot. It writes only when the rod is worn.

A plain rod is never touched. The fallback "swap in a fresh marked rod" (`L0-pear-ru04`) is not needed: the write holds
(probe Q7).

**Not extracted from craftgate.** `L0-pear` names a token-swap helper extracted from `src/legendary/craftgate.ts`. That
helper is not extracted. The craftgate's settle step is legendary-shaped (claim, refund, unwrap, the world flag, the
announcement), and the Pearl Rod needs one branch of it. So `item.ts` repeats the 30-line queue-and-flush pattern instead
of reshaping a module that every legendary craft goes through. Craftgate ignores the Pearl Rod token (`defForToken` is
undefined for it), and the swap ignores legendary tokens.

### Measured on BDS 1.26.51.1 (private copy of the checks instance, 2026-10-12)

- **`pear_item_craft_unlimited`.** A crafter runs the shipped recipe three times in a row. 3 tokens reach the player and
  3 swaps follow. The player ends with 3 Pearl Rods, 3 distinct marks, 0 tokens and 0 plain rods. Each rod reads
  `name=Перовый сокровятель lore=[Pearl Rod|unbound] damage=0/384 enchants=[]`.
- **`pear_item_grid_shifted`.** The declared layout (1,4) crafts a token, both before and after the negatives. None of
  the 8 moved layouts crafts anything:
  - left (0,3), right (2,5), down (4,7), down-left (3,6), down-right (5,8);
  - pearl below the rod;
  - the diagonal (0,4);
  - side by side (3,4).
- **`pear_item_hundred_casts`.** Two players cast and reel 100 times each, side by side.
  - The Pearl Rod: 100 hooks and 100 reels; damage 0 at the end of all 100 cycles and at the end; mark unchanged;
    `repairs_in_event=100`, `repairs_after_use=0`.
  - The plain rod (control): 100 hooks and 100 reels, damage 0 → 200.
  - Event order in one tick: the reel's damage is already readable in the tick of the reel, before the after-event
    (`+11:damage 0->2 +11:hook_removed +11:use(d=2)`). So a script that samples every tick sees the Pearl Rod at damage 2
    for at most 1 tick per reel, never 2 ticks: `worn_ticks` = `repairs_in_event` = 100, 100 and 75 of 100 reels over
    three runs, worst 2. In the 75 run the other 25 reels were already at 0 when the sampler ran.
  - Hand check: damage 50 written onto the held Pearl Rod returns to 0 within the 20-tick period (+12, +18 and +20 over
    three runs). A plain rod at 50 stays at 50.
  - SimulatedPlayer drops uses that come too close together (498 calls for 200 effective uses, one accepted about every
    11 ticks). So the scenario drives each cast and reel by its evidence: a new hook, or the hook gone.
- **`pear_item_fishes_unbound`.** A one-block-deep pool runs past the platform edge. A hook that lands against a wall
  reads as stuck in a block: a reel costs 2 and nothing bites. Each player casts until a catch, reeling when the bobber is
  pulled under (drop > 0.30 or vy < −0.25).
  - The Pearl Rod caught on its 2nd cast in both runs, `salmon×1` and then `bow×1` (treasure). The loot spawned at the hook
    and was picked up 11 ticks after the reel. The rod ended at damage 0, lore `Pearl Rod|unbound`, dynamic properties
    `[andrew:pearl_rod]` only.
  - The plain rod (control) caught `cod×1` both times. A catch costs it 1 durability; a short cast onto the rim and reeled
    from there costs 2.

### Limitations (C-16)

- **The input rod's enchantments are lost.** The output is always a new rod. By the time the token exists, the
  ingredients are gone, so nothing of the rod that went in can be read back. This is the same limitation as craftgate's
  refund (`L0-xasm43`, gap 3). The engine half is not measured: a crafter has no `minecraft:inventory` component on
  1.26.51.1, and `replaceitem` cannot enchant, so no enchanted rod can be loaded into it.
- **The name and the lore do not follow the client's language.** A vanilla rod has no translation key to point at, so the
  nameTag «Перовый сокровятель» and the lore `Pearl Rod` / `unbound` are literal strings. An English iPad shows the
  Russian name too (`xq12` item 2). The token's own name is a lang key and does follow the language.
- **The 2×2 inventory grid is not measured.** No script can operate it. What is measured is that Bedrock keeps the blank
  third row and column, so the recipe needs three rows and a 2×2 grid cannot hold it. Whether the 2×2 grid offers the
  recipe is checked on the iPad.
- **As an ingredient it is a plain rod** (`L0-xasm45`). The Orbital Cannon recipe, carrot-on-a-stick,
  warped-fungus-on-a-stick and the Pearl Rod's own recipe all consume it as a plain rod, along with its id and its
  binding. A craftgate refund of a duplicate Orbital Cannon returns a plain rod.
- **An anvil rename or combine is not measured** (no SimulatedPlayer anvil). It may drop the mark.

### For the iPad sheet (`PEAR-IPAD-01-AA`)

- **The durability bar may blink.** On the server the reel's damage exists for one tick before it is written back
  (above). Whether the client draws that tick is visible only on the device. Look at the bar during fast casting.
- **Name and lore** are fixed strings: «Перовый сокровятель» with `Pearl Rod` / `unbound` below, in Russian on an English
  iPad too.
- **The recipe book** shows the token's icon (a rod with a teal pearl on its line). The rod you get looks like a vanilla
  fishing rod.
- **The 2×2 grid** must not offer the recipe.
- **An enchanted rod** used as the ingredient yields an unenchanted Pearl Rod.

## `bind.ts`: the hook enters a plate (`L0-pear-pr02`, `L0-xasm41`, `L0-pear-ent1`)

Spec v3 §7, unbound state. The decisions live in `bind-rules.ts`, which has no engine import; `tests/pearl-bind.test.mjs`
runs it under node, and runs `bind.ts` against a stand-in engine. `registerPearlBind()` runs at script load; `src/main.ts`
arms one copy and the GameTest pack (`src/gametest/pear-bind.ts`) arms its own.

**Whose hook.** `entitySpawn` of a `minecraft:fishing_hook` whose `projectile.owner` is a player holding a Pearl Rod in the
selected slot. The owner is readable at spawn +0 on every hook (probe Q3), so the 3-block `itemUse` correlation of
`L0-pear-pr02` is not written. The hook is tracked as `{hook, player, rodId}` in memory only; a restart drops it and the
cast stays a plain one.

**The hit.** One shared interval checks every tracked hook each tick and returns at once when there is none. A hook hits
a plate when all of these hold:
- the cell `floor(x), floor(y + 0.001), floor(z)` is a `minecraft:*pressure_plate`. A resting hook sits at exactly the
  support's top (probe Q2), so `floor(y)` is the plate cell; the 0.001 keeps a y a hair below that integer from naming
  the support;
- the hook is at most 0.25 above that cell's floor, or on the ground, or slower than 0.05 blocks a tick;
- the hook has not hit an entity (`projectileHitEntity` for that hook sets a flag for good);
- the same cell passed the two checks above on **two consecutive ticks**. A hook stuck in a mob can read low and slow in
  the very tick it hits, before its `projectileHitEntity` arrives; the second check sees the flag. A hook that skims
  the lowest quarter of a plate cell and lands next door never gets a second check there.

**The binding.** The rod is looked up by its id in the binder's inventory, the selected slot first; a rod that has left
the inventory binds nothing and the hook is left to vanilla. Onto that rod, in one `setItem`:
- the six properties of `L0-pear-ent1`: `andrew:pr_dim` (`Dimension.id`), `andrew:pr_pos` (the **plate's** cell as a
  Vector3), `andrew:pr_type`, `andrew:pr_owner` (`Player.id`), `andrew:pr_epoch`, `andrew:pr_gen`. A record missing any
  of them, or with a non-integer cell, reads as unbound (`readBinding`);
- the lore `Pearl Rod` / `bound: <overworld|nether|the_end> x y z`. The binder's name is never shown (`xasm42`);
- durability damage 0.

Then `hook.remove()` and the actionbar line `andrew.pearl_rod.bound` («Удочка привязана к плите» / "Rod bound to plate").
A removed hook leaves no cast behind; the next use casts afresh (probe Q4).

**One binding per rod.** Any hit from a rod overwrites all six properties of that rod, whoever casts it. Another rod —
in the same inventory or anyone else's — is not touched: the record lives on the item, found by its id.

**What it reads but does not own.**
- The life epoch: player dynamic property `andrew:life_epoch`, missing = 0. `owner.ts` (below) bumps it on death.
- The plate generation: world dynamic property `andrew:pg:<overworld|nether|the_end>:<x>:<y>:<z>` (`L0-pear-ent2`). The
  binding does not read it, it claims it: `claimGeneration()` in `generation.ts` (below) hands out the number.
- Honouring a binding on use is `teleport.ts` (below). The binder's own use of a bound rod is a trip, not a cast, so the
  binder never overwrites a live record of their own: anyone else's cast does, and so does the binder's first cast after
  a trip or a dead plate cleared it.

### Measured on BDS 1.26.51.1 (private copy of the checks instance, 2026-10-13)

- **`pear_bind_every_plate`.** The 17 plate types come from `BlockTypes.getAll()` at run time, `poplar_pressure_plate`
  included. Each type fills the 7×6 field in front of the caster, and a fresh Pearl Rod casts into it. **17 of 17 bind**,
  every one the same way:
  - path (`+tick:relative y`, `p` = inside a plate cell) `1:2.43p 2:2.00p`; at rest from +2;
  - the rod write (`playerInventoryItemChange`) and the hook's `entityRemove` both land at **+3**, the same tick. The
    scenario sees the rod bound and the hook gone together at +4, because a GameTest continuation runs before the
    interval. No sample ever saw the rod bound with its hook still out;
  - record: the plate cell rel 3,2,3, the plate's type, `overworld`, the caster's id, epoch 0, the cell's generation. The
    block at the recorded cell is the plate; `projectileHitBlock` names the support, `stone` at rel 3,1,3, the cell below;
  - no hook of the caster left in the world 1 and 20 ticks later; damage 0; lore `Pearl Rod|bound: overworld 3 -58 6`.

  Control: the bare floor. The hook rests at +2 in the air cell rel 3,2,3 and the rod stays unbound.
- **`pear_bind_negatives`.**
  - *Next to plates.* The hook rests on the bare floor at rel 3,2,3, then stone plates are set into all 8 cells around it.
    30 checks beside plates, no binding. Positive control in the same place: a plate set into the hook's own cell binds
    within 2 ticks.
  - *Over plates.* A long cast on a bare floor laid out to z=16 rests at rel 3,2,6. Plates are then laid on z 1..5 and the
    same cast is thrown again. It passes through plate cells at dy 0.91 (rel 3,2,3, 1.20 blocks/tick) and dy 0.44
    (rel 3,2,5, 1.11 blocks/tick), both judged in flight, rests at +3 in the air cell rel 3,2,6, and binds nothing over 30
    checks. Positive control: a plate set into its cell binds within 2 ticks.
- **`pear_bind_hook_in_mob`.** A mob spawned without behaviours stands on a field of stone plates and the rod is cast at
  it.
  - *Pig.* Hit at +2. `projectileHitEntity` fires on **every tick** the hook stays stuck (53 events). The hit knocks the
    pig back about 2.5 blocks, still on plates. The hook rides at dy 0.72 (0.8 of a pig's height) with |v| 0.13, never
    on the ground: it would not bind on height and speed alone (0 of 54 samples).
  - *Baby turtle* (`minecraft:entity_born`). Hit at +2, 53 events; the hook rides at dy 0.17 once the turtle settles. On
    height alone it **would** bind (44 of 54 samples); the hit flag keeps it unbound. This is the case the flag is for:
    any mob under about 0.31 blocks tall.
  - Control: the same plates with no mob bind a fresh cast.
- **`pear_bind_overwrite_two_rods`.** Two players cast in the same tick onto two plate types: each rod records its own
  plate and its own binder (acacia at rel 1,2,3 for A, heavy weighted at rel 5,2,3 for B). A's second rod, in slot 1,
  binds to cherry; the first rod's record is unchanged. The first rod cast again at a nearer aim is overwritten: mangrove
  at rel 1,2,2, lore updated. A's second rod and B's rod are unchanged.
  - With `teleport.ts` armed, step 3 runs differently (regression run of PEAR-TP-01, 2026-10-13). A's first use of rod 1
    is A's own bound use: a trip to the acacia cell, which now holds mangrove, so the outcome is `plate-gone` and the
    record is cleared. The scenario's retried use is then a plain cast, and it binds mangrove onto the now unbound rod.
    The assertions still hold, but step 3 no longer shows a live record being overwritten. Under `xasm42` only someone
    other than the binder can do that, which is PEAR-OWNER-01's scenario.

### Limitations

- **The hook presses the plate while it lies there.** A resting hook presses wooden and both weighted plates (probe Q2)
  for the tick before the binding removes it, so a plate wired to a mechanism gets a short pulse. How long the plate
  stays down after that is not measured.
- **No binding on a rod outside the inventory.** A rod dropped or put in a chest between the cast and the hit binds
  nothing. Switching the hand away from the rod kills the hook one tick later anyway (probe Q7).
- **A hook that ever touched an entity never binds**, even if the mob is gone and the hook falls onto a plate. Reeling in
  and casting again binds normally.

### For the iPad sheet (`PEAR-IPAD-01-AA`)

- **The cast pose.** The hook is removed by script on binding; the rod should snap back to its normal pose. Only the
  device shows it.
- **The actionbar line** «Удочка привязана к плите» / "Rod bound to plate" follows the client language. The lore line
  `bound: overworld x y z` is a literal string and does not.

## `generation.ts`: a replaced plate does not take the rod there (`L0-xcx34`, `L0-pear-ru03`, `L0-pear-ent2`)

Spec v3 §7: «Если плита сломана/заменена — привязка недействительна, телепортации нет» (if the plate is broken or
replaced, the binding is void and there is no teleport); §8: "Destroyed/replaced plates do not teleport". A block has no
identity of its own: an oak plate broken and put back as an oak plate reads exactly like the first one, and its
permutation changes on every press (`redstone_signal`). So the module watches the ways a plate can go that a script
sees, and gives every bound plate a generation those ways end. The decisions live in `generation-rules.ts`, which has
no engine import; `tests/pearl-generation.test.mjs` runs it under node, and runs `generation.ts` and `bind.ts` against a
stand-in engine. `registerPearlGeneration()` runs at script load; `src/main.ts` arms one copy and the GameTest pack
(`src/gametest/pear-generation.ts`) arms its own. It and `registerPearlBind()` arm once per pack: a second binding
interval would confirm a hook's hit within one tick (seen in development, `pear_bind_hook_in_mob` failed).

**The check.** `plateCheck(binding)` reads the cell's block and its generation:

| Verdict | When | Trip |
|---|---|---|
| `same` | the recorded plate type stands there and the cell's generation is the recorded one | yes |
| `other-type` | another plate type stands there (`/setblock` to oak) | no |
| `missing` | no plate at all | no |
| `replaced` | the generation is not the recorded one: an observed path took the plate, or the cell was pruned or evicted | no |
| `unloaded` | the cell is not loaded; the teleport loads it before it asks | — |

The trip itself is PEAR-TP-01's. Its comparison `plateGeneration(dim, pos) === binding.gen` (`bind.ts`) reads the same
property, so it agrees with `plateCheck` on every binding made through `claimGeneration()`.

**A generation is a stamp, not a count.** The first binding to a cell writes `andrew:pg:<dim>:<x>:<y>:<z>` = the next
number from the world counter `andrew:pg_seq`; a second rod on the same plate records the same number. An observed
replacement deletes the property. A missing property reads 0 and no binding records 0, so every binding to the old
plate is void for good: the next binding to that cell gets a number no cell ever had. This differs from `L0-pear-ent2`
("a counter, missing = 0, entries never deleted"). With a count from 0, deleting an entry would make old bindings match
again; with stamps, deleting one can only refuse a trip, which is what lets the store be pruned.

**The observed paths.**

| Event | Cells it ends (when watched) | What it catches |
|---|---|---|
| `playerBreakBlock` | the broken cell and the one above | the plate itself; its support, which takes the plate with it |
| `playerPlaceBlock` | the placed cell | a plate put back by hand after something unobserved removed the first one |
| `blockExplode` | the exploded cell and the one above | TNT, creepers, beds, anchors, crystals: the plate or its support |
| `pistonActivate` | watched cells within one block of the piston and everything it moves (one more layer up), `PISTON_SETTLE_TICKS` = 4 ticks later, **only those whose plate is gone** | a plate crushed by a pushed block or the arm, or knocked off a moved support |

A piston cannot move a plate, only destroy it, so a plate still standing after the move is left alone: no false
refusal. `getAttachedBlocksLocations()` threw "Failed to call function" on one retraction in two runs; then the box is
two blocks around the piston instead.

**The store and its pruning.** Each watched cell has a second property `andrew:pgw:<cell>`: JSON
`{rods: {rodId: [binder id, order]}, last, pinned}`. A rod leaves its cell when
- its binding is cleared or changed in its slot: `playerInventoryItemChange` with the bound rod as `beforeItemStack`
  and the same rod id without that binding as `itemStack`. That is how the teleport's clearing reaches the store,
  with no call between the two modules. A rod moved to another slot, another item, or a durability write is not;
- the same rod is bound elsewhere: `claimGeneration()` releases its previous cell in the tick it binds;
- its binder dies (`entityDie`, players only): every binding of theirs is void (C-45).

The last rod out deletes both properties. Two bounds hold even when nothing is released:
- `MAX_CELLS` = 512. A binding to a new cell past it evicts the cell bound longest ago; that cell's bindings then
  read `replaced`.
- `MAX_RODS_PER_CELL` = 64. Past it the cell is *pinned*: rods are no longer tracked, and only a replacement or
  eviction removes it.

### Measured on BDS 1.26.51.1 (private copy of the checks instance, 2026-10-13)

Every scenario binds by a real cast from rel 3,2,0 into a field of plates, then clears every other plate cell; the bound
plate is at rel 3,2,3 on a stone support.

- **`pear_gen_player_replace`.** The player breaks the stone plate with a pickaxe (air after 3 ticks; the
  `playerBreakBlock` after-event lands one tick later and ends the generation), then places a stone plate from their hand
  on the same support. The cell reads `stone_pressure_plate` again, the rod still says generation 1, the world says 0:
  `replaced -> NO TRIP`. The rod binds the new plate with a later generation (`same -> TRIP`), and the first record stays
  refused. Place path alone: `/setblock … air` ends nothing (`missing`, generation kept), then the player places a stone
  plate into the watched cell: `replaced`.
- **`pear_gen_setblock_other_type`.** From a bound stone plate, `/setblock` to the oak plate and to the heavy weighted
  plate reads `other-type`; to stone and to air, `missing`. No command moves the generation: the type check is what
  refuses these. **The limitation, measured:** `/setblock` air then `/setblock` stone plate in one tick reads
  `same -> TRIP`.
- **`pear_gen_explosion_support_piston`.**
  - TNT 2.5 blocks from the plate goes off after 81 ticks: one `blockExplode` for the plate cell, the support survives,
    the generation ends. The plate put back by `setType` (seen by nothing) reads `replaced`.
  - The player breaks the stone support under an oak plate (7 ticks); the plate pops off, the generation ends; support and
    plate put back read `replaced`.
  - A piston facing up under the support, powered by a redstone block: the plate cell reads `moving_block` 3–4 ticks
    after the power and `stone` (the support, pushed in) from 5–6; the check 4 ticks after the event ends the
    generation. Put back: `replaced`.
- **`pear_gen_hundred_presses`.** A second player steps on and off the bound stone plate 100 times: signal 1 within a tick
  of each step, 0 again 20 ticks after leaving. No observed event fires, the generation and the rod's record stay, and
  the plate reads `same -> TRIP`.
- **`pear_gen_store_pruned`.** Two rods of one player on one plate share its generation. Clearing rod 1 in its slot, the
  way the teleport does, releases it (the plate is still held by rod 2); clearing rod 2 prunes the plate and leaves only
  `andrew:pg_seq`. Rod 1 bound again and then overwritten onto an oak plate a cell nearer: the first plate is pruned.
  The binder dies (`kill()`): their last plate is pruned within a tick.

### Limitations (C-16)

- **A plate swapped for one of the same type without a player, an explosion or a piston is not noticed.** `/setblock`,
  `/fill`, `/clone`, a structure load and another add-on's `setType` raise no event a script sees; whatever else removes
  a plate that way (liquids, game rules) is in the same group. Such a rod still takes its player there. Wording for
  Andrey is below.
- **Pistons moving more than two blocks are judged by the moved-block list.** When the list cannot be read, only the
  two blocks around the piston are checked.
- **A bound rod destroyed where nobody sees it** (lava, despawn, used as an ingredient) never releases its plate. The
  plate's entry stays until the binder dies, the plate is replaced, or it is evicted past 512 cells.
- **Eviction refuses a good binding.** The 513th plate bound while none of the 512 before it was released refuses the
  trip of the plate bound longest ago (`replaced`): bind it again.
- **A rod bound by a build before this module records generation 0** and is not watched: against a cell with no entry
  it reads `same` whatever happened to the plate. Only epic builds before this one bind that way; none was released.

### For Andrey: the acceptance sheet (`PEAR-IPAD-01-AA`) and the release notes

**RU.** Удочка запоминает плиту по месту и по типу. Если плиту сломать — руками, взрывом, поршнем или сломав блок
под ней — и поставить на то же место точно такую же, удочка это заметит и не перенесёт: скажет, что плита пропала или
заменена, и попросит привязаться заново. Если на место плиты поставить плиту другого вида (была каменная, стала
дубовая), тоже не перенесёт.

Есть один случай, который игра различить не даёт. Если плиту заменить на точно такую же **командой** (`/setblock`,
`/fill`, `/clone`), **загрузкой постройки** или **другим аддоном**, игра никому об этом не сообщает. У блока в
Minecraft нет своего «паспорта»: новая каменная плита на том же месте ничем не отличается от старой. Поэтому такая
удочка **перенесёт** игрока к новой плите, как к старой. Обычной игрой этого не сделать — только командами
оператора или другими аддонами. Просим принять это ограничение явно.

**EN.** The rod remembers a plate by its place and its type. Break the plate — by hand, with an explosion, with a piston,
or by breaking the block under it — and put the very same kind back: the rod notices and does not teleport; it says the
plate is gone or replaced and asks you to bind again. Put a different kind of plate there (stone becomes oak) and it does
not teleport either.

One case the game does not let us tell apart. If the plate is swapped for an identical one **by a command** (`/setblock`,
`/fill`, `/clone`), **by loading a structure**, or **by another add-on**, the game tells nobody. A Minecraft block has no
identity of its own: a new stone plate in the same spot is indistinguishable from the old one. Such a rod **will**
teleport you to the new plate as if it were the old one. Normal play cannot do this — only operator commands or other
add-ons can. Please accept this limitation explicitly.

## `teleport.ts`: the trip to the plate (`L0-pear-pr03`, `L0-xasm42`, `L0-pear-ru01`, `L0-pear-ru02`, `L0-adr-prta`)

Spec v3 §7, bound state. The decisions live in `teleport-rules.ts` and the world area budget in `area-pool.ts`. Neither has
an engine import. `tests/pearl-teleport.test.mjs` runs both under node, and runs `teleport.ts` against a stand-in engine.
`registerPearlTeleport()` runs at script load, and a second call in the same pack does nothing. `src/main.ts` arms one
copy with `worldAreas`, and the GameTest pack (`src/gametest/pear-teleport.ts`) arms its own with a budget of 9 and the
prefix `andrew_gt_pearl_`.

**The use.** `world.beforeEvents.itemUse` of a Pearl Rod:
- the rod carries a binding, its owner is the user and its epoch is the user's current `andrew:life_epoch` → the use is
  cancelled (no hook is thrown, probe Q4) and a trip starts on the next tick;
- the same, while this player already has a trip → cancelled, «Перенос уже идёт» / "Already travelling", nothing starts;
- anything else (an unbound rod, a stranger, the binder after a death) → untouched: a vanilla cast.

**The trip.**
1. **Next tick.** The dimension is resolved. Another dimension is allowed, because probe Q6 measured 9 of 9
   cross-dimension trips; an id the world does not have is refused. One slot is taken from the world budget and
   `tickingarea add x-1 0 z-1 x+1 0 z+1 andrew_pearl_<n>` runs in the destination dimension. Those are the columns of the
   plate and its 8 neighbours, which is every column the spot search reads.
2. **Wait** (the one shared interval, every tick). The trip waits until the 9 cells read `isChunkLoaded` and the plate
   cell answers `getBlock`, for at most **200 ticks** (`xasm42`). If the player died or left the game, the trip ends
   without a word. A death is read three ways: health 0, `entityDie`, or a changed epoch. Health matters because in the
   tick of a death the interval already reads 0 while `entityDie`, and the epoch bump it carries, arrive only after it
   (PEAR-OWNER-01's probe). Without it, a destination that loads in that very tick would carry a dead player and clear
   the binding.
3. **Check, in order.**
   - The rod, found by its id anywhere in the inventory, must still carry this very binding.
   - The plate cell must hold the same typeId and the world generation must be the same (`L0-pear-ru03`). The
     permutation is ignored.
   - A safe spot must exist: the plate cell, then N, E, S, W, NE, SE, SW, NW (north is −z). A cell is safe when the feet
     and head cells are passable (air, plate, carpet, sign, torch, button, one snow layer, flowers, grass, light block;
     not waterlogged), the floor is solid (not air, liquid, magma, campfire, cactus, powder snow, scaffolding, fence,
     wall, rail, …) and all three lie inside the dimension.
4. **Move.** A rider is ejected from the mount, then `teleport(centre of the spot, { dimension })`. The trip reads back the
   dimension and the location in the same tick (same dimension, within 0.5). Only then is the binding cleared and the
   lore set to `unbound`. «Вы у плиты» / "Arrived at the plate" is shown and `mob.endermen.portal` plays at the spot.
   The read-back only catches the engine not moving the player at all: over an unloaded chunk it reads "arrived" too
   (probe Q6). The preload and the spot check are what make the arrival safe.

**Outcomes** (`xasm42`, plus the two keep rows of `L0-pear-pr03`). Every row removes the area before anything else:

| Outcome | Moved | Binding | Actionbar (`andrew.pearl_rod.*`) |
|---|---|---|---|
| `arrived` | yes | cleared | `arrived` |
| `plate-gone`: missing, another type, another generation | no | cleared | `plate_gone` "…bind the rod again" |
| `not-loaded`: 200 ticks without the cells | no | kept | `not_loaded` "…try again" |
| `busy`: the budget or the engine refused the area | no | kept | `busy` "…try again" |
| `dimension-refused` | no | kept | `dimension_refused` |
| `unsafe`: no safe cell of the nine | no | kept | `unsafe` |
| `travelling`: a use during a trip | no | unchanged | `travelling` |
| `rod-left`: the rod left the inventory during the wait | no | kept on that rod | `rod_left` |
| `failed`: the read-back mismatched, or the trip threw | no | kept | `failed` |
| `died`, `offline` | no | kept (a death voids it through the epoch) | none |

No row except `arrived` moves the player or mentions arriving (C-44).

**The areas.**
- An area is removed on every path, in `end()`, before the binding, the message or the log.
- A name removed in a tick is not added again in that tick: a loaded area's name is refused there (probe Q5).
- On the first tick after load each copy removes its 10 names in all three dimensions, so a crash or a restart mid-trip
  leaks nothing for good.

**The budget** (`area-pool.ts`, `L0-pear-ad01`, `CX-pear-01`). There is one counter per script pack, with a capacity of 10:
the engine gives one world 10 command areas, across all dimensions. One slot is reserved for the rod. Structure clients
share the other 9, and stop short of any slot the rod has borrowed. The rod may borrow any free slot. In the release pack,
`src/main.ts` hands `worldAreas` to every client: the spawn search (`andrew_ws_`), `/andrew:find` (`andrew_find_`), the
ring loaders (`andrew_ring_<d>`) and the rod (`andrew_pearl_`). Each client asks before its `tickingarea add` and gives
the slot back after its `tickingarea remove`. A slot the budget refuses is retried like a refused add.

`L0-pear-ad01` asks for an allocator that is "the only code that runs `tickingarea add/remove`". What was built is a
budget instead: the names, the retries and the startup sweeps stay with each client. That keeps the structure loaders'
crash sweeps and their GameTest scenarios unchanged, and gives the same guarantee: a structure search never takes the
rod's slot. Without a budget (all GameTest structure scenarios) the loaders behave exactly as before.

### Measured on BDS 1.26.51.1 (private copy of the checks instance, 2026-10-13)

Preload ticks vary from run to run. The ranges below come from the earlier runs of 2026-10-13; the gate run is not bound
to them, and its own numbers are in its `[pear-tp] … RESULT` lines. The scenarios bind through a real cast
(`pear_tp_near_clears`) or by writing the record onto a fresh rod exactly as `bind.ts` writes it (all others). After every
outcome each scenario checks four things: the budget holds nothing, no trip is pending, no name is held, and the engine
still accepts as many areas as at the scenario's start (9 in a GameTest world). It counts the last by adding areas until
the engine refuses, then removing them. **Every check of every scenario read 9 of 9**: 22 checks in the gate run.

- **`pear_tp_near_clears`.** A cast onto a field of stone plates binds rel 3,2,3, and every other plate is cleared. The
  bound use throws no hook. The player moves 3 blocks onto the plate, `arrived` after 1 tick, read-back offset 0.000.
  Twenty ticks later the player is still there, on the ground on stone. Lore `Pearl Rod|unbound`, one line `arrived`.
  The next use is a plain cast: one hook, no bound use counted.
- **`pear_tp_far_unloaded`.** Pads at 100 000 and 1 000 000 blocks, built under a test area that is then removed. Each
  chunk read unloaded 1 tick later and was still unloaded at the use. Both trips arrived after 2 ticks, 99 997 and
  999 997 blocks, offset 0.000 and on the ground 20 ticks later. There is no distance limit anywhere in the code.
- **`pear_tp_unsafe_keeps`.** A stone plate on the platform:
  - three ways to make it unsafe: *suffocation* (stone over all nine head cells), *lava* (the plate's head blocked, lava
    in the 8 neighbours' feet) and *void* (the plate's head blocked, the floor under the 8 neighbours removed);
  - each is `unsafe` after 1 tick: not moved, the same record on the rod, lore still `bound: …`, one line `unsafe`;
  - control: the suffocation layout with only the west head cell opened arrives at the west neighbour.
- **`pear_tp_outcomes_no_leak`.**
  - *Plate gone*: the plate set to air, or to a birch plate, gives `plate-gone` after 1 tick, binding cleared, not moved.
  - *Not loaded*: a binding at y=400, above the overworld, whose cell never answers. The trip holds `andrew_gt_pearl_0`
    and 1 slot while it waits, and gives `not-loaded` at exactly 200 ticks, binding kept.
  - *Travelling*: a second use during that wait is refused once as `travelling` and adds no area.
  - *Busy (engine)*: 9 raw areas fill the world, so the engine refuses `andrew_gt_pearl_0`: `busy` after 0 ticks, kept.
  - *Dimension refused*: a binding to `andrew:nowhere` gives `dimension-refused`, kept.
  - *Rod left*: the slot is emptied right after a use bound to the Nether, giving `rod-left` once the Nether loads, after
    4–13 ticks. The record is still on the removed rod.
  - *Stranger*: a second player holding the owner's bound rod casts it: one hook, no bound use, the record unchanged.
  - *Riding*: `addRider` puts the player in a minecart. The trip ejects them and arrives; afterwards they ride nothing,
    and the cart stays.
  - *Died*: `kill()` during a wait gives `died (health 0)` in the kill tick itself, before `entityDie` arrives, with no
    actionbar line.
- **`pear_tp_pool_reserve`** (budget of 9 for the GameTest world).
  - *Control, no budget*: an unbudgeted ring loader asked for 12 areas loads 9, which fills the world. A trip is then
    refused by the engine (`busy`). That starvation is what the budget prevents.
  - *Budgeted*: a ring search (6 asks) and a find search (5 asks) share the budget and hold **8** (ring 3, find 5). The
    other 3 asks wait, with 6 refusals counted, and the engine has exactly 1 area left. A trip to a pad 200 000 blocks
    out runs on that slot: 1 rod slot seen, never fewer than 8 structure slots, `arrived` after 2–3 ticks.
  - *A second trip*: with the reserve held by a trip that cannot load, a second player's trip is `busy`, refused by the
    budget ("8 structure + 1 pearl of 9"), with the binding kept. Once that trip times out at 200 ticks, the second
    player's next use arrives.
  - After the searches release, all 11 asks have completed and the budget holds 0.
- **`pear_tp_cross_dimension`.** Pads in the Nether (20 000, y 70), the End (20 000, y 70) and the overworld (120 000).
  overworld → Nether arrived after 9–11 ticks, Nether → End after 5–8, End → overworld after 2–3. Offset 0.000 each time, and
  20 ticks later the player was on the ground on stone in the destination dimension.
- **Regression** (same copy, same day): `pear_bind_*` (4), `pear_item_*` (4), `strf_cmd_find`, `strf_cmd_find_refuses`,
  `windmill_spawn_once`, `windmill_spawn_holds_discovery` and `airship_linked_*` (4) are all green.

### Limitations

- **Only this pack's areas are counted.** Areas from other packs, from operators' `/tickingarea` or from GameTest sites
  are invisible to the budget. When they fill the world the engine refuses the add, and the trip reports `busy` with the
  reason in the log ("the engine refused tickingarea …").
- **Mobs standing on the spot are not considered**, and neither is a liquid that flows in after the check in the same
  tick (`L0-pear-ru02`).
- **The y=400 "never loads" case is forced.** On a real world a preload took 2–31 ticks (probe Q5), and no natural
  location failed to load in any run. The timeout is proven by making the cell unanswerable, not by a slow world.
- **A SimulatedPlayer loads no chunks.** After a far arrival, with the area gone, the cell under it read `unloaded` while
  it stood there, on the ground (the same as probe Q6). Whether a real client lands and the world draws is an iPad check.
- **`world.tickingAreaManager`** is in stable 2.10.0: per-pack areas with a chunk budget separate from the command cap
  of 10. It is neither measured nor used here. If it holds up on BDS it would remove the contention altogether.

### For the iPad sheet (`PEAR-IPAD-01-AA`)

- **The arrival**, near and far: the player lands on the plate, does not fall, and the world draws around them. Also the
  enderman sound.
- **The cancelled use**: a bound rod's use throws no line. Whether the client flickers a cast for a tick (probe Q4) is
  visible only on the device.
- **Every actionbar line**, in both languages: arrived, plate gone, not loaded, busy, dimension, unsafe, already
  travelling, rod left, failed.
- **Riding**: using the rod while on a horse or in a boat leaves the mount behind (`xq12` item 4).

## `owner.ts`: the binding belongs to a living player (`C-45`, `L0-pear-ru01`, `L0-pear-ent2`, `L0-pear-ac04`)

Spec v3 §7: when the binder dies, all their active bindings of this item reset, «даже если предмет позже поднимет другой
игрок» (even if another player picks the item up later). Handing the rod over or dropping it gives nobody else the right
to use the binding; they have to bind it themselves. The decisions live in `owner-rules.ts`, which has no engine import;
`tests/pearl-owner.test.mjs` runs it under node, and runs `owner.ts` with `bind.ts` against a stand-in engine.
`registerPearlOwner()` runs at script load, once per pack; `src/main.ts` arms one copy and the GameTest pack
(`src/gametest/pear-owner.ts`) arms its own.

**The life epoch.** Player dynamic property `andrew:life_epoch`, missing = 0. `world.afterEvents.entityDie` of a player
writes one more; it survives a logout and a restart like any player property. A binding carries its binder's id and the
epoch at bind time (`bind.ts`), and the use gate (`teleport.ts` `useVerdict` → `isHonoured`) honours it only for the same
id in the same epoch:

| who uses the rod | `honourOf` | the use |
|---|---|---|
| the binder, same epoch | `honoured` | a trip |
| the binder after a death | `past-life` | a vanilla cast |
| anybody else | `foreign` | a vanilla cast |
| a rod without a whole record | `unbound` | a vanilla cast |

Nobody is stopped from casting: the spec forbids using somebody else's *binding*, not their rod (`xasm42`). The caster's
own hook in a plate then binds the rod to the caster (one binding per rod, `bind.ts`).

**No search.** A death writes one number on the player and touches no rod. A rod in a chest, on the ground, in an unloaded
chunk or in a stranger's hand goes void because the epoch it carries is no longer its binder's.

**Erasing a dead record.** A void record can never be honoured again, since an epoch only grows, but it would keep the
lore `bound: …`. It is erased, with the lore set back to `unbound`, when the rod turns up while its binder is online in a
later life:
- a Pearl Rod carrying a record arrives in a player's inventory (`playerInventoryItemChange`: a pick-up, a chest take, a
  hand-over). The rod is found by its id, because `event.slot` does not say which container slot it names;
- a player spawns (`playerSpawn`): their whole inventory is swept, which covers rods kept through a death by
  `keepInventory` and rods whose binder died while the holder was away.

The erase is a `setItem` with the record gone, so `generation.ts` sees the release in the same inventory event.

**A death in the middle of a trip.** A trip reads a death three ways (`teleport.ts`): health 0, `entityDie`, a moved
epoch. Health is the one that counts in the tick of the death. Measured on BDS 1.26.51.1 with a scratch probe (`kill()`,
a lethal `applyDamage`, a Void death): the order in a tick is GameTest continuation → `runInterval` → `system.run` jobs →
after-events. Health reads 0 at once, but `entityDie` (and with it the epoch bump) arrives after that tick's interval.
For a Void death the continuation and the interval already read 0 in the death tick.

### Measured on BDS 1.26.51.1 (private copy of the checks instance, 2026-10-13)

- **`pear_owner_death_voids`.** A binds three rods to one stone plate in life 0. One stays in A's inventory, one goes to a
  chest, one to B by a throw and a pick-up.
  - Before the death: all three `honoured` for A, `foreign` for B. Control: a fourth rod bound alike takes A to the plate
    (`trip arrived after 1 ticks`).
  - `kill()`: one `entityDie` (cause `selfDestruct`), epoch 0 → 1. The rod in A's inventory spills on its own (C-46). All
    three rods read `past-life` for A, and B's copy is still `foreign` for B. **No rod was rewritten**: all three still
    carry the record of life 0.
  - B's use of A's rod after the death: a plain cast. B throws it and picks it up again: the record is erased, lore
    `Pearl Rod|unbound` (`cleared+1`).
  - A respawns and gets the spilled rod back from the ground and the other from the chest: both read `unbound`, lore
    `Pearl Rod|unbound`, and both uses are plain casts. A's own hook in a plate binds the rod again with epoch 1, and A's
    next use arrives on the plate.
- **`pear_owner_stranger`.** A binds a rod to an acacia plate and throws it; B picks it up: `foreign` for B, `honoured`
  for A.
  - B's use: a plain cast (hook out, gate trips +0, B moved 0.00); the record on the rod is still A's.
  - B's own hook in a heavy weighted plate: the record now names B, in B's epoch. B is `honoured`, A `foreign`, and B's
    next use arrives on B's plate.
  - Control: A's own rod, through a chest and a ground drop, is still `honoured`, and A's use arrives on A's plate.
- **`pear_owner_death_mid_trip`.** A near plate; the control trip arrives one tick after the use. A is then killed three
  ways:
  - `taken`: in the tick the gate takes the use, before the trip's first step → `died (health 0)` at use+0;
  - `ready`: in the first tick the trip holds its area with the plate loaded → `died (health 0)` at use+1;
  - `ready_keep`: the same with `keepInventory` on, the rod staying in the dead hand → `died (health 0)` at use+1.

  In all three: moved 0.00, no actionbar line, no arrival counted, no trip and no area left, epoch +1. The rod kept in the
  dead hand still carries its record (void by epoch). Back in the new life, the rod reads `Pearl Rod|unbound` and casts.
  Before the trip's health check existed, `ready` ended `rod-left` with `andrew.pearl_rod.rod_left` («Удочки нет в
  инвентаре…») sent to the dead player, and `ready_keep` ended **`arrived`**: the dead player was moved 3 blocks onto the plate, told "arrived", and the
  binding was cleared (`5.red.json`).

### Limitations

- **The lore cannot follow the holder.** It belongs to the item, not to the viewer. A live binding of A reads `bound: …` in
  B's hand too, although for B the rod casts.
- **A dead record waits for its binder to be online.** Whether a binder has died since is known only from the binder's
  own epoch, readable while they are online. A rod in a chest whose binder has left the game keeps `bound: …` until the
  binder is back and the rod moves. It is void all the same; only the lore lags.
- **Death is the only reset.** A binder who logs out keeps their bindings: the spec resets them on death only.

### For the iPad sheet (`PEAR-IPAD-01-AA`)

- **Death resets the binding.** Bind a rod, die, pick the rod up: the lore reads `unbound`, and the use casts.
- **A friend cannot ride your binding.** Hand a bound rod to a second player: their use casts a line, and nobody moves.

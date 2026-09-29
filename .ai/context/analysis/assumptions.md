---
title: Assumptions
type: analysis
generated_at: "2026-09-29T20:38:15.059Z"
source_channel: rollout
node_id: rollout-assumptions
aliases: ["rollout-assumptions","assumptions"]
is_a: ["rollout","assumptions"]
relates_to: ["L0-lgnd-as01","L0-lgnd-as02","L0-lgnd-as03","L0-lgnd-as04","L0-lgnd-as05","L0-lgnd-as06","L0-lgnd-as07","L0-lgnd-as08","L0-lgnd-as09","L0-lgnd-as10","L0-lgnd-as11","L0-lgnd-as12","L0-lgnd-as13","L0-lgnd-as14","L0-orbc-as01","L0-orbc-as02","L0-orbc-as03","L0-orbc-as04","L0-orbc-as05","L0-orbc-as06","L0-orbc-as07","L0-orbc-as08","L0-pntr-as01","L0-pntr-as02","L0-pntr-as03","L0-pntr-as04","L0-pntr-as05","L0-pntr-as06","L0-pntr-as07","L0-pntr-as08","L0-ring-as01","L0-ring-as02","L0-ring-as03","L0-ring-as04","L0-ring-as05","L0-ring-as06","L0-ring-as07","L0-ring-as08","L0-xasm10","L0-xasm11","L0-xasm12","L0-xasm6","L0-xasm7","L0-xasm8","L0-xasm9"]
priority: 540
---

# Assumptions (CAN_ASSUME)

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

### Lgnd as01 concept assumption (L0-lgnd-as01)

**ASM-lgnd-01: Q-020 default (a) applies to both weapons.**

Indestructibility and Void return cover the Web Sword as well as the Scythe ("по общим правилам", by the general rules). The craft right is still not reopened.

**Impact if wrong:**
- **(b) Scythe only:** `returnOnLoss` becomes a per-def flag set to false for the Web Sword. That is a one-line change, and ac09 is inverted for the Web Sword.
- **(c) not in v3:** drop `L0-lgnd-p003`, the owed/gen parts of ent4, ad02, ad03, ac08–ac10 and ac12. That removes about 30 % of this component's effort.






### Lgnd as02 concept assumption (L0-lgnd-as02)

**ASM-lgnd-02: The Scythe's key prefix is `sc` and its ability key is `scythe_of_calamity`.**

No source names them. They mirror the Web Sword's `ws` / `web_sword`.

**Impact if wrong:** none until the first world ships with them. After that, the names are frozen by the same logic as `L0-lgnd-r006`.






### Lgnd as03 concept assumption (L0-lgnd-as03)

**ASM-lgnd-03: The stable 2.10.0 API raises `world.beforeEvents.entityRemove` and `entitySpawn` for `minecraft:item` entities, without a removal reason.**

The removals assumed to raise the event: falling below the world floor, lava/fire, cactus, explosions and despawn. Because the event gives no reason, pickup vs. loss is inferred (`L0-lgnd-p003` step 3).

**Impact if wrong:**
- If the Void kill raises no `entityRemove`, the watcher's `y < heightRange.min` check becomes the only Void path. It still works.
- If some destruction cause raises nothing, that cause is not covered, and ac09 narrows.

This must be measured on BDS 1.26.51.x first, as was done for retention path A/B.






### Lgnd as04 concept assumption (L0-lgnd-as04)

**ASM-lgnd-04: No stable item component makes a custom item entity immune to lava, fire, cactus or explosions.**

So "must not be destroyed by ordinary means" (Scythe §1) is realised as *destroyed, then immediately re-issued to the last holder*, not as physical immunity.

**Impact if wrong:** if such a component exists on 1.26.50 (C-1), fire, lava and explosions become prevention instead of recovery. Most gen bumps disappear, and the stale-copy surface shrinks. The Void path is still needed.






### Lgnd as05 concept assumption (L0-lgnd-as05)

**ASM-lgnd-05: Unmarked (Creative) copies keep casting.**

The shipped `trap.ts` checks only `isWebSword`, never the mark. `src/gametest/main.ts` hands out unmarked `new ItemStack(WEB_SWORD_ID)` for the trap scenarios (checked). So the dispatcher treats an unmarked legendary as castable, with its cooldown keyed by the player. Only *stale* marked stacks are barred.

**Impact if wrong:** requiring a mark to cast would break the Web Sword trap GameTests (C-10). It would also make Creative testing on the iPad impossible.






### Lgnd as06 concept assumption (L0-lgnd-as06)

**ASM-lgnd-06: Ledger sizes stay far below the dynamic-property string limit (about 32 KB).**

Admin `give` copies are rare, and each owed entry is about 200 chars.

**Impact if wrong:** a long-running test world with many lost admin copies could overflow `_owed`. The mitigation is to drop the oldest `despawn` entries and log a line. That loses those debts, which in practice means admin copies only.






### Lgnd as07 concept assumption (L0-lgnd-as07)

**ASM-lgnd-07: Bedrock never raises `itemUse` for an off-hand custom item, and `minecraft:allow_off_hand` works on a custom sword and a custom hoe in 1.26.50.**

The off-hand ability is therefore reachable only through a main-hand legendary press (Q-019 a).

**Impact if wrong:**
- If `allow_off_hand` is rejected for these items, the two-hand ACs (ac04–ac06) cannot be tested, and Q-019 degrades to (b): HUD only.
- If an off-hand Use event does exist, the dispatcher gets a second trigger with the same priority rule.






### Lgnd as08 concept assumption (L0-lgnd-as08)

**ASM-lgnd-08: "Main hand on cooldown" (Scythe §6) also covers "main hand busy".**

So while a Scythe volley is in flight, a ready off-hand Web Sword fires on the next Use press.

**Impact if wrong:** if busy should swallow the press instead, one condition in `L0-lgnd-p004` changes and ac05's busy variant flips. In gameplay terms, the player could not web-trap a target mid-volley.






### Lgnd as09 concept assumption (L0-lgnd-as09)

---
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r010", "L0-stgt", "L0-lgnd-p007"]
---
**ASM-lgnd-09: Shadow Blade hiding is stored as `andrew:hidden_until` in epoch milliseconds.**

Scythe §3 excludes a player hidden by Shadow Blade's active ability, but no source defines Shadow Blade or how its hidden state is stored. `L0-lgnd-r010` fixes a player dynamic property `andrew:hidden_until` holding a `Date.now()` deadline, the same clock as cooldowns (ticks restart with the script engine; absolute time stops with `dodaylightcycle false`, measured on BDS 1.26.51.1). Earlier lgnd artifacts cite this as "ASM-020"; no such parent assumption exists in the KV, so this artifact is the record.

**Impact if wrong:** low and local. If Shadow Blade arrives using a tag, an effect (invisibility) or a tick-based deadline, only the body of `isHiddenFromTargeting` changes; `L0-stgt` and the `/andrew:hide` test seam keep their call sites.






### Lgnd as10 concept assumption (L0-lgnd-as10)

---
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-cx09", "L0-lgnd-p003", "L0-lgnd-ad03", "L0-lgnd-cx06"]
---
**ASM-lgnd-10: A 40-tick loss check is fast enough to catch the Void before the engine kills the item. A hopper is the only non-player collector that matters.**

`recovery.ts` checks the watched entities every 40 ticks (2 s). An item that falls below `heightRange.min` is assumed to still exist at the next check, and the code removes it itself. The pickup heuristic looks only at players and at the container at the spot or one block below.

**Impact if wrong:**
- **The engine kills Void items within 2 s.** Classification then falls to "vanished from the ground", which gives the same outcome: the item is returned. Only the log line differs, so the impact is low.
- **Allays, hopper minecarts or hopper chains matter in practice.** A duplicate becomes possible (`cx09` item 2).

This must be measured on BDS 1.26.51.x.






### Lgnd as11 concept assumption (L0-lgnd-as11)

---
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-as05", "L0-lgnd-r012", "L0-lgnd-r014", "L0-lgnd-ad08"]
---
**ASM-lgnd-11: Unmarked copies (vanilla `/give`, Creative) are ordinary items. They cast, but get no legendary protection.**

Orbital §4 allows these copies "for testing". Spec AC-20 says "the Orbital Cannon and all legendary weapons survive death and ordinary destruction", but does not say whether test copies are included.

What unmarked copies get under this assumption:
- **Cast:** yes, sharing the player's cooldown (Orbital §7, AC-17; `as05`).
- **Protection:** none. No death retention, loss return or `protectLegendariesIn` move. They die, burn and vanish as vanilla items.

Why:
- Each protection writes a durable token.
- Unmarked copies are unlimited, so protecting them grows `_owed`/`_pending` without bound (`as06`).
- It protects nothing scarce.

**Impact if wrong.** If the client wants every copy protected, the gate stamps `origin: "admin"` on the first inventory sighting of an unmarked `itemId` (no flag change).
- This is one branch in `craftgate.ts`.
- The owed list then needs a cap (drop the oldest `admin` entries).
- The `ac09` "unmarked destroyed as vanilla" clause inverts.






### Lgnd as12 concept assumption (L0-lgnd-as12)

---
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p008", "L0-lgnd-r013", "L0-lgnd-ad10", "L0-xasm7", "L0-adr-ochg"]
---
**ASM-lgnd-12: Engine behaviour behind `protectLegendariesIn` (probe on BDS 1.26.51.x)**

1. `Dimension.getBlocks(volume, { includeTypes })` is stable in `@minecraft/server` 2.10.0. It filters engine-side, so a query of about 9³ (one RMB detonation) or about 5×5×384 (one LMB column) costs well under 1 ms per call.
2. `block.getComponent("inventory").container` is readable and writable for chests, barrels, hoppers, shulker boxes and the other inventory blocks, and `setItem(i)` removes a slot.
3. `setType("minecraft:air")` on a container **deletes** its contents without spawning item entities. That is the reason the extraction has to come before it.
4. `createExplosion` on a container **spills** its contents as new item entities. That is the reason RMB suppression must exempt legendaries.
5. `dimension.spawnItem(stack, loc)` keeps the stack's dynamic properties (the mark). The shipped death path B already relies on this for re-grant.

**Impact if wrong.**
- If (1) is not stable or is slow: iterate `getBlock` over the volume inside the Cannon's own removal job (pass a per-block `protectBlock(block)` instead). The cost moves into `pntr`'s job budget.
- If (3) spills contents: tier 1 is still needed for RMB, and the LMB step becomes a safety net.
- If (5) drops properties: re-drop through `new ItemStack` plus a re-stamp.






### Lgnd as13 concept assumption (L0-lgnd-as13)

---
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad08", "L0-lgnd-r014", "L0-lgnd-p001", "L0-lgnd-ac15"]
---
**ASM-lgnd-13: A recipe can output a hidden token item that looks like the weapon, and the swap is invisible in practice.**

This assumes all of the following on 1.26.50 / BDS 1.26.51.x:
- A shaped recipe's `result` can be a custom item with `menu_category: none`.
- The crafting-table and 2×2 previews and the recipe book show its icon and localized name. Given the same `minecraft:icon` and a lang name equal to the weapon's, the result looks the same as the real weapon.
- `playerInventoryItemChange` fires when the token reaches any inventory slot. That includes a click-craft that leaves it on the cursor and is then placed, and the iPad craft button that moves it straight into the inventory.
- Replacing it in the next tick causes no client flicker that matters.
- A vanilla `/give @p andrew:<item>_crafted` is possible but obscure, and it would claim. That is accepted: it is the documented way to *simulate* a craft in tests.

**Impact if wrong.**
- If the recipe book hides `menu_category: none` results, set the category to `items` with `is_hidden_in_commands`, or accept the token being visible in Creative search.
- If `playerInventoryItemChange` misses the cursor-to-drop path (the player throws the crafted token straight out of the UI), the token claims later, when it is picked up. The outcome is the same.
- If the whole approach fails, fall back to `ad08` rejected (c) and document that `/give` claims.






### Lgnd as14 concept assumption (L0-lgnd-as14)

---
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad09", "L0-lgnd-r015", "L0-lgnd-p009", "L0-xasm10"]
---
**ASM-lgnd-14: LMB with an off-hand Cannon does nothing. "Attack" is a main-hand action only.**

Orbital §7 shows the HUD for either hand. Orbital §6 gives two modes, but does not say which hand an attack comes from. Vanilla swings with the main-hand item, and `entityHitBlock` reports the main-hand context. An off-hand Cannon therefore:
- responds to **Use** only, through a main-hand legendary press (`as07`, hand priority);
- never responds to LMB.

**Impact if wrong.** If the client expects LMB to fire an off-hand Cannon while the main hand holds, for example, a pickaxe, `resolveActivation(player, "attack")` gains the off-hand fallback that `use` already has. That is one line. But mining with a pickaxe would then also fire the Cannon at every block you start to break, which is almost certainly unwanted. Confirm at the iPad DEMO.






### ASM-orbc-01 · \ (L0-orbc-as01)

# ASM-orbc-01 · "N blocks above the chosen point" is measured from the target block's Y

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-orbc-r007"]`

**Gap.** §8 says "30 blocks above the selected point", but does not say whether that is the block's Y, its top face (Y+1) or the hit point.

**Assumption.**
- `spawnY = target.y + offset`, in integer block coordinates.
- The charge's feet are at `spawnY`, and x and z are at the column centre (+0.5).
- The hit face and the sub-block hit point are ignored.

**Impact if wrong.** ±1 block of height, which is about 1 tick of fall. It only affects AC-4's exact numbers, and the unit test holds the constant.






### ASM-orbc-02 · Fall speed is a constant 1 block per tick (L0-orbc-as02)

# ASM-orbc-02 · Fall speed is a constant 1 block per tick

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-orbc-ad02", "L0-orbc-p002"]`

**Gap.** §8 says only "falls vertically down". No speed or acceleration is given.

**Assumption.**
- `FALL_SPEED = 1.0` block/tick, which is 20 blocks/s, constant with no acceleration.
- A +30 drop onto flat ground takes 1.5 s, and +10 in the Nether takes 0.5 s.
- It is exported as one named constant in `src/orbital/charge.ts`.

**Impact if wrong.**
- Faster (for example vanilla terminal, about 2–4 b/t) doubles the per-tick sweep reads and makes the TNT hard to see on the iPad.
- Slower makes aimed PvP shots easy to dodge.

The value is purely a tuning change. The sweep (`ad02`) keeps contact exact at any speed.






### ASM-orbc-03 · What a \ (L0-orbc-as03)

# ASM-orbc-03 · What a "block" is for contact

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-orbc-r008", "L0-orbc-r003"]`

**Gap.** §8 says a charge detonates "on first contact with a block", and one spawned in a "solid block" triggers at once. "Solid" is not defined. `Block.isSolid` exists in stable, but its semantics for slabs, leaves, glass and similar blocks are not verified on 1.26.51.1.

**Assumption.**
- Contact means not air, not a liquid, and not in `PASS_THROUGH`.
- `PASS_THROUGH` holds:
  - short and tall grass, ferns, flowers, saplings and dead bush;
  - all torches, redstone wire and rails;
  - a snow layer of height 1;
  - vines, cobweb, sugar cane, kelp and seagrass;
  - fire and soul fire;
  - `structure_void` and `light_block`.
- Everything else is contact, including leaves, glass, slabs, carpets, fences and barriers.
- A unit test lists the set, and the target raycast (`r003`) skips the same passable blocks.

**Probe.** Compare `Block.isSolid` against this set on BDS. If they agree, use `!isSolid && !isLiquid` as pass-through.

**Impact if wrong.** A charge stops on a flower, which gives an effect 1 block high, or it passes through a leaf canopy. Minor, and a local fix.






### ASM-orbc-04 · All charges of one attack spawn at the same Y, derived from the target (L0-orbc-as04)

# ASM-orbc-04 · All charges of one attack spawn at the same Y, derived from the target

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-orbc-r007", "L0-ring"]`

**Gap.** §10 says all RMB charges "are created simultaneously at the corresponding dimension height and start falling simultaneously". It is unclear whether "height" means per-column terrain + 30, or target + 30.

**Assumption.** There is one `spawnY` per attack, `target.y + offset` clamped (`r007`), shared by every ring column. On uneven terrain a column's fall is then longer or shorter, which matches §10's note that "actual detonation timing may differ slightly".

**Impact if wrong.** With per-column heights, every column needs a surface read at spawn: about 160 `getTopmostBlock` calls. The fall times would equalise. It is a change only in `p001` step 7.






### ASM-orbc-05 · Blocks stay unbreakable while the Cannon is in the main hand (L0-orbc-as05)

# ASM-orbc-05 · Blocks stay unbreakable while the Cannon is in the main hand

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-orbc-p001", "L0-adr-orbc"]`

**Gap.** `L0-adr-orbc` cancels `playerBreakBlock` so that Creative LMB does not break the target. It does not say what happens in Survival or during cooldown.

**Assumption.** `beforeEvents.playerBreakBlock` is cancelled whenever the main hand holds `andrew:orbital_cannon`, in every game mode, during cooldown or not. LMB is purely a weapon: a Survival hold never mines the targeted block, and players cannot mine with the Cannon.

**Impact if wrong.** If mining with the Cannon is expected, drop the cancel in Survival. It is a one-line change. The risk is that a Survival hold mines the block in the same gesture that fires.






### ASM-orbc-06 · A press during cooldown is silent (L0-orbc-as06)

# ASM-orbc-06 · A press during cooldown is silent

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-orbc-r005", "L0-orbc-r004"]`

**Gap.** §6 says only "a repeated press does not create a charge" during cooldown.

**Assumption.** A press during cooldown gives no message, sound or flash. The Action Bar countdown (`r012`) is the only feedback, and it is always visible while the Cannon is held.

**Impact if wrong.** If a "not ready" cue is wanted, add one lang key and a player-only `playSound`. There is no state change.






### ASM-orbc-07 · Creative Equipment category with no item group (L0-orbc-as07)

# ASM-orbc-07 · Creative Equipment category with no item group

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-orbc-ent1", "L0-orbc-ac02"]`

**Gap.** §4 says "preferably in Equipment". The Web Sword and Scythe join vanilla groups (`itemGroup.name.sword`, `itemGroup.name.hoe`). There is no verified vanilla group for the fishing rod.

**Assumption.** `menu_category: {category: "equipment"}` with no `group`. The Cannon then appears as a standalone entry in the Equipment tab.

**Impact if wrong.** It is cosmetic. If a rod or tool group id is confirmed on the iPad, add `group`. The change is JSON only.






### ASM-orbc-08 · Omitting `minecraft:damage` gives exactly empty-hand damage (L0-orbc-as08)

# ASM-orbc-08 · Omitting `minecraft:damage` gives exactly empty-hand damage

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-orbc-ent1", "L0-orbc-ac01"]`

**Gap.** §2 requires melee damage equal to an empty-hand punch. The default attack damage of a custom item without the component is believed to be 1, the same as the hand, but it is not measured.

**Assumption.**
- The item JSON has no `minecraft:damage` and no `minecraft:tags`, so no weapon or enchant-slot bonuses apply.
- `ac01` measures the result against an empty hand on BDS.

**Impact if wrong.** Set `minecraft:damage` to the value that matches the measurement. It is a JSON-only fix.






### AS-pntr-01 · Irregularity model and top edge (L0-pntr-as01)

# AS-pntr-01 · Irregularity model and top edge

**Gap.** §9 gives only "approximately 5×5", "small natural irregularity" and "from the actual trigger point".

**Assumption (CAN_ASSUME).**
- Horizontally the column fits in 7×7, with a 3×3 core that is always present and about 25 cells per layer.
- It starts exactly at the detonation cell's y. There is no crater or bowl above it and no widening at the surface.

**Impact if wrong.** If the client expects a TNT-like crater at the top, add a small hemispherical cut (r≈2.5) around `top`. That is a local change to `planColumn` and cheap.






### AS-pntr-02 · `setType` gives no drops or XP (L0-pntr-as02)

# AS-pntr-02 · `setType` gives no drops or XP

**Gap.** The stable API docs do not say whether `Block.setType` on a block with a block entity (chest, shulker, spawner) spills its contents or XP.

**Assumption (CAN_ASSUME).**
- `setType` replaces the block silently: no item entities and no XP orbs.
- `pntr` still calls `container.clearAll()` first as belt-and-braces (`L0-pntr-r004`).

**Probe.** A BDS gametest places a filled chest, a shulker box, a spawner and a furnace with fuel/output in the column, fires the LMB, then counts `minecraft:item` and `minecraft:xp_orb` entities in the column AABB. The count must be 0.

**Impact if wrong.**
- The furnace XP or a spawner's orb would leak. The fix is a post-job sweep of *new* item or XP entities in the column AABB that skips legendaries, reusing `ring`'s snapshot method (`L0-adr-ochg`).
- The cost is small, but it adds entity scans to C-5a′.






### AS-pntr-03 · Per-cell throughput is enough to look instant (L0-pntr-as03)

# AS-pntr-03 · Per-cell throughput is enough to look instant

**Gap.** There are no measured numbers for `getBlock` + `setType` cost on BDS 1.26.x with `runJob`.

**Assumption (CAN_ASSUME).**
- `runJob` processes at least ~2,000 column cells per tick without pushing the tick above 50 ms on the target host.
- So a typical Overworld column (~3,500 cells) finishes in ≤ 3 ticks, and the worst case (~9,600 cells) in ≤ 6 ticks (PN-1).

**Probe.** A gametest fires LMB from y=319 in a stone-filled test area and records `report.ticksUsed` and the tick times. It is repeated with 3 concurrent columns.

**Impact if wrong.**
- Removal visibly lags (the shaft "unzips" downward). Mitigations, in order:
  1. the hybrid `fillBlocks` fast path (`L0-pntr-ad01`, rejected alternative 1);
  2. relaxing PN-1 to ≤ 10 ticks and documenting it (C-15 rank 4 < rank 3).
- AC-10 (`L0-pntr-ac07`) is at risk.






### AS-pntr-04 · Waterlogged cells become water (L0-pntr-as04)

# AS-pntr-04 · Waterlogged cells become water

**Gap.**
- §9 says liquids are not removed.
- `xasm6` says "waterlogged state is kept" but does not say what happens to the solid part.

**Assumption (CAN_ASSUME).**
- A waterlogged block (a waterlogged fence, stairs, seagrass or kelp base) is treated as a solid plus water.
- The solid is removed and the cell becomes `minecraft:water`, a source block.
- So an ocean-floor column through a waterlogged shipwreck keeps its water.

**Impact if wrong.**
- If the client reads "keep waterlogged" as "keep the whole block", those cells go into the keep class. That is a one-line change, but it leaves fences and stairs floating in the shaft.
- Setting a source block could also create a little extra water where the waterlogged block had been dry-adjacent. This is cosmetic.






### AS-pntr-05 · Legendaries nested in storage items are `lgnd`'s problem (L0-pntr-as05)

# AS-pntr-05 · Legendaries nested in storage items are `lgnd`'s problem

**Gap.**
- A legendary can sit inside a bundle or shulker-box *item* that is inside a chest in the column.
- Stable 2.10.0 exposes `ItemInventoryComponent` only for items with the Storage Item component (bundles). Whether a shulker-box item's contents are readable is unverified.

**Assumption (CAN_ASSUME).**
- `lgnd.protectLegendariesIn` owns the recursion: it walks nested storage items where the API allows.
- `pntr` passes only the cell volume. It does not inspect items itself, so there is a single implementation shared with `ring`.

**Impact if wrong.**
- If shulker-box items are opaque, a legendary nested in one is deleted by the LMB. That violates C-7′.
- The `lgnd` delta must then either block putting legendaries into shulker boxes (a `beforeEvents` hook) or document the gap under C-16. Neither changes `pntr` code.






### AS-pntr-06 · Drops from neighbours outside the column are environmental (L0-pntr-as06)

# AS-pntr-06 · Drops from neighbours outside the column are environmental

**Gap.**
- §9's "no drops" covers destroyed blocks.
- Removing the column also breaks attached blocks *outside* it (torches, ladders, signs, rails, door halves, portal blocks), and they pop by vanilla rules.
- C-19 forbids "uncontrolled item entities".

**Assumption (CAN_ASSUME).**
- These neighbour drops are "environmental consequences" (AC-9) and are not suppressed.
- They are bounded: at most one ring of neighbours around the 7×7 column.
- `pntr` guarantees zero drops only for cells inside the column.

**Impact if wrong.** If the client wants a spotless column, add a post-job sweep of new item entities in a 9×9 AABB around the column (skipping legendaries). This is the same helper as in `L0-pntr-as02`.






### AS-pntr-07 · Liquids and gravity blocks react to script `setType` (L0-pntr-as07)

# AS-pntr-07 · Liquids and gravity blocks react to script `setType`

**Gap.** §9 says liquids "flow naturally into the shaft" after removal. The stable docs do not guarantee that `Block.setType` fires the neighbour updates that make water, lava or sand move.

**Assumption (CAN_ASSUME).** `setType` triggers ordinary neighbour updates:
- adjacent water and lava start flowing into the new air;
- sand and gravel above removed cells fall.

**Probe.** Fire LMB next to a water pool and under a sand overhang. Water must enter the shaft within 2 s and the sand must fall.

**Impact if wrong.** The shaft walls stay as frozen liquid faces, which violates §9 and AC-7. The fix: after the job, touch each edge liquid cell (`setType` to the same liquid) to force an update. That is O(perimeter) cheap.






### AS-pntr-08 · Non-solid breakables are removed too (L0-pntr-as08)

# AS-pntr-08 · Non-solid breakables are removed too

**Gap.** §9 speaks of destroying "all **solid** blocks a Survival player can break", and also says chests, spawners "and other destructible blocks" are destroyed.

**Assumption (CAN_ASSUME).** Everything that is not air, liquid or on the `xasm6` keep list is removed, including non-solid blocks such as torches, flowers, grass, snow layers, cobwebs, rails, carpets, signs and item frames. This matches `xasm6`'s "everything else is removed" and gives a clean shaft.

**Impact if wrong.** If only full solids should go, the classifier needs a solidity test. There is no stable query for it, so a second list would be needed. Cosmetic.






### Ring as01 concept assumption (L0-ring-as01)

**ASM-ring-01 · Script explosions drop the blocks they break**

**Assumption.** A `createExplosion(…, 4, {breaksBlocks:true})` on BDS 1.26.x drops the broken blocks as item entities, as vanilla Bedrock TNT does (effectively 100% yield). Suppression is therefore required. This is the probe item named in `L0-adr-ochg`.

**Probe.** Explode on a 9×9×5 stone/dirt pad with `doTileDrops` true, then count `minecraft:item` within ±8.

**Impact if wrong.**
- If script explosions drop nothing by themselves, `ad01` becomes dead code: remove the toggle and keep only the container check.
- If they drop at 1/power probability (Java-like), suppression is still needed, but the load in RG-4 is 4× lower.






### Ring as02 concept assumption (L0-ring-as02)

**ASM-ring-02 · `doTileDrops=false` also stops container contents spilling, and nothing else**

**Assumption.** While `world.gameRules.doTileDrops` is false:
- a chest, barrel, hopper or shulker box destroyed by the explosion drops neither itself nor its contents;
- mob loot and player death drops (`doMobLoot`, `keepInventory`) are unaffected.

**Probe.** One chest with 10 cobblestone, one zombie and one SimulatedPlayer (via the `bds-gametest` pack; see memory about SimulatedPlayer visibility) inside a blast. Count the items by type afterwards.

**Impact if wrong.**
- If contents still spill, enable the container fallback in `ad01`/`ent3`. That is a small, localised change.
- If mob or player drops are also suppressed, `ad01` fails `r006`. Revert to a diff limited to destroyed-block cells, and reopen `L0-ring-cx01`.






### Ring as03 concept assumption (L0-ring-as03)

**ASM-ring-03 · `source: owner` does not exempt the owner from damage**

**Assumption.** `ExplosionOptions.source` only attributes the explosion, for kill messages and credit. The source entity still takes damage and knockback, as a player who lit vanilla TNT does.

**Probe.** Run AC-13 twice, with and without `source`, on a SimulatedPlayer owner at 3 blocks. Compare the health loss.

**Impact if wrong.** If `source` exempts the owner, omit `source` on every blast. The only loss is kill attribution in the death message ("blown up" instead of "blown up by X"). Document it (C-16).






### Ring as04 concept assumption (L0-ring-as04)

**ASM-ring-04 · `breaksBlocks:false, allowUnderwater:true` in water deals full damage and still plays sound and particles**

**Assumption.** An explosion whose centre is in water, with these flags:
- changes no block;
- damages entities as on land;
- plays the normal explosion sound and particles.

**Probe.** Blast centred in a 5-deep pool, with a zombie 2 blocks away and a SimulatedPlayer at 4. Snapshot the blocks before and after.

**Impact if wrong.**
- If there is no sound underwater, add `dim.playSound("random.explode", centre)` for underwater blasts only (AC-12, ipad).
- If the damage is reduced by water, accept it as vanilla-consistent and note it (C-16). The spec says "normal TNT damage", and vanilla underwater TNT is the reference.






### Ring as05 concept assumption (L0-ring-as05)

**ASM-ring-05 · 48 power-4 explosions per tick fit the tick budget on BDS in Docker on the M4 Pro**

**Assumption.** `RING_MAX_BLASTS_PER_TICK = 48` with `doTileDrops` false keeps tick time within RG-3, with the players on iPad.
- The value is a starting guess: vanilla handles TNT cannons of this order.
- The cost is dominated by explosion ray-casting (~1,300 rays per blast) and client chunk re-sends.

**Probe.** 3 SimulatedPlayers fire RMB at the same tick over flat stone. Log `system.currentTick` deltas and the wall-clock ms per tick.

**Impact if wrong.**
- Lower the cap: 32, then 16. With 3 attacks, the drain time grows to ≤ 30 ticks (1.5 s), and RG-2 is relaxed as allowed.
- If even 16 fails, the only remaining lever is fewer charges: a 4-connected ring, about −30% (`L0-xasm8` impact).






### Ring as06 concept assumption (L0-ring-as06)

**ASM-ring-06 · The charge count is 140–160 per RMB, with a hard cap of 200**

**Assumption.**
- The real-radius midpoint circle in `p001` gives about 1 + 16 + 28 + 44 + 56 ≈ 145 columns. `L0-xasm8` estimated ≈ 160.
- All budgets (orbc's 480-charge flight sweep, RG-1 to RG-3) are sized for ≤ 160 per attack × 3 attacks.
- A unit test pins the exact count, and `layout` asserts ≤ 200.

**Impact if wrong.**
- If the client wants visibly thicker rings (a 2-wide band), the count roughly doubles to ~300. That breaks orbc's sweep budget and RG-3, and needs a new L0 budget decision.
- If the client accepts a 4-connected ring, the count drops to ~100.






### Ring as07 concept assumption (L0-ring-as07)

**ASM-ring-07 · World TNT primed by a ring blast is ordinary vanilla TNT**

**Assumption.**
- `minecraft:tnt` blocks in the world that a ring blast primes behave exactly as vanilla:
  - they explode ~4 s later;
  - they can push each other;
  - they drop blocks, because `doTileDrops` has been restored by then;
  - they can chain.
- "Each charge is independent" (§10) is about the Cannon's own charges only.

**Impact if wrong.** If the client expects the world's TNT to be neutralised, `ring` must remove TNT blocks in the blast volume beforehand. That breaks "TNT-like" behaviour and costs another block query per step.






### Ring as08 concept assumption (L0-ring-as08)

**ASM-ring-08 · The blast centre is the cell above the contact block**

**Assumption.** A landed charge explodes as if it were TNT resting on the contact block, with its centre at `point + (0.5, 1.5, 0.5)`. It uses `point` itself only when the cell above is solid (`r010`). §10 says only "falls to the first block". The resting position is the natural reading, and it matches what the iPad player sees: the TNT touches the ground, then explodes.

**Impact if wrong.** If the blast is meant to be *in* the contact block, the craters come out ~1 block deeper and the seabed checks move one cell down. It is a one-line change in `r010`, with no effect on budgets.






### ASM-L0-10 · Mobile LMB/RMB mapping and \ (L0-xasm10)

# ASM-L0-10 · Mobile LMB/RMB mapping and "successful activation"

**Gap.** Orbital §6 asks for "the closest stable equivalent on mobile" and says the cooldown starts on "successful activation".

**Assumption (CAN_ASSUME).**
- On iPad touch (the default "tap to interact" scheme), **tap on a block = Use (RMB)** and **hold on a block = Attack/break start (LMB)**. The `entityHitBlock` event fires at the start of the hold.
- "Successful activation" means a valid target was found and the charges were spawned. The cooldown and target lock are written in the same tick as the spawn, before any charge moves.

**Impact if wrong.**
- If the iPad's tap fires both a hit and a use in one gesture, one activation must win per tick. The rule: the first event that tick consumes the cooldown, and the second is a no-op.
- If "successful" means "hit something", AC-16 changes. The spec says otherwise (§6: "not after the hit").






### ASM-L0-11 · Engine facts assumed across `lgnd`, `pntr` and `ring`, to be probed once on BDS 1.26.51.1 (checks instance, port 19136) (L0-xasm11)

# ASM-L0-11 · Engine facts assumed across `lgnd`, `pntr` and `ring`, to be probed once on BDS 1.26.51.1 (checks instance, port 19136)

Each child has its own local probes (`pntr-as01…08`, `ring-as01…08`). The probes below are the ones that **more than one** component's design rests on. They run once, as the first commit of the `lgnd` v3 step 5, before `pntr` or `ring` code is written.

| # | Assumed (CAN_ASSUME) | Rests on it | If false |
|---|---|---|---|
| P1 | `runCommand("setblock x y z air destroy")` on `frame`/`glow_frame` spills the frame and its item as item entities, and `getEntities` sees them in the same tick or after one `system.run`. | `L0-adr-oprt` §3 (`p008` step 2b), used by both effects | Frame fallback: `pntr` keeps frames. For `ring`, a C-16 documented limit. |
| P2 | Setting `world.gameRules.doTileDrops` from script is silent to clients (no chat line or toast) and applies to blocks broken by `createExplosion` in the same synchronous call. | `L0-adr-odrp`, `ring-ad01` | `ring-ad01`'s fallback: an item diff limited to destroyed-block cells. |
| P3 | With `doTileDrops=false`, a container destroyed by `createExplosion` does not spill its contents (`ring-as02`). | `L0-adr-odrp` §2 | `ring-ad01`'s container fallback. Legendaries are already safe through `p008`. |
| P4 | A `createExplosion` of power 4 damages or destroys item entities no farther than 2 × power (8 blocks) from its centre. | `L0-adr-oprt` §1 margin | Widen the `ring` margin to the measured value. The `p008` contract is unchanged, because the caller sizes the volume. |

**Why an assumption, not a question.** These are all engine facts that the checks instance can answer in one GameTest. Nothing here needs the client.






### ASM-L0-12 · Each component caps its own per-tick work, and the sum is accepted without a shared scheduler (L0-xasm12)

# ASM-L0-12 · Each component caps its own per-tick work, and the sum is accepted without a shared scheduler

**Observed across the children.** Four independent bounded loops can run at once for one world:
- the `orbc` charge job, one per attack (`L0-adr-ochg` §2);
- the `pntr` removal `runJob` and its 20-tick particle job (`pntr-ad01`, `ad03`);
- the `ring` detonation queue, ≤ `RING_MAX_BLASTS_PER_TICK` (`ring-ad02`);
- the `lgnd` `protectLegendariesIn` calls, one per `pntr` attack and one per `ring` queue step (`L0-adr-oprt` §1).

Each loop exists only while it has work (C-5a′).

**Assumed (CAN_ASSUME).**
- No L0 scheduler is built.
- The system budget is taken as the sum of the per-component caps.
- The acceptance ceiling is `ring-ac17`'s "several simultaneous RMBs", read as **3 players × 1 attack each** (the shared 30 s cooldown limits each player to one), plus one concurrent LMB.
- Why this bound holds: `pntr`'s `runJob` yields to the engine by design, and the `ring` queue is the only loop that can do a burst of heavy engine work in one tick.

**If the load test fails.** The fix is to lower `RING_MAX_BLASTS_PER_TICK` or `pntr`'s cells per yield, not to add a governor. A governor would couple the two effects, and the reduce plan says they are leaves with no data between them.






### ASM-L0-6 · \ (L0-xasm6)

# ASM-L0-6 · "Survival-unbreakable" is a fixed deny list

**Gap.** Orbital §9 keeps "blocks a Survival player cannot break (Bedrock, End Portal Frame, active End Portal and similar engine-protected blocks)". Stable 2.10.0 exposes no block-hardness query.

**Assumption (CAN_ASSUME).** The deny list lives in `src/orbital/` and has a test:
- `bedrock`, `end_portal_frame`, `end_portal`, `end_gateway`, `barrier`, `light_block`;
- `command_block` ×3, `structure_block`, `structure_void`, `jigsaw`;
- `allow`, `deny`, `border_block`;
- `invisible_bedrock`, `moving_block`, `piston_arm_collision` / `sticky_piston_arm_collision`.

Also kept: `air` and all liquids plus waterlogged state (§9). Everything else is removed, **including** Obsidian, Crying Obsidian, Reinforced Deepslate, Respawn Anchor and Ancient Debris.

**Impact if wrong.** A block in the Warden City monument (Reinforced Deepslate) or a modded block is kept or removed against expectation. Changing the list is cheap.






### ASM-L0-7 · \ (L0-xasm7)

# ASM-L0-7 · "No drops" includes ordinary container contents

**Gap.**
- For LMB, Orbital §9 says container contents disappear.
- For RMB, §10 says blocks broken by the blast vanish "without item drops". It does not mention container contents.

**Assumption (CAN_ASSUME).**
- RMB treats container contents like block drops: they are removed.
- Legendaries are always exempt and re-dropped (`L0-xcx10`).
- Item entities that were already on the ground before the blast are **not** removed. Only items that appear during the blast window inside the blast AABB are removed.

**Impact if wrong.**
- If the client wants chests to spill under RMB, suppression must whitelist container spills. That is a small change.
- If pre-existing ground items should also vanish, the snapshot logic flips.






### ASM-L0-8 · Ring rasterisation and charge count (L0-xasm8)

# ASM-L0-8 · Ring rasterisation and charge count

**Gap.** Orbital §10 says the rings are "approximately 1/5/10/15/20 in diameter, as continuous as possible, discrete grid allowed".

**Assumption (CAN_ASSUME).**
- Rings are 8-connected midpoint circles of radius r = d/2 (0, 2.5, 5, 7.5, 10), centred on the target block's column.
- Duplicates are removed across rings.
- Diameter 1 is exactly one charge over the target.

That gives roughly 1 + 16 + 32 + 48 + 64 ≈ **160** charges per RMB. The budgets in C-5a′ and C-19 are sized for about 160 per attack and 3 concurrent attacks.

**Impact if wrong.** A sparser ring, for example 4-connected, halves the load. A denser, "thick" ring doubles it and may break the tick budget. This must be re-measured on BDS.






### ASM-L0-9 · \ (L0-xasm9)

# ASM-L0-9 · "Standalone module" means a separate source module, not a separate pack

**Gap.** Orbital §1 says "a separate testable module suitable for later integration into the full PvP Add-On". This repo already is that full add-on.

**Assumption (CAN_ASSUME).**
- The Cannon ships inside `andrew.mcaddon` as `src/orbital/` plus its item, entity, recipe and lang entries.
- It is testable on its own through gametest tags such as `orbital:*`.
- No second pack.

**Impact if wrong.** If the client wants a separately installable pack, the craft gate, mark and HUD must be duplicated or extracted into a shared library pack. That is a large rework, and there is a risk of two gates fighting over one world (C-7′).







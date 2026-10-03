---
title: Assumptions
type: analysis
generated_at: "2026-10-03T18:06:22.797Z"
source_channel: rollout
node_id: rollout-assumptions
aliases: ["rollout-assumptions","assumptions"]
is_a: ["rollout","assumptions"]
relates_to: ["L0-katn-as01","L0-katn-as02","L0-katn-as03","L0-katn-as04","L0-lgnd-as01","L0-lgnd-as02","L0-lgnd-as03","L0-lgnd-as04","L0-lgnd-as05","L0-lgnd-as06","L0-lgnd-as07","L0-lgnd-as08","L0-lgnd-as09","L0-lgnd-as10","L0-lgnd-as11","L0-lgnd-as12","L0-lgnd-as13","L0-lgnd-as14","L0-lgnd-as15","L0-lgnd-as16","L0-lgnd-as17","L0-xasm18","L0-xasm19","L0-xasm20","L0-xasm21","L0-xasm22"]
priority: 600
---

# Assumptions (CAN_ASSUME)

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

### Katn as01 concept assumption (L0-katn-as01)

---
title: "AS-katn-01 · The head lands where the player looked; the feet cell is derived from it"
is_a: ["assumption"]
part_of: ["L0-katn"]
relates_to: ["L0-xasm18", "L0-xasm19", "L0-katn-p001", "L0-katn-r004"]
---
**Gap.** `L0-xasm19` starts the search at "the endpoint cell" as the feet cell. `L0-xasm18` says the result is never further than 20 from the head.
- Taking an eye-level endpoint 20 blocks out as the **feet** cell raises the player by about 1.6 blocks.
- That puts the head about 20.06+ from the start, which breaks the cap.
- It also makes the player float a step above where they aimed.

**Assumption (CAN_ASSUME).**
- Floor hit (Up face): the feet cell is the cell above the hit block.
- Any other case: the desired feet = endpoint − (0, 1.62, 0), so the head arrives at the aimed point.
- Every candidate must satisfy |head after − head before| ≤ 20.

**Impact if wrong.** If the client expects the feet at the aimed point, change one line in `plan.ts`. T06's bound then shifts by the eye height, and the T05 and T07 tests are unchanged. Local to `katn`.






### Katn as02 concept assumption (L0-katn-as02)

---
title: "AS-katn-02 · Aim is the server view direction, also for a tap on a block"
is_a: ["assumption"]
part_of: ["L0-katn"]
relates_to: ["L0-katn-p001", "L0-katn-ac09", "L0-webs"]
---
**Gap.** On the iPad without a crosshair, a tap can land anywhere on screen, and `playerInteractWithBlock` reports the tapped block. The spec says only "the point the player looks at".

**Assumption (CAN_ASSUME).**
- Both triggers trace along `getViewDirection()` from `getHeadLocation()`, the screen centre.
- The tapped block is ignored as an aim point. It is only within vanilla reach (about 6 blocks), so it cannot express a 20-block jump, and mixing the two would give two aim models.

**Impact if wrong.** If the operator wants "tap a block = go there", a block-tap branch uses `event.block` + `faceLocation` as the endpoint, still capped and safety-checked. It is limited to reach, a small local change, and checked on the iPad (`L0-katn-ac09` §5).






### Katn as03 concept assumption (L0-katn-as03)

---
title: "AS-katn-03 · A landing cell must not be lava or fire; water is fine"
is_a: ["assumption"]
part_of: ["L0-katn"]
relates_to: ["L0-katn-cx01", "L0-katn-ad01", "L0-katn-r004", "L0-adr-ktob"]
---
**Gap.** §5 says lava does not block the **trace**. §6 says the destination is a **safe** position. `L0-adr-ktob` §3 lets liquids count as "fits", which would land a player inside a lava pool they aimed across.

**Assumption (CAN_ASSUME).**
- Lava, flowing lava, fire and soul fire in the feet or head cell make the candidate unsafe. The search steps back past them.
- Water is allowed: drowning is not immediate, and water breaks a fall.
- Hazardous floors (magma, campfire, powder snow) are allowed: §6 forbids only walls and suffocation.

**Impact if wrong.**
- If the client wants "land in lava if you aimed there", drop the filter.
- If the client wants hazard floors excluded too, extend the set.

One constant in `plan.ts`; T08 is unaffected (it aims *past* the lava).






### Katn as04 concept assumption (L0-katn-as04)

---
title: "AS-katn-04 · Fall look-ahead scales with speed; riding and other cases are not special"
is_a: ["assumption"]
part_of: ["L0-katn"]
relates_to: ["L0-adr-ktfl", "L0-xasm20", "L0-katn-p002"]
---
**Gap.**
- `L0-adr-ktfl` fixes a 2-block look-ahead and notes it may need to scale.
- The spec says nothing about using the Katana while riding, sleeping or in a minecart.

**Assumption (CAN_ASSUME).**
1. The look-ahead is `max(2, ceil(|velocity.y|) + 1)` blocks. At ~3.9 blocks per tick that is 5, so the self-teleport can never be skipped over between two ticks.
2. Using it while riding is allowed. The engine's teleport dismounts the player, and the vehicle stays.
3. A self-teleport that lands within 0.3 of a ledge is accepted. The re-teleport uses the current exact location, so it cannot move the player.

**Impact if wrong.**
- If probe (1) shows the self-teleport snags or fails, the `slow_falling` fallback in `L0-katn-p002` §4 applies.
- If riding must be blocked, add one guard (`player.getComponent("riding")`) in `p001` step 2.






### Lgnd as01 concept assumption (L0-lgnd-as01)

**ASM-lgnd-01 — decided 2026-09-24 (decision-legendary-rules-obschie-dlya-vseh-legendarnyh-vk): loss return applies to all legendaries, shipped in ed7558b.**

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

**ASM-lgnd-04: `minecraft:fire_resistant` (format ≥ 1.21.90) makes it immune to fire and lava (measured, LGND-FIREPROOF-01-AA); nothing covers cactus or explosions.**

So "must not be destroyed by ordinary means" (Scythe §1) is realised as: fire, lava: immunity; cactus, explosions, despawn: destroyed, then re-issued to `mark.owner`.

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






### Lgnd as15 concept assumption (L0-lgnd-as15)

---
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r016", "L0-lgnd-ad13", "L0-magn", "L0-lgnd-ad12"]
---
**ASM-lgnd-15: Entity holders (chest/hopper minecarts, armour stands) need no recovery watching while the magnet moves them. Their legendary contents can be read by `magn` at selection time.**

What this assumes (measure on BDS 1.26.51.1):
1. **The minecart's container is readable.** `minecraft:inventory` on `chest_minecart` and `hopper_minecart` gives a readable container, so `isLegendaryStack` can be checked per slot.
2. **The armour-stand hand is readable through `hasitem`.** Mobs have no `equippable` in 2.10.0 (UFO §4, U4b), so an armour-stand hand is checked with `hasitem={item=andrew:<id>,location=slot.weapon.mainhand}` (and offhand). That is one item per query: 6 ids × 2 slots per candidate stand, once at selection.
3. **Recovery tracks only item entities and player departures.** It never tracks a stack inside an entity, so a teleported minecart or stand cannot break a watch: there is none.
4. **Destruction spills.** If such an entity is later destroyed (lava, cactus, the Void), its contents spill as `minecraft:item` entities that `entitySpawn` watches. Fire and lava are covered by `fire_resistant`; the Void and cactus by a return.

**Impact if wrong.**
- If (1) fails, `magn` must skip every non-empty chest or hopper minecart.
- If (2) is too costly, it must skip every armour stand holding anything in a hand.
- If (4) fails (a minecart destroyed in the Void drops nothing), a legendary stored in a minecart is lost with no return. That is an as-built gap regardless of the magnet, and `r016` item 3 is what keeps the magnet from making it likelier.
- Separately, a hopper minecart picking up a ground legendary is classified as lost, because `whereIs` searches **block** containers only. That creates a stale copy (`cx02` a). It is harmless, but it is a log-visible return.






### Lgnd as16 concept assumption (L0-lgnd-as16)

---
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ac22", "L0-lgnd-p002", "L0-magn"]
---
**ASM-lgnd-16: A magnet-fall death is an ordinary `entityDie`, and the magnet never touches a death drop before retention does.**

What this assumes:
- The magnet moves a held player by `applyKnockback` (UFO §6). The death is plain fall damage at landing.
- Death drops are spawned before `entityDie` (measured earlier). Retention path B empties the legendaries in the same handling, so no legendary item entity outlives the die tick.
- The magnet re-selects only iron dropped within 12 blocks of the hover point. A legendary is never iron, and death drops at ground level are about 37 blocks below it.

**Impact if wrong.**
- Suppose the player dies while still held, for example killed in the air by another player. Death drops would then spawn under the saucer, within 12 blocks. That is harmless for legendaries, because they are removed by retention and are not iron anyway.
- Suppose a future magnet change pulls **every** fresh drop near the hover point. A retained legendary is still safe, but an **unmarked** copy (no retention) would be pulled, which violates AC 13. `r016` item 1 covers this.






### Lgnd as17 concept assumption (L0-lgnd-as17)

---
is_a: ["assumption"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad14", "L0-lgnd-as02", "L0-xasm22"]
---
**ASM-lgnd-17: The Katana's def names are `dk` / `dragon_katana` / `andrew:katana` / `andrew.katana`, and its refund is the recipe's non-sword ingredients plus a plain diamond sword.**

The spec does not name any of the keys. They follow the precedents:
- `ws`, `sc` and `oc` are the two-letter initials of the full name;
- the command is the short weapon name (`websword`, `scythe`, `orbital`).

The refund mirrors the Web Sword's, which returns its consumed diamond sword. The returned sword is **plain**: the enchantments and damage of the consumed sword are not read, because the token pipeline cannot see the consumed ingredient (`L0-xasm22`).

**Impact if wrong.**
- **Names:** none until the first world ships. After that they are frozen (`r006`).
- **The refund must restore an enchanted sword:** this needs a craft-time ingredient read, which stable 2.10.0 does not offer. It would be a C-16 deviation, raised on L0.






### ASM-L0-18 · Range clamp (L0-xasm18)

---
title: "ASM-L0-18 · Aim beyond 20 blocks is clamped along the ray, measured from the head"
aliases: ["L0-xasm18", "Katana range clamp"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-katn", "L0-adr-ktob"]
see_also: ["dragonkatanaspecv1ruen-part-1", "dragonkatanaspecv1ruen-part-2"]
---
# ASM-L0-18 · Range clamp

**Gap.** §5 says "the player aims at a point within at most 20 blocks". T06 says "a point further than 20 does not allow exceeding the max range". Neither says whether aiming further *refuses* the use or *shortens* it. Neither says where the 20 is measured from.

**Assumption (CAN_ASSUME).**
- The trace runs from the player's **head location** along the view, for at most 20 blocks.
- If nothing solid is hit within 20, the endpoint is the point 20 blocks out, in the air. This counts as a valid use, consistent with "a point in the air is allowed", and it consumes the cooldown.
- The resulting feet position may differ from the endpoint by the safe-cell correction (`L0-xasm19`), but never lies further than 20 blocks from the head.

**Impact if wrong.** If the client wants a refusal for over-range aim:
- the trace stays the same;
- `katn` adds a "no target" branch: no teleport, no cooldown, and a HUD hint;
- T06's GameTest flips from "lands at ≤ 20" to "does not move".

The cost is small, and the decision is local to `katn`.






### ASM-L0-19 · Safe-cell search (L0-xasm19)

---
title: "ASM-L0-19 · The safe-cell search walks back along the ray and never crosses the obstacle"
aliases: ["L0-xasm19", "Katana safe-cell search"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-katn", "L0-adr-ktob"]
see_also: ["dragonkatanaspecv1ruen-part-1", "dragonkatanaspecv1ruen-part-2"]
---
# ASM-L0-19 · Safe-cell search

**Gap.** §5 says that at an obstacle the player goes to "the nearest safe position on the side facing the owner". §6 allows shifting the final position "a little up or sideways". Moving *up* in front of a low wall could put the player on top of it, which is arguably "past" the obstacle. "A little" has no number.

**Assumption (CAN_ASSUME).**
1. Candidate feet cells are taken, nearest first, from:
   - the endpoint cell;
   - then the cells stepping back toward the head along the ray (0.5-block steps);
   - at each step, offsets of +1 and +2 up and ±1 sideways.
2. A candidate must:
   - fit (per `L0-adr-ktob`);
   - lie on the owner's side of the hit face's plane;
   - be reachable from the head by a clear ray, so the player is never placed behind a solid block.
3. The search stops at the player's own cell. If nothing fits, there is **no teleport and no cooldown**, and the HUD says nothing.
4. A floor hit (aiming at the ground) is the same case: the feet cell sits on top of the hit face.

**Impact if wrong.**
- If "on top of a 1-high wall" must be allowed, the plane rule relaxes for upward offsets only.
- If a failed search must still consume the cooldown, add one line.

Neither change touches other nodes.






### ASM-L0-20 · Fall-flag expiry (L0-xasm20)

---
title: "ASM-L0-20 · The fall flag ends at the first landing, a liquid, a climb, death, a dimension change, logout or 10 s"
aliases: ["L0-xasm20", "Katana fall-flag expiry"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-katn", "L0-adr-ktfl"]
see_also: ["dragonkatanaspecv1ruen-part-2", "dragonkatanaspecv1ruen-part-3"]
---
# ASM-L0-20 · Fall-flag expiry

**Gap.** §7 says "the nearest landing related to this teleport" and "one-shot", but it does not define the cases where there is no landing:
- falling into water;
- grabbing a ladder or vine;
- an elytra glide;
- dying;
- a second teleport after the cooldown.

It also gives no time bound.

**Assumption (CAN_ASSUME).** The flag is consumed by whichever comes first:
- the first on-ground tick;
- entering a liquid;
- climbing;
- gliding;
- death;
- a dimension change;
- leaving the game;
- **10 s** of wall-clock time after the teleport (epoch ms, C-21, C-25).

A new Katana teleport replaces the flag rather than stacking it. The longest fall from the 20-block cap down to bedrock-level void takes well under 10 s at terminal velocity, so the bound never cuts off a legitimate landing in the Overworld.

**Impact if wrong.** If the client wants protection to survive a water bounce or a glide, the end conditions change in one function inside `katn`. The T12 test ("the next ordinary fall hurts") is unaffected.






### ASM-L0-21 · Escape interplay with other features (L0-xasm21)

---
title: "ASM-L0-21 · The Katana may teleport out of a Web Sword trap and out of the UFO magnet's hold"
aliases: ["L0-xasm21", "Katana escape interplay"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-katn", "L0-webs", "L0-magn"]
see_also: ["dragonkatanaspecv1ruen-part-1", "webswordspecv1ruen-part-1", "ufomagnetspecv1ruen-part-2"]
---
# ASM-L0-21 · Escape interplay with other features

**Gap.** The Katana spec names no interaction with the other legendaries or with events. Two follow from the mechanics:
1. **Web Sword trap.** A player caught in the 3×3×3 cobweb cube can use the Katana. Cobweb is passable to the block ray (`L0-adr-ktob`), so the trace leaves the cube.
2. **UFO magnet hold.** A player held under the saucer for iron in hand can teleport away. The magnet re-applies knockback each tick while iron is held, so they may be pulled back.

**Assumption (CAN_ASSUME).** Both escapes are **allowed**, and no feature blocks another's ability. This matches the spec's single rule that only solid blocks stop the trace. It also keeps the nodes independent: no change to `webs` or `magn`.

**Impact if wrong.**
- If the client wants a trap to be inescapable, `katn` would need a new `lgnd`-level "rooted" predicate, published like the hidden seam (`lgnd-r010`), that `webs` sets and `katn` reads. That is a framework change, and the reduce would raise it as a contradiction.
- If the magnet must win, `magn` ignores teleports, which is already its behaviour.

Worth asking the client during the iPad acceptance of the Katana.






### ASM-L0-22 · The framework as built satisfies the Katana's global rules (L0-xasm22)

---
title: "ASM-L0-22 · Katana §3/§13 rules and the recipe are met by registering with the framework as built"
aliases: ["L0-xasm22", "Katana uses the framework as built"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-katn", "L0-xcx21", "L0-xcx11"]
see_also: ["dragonkatanaspecv1ruen-part-1", "dragonkatanaspecv1ruen-part-3"]
---
# ASM-L0-22 · The framework as built satisfies the Katana's global rules

**Assumption (CAN_ASSUME).** Katana §3 and §13 ("preserve all global legendary-item rules") are satisfied by adding a fourth `LegendaryDef` with its craft token, with **no new framework behaviour**.

| Spec | How it is met |
|---|---|
| One Survival craft, persistent; Creative and `/give` are free; announcement | craft gate + craft token + world flag, as for the other three |
| Infinite durability | no `minecraft:durability` component, as for the Web Sword |
| Transfer and containers | no binding, as for the others |
| Death retention, and a contained item untouched | `retention.ts`, cause-agnostic |
| Fire and lava | `fire_resistant` (prevented) |
| Cactus, TNT | **returned** to the owner (C-16): see `L0-xcx21` |
| Orbital Cannon (T17) | `protectLegendariesIn` on blast and ring volumes |
| Void, offline, then next join | recovery + owed list. The target is `mark.owner` until `xcx11` closes |

**The recipe ingredient.** A Diamond Sword in the centre is accepted whatever its damage or enchantments, as in vanilla shaped recipes. Its enchantments are **not** carried onto the Katana.

**Impact if wrong.**
- If enchantments must carry over, `katn` needs a craft-time hook. The craft token pipeline would have to read the consumed sword, which it cannot do today.
- If any rule needs per-weapon behaviour, it is an `lgnd` change.







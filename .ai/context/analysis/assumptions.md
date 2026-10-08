---
title: Assumptions
type: analysis
generated_at: "2026-10-08T18:47:14.763Z"
source_channel: rollout
node_id: rollout-assumptions
aliases: ["rollout-assumptions","assumptions"]
is_a: ["rollout","assumptions"]
relates_to: ["L0-katn-as01","L0-katn-as02","L0-katn-as03","L0-katn-as04","L0-lgnd-as01","L0-lgnd-as02","L0-lgnd-as03","L0-lgnd-as04","L0-lgnd-as05","L0-lgnd-as06","L0-lgnd-as07","L0-lgnd-as08","L0-lgnd-as09","L0-lgnd-as10","L0-lgnd-as11","L0-lgnd-as12","L0-lgnd-as13","L0-lgnd-as14","L0-lgnd-as15","L0-lgnd-as16","L0-lgnd-as17","L0-lgnd-as18","L0-magn-asbd","L0-magn-asfl","L0-magn-asit","L0-magn-aslh","L0-magn-asrg","L0-sauc-as01","L0-sauc-as02","L0-sauc-as03","L0-sauc-as04","L0-sauc-as05","L0-sauc-as06","L0-sclk-as01","L0-sclk-as03","L0-sclk-as04","L0-sclk-as05","L0-strm-asm1","L0-ufoc-as01","L0-ufoc-as02","L0-ufoc-as03","L0-ufoc-as04","L0-ufoc-as05","L0-xasm29","L0-xasm30","L0-xasm31","L0-xasm32"]
priority: 620
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






### Lgnd as18 concept assumption (L0-lgnd-as18)

**ASM-lgnd-18: Def #5's data that the spec does not name.**

Related: L0-lgnd-ad16, L0-lgnd-cx15, L0-sclk.

The crossbow spec gives the recipe (§2: echo shard top and bottom, deepslate left and right, crossbow in the centre) but no keys, ids, refund or command. Filled with defaults:
| Field | Value | Basis |
|---|---|---|
| `itemId` | `andrew:sculk_crossbow` | L0 plan (`sclk`), `adr-scbs` option A |
| `keyPrefix` | `sk` | `cx15`; `sc` is taken |
| `craftTokenId` | `andrew:sculk_crossbow_crafted` | `ad08` naming |
| `refund` | `minecraft:echo_shard` ×2, `minecraft:deepslate` ×2, `minecraft:crossbow` ×1 | the recipe inputs, as for every shipped def. "Deepslate" = the plain block `minecraft:deepslate` (§2 "обычный блок"), not cobbled |
| `textPrefix` | `andrew.crossbow` | |
| `command` | `andrew:crossbow` | |
| `nameKey` | `item.andrew:sculk_crossbow` | |

The refunded crossbow is a fresh, unenchanted, full-durability `minecraft:crossbow`. An enchanted or damaged input crossbow loses its enchantments and damage on a blocked craft (as the Web Sword's and Katana's diamond sword already do).

**Impact if wrong.** All are one-line data changes **until the first world ships**. After that, `keyPrefix` and the command are frozen (`r006`). If the operator wants the input crossbow's enchantments preserved on refund, the gate needs the consumed stack, which stable 2.10.0 does not expose (no craft event): that would be an L0 contradiction.






### magn-asbd · A horse in iron horse armour and a mob holding iron are not pulled (L0-magn-asbd)

# magn-asbd · A horse in iron horse armour and a mob holding iron are not pulled

**Assumption.**
- §4 names the helmet, chestplate, leggings and boots slots, and excludes iron weapons in a mob's hand.
- `iron_horse_armor` is listed only as an *item*.
- So a horse or donkey wearing it (body slot) is not a class 3 candidate.

**Impact if wrong.**
- Adding the body slot is one more tagging command (`hasitem={item=iron_horse_armor}`).
- A pulled horse with a rider raises the question of what happens to the rider, which the spec does not address.






### magn-asfl · Elements fly to their ring slot at ≤ 1.5 blocks per tick (L0-magn-asfl)

# magn-asfl · Elements fly to their ring slot at ≤ 1.5 blocks per tick

**Assumption.**
- The spec sets 0.6 blocks per tick for **players** only. For elements it says just "fly to their places".
- Ore can sit 60 blocks below the ring (centre − 20 → hover − 3), and the zone edge is ~50 blocks away horizontally.
- At 1.5 blocks per tick, the worst path of ~80 blocks takes ~2.7 s, about 5 % of the 60 s magnet. The flight is still visible on iPad as a stream rising into the cloud.

**Impact if wrong.**
- If the speed is too slow, far elements arrive late and look sluggish.
- If it is instantaneous, the "flying" visual is lost (the iPad DoD).
- Only one constant changes.






### magn-asit · `Block.getItemStack(1)` gives the right single item for every IRON_BLOCKS entry (L0-magn-asit)

# magn-asit · `Block.getItemStack(1)` gives the right single item for every IRON_BLOCKS entry

**Assumption.**
- `getItemStack(1, false)` returns the plain item for each block:
  - rail → rail;
  - a hanging lantern → lantern;
  - a water or lava cauldron → cauldron;
  - a chipped anvil → chipped_anvil.
- The door is special-cased to `iron_door`, and ore to `raw_iron`.
- An explicit fallback map keyed by block id covers any block where the call returns undefined or a variant item.
- A GameTest checks each IRON_BLOCKS id once.

**Impact if wrong.**
- A wrong item id gives the wrong drop, which breaks AC-10.
- A data-bearing item, such as a filled cauldron item, gives a non-vanilla item.
- Both are caught by the per-id test before merge.
- The cauldron's liquid is lost by design: the item is an empty cauldron.






### magn-aslh · Holders that contain a legendary are skipped, not pulled with it (L0-magn-aslh)

# magn-aslh · Holders that contain a legendary are skipped, not pulled with it

**Assumption.**
- UFO §5 pulls a chest or hopper minecart "whole", and an armour stand with iron armour is pulled.
- §4 and AC-13 say a legendary is "never pulled, wherever it lies".
- Reading: a class 3 holder whose inventory, or whose hand or armour slots, holds a legendary is **not selected**.
- The check uses the minecart's `minecraft:inventory` container and `hasitem` on `andrew:*` legendary ids for armour stands and mobs.

**Impact if wrong.** If the operator wants the holder pulled with the legendary inside, `lgnd`'s watching of moved holders (the `lgnd` v4 delta) becomes load-bearing, and AC-13 changes to "never separated from its holder". This costs one extra rule plus a GameTest.






### magn-asrg · A 3-block keep-away margin stops pickup; ring crowding is harmless (L0-magn-asrg)

# magn-asrg · A 3-block keep-away margin stops pickup; ring crowding is harmless

**Assumption.**
- U11 measured pickup at about 2 blocks for a hovering player, so a 3-block margin around every player suffices.
- Exempt drops grow the ring beyond 10 slots. At 30 slots the spacing on r 5 is still about 1 block, and held items do not merge, because each is teleported to its own point every tick.

**Impact if wrong.**
- **Pickup.** A held player would pick up ring items, so the "visible cloud" thins and the AC-8 counts drift. The fix is to raise the margin or the ring radius.
- **Merging.** Held stacks would merge, changing the element count. Then a minimum slot spacing would be needed (at most 1 slot per 1.5 blocks, overflow onto a second ring at −4).






### AS-sauc-1 · The hull band is `[y, y + 3]` above the entity position, and the model is built to fill it (L0-sauc-as01)

# AS-sauc-1 · The hull band is `[y, y + 3]` above the entity position, and the model is built to fill it

**Assumption.**
- UFO §8 says "a cylinder of radius 6 and height 3 blocks **around its position**". It does not say whether the band is centred (y ± 1.5) or rests on the position.
- Reading: the entity position is the underside of the disc. The hull is r 6 in `[y, y + 3]`. The geometry (disc + dome) is built to occupy that band, and the beam hangs from y.
- The edges are closed: a charge column at exactly r = 6.0, or a segment ending exactly at y or y + 3, is a hit.

**Impact if wrong.**
- If the client meant a centred band, the hit band moves down by 1.5 blocks.
- Only shots that graze the top or bottom edge change outcome; a vertical charge column through the disc hits under either reading.
- The fix is a constant offset in the hull test and in `ac03`'s probe heights, with no model change.






### AS-sauc-2 · Filled-in tunables: fall acceleration, path easing, departure height, sound volume (L0-sauc-as02)

# AS-sauc-2 · Filled-in tunables: fall acceleration, path easing, departure height, sound volume

**Assumption** (the spec leaves these open):
- **Fall.** `vy` starts at 0 and gains `a = 0.025` blocks per tick².
  - From the hover height (≈ 40 above the centre) the saucer touches ground at ≈ 57 ticks, just inside 3 s.
  - From arrival or departure height (+50) the 60-tick cap fires first, at ≈ 45 blocks of drop. The blast then happens a few blocks above the ground, which §8 allows ("or after 3 seconds").
  - Ground = the first non-air cell (solid **or liquid**) under the hull centre.
- **Easing.** Arrival uses smoothstep. Departure uses ease-in (it accelerates away).
- **Departure height.** Departure climbs back to `hoverY + 10`, mirroring the arrival. §2 states only "the opposite way beyond the horizon (90 blocks)".
- **Sound volume.** `volume: 4`, about a 64-block range, for every UFO sound.

**Impact if wrong.**
- These are all constants in `src/ufo/saucer.ts`, so changing one is a one-line edit.
- `ac01`, `ac03` and `ac05` assert the constants through exported values, not literals.
- Only the iPad look and listen check (`ac06`) can reject them.
- One residual risk: a reward dropped over lava burns, as vanilla items do. If the operator wants the reward to be loss-proof, the blast point must move to the nearest non-lava surface.






### AS-sauc-3 · The shooter's name is resolved from `attack.ownerId` at the shot; `Attack` gains an optional `ownerName` (L0-sauc-as03)

# AS-sauc-3 · The shooter's name is resolved from `attack.ownerId` at the shot; `Attack` gains an optional `ownerName`

**Assumption.**
- `Attack` (`src/orbital/flight.ts:26-38`) carries `ownerId` and the optional `ownerName` (`:37`), filled at `src/orbital/activation.ts:79`.
- The charge is at most ~3 s old when it crosses the hull, since it spawns 60 above the target and falls 1 block per tick. The owner is therefore almost always online.
- `sauc` resolves the name from `world.getAllPlayers()`, filtering out `undefined` (C-22).
- To cover a disconnect in that window, the seam adds an **optional** `ownerName` to `Attack`, filled at launch from `player.name`. This is additive and unused by `pntr`/`ring`. The broadcast uses the live name, then `ownerName`, then the literal `"?"`.

**Impact if wrong.**
- If adding a field to `Attack` is refused, a shooter who logs out within ~3 s is broadcast as "?".
- This is cosmetic. No AC exercises it beyond C-20′'s "the shooter is named".






### AS-sauc-4 · The 100-block limit is horizontal; a saucer 90 out is loaded, persists for 95 s, and renders on the iPad (L0-sauc-as04)

# AS-sauc-4 · The 100-block limit is horizontal; a saucer 90 out is loaded, persists for 95 s, and renders on the iPad

**Assumption.**
1. **The 100-block limit is horizontal.** UFO §2 says "not farther than 100 blocks from the centre". The 3D distance at spawn is √(90² + 50²) ≈ 103. U8 measured unloading against the *loaded area*, which is a horizontal chunk distance. The horizontal reading is therefore the intended one.
2. **The spawn point is usable.** A chunk 90 blocks (≈ 6 chunks) from an online target player is loaded under BDS defaults, so `spawnEntity` and per-tick teleports there succeed. In GameTest, simulated players load no chunks, so the scenario needs a `tickingarea` covering the path (or a test-only shortened radius that is flagged as such).
3. **No despawn.** A `minecraft:snowball`-runtime custom entity with no projectile component is not despawned or auto-removed within the 95 s event. The shipped charge only proves 20 s (`ATTACK_TIMEOUT_TICKS` = 400). Probe U8 / the U1 run held a probe for ~60 s.
4. **It renders at range.** The iPad client draws an entity ~95 blocks away if its chunk is within the client's render distance (≥ 6 chunks) and `visible_bounds` is large (`ent1`).

**Impact if wrong.**
- (1) The path has to shrink to ~80 horizontal, an AC-2 deviation note.
- (3) The saucer vanishes mid-event; `p001` treats that as an abort, and the event is lost.
- (4) The DoD line "saucer visible on approach" fails at low render distance. The spawn radius stays at 90, so the fix is the operator's render-distance setting or a deviation.
- Each item is checked by `ac01` (positions and validity over the full 95 s) or by `ac06` (iPad).






### AS-sauc-5 · The hull keeps absorbing charges during the downed fall; the interceptor is removed only at the blast (L0-sauc-as05)

# AS-sauc-5 · The hull keeps absorbing charges during the downed fall; the interceptor is removed only at the blast

**Assumption.**
- §8 says "any phase — arrival, magnet or departure". It is silent on the 3 s fall after a shoot-down.
- `L0-adr-ufoi` already accepts that one RMB salvo can lose several charges to a hull.
- Reading: while the saucer entity exists, including the fall, a crossing charge is absorbed (no ring or column effect) but does not re-trigger (`r004` latch).
- The interceptor is unregistered in the blast tick.

**Impact if wrong.**
- If the client expects charges to pass through a falling wreck, a salvo fired right after the shoot-down loses its effect on the cells under the wreck.
- The change is one condition: `downed` makes the interceptor return `false`. `ac03` has a sub-case pinned to this choice.






### AS-sauc-6 · An RMB salvo is partly absorbed: columns inside the hull are intercepted, and the rest detonate at their per-ring power (L0-sauc-as06)

# AS-sauc-6 · An RMB salvo is partly absorbed: columns inside the hull are intercepted, and the rest detonate at their per-ring power

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-sauc-r001", "L0-sauc-r004", "L0-sauc-ac03", "L0-adr-ufoi", "L0-ring"]`

**Context.**
- In shipped Orbital v1.4.4 (`src/orbital/ring-layout.ts`), RMB rings have radii 0.5 / 3.5 / 7 / 10.5 / 14 and powers 4 / 4 / 2 / 1 / 1.
- A blast reaches 2 × power.
- RMB refuses a target nearer than 7 blocks from the eye (`RING_MIN_RANGE`, Orbital §6).

**Assumption.**
- `r001` runs per charge. With the target under the saucer axis, the centre and ring-3.5 columns cross the r 6 hull and are intercepted.
- Rings 7, 10.5 and 14 fall clear of the hull and detonate normally at powers 2 / 1 / 1. That is ordinary Cannon behaviour and not "blast damage" from the saucer, so UFO §8's "no damage" covers only the saucer's own blast (`r004`).
- The first intercepted charge latches the shoot-down. The others in the same tick are absorbed silently (`r004` item 1).
- The 7-block minimum only limits where the shooter stands. Hovering at centre + 40 and spawning charges at target + 60 already require the target to be under the hull, so the minimum range adds no new positional limit.

**Impact if wrong.**
- If the client expects the whole salvo to vanish once the saucer is hit, the interceptor has to absorb every charge of an attack once one of them hits. That means a per-`attackId` set in `p003` and one line in `r001`.
- `ac03`'s RMB block assertions are scoped to this reading. Under the other reading they could go back to the full 13 × 13 snapshot.






### Sclk as01 concept assumption (L0-sclk-as01)

**AS-sclk-01 · The bolt's gravity and drag can be tuned to match an arrow (CAN_ASSUME)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["assumption"]` · `relates_to: ["L0-sclk-ent2", "L0-sclk-p001", "L0-adr-scdm"]`

**Assumption.** With the snowball runtime, `minecraft:projectile.gravity` and `inertia` can be set so that a bolt fired at an arrow's spawn velocity lands within 1 block of where the arrow would land, at 30 blocks on a flat range. The starting values are the vanilla arrow's (gravity 0.05, inertia 0.99), corrected by probe Q9.

**Impact if wrong.** The bolt drops faster or slower than an arrow. Gameplay still works (physical, not hitscan), but aiming feels different from a vanilla crossbow. That is a C-16 deviation noted in the README. No design change.






### Sclk as03 concept assumption (L0-sclk-as03)

**AS-sclk-03 · No extra knockback on a hit (CAN_ASSUME)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["assumption"]` · `relates_to: ["L0-sclk-p004", "L0-sclk-r002"]`

**Gap.** The vanilla Warden Sonic Boom knocks targets back hard. The spec says only that the **visual** does not knock back (§4) and says nothing about the hit.

**Assumption.** A hit applies only the knockback that `applyDamage(…, cause projectile)` itself gives. There is no `applyKnockback`. The weapon's identity is damage plus sculk, not displacement.

**Impact if wrong.** If the operator wants a Warden-like shove: one `applyKnockback` along the bolt's velocity in p004, with a tuned strength. GameTests that check the target's position after a hit would change.






### Sclk as04 concept assumption (L0-sclk-as04)

**AS-sclk-04 · Performance constants (CAN_ASSUME)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["assumption"]` · `relates_to: ["L0-sclk-ad04", "L0-sclk-r007", "L0-sclk-cons"]`

| Constant | Value | Basis |
|---|---|---|
| `TRAIL_PER_TICK` | 3 | about 1 ring per 1–1.3 blocks at full arrow speed (~3 blocks/tick) |
| `CARVE_BUDGET_PER_TICK` | 300 | one full volley in one tick; the Orbital ring carve has run at similar per-tick counts on the iPad |
| `BOLT_LIFETIME_TICKS` | 100 | `xasm27` |

**Impact if wrong.** These are TPS-only effects. `ufo_hold_tps_measured`-style measurement on the iPad (a 3-player Multishot burst) retunes the constants. No logic changes.






### Sclk as05 concept assumption (L0-sclk-as05)

**AS-sclk-05 · Emulation of Quick Charge and Multishot if the custom shooter ignores them (CAN_ASSUME)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["assumption"]` · `relates_to: ["L0-adr-scbs", "L0-sclk-r005", "L0-sclk-p002", "L0-xq7"]`

**Assumption.** Probe Q3 measured no native Quick Charge effect (Multishot was not measured), so:
- **Multishot:** the substitution of one arrow from a stack with `multishot` spawns 3 bolts, at 0° and ±10° yaw at the same speed. One arrow is spent (vanilla Multishot spends one).
- **Quick Charge:** the native draw is set to the QC III floor (0.5 s), and the script holds each load to `25 − 5 × level` ticks of the **loading draw**, removing the arrow fired by the next press when the load was shorter. Measuring by spawn speed is impossible: every fired arrow is full speed.

**Impact if wrong.**
- If the operator rejects hold-to-load/press-to-fire with scripted Quick Charge (`xq7`, the feel item): fall back to `adr-scbs` option B (the vanilla crossbow), which re-opens `lgnd`.
- If the ±10° spread is off: one constant.






### ASM-strm-1 · Defaults filled in by strm (L0-strm-asm1)

---
title: "ASM-strm-1 · Sample sizes, melee damage value and the live passive band"
is_a: ["assumption"]
part_of: ["L0-strm"]
relates_to: ["L0-strm-acd", "L0-xasm30", "L0-strm-pprb"]
---
# ASM-strm-1 · Defaults filled in by strm

1. **Seeded passive rate.**
   - N = 10 000 rolls of the real `rollPassive(rng)` with a fixed-seed PRNG. The observed rate must be in [0.29, 0.31].
   - Both branches are also forced with stub RNGs (`() => 0`, `() => 0.99`).
   - **If wrong:** none; it is deterministic.
2. **Live ±5 % band.**
   - The live sample is **N ≥ 600** real melee hits. Each is spaced past the 10-tick hurt window, so the run takes ≈ 6 000 ticks, about 5 min.
   - At p = 0.3, σ ≈ 1.9 %, so ±5 % ≈ 2.7σ and the false-red rate is ≈ 0.8 %. N = 300 would be ≈ 6 %, which is too flaky for a suite that is already flaky.
   - The live test runs as its own scenario, outside the default blast-radius gate.
   - **If wrong** (too slow): drop to N = 400 (≈ 2 % flake) and accept a re-run as a deviation.
3. **Melee damage.** `minecraft:damage` = the probe-P6 value, expected **7** (Bedrock diamond sword). Note that the Scythe's 8 matched netherite. **If wrong:** one JSON value.
4. **Strike stagger.** Three strikes over ≤ 6 ticks (0/3/6). The column is ~6 blocks high. **If wrong:** cosmetic.
5. **Entity hit point** = the ray-entity distance along the trace. If the API gives no distance, use the entity's location + 1 (body centre). **If wrong:** visual offset only.
6. **The probe uses diamond armour + Protection IV** as "armoured". **If wrong:** none; the mob is the control.






### AS-ufoc-1 · How the commands behave where the spec is silent (L0-ufoc-as01)

# AS-ufoc-1 · How the commands behave where the spec is silent

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-ufoc-p004", "L0-ufoc-r006"]`

**Spec (§9)** says only: `come` targets the invoker, or a random player; `stop` removes the saucer and drops what it holds; `enable`/`disable` is a stored flag. Everything below fills a gap.

**Assumed:**
1. **`come` from the Nether or End, or from the console:** the target is a random Overworld player. With no Overworld player, `come` fails with a message.
2. **`come` while a UFO is up:** it is refused (at most one saucer).
3. **`come` while the event is disabled:** it works, as an operator override for testing. The flag is unchanged.
4. **After `stop`:** the next arrival is now + 15 min, the same as a departure.
5. **`disable` mid-event:** it also stops the event.
6. **`enable` when `next_ms` is overdue:** the arrival is pushed to now + 15 min.
7. **Command replies:** plain English text, not localized. `CustomCommandResult.message` is a string, not rawtext.

**Impact if wrong:**
- Points 1–3 and 7: low; each is a small change in `commands.ts`.
- Point 4: if `stop` should leave the old schedule, the next saucer could arrive sooner than 15 min.
- Point 5: if `disable` should let a live event finish, the saucer stays up after the operator disabled the event.
- Point 6: an overdue arrival would fire within 5 s of `enable`.






### AS-ufoc-2 · The target can be in any game mode; the centre is the literal block under the feet (L0-ufoc-as02)

# AS-ufoc-2 · The target can be in any game mode; the centre is the literal block under the feet

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-ufoc-r002", "L0-xasm14"]`

**Assumed:**
- **Game mode.** Any online, live Overworld player can be the target, including Creative and Spectator players. The spec says only "a random online player in the Overworld". `magn` still never pulls Creative or Spectator players (§5).
- **Centre.** The centre is `floor(y) − 1` under the target, with no downward raycast. A target who is flying, gliding or jumping gets a centre in the air.

**Impact if wrong:**
- If Spectators should be excluded, an event can happen over an observer. The fix is one filter in `overworldPlayers()`.
- With an airborne centre, the zone (centre − 20 … hoverY) can miss the ground, and the event pulls little. An alternative is a block raycast down to the first solid block, capped at 64 blocks. Note that a block raycast passes carpets, signs and ladders. Switching to it is a change local to `r002`.






### AS-ufoc-3 · \ (L0-ufoc-as03)

# AS-ufoc-3 · "Exactly 15 minutes" allows the 5 s idle-check granularity

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-ufoc-r001", "L0-ufoc-ac02", "L0-ufoc-ad02"]`

**Assumed.**
- AC-1's "exactly 15 minutes" is met when the arrival starts within the next idle check after `next_ms`. That is [15 min, 15 min + 100 ticks], or about 5 s at 20 TPS.
- Phases count ticks (`ad01`), so under lag a 20 s arrival lasts more than 20 s of wall time. AC-2 is asserted in ticks: 400/1200/300.

**Impact if wrong.**
- If the operator wants second-exact arrivals, the idle divider drops to 20 ticks. That costs nothing measurable.
- If AC-2 is meant in wall seconds under lag, the phases would have to switch to ms deadlines, and the flight would jump. That reverses `ad01`.






### AS-ufoc-4 · A lost saucer aborts the event: it was never spawned, it unloaded, or a consumer threw (L0-ufoc-as04)

# AS-ufoc-4 · A lost saucer aborts the event: it was never spawned, it unloaded, or a consumer threw

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-ufoc-p002", "L0-sauc-p001", "L0-magn-prel"]`

**Context.**
- The saucer spawns 90 blocks from the centre (§2). If that chunk is not loaded, `spawnEntity` throws.
- If every player leaves the area mid-event, the saucer's chunk can unload (U8, C-12′). §10 says the event continues when the *target* leaves, but it does not cover the saucer itself vanishing.

**Assumed.** `ufoc` aborts the event in any of these cases:
- `sauc` cannot spawn the saucer;
- the saucer is invalid on any later tick, outside `downed`;
- an `onPhase` consumer throws.

The abort releases everything held (when in `magnet`), removes whatever remains, ends the session and sets `next_ms` to now + 15 min. A saucer that unloaded and later reloads is removed by the `entityLoad` sweep, because its event id no longer matches (`p003`).

**Impact if wrong.**
- If the event should survive an unload (for example by pausing the phase clock), `p002` needs a "suspended" state.
- If `sauc` prefers to spawn nearer the centre when the 90-block point is unloaded, the abort becomes a fallback rather than the normal path.






### AS-ufoc-5 · The 150-block notice range is horizontal and Overworld-only, sent once at arrival start (L0-ufoc-as05)

# AS-ufoc-5 · The 150-block notice range is horizontal and Overworld-only, sent once at arrival start

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["assumption"]` · `relates_to: ["L0-ufoc-r005", "L0-ufoc-ac07"]`

**Spec (§7):** the localized "В небе НЛО!" goes to players within 150 blocks of the centre when the arrival starts.

**Assumed:**
- The distance is horizontal (x/z), so players in deep caves under the centre are told too.
- Only Overworld players get it.
- It is sent once. Players who walk into range later are not told.
- `come` sends it too.

**Impact if wrong:** low. A 3D distance or a later re-notice is a change local to `r005`. Only AC `ac07`'s expected recipient set changes.






### ASM-L0-29 · Reading "10 HP before armour" (L0-xasm29)

---
title: "ASM-L0-29 · 'Before armour' means armour, Protection and Resistance then reduce it"
aliases: ["L0-xasm29", "Pre-armour damage reading"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-strm", "L0-adr-sbdm", "L0-xcx27"]
see_also: ["stormbladeelytratotemspecruen-part-1", "stormbladeelytratotemspecruen-part-2"]
---
# ASM-L0-29 · Reading "10 HP before armour"

**Assumption (CAN_ASSUME):** "10 HP (6 HP) of damage ДО учёта брони и прочих стандартных защит" means the *raw* damage is 10 (6). Armour, toughness, Protection enchantments and Resistance **then reduce** it, as they would a vanilla hit. It is **not** true damage like the Sculk Crossbow's (C-28). §07's "10 HP before armor" and §06's "+6 HP before armour" read the same way. The difficulty does not scale it: player-sourced damage is never scaled.

**Impact if wrong:** if Andrey meant "ignores armour", the damage path switches to the crossbow's `hit.ts` true-damage pattern with cause `sonicBoom`. That is a contained change in `src/storm/damage.ts`, plus re-run tests against the armoured target.






### ASM-L0-30 · Melee base and the passive trigger (L0-xasm30)

---
title: "ASM-L0-30 · Diamond-sword parity is measured, and the passive rides main-hand melee only"
aliases: ["L0-xasm30", "Storm Blade melee base"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-strm", "L0-scyt"]
see_also: ["stormbladeelytratotemspecruen-part-1"]
---
# ASM-L0-30 · Melee base and the passive trigger

**Assumptions (CAN_ASSUME):**
1. "Damage as a Diamond Sword" is checked **against a vanilla `minecraft:diamond_sword` on the same BDS build**, with the same target and armour. It is never compared to a hard-coded number; Bedrock and Java differ by 1. This follows the Scythe's precedent (`scythe_melee_matches_netherite`). Sharpness, Smite, Bane, Fire Aspect, Knockback and Looting behave as on a vanilla sword. Sweeping does not exist on Bedrock.
2. A "successful hit" for the passive is an `entityHitEntity` by a player whose **main hand** holds a live (non-stale) Storm Blade, on an entity with a health component. Bedrock never melees with the off hand, so an off-hand blade has no passive. Item frames, armour stands without health, dropped items and XP orbs are not "living".
3. The active ability is triggered by **Use** (RMB / long-press on the iPad), as on every other active legendary, through `hands.ts resolveActivation`.

**Impact if wrong:** (1) changes one item-JSON damage value. (2) If off-hand passive was expected, the spec would need a mechanic Bedrock lacks; document it. (3) A different trigger would need a framework hook, which is not allowed in this run, so it would mean a new L0 decision.






### ASM-L0-31 · What counts as a valid activation (L0-xasm31)

---
title: "ASM-L0-31 · Valid release, invalid attempt, and the 10-block line"
aliases: ["L0-xasm31", "Storm Blade activation validity"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-strm", "L0-katn", "L0-lgnd"]
see_also: ["stormbladeelytratotemspecruen-part-1"]
---
# ASM-L0-31 · What counts as a valid activation

**Assumptions (CAN_ASSUME):**
1. **Valid release:** `resolveActivation` picked the blade, the player is alive, and the eye's chunk is loaded. A miss, a wall at 0.5 blocks and an empty 10 blocks are all valid: they spend the cooldown and draw the line to the stop point.
2. **Invalid (no cooldown spent):** the blade is on cooldown or busy, the stack is stale (a duplicate), the player is dead or spectating, or the blade is not in either hand. The HUD shows the seconds; there is no message.
3. **The line:**
   - It starts at the eye and runs along the view direction for at most 10 blocks of **Euclidean** length. The block ray's budget is cell steps, so it is clamped by distance (memory: `maxDistance` = cell steps).
   - It stops at the first block the Katana's `TRACE_FLAGS` treat as solid. Liquids and passable blocks (grass, flowers, carpet, signs, fire) do not stop it.
   - The hit is the nearest living entity (not the wielder) whose ray intersection is closer than the block stop.

**Impact if wrong:** if liquids should stop the line, flip one flag. If misses should not spend the cooldown, it is a one-line rule change, but §02 says plainly that they do.






### ASM-L0-32 · The Storm Blade's def (L0-xasm32)

---
title: "ASM-L0-32 · Def #6 uses key prefix `sb`, a 600-tick cooldown, and needs no framework change"
aliases: ["L0-xasm32", "Storm Blade def"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-strm", "L0-lgnd", "L0-adr-sckp"]
see_also: ["stormbladeelytratotemspecruen-part-1"]
governs_files: ["src/legendary/registry.ts"]
---
# ASM-L0-32 · The Storm Blade's def

**Assumption (CAN_ASSUME):** def #6 is
`{ itemId: "andrew:storm_blade", keyPrefix: "sb", abilityKey: "storm_blade", nameKey: "item.andrew:storm_blade", cooldownTicks: 600, craftTokenId: "andrew:storm_blade_crafted" }`.

`sb` collides with none of the existing prefixes `ws`, `sc`, `oc`, `dk` and `sk` (`registry.ts`). Read with `L0-adr-sckp`, which forbids reusing a prefix.

The recipe's refund on a blocked second craft gives the inputs back (2 lightning rods, 2 wind charges, 1 diamond sword), the same way the crossbow's does.

Every other legendary rule is def-driven at 1.8.0:
- the craft gate;
- retention, recovery and the Void return to the last holder;
- protection, the magnet, the HUD and hand priority.

The passive melee lives in `src/storm/`, subscribed to `entityHitEntity`. It is **not** a framework hook.

**Impact if wrong:** if any framework file has to change beyond `registry.ts` (adding the def) and `main.ts` (the subscription), `strm` must raise a new L0 contradiction before it builds, as the v7 invariant required.







---
title: Assumptions
type: analysis
generated_at: "2026-10-05T22:05:04.964Z"
source_channel: rollout
node_id: rollout-assumptions
aliases: ["rollout-assumptions","assumptions"]
is_a: ["rollout","assumptions"]
relates_to: ["L0-lgnd-as01","L0-lgnd-as02","L0-lgnd-as03","L0-lgnd-as04","L0-lgnd-as05","L0-lgnd-as06","L0-lgnd-as07","L0-lgnd-as08","L0-lgnd-as09","L0-lgnd-as10","L0-lgnd-as11","L0-lgnd-as12","L0-lgnd-as13","L0-lgnd-as14","L0-lgnd-as15","L0-lgnd-as16","L0-lgnd-as17","L0-lgnd-as18","L0-sclk-as01","L0-sclk-as02","L0-sclk-as03","L0-sclk-as04","L0-sclk-as05","L0-xasm23","L0-xasm24","L0-xasm25","L0-xasm26","L0-xasm27","L0-xasm28"]
priority: 610
---

# Assumptions (CAN_ASSUME)

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

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






### Sclk as01 concept assumption (L0-sclk-as01)

**AS-sclk-01 · The bolt's gravity and drag can be tuned to match an arrow (CAN_ASSUME)**

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["assumption"]` · `relates_to: ["L0-sclk-ent2", "L0-sclk-p001", "L0-adr-scdm"]`

**Assumption.** With the snowball runtime, `minecraft:projectile.gravity` and `inertia` can be set so that a bolt fired at an arrow's spawn velocity lands within 1 block of where the arrow would land, at 30 blocks on a flat range. The starting values are the vanilla arrow's (gravity 0.05, inertia 0.99), corrected by probe Q9.

**Impact if wrong.** The bolt drops faster or slower than an arrow. Gameplay still works (physical, not hitscan), but aiming feels different from a vanilla crossbow. That is a C-16 deviation noted in the README. No design change.






### Sclk as02 concept assumption (L0-sclk-as02)








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






### ASM-L0-23 · Sonic Boom damage = 10 (L0-xasm23)

---
title: "ASM-L0-23 · The Sonic Boom (Normal) damage is 10 HP, one constant"
aliases: ["L0-xasm23", "Sonic Boom damage = 10"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-adr-scdm", "L0-xq7"]
see_also: ["sculkcrossbowspecv1ruen-part-1", "sculkcrossbowspecv1ruen-part-3"]
---
# ASM-L0-23 · Sonic Boom damage = 10

**Gap.** §5 and T06 say "equal to vanilla Warden Sonic Boom on Normal difficulty", but give no number.

**Assumption (CAN_ASSUME).** `SONIC_BOOM_DAMAGE = 10` HP (5 hearts): the Warden's ranged attack on Normal. It is exported as one constant that the GameTests read. It ignores difficulty (T07), armour and the shield (T08, C-28) — the shield clause holds only with a shield-piercing cause (`sonicBoom`), not through `decision-scythe-true-damage`, whose `entityAttack` lethal branch a raised shield cancels.

**Verification.** The probe measures a real Warden's Sonic Boom on an unarmoured SimulatedPlayer at Normal on BDS 1.26.51. If the value differs, the constant takes the measured value.

**Impact if wrong.** One number changes. The T06–T08 and T17 expectations follow the constant. No design change.






### ASM-L0-24 · Entity-hit scope and patch placement (L0-xasm24)

---
title: "ASM-L0-24 · What counts as a 'living entity' hit, and where the sculk patch goes"
aliases: ["L0-xasm24", "Crossbow entity-hit scope and patch placement"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-adr-sctr", "L0-xq7"]
see_also: ["sculkcrossbowspecv1ruen-part-1", "sculkcrossbowspecv1ruen-part-2"]
---
# ASM-L0-24 · Entity-hit scope and patch placement

**Gaps.** §5 says "a living entity" and "a sculk patch under the target". It does not say:
- what happens on a hit on an entity without health;
- what happens when the target is in the air (a jumping player, a flying mob, the UFO saucer).

**Assumption (CAN_ASSUME).**
- **Living** = the entity has `minecraft:health` and is not in Creative or Spectator.
  - A living hit deals D (C-28) and places a patch.
  - An entity hit on a non-living or immune entity (boat, minecart, the damage-immune saucer, a Creative player) deals no damage and places **no crater**. It still places a patch: the bolt "hit an entity".
- **The patch** is centred on the target's feet column. It is placed on the first solid full-block surface at most **6 blocks** below the feet. If there is none (a target in the air over the Void, a high flier, the saucer), **no patch** is placed.
- A patch never replaces liquids, containers or deny-list blocks (C-27).

**Impact if wrong.** Only placement rules change, in `sculkCells`. If the operator wants damage to non-living entities, armour stands would break, which then touches the `lgnd` stand rules.






### ASM-L0-25 · Crater contents (L0-xasm25)

---
title: "ASM-L0-25 · The crater drops nothing; liquids, deny-list blocks and unloaded cells are spared; containers spill"
aliases: ["L0-xasm25", "Crossbow crater drops and exclusions"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-adr-sctr", "L0-xcx25", "L0-xasm6", "L0-xq7"]
see_also: ["sculkcrossbowspecv1ruen-part-2"]
---
# ASM-L0-25 · Crater contents

**Gap.** §6 says "destruction is controlled by the script", but says nothing about drops, liquids, containers or unbreakable blocks.

**Assumption (CAN_ASSUME).**
- Crater cells become air **without item drops**. A drop-free carve fits "not a TNT explosion" and avoids a resource farm.
- **Liquids** are not removed. Water may flow into the crater.
- **Deny-list blocks** stay. The list is `PENETRATOR_KEEP` (`src/orbital/penetrator-keep.ts`), 35 ids: bedrock, end portal, end portal frame, end gateway, barrier, `light_block` plus `light_block_0…15`, the three command blocks, structure block, structure void, jigsaw, allow, deny, border block, invisible bedrock, moving block, and both piston arm collision blocks.
- **Obsidian, reinforced deepslate, ancient debris and the Nether portal are carved like stone** — they are deliberately absent from the list, being hard but Survival-breakable (`xasm6`, `pntr-r003`). Spec §6 is silent on them; `r010` already ruled that the list keeps its Orbital meaning, and the operator has accepted the Cannon as it stands (ORBC-IPAD-01-AA).
- **Containers** removed by the carve **spill their contents**. This is an engine fact: `setType` spills containers even with `doTileDrops` false. Any legendary inside is first taken out by `protectLegendariesIn`.
- **Structure blocks** of the shipped structures (Warden City, Bastion, …) get no special protection. A crater is an ordinary world edit, like a player's pickaxe.
- In the Nether and the End the same rules apply. Sculk is placed in every dimension.

**Impact if wrong.**
- If drops are wanted: one flag in the carve (`setType` → `/setblock … destroy`), which raises the per-tick cost.
- If structures must be protected: a new protect-box rule that `strf` would own (a new L0 contradiction).






### ASM-L0-26 · Def #5 inherits the framework as built (L0-xasm26)

---
title: "ASM-L0-26 · The crossbow joins the framework as def #5 and inherits the 1.6.x rules as built, including magnetism and the crafter-target Void return"
aliases: ["L0-xasm26", "Crossbow inherits the framework as built"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-sclk", "L0-magn", "L0-xcx11", "L0-xcx24", "L0-xcx21"]
see_also: ["sculkcrossbowspecv1ruen-part-1", "sculkcrossbowspecv1ruen-part-4"]
governs_files: ["src/legendary/registry.ts", "src/ufo/magnet-select.ts", "src/ufo/magnet-hold.ts", "src/legendary/recovery.ts"]
---
# ASM-L0-26 · Def #5 inherits the framework as built

**Assumption (CAN_ASSUME).** Crossbow §3 and §13 ("preserve all global legendary rules") are met by def #5 (`keyPrefix "sk"`, corrected at reduce from `sc`, which the Scythe holds: `L0-lgnd-cx15`, `L0-adr-sckp`; a craft token, a refund of echo shard ×2, deepslate ×2 and crossbow ×1) plus the no-ability change (`xcx24`), with these readings carried over from earlier weapons:

| Rule | As built at 1.6.1 |
|---|---|
| Hazards: fire and lava prevented; cactus and TNT get a return | the C-16 reading of `L0-xcx21`/`adr-ktgr`. T20 is proven as "exactly one exists, held or owed" |
| Orbital blast and rings | prevented by `protectLegendariesIn` |
| Void return to "the last owner" | **`mark.holder`, falling back to `mark.owner`**. `decision-resolve-l0-xcx11` chose the last holder, and it is built as of 2026-10-05 (`state.ts:47-52,69-72`, `recovery.ts:273`, LGND-HOLD-01-AA): a stack from before holders still returns to its `owner` |
| UFO Magnet | the crossbow **is pulled**: since 1.6.0 the selector takes any `isLegendaryWeaponStack` (`magnet-select.ts:8`). The spec does not list the magnet as a hazard, so this is not a breach |

**Impact if wrong.** The holder field is built, so the crossbow inherits it with no `lgnd` work of its own; T20/Void tests name the last holder, not the crafter. If the crossbow must be exempt from the magnet, a per-def `magnetic: false` is needed (touches `magn`).






### ASM-L0-27 · Ammunition and the bolt's life (L0-xasm27)

---
title: "ASM-L0-27 · Ammunition: arrows only (plain, tipped, spectral) with arrow effects dropped; no fireworks; bolts are not picked up; lifetime 100 ticks"
aliases: ["L0-xasm27", "Crossbow ammunition and bolt lifetime"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-adr-scbs", "L0-adr-scdm", "L0-xq7"]
see_also: ["sculkcrossbowspecv1ruen-part-1", "sculkcrossbowspecv1ruen-part-2"]
---
# ASM-L0-27 · Ammunition and the bolt's life

**Gap.** §4 says "every fired arrow/bolt". A vanilla crossbow also loads **firework rockets**, and tipped arrows carry effects. The spec says nothing about pickup or how long a bolt lives.

**Assumption (CAN_ASSUME).**
- **Ammunition:** `minecraft:arrow` in all its variants (plain, tipped, spectral). **No fireworks.** A rocket's explosion would be area damage, which §5 and §9 forbid. If the base item is the vanilla crossbow (`adr-scbs` B), a loaded rocket is fired as one bolt and its explosion never happens.
- **Tipped and spectral effects are not applied.** The Sonic Boom hit replaces the arrow's whole hit (§5, "instead").
- **A bolt is never picked up.** It is removed on its outcome. Ammunition is spent as vanilla spends it: none in Creative, and the Infinity enchantment does not exist for crossbows.
- **Lifetime:** 100 ticks (5 s), or leaving loaded chunks, or falling into the Void. Then the bolt is removed with no outcome (C-26 "expiry").

**Impact if wrong.** If fireworks must work, the rocket path needs its own rule (a boom hit plus a crater?), and the operator must define it. If tipped effects must apply, the hit adds `addEffect` from the stored potion, which is a small change.






### ASM-L0-28 · A sculk bolt is invisible to every legendary and magnet predicate (L0-xasm28)

---
title: "ASM-L0-28 · A sculk bolt is invisible to every legendary and magnet predicate"
aliases: ["L0-xasm28", "Bolts are not legendaries"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-lgnd", "L0-magn", "L0-sclk-ent2", "L0-sclk-ad03", "L0-lgnd-r016", "L0-xasm26"]
governs_files: ["src/sculk/", "src/legendary/registry.ts", "src/ufo/magnet-select.ts"]
---
# ASM-L0-28 · A sculk bolt is invisible to every legendary and magnet predicate

**Assumption (CAN_ASSUME).** `andrew:sculk_bolt` is a projectile entity (`sclk-ent2`), not an item stack, and it holds no item. So:
- `isLegendaryStack` / `isLegendaryWeaponStack` / `isLegendaryItemEntity` never match it, and `protectLegendariesIn` never moves it out of a crater box. That is harmless, because a bolt has already resolved by the time its own crater is planned.
- The UFO magnet (`magn`) selects legendary item entities and holders through `hasitem` (`lgnd-r016`). A bolt is neither, so a magnet in flight range never captures it.
- A bolt that leaves loaded chunks or exceeds 100 ticks is removed with no outcome. It has no owed entry or recovery path in `lgnd`.

**Why it is an L0 assumption.** Each child states only its own half: `sclk` says "bolts are not item stacks", and `lgnd`/`magn` select by stack type. Neither checks the other.

**Check (cheap, in the `sclk` pipeline task).** A GameTest fires a bolt across an active magnet zone and asserts that it resolves exactly once on its natural path. If the magnet turns out to move generic projectile entities, the bolt needs a magnet exclusion. That exclusion would be a `magn` change, filed as a new L0 contradiction, not patched in `sclk`.







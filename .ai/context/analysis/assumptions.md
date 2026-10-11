---
title: Assumptions
type: analysis
generated_at: "2026-10-11T18:49:56.592Z"
source_channel: rollout
node_id: rollout-assumptions
aliases: ["rollout-assumptions","assumptions"]
is_a: ["rollout","assumptions"]
relates_to: ["L0-trdt-as01","L0-xasm23","L0-xasm24","L0-xasm25","L0-xasm26","L0-xasm27","L0-xasm28","L0-xasm29","L0-xasm30","L0-xasm31","L0-xasm32","L0-xasm33","L0-xasm34","L0-xasm35","L0-xasm36","L0-xasm37"]
priority: 630
---

# Assumptions (CAN_ASSUME)

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

### ASM-trdt-01 · Engine behaviour the custody and damage design leans on (L0-trdt-as01)

# ASM-trdt-01 · Engine behaviour the custody and damage design leans on

**Links.** relates_to: L0-trdt-adcl, L0-trdt-addm, L0-trdt-cons.

**Assumptions (CAN_ASSUME, each with a probe).**
1. **Item use (P3).** A custom item with a use duration and no `throwable` raises `itemReleaseUse` with a usable remaining duration, on touch as well. If wrong: the input moves to `itemStopUse` or the charge is timed from `itemStartUse`.
2. **Thrown damage source (P10).** A script-shot projectile with an owner reports `damagingProjectile` and the owner as `damagingEntity` in `beforeEvents.entityHurt`. If wrong: the scripted `entityAttack` fallback (`addm` §3) is used.
3. **Restart (P9).** The entity dynamic property `andrew:tr.throw` survives a restart, and `entityLoad` fires for the custody entity. If wrong: a stale entity is caught by `entitySpawn` plus a type sweep near the players on the first ticks.
4. **Drops.** A player rarely presses Drop within `DROP_SWING_WINDOW_TICKS` of a throw. If they do, lgnd's departure watch may `lost()` the instance. The generation bump then makes the custody mark stale: the return inserts nothing and exactly one copy remains. Impact: a harmless "recovered" message.
5. **Unmarked Creative copies** thrown while the thrower is offline are dropped at the last position rather than owed. If wrong: Andrey wants Creative copies owed too, which needs lgnd owed support for unmarked stacks.
6. **Entity hit return speed.** It is 10 b/s, the same as a miss (`xasm36`).






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






### ASM-L0-33 · The trident's def (L0-xasm33)

---
title: "ASM-L0-33 · Def #7: `andrew:above_water_trident`, prefix `tr`, a passive def; refund and buckets"
aliases: ["L0-xasm33", "Trident def"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-trdt", "L0-lgnd", "L0-xasm32", "L0-adr-sckp"]
see_also: ["abovewatertridentspecv1ruen-part-1"]
governs_files: ["src/legendary/registry.ts", "packs/behavior/recipes/"]
---
# ASM-L0-33 · The trident's def

**Assumption (CAN_ASSUME).**
- **Identifier.** The spec's `addon:above_water_trident` is only "suggested". The project namespace wins: `andrew:above_water_trident`, token `andrew:above_water_trident_crafted`, command `andrew:trident`.
- **Key prefix `tr`.** It collides with none of `ws`, `sc`, `oc`, `dk`, `sk`, `sb` (`L0-adr-sckp`).
- **Def shape.** A **`PassiveLegendaryDef`**, like the Sculk Crossbow: no `abilityKey`, cooldown or HUD line. The spec forbids a cooldown, and throw and dash are owned by `src/trident/`, not `resolveActivation`.
- **Buckets.** Bedrock's crafting returns the water buckets' container item (an empty bucket) for a token craft just as for any shaped recipe, the way cake returns buckets. The probe verifies this, including with a full inventory (C-34).
- **Refund on a blocked craft.** 2 golden apples, 1 trident and 2 **water** buckets, **minus** the 2 empty buckets the engine already returned. The refund removes them first; if that fails, it returns only the apples and trident plus 2 water buckets in exchange for the 2 empties. The deep-dive picks the variant.

**Impact if wrong.**
- If the engine does not return buckets for this recipe, the script must give them, and a full inventory needs a protected drop.
- If the refund ignores the empties, every blocked craft mints 2 buckets, which breaks C-7 and C-34.






### ASM-L0-34 · Damage numbers (L0-xasm34)

---
title: "ASM-L0-34 · Damage: vanilla trident values; +2 is before armour like C-29"
aliases: ["L0-xasm34", "Trident damage"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-trdt", "L0-adr-twlt", "L0-xcx26"]
see_also: ["abovewatertridentspecv1ruen-part-1", "abovewatertridentspecv1ruen-part-2"]
---
# ASM-L0-34 · Damage numbers

**Assumption (CAN_ASSUME).**
- **"Base damage as vanilla trident"** means the value measured on BDS 1.26.51.1 against a vanilla `minecraft:trident`, separately for melee and for a thrown hit. Expected: melee 9, thrown 8.
  - For melee, the custom item's `minecraft:damage` = measured − 1, because the hand base adds 1 (project measurement: 7 → 8).
  - For thrown hits, the projectile's impact damage is matched to the vanilla thrown trident.
  - Impaling is not promised to act on a custom item. The probe checks it, and it is reported if inert.
- **"+2 HP (one heart)"** is an `entityAttack` bonus **before** armour, Protection and Resistance, the same as the Storm Blade's +6 (C-29). It is not true damage. The spec does not say "ignores armour", and the project already has a proven path for this.
- **Who gets the bonus.** A "living entity" includes players and every mob with health. Armour stands, item frames, boats and minecarts get no bonus and no strike.

**Impact if wrong.**
- If Andrey wants +2 *true* damage, the bonus switches to the Sculk Crossbow's true-damage write (`sclk`). That changes one helper, and `xcx26` work is reused.
- If vanilla values differ from 9/8, only the data values change.






### ASM-L0-35 · How "disallow Loyalty and Riptide" is met (L0-xasm35)

---
title: "ASM-L0-35 · Loyalty/Riptide ban = trident enchant slot + script scrub; Channeling is inert"
aliases: ["L0-xasm35", "Trident enchant ban"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-trdt", "L0-adr-twth"]
see_also: ["abovewatertridentspecv1ruen-part-1", "abovewatertridentspecv1ruen-part-2"]
---
# ASM-L0-35 · How "disallow Loyalty and Riptide" is met

**Assumption (CAN_ASSUME).**
- **Slot granularity.** Stable item JSON grants an enchant *slot*, not a per-enchantment list. Giving the item the trident slot admits Loyalty, Riptide, Channeling and Impaling at the table, the anvil and `/enchant`.
- **The ban.** It is enforced by a script scrub (C-37). Whenever a trident copy is observed (inventory change, re-insert after return, container pull) carrying Loyalty or Riptide, those two levels are removed and the rest are kept. The anvil may still consume the book; that is reported as a limitation.
- **Channeling.** Allowed but inert: the built-in strike already happens on every hit, and no second strike is added.
- **Impaling.** Allowed. It works only if the probe shows it affects a custom item; otherwise it is reported as inert.
- **Unbreaking and Mending.** Allowed and harmless, since the item has no durability.

**Impact if wrong.**
- If a stable per-enchantment exclusion exists, the scrub is replaced by data.
- If Andrey wants the anvil to refuse the book outright, there is no stable way to do it. That would be a client question.






### ASM-L0-36 · Timings the spec leaves open (L0-xasm36)

---
title: "ASM-L0-36 · Timing gaps: fall-grant expiry, return cap, return speed after an entity hit"
aliases: ["L0-xasm36", "Trident timing gaps"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-trdt", "L0-adr-twth", "L0-adr-twrp"]
see_also: ["abovewatertridentspecv1ruen-part-2"]
---
# ASM-L0-36 · Timings the spec leaves open

**Assumption (CAN_ASSUME).**
- **Fall grant.** One grant per dash, not stacked: a second dash refreshes it. It expires 10 s after the last dash if no landing used it, matching the katana's `FALL_FLAG_MS`. Water, a ladder or a slime landing consumes it, because "the next landing" happened.
- **Return after an entity hit.** "Then return the weapon" gives no speed. It uses the same visible 10 b/s return from the hit point.
- **Return cap.** The owner may outrun 10 b/s, for example with an elytra (≈ 30 b/s) or a dash. If the return entity has not arrived within 30 s, or its chunk stops ticking, the copy is delivered directly to the owner (or to pending delivery) with a lang message.
- **Flight cap.** A thrown trident that has neither hit anything nor stopped within 10 s counts as a miss and starts returning.
- **Re-throw during return.** Nothing to throw. The player has no copy, and Creative copies are separate items (C-33).

**Impact if wrong.**
- If Andrey wants the fall grant to persist until landing however long, only the expiry constant changes.
- If he wants a faster return after an entity hit, only the speed constant changes.






### ASM-L0-37 · Speed targets (L0-xasm37)

---
title: "ASM-L0-37 · Speed targets: swim ≈ land sprint (5.6 b/s); dash = vanilla Riptide III launch"
aliases: ["L0-xasm37", "Trident speed targets"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-trdt", "L0-adr-twrp"]
see_also: ["abovewatertridentspecv1ruen-part-1", "abovewatertridentspecv1ruen-part-2"]
---
# ASM-L0-37 · Speed targets

**Assumption (CAN_ASSUME).**
- **Swim speed.** "Approximately land running speed" means horizontal speed while swimming of **5.6 b/s ± 15 %**, the vanilla sprint speed. It is measured with a SimulatedPlayer swimming forward with and without the trident. The baseline is vanilla swim speed (≈ 2–3 b/s with sprint-swimming). The target applies with no Depth Strider or effects. Existing boosts stack naturally and are not capped further.
- **Dash strength.** "Riptide III-like" means the launch distance of a vanilla Riptide III trident used in water, flat, from a standing player. It is measured on BDS, and the scripted impulse is calibrated to ± 20 %. The direction is the full view vector, including upward.
- **Dash rate.** No cooldown. The rate is limited only by the vanilla charge minimum (10 ticks), which the use-duration component keeps.

**Impact if wrong.** Only the calibration constants change. The iPad sheet can ask Andrey to tune them.







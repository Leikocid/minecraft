---
title: Assumptions
type: analysis
generated_at: "2026-10-12T18:21:49.815Z"
source_channel: rollout
node_id: rollout-assumptions
aliases: ["rollout-assumptions","assumptions"]
is_a: ["rollout","assumptions"]
relates_to: ["L0-ench-asm1","L0-pear-as01","L0-trdt-as01","L0-uwbw-as01","L0-xasm23","L0-xasm24","L0-xasm25","L0-xasm26","L0-xasm27","L0-xasm28","L0-xasm29","L0-xasm30","L0-xasm31","L0-xasm32","L0-xasm33","L0-xasm34","L0-xasm35","L0-xasm36","L0-xasm37","L0-xasm38","L0-xasm39","L0-xasm40","L0-xasm41","L0-xasm42","L0-xasm43","L0-xasm44","L0-xasm45"]
priority: 650
---

# Assumptions (CAN_ASSUME)

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

### ASM-ench-1 · Roller details the spec leaves open (L0-ench-asm1)

# ASM-ench-1 · Roller details the spec leaves open

**is_a:** assumption · **part_of:** L0-ench · **relates_to:** L0-xasm39, L0-ench-roll, L0-ench-r005

**Assumptions (CAN_ASSUME).**
1. **The size of the standard pool.** A result has 1 enchantment plus up to 2 extras. Each extra is added with p = 0.3 · tier / 3, stopping at the first failure. This mirrors vanilla, where a higher cost means more enchantments, without the bookshelf cost, which is not observable after the fact.
2. **Other levels.** Enchantments other than Wind Burst and Unbreaking take a level uniform in `1..min(vanillaMax, tierCap)`. The spec sets a distribution only for those two.
3. **The guaranteed rare** is picked uniformly from `R`, and it is picked first, so a later pick can never displace it.
4. **No usefulness filter.** Mending and Unbreaking stay eligible on items without durability (legendaries) if their slot admits them.
5. **Spear Lunge.** If the probe finds Lunge already offered, it stays in the standard pool, keeps its vanilla level and is never treated as rare. If it is not offered, it is treated as rare like any treasure enchantment.
6. **SimulatedPlayer and the table.** We take as given that a SimulatedPlayer cannot use a table (`src/gametest/sculk-enchant.ts:1-2`). The probe confirms this, and the hook's end-to-end channel is then `ipad`.
7. **Tier inference** (only for option (a)): a level drop of 1, 2 or 3 maps to tier 1, 2 or 3.

**Impact if wrong.**
- **Different count or level shapes (1, 2):** only those tests' expected bands change. The §5 bullets are unaffected, because they constrain only the rare stage, curses, conflicts and the Wind Burst/Unbreaking levels.
- **A usefulness filter required (4):** the rare set for def #8 shrinks, possibly to `none`.
- **Lunge counted as rare (5):** one entry moves from `S` to `TREASURE`.
- **A SimulatedPlayer that can use the table (6):** `ac06`'s hook proof moves to `bds`, which is cheaper.
- **Tier ≠ level drop (7):** the cap in the adapter changes; the roller does not.






### ASM-pear-01 · Defaults filled in by the deep-dive (L0-pear-as01)

# ASM-pear-01 · Defaults filled in by the deep-dive

**Is a:** assumption (CAN_ASSUME). **Part of:** L0-pear. **Relates to:** L0-xasm42, L0-pear-pr01, L0-pear-pr02, L0-pear-pr03, L0-pear-ent2.

1. **The rod must still be in the user's inventory when the teleport fires**, found by rod id. If it was dropped or stored mid-wait, there is no teleport and the binding stays on that rod.
   - *Impact if wrong:* if Andrey wants the trip to go ahead anyway, the binding clear would target a rod we cannot reach. The trip would then be repeatable, which breaks "teleports once".
2. **A hook binds only to the rod it was cast from** (by rod id), and only if that rod is still in the caster's inventory at bind time.
   - *Impact if wrong:* none visible. Vanilla removes the hook when the rod leaves the hand.
3. **Plate-generation entries are never deleted**, and only watched cells are recorded.
   - *Impact if wrong:* world dynamic-property growth of a few dozen bytes per distinct bound plate, which is negligible against the measured budget.
4. **A token that never reaches a player inventory** (crafter, hopper) stays a token. It is not a usable rod.
   - *Impact if wrong:* a crafter-made rod needs a manual pick-up, after which the swap fires. A cosmetic issue.
5. **Arrival feedback:** the actionbar shows "Arrived", plus `mob.endermen.portal` at the destination. No particles. That is an iPad taste item.
6. **Messages are sent as `rawtext` translate keys**, defined in the RP `texts/*.lang` for `en_US` and `ru_RU`, so they follow the iPad's language. Only the rod's nameTag is a fixed string (`xq12` item 2).
   - *Impact if wrong:* if translate keys do not resolve on the actionbar, the fallback is a bilingual fixed string. Only the wording changes.
7. **The preload area is 3×3 blocks around the plate**, which touches 1–4 chunks. The poll covers the 9 candidate cells.
   - *Impact if wrong:* a neighbour cell in an unloaded chunk reads as unsafe. Prevented by polling all 9.
8. **Hand-check cadence is 20 ticks** for the durability hold.
   - *Impact if wrong:* none. The worst-case loss between checks is far below 64.






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






### ASM-uwbw-01 · Bow-specific defaults the spec leaves open (L0-uwbw-as01)

# ASM-uwbw-01 · Bow-specific defaults the spec leaves open

**Links.** relates_to: L0-xasm38, L0-uwbw-adfl, L0-uwbw-pprb.

**Assumed (CAN_ASSUME).**
1. **A swap costs engine damage.** A custom-projectile swap loses vanilla arrow damage and enchantment effects. Flight therefore defaults to the tagged vanilla arrow (`adfl` B).
2. **The draw.** A custom shooter without `charge_on_draw` draws and releases like a bow, with `max_draw_duration` 1.0 s. A custom shooter cannot fire the bow's pull textures through vanilla Molang, so the RP attachable animates the pull from the use duration.
3. **The off hand.** It is enabled only if probe row 9 shows the shooter drawing from it. Otherwise the bow is main-hand only, and the README says so.
4. **Infinity.** It follows vanilla on the kept arrow: it does not consume a plain arrow, and that arrow cannot be picked up.
5. **Flame.** Its duration on a Bedrock arrow is read in probe row 3. "Longer of 2 s and Flame" uses that measured value.
6. **The HUD.** It uses the existing legendary action-bar loop, shown only while the bow is in either hand.
7. **Arrows in flight at restart.** An armed arrow that is in flight when the server restarts is a miss, and the charge is kept.

**Impact if wrong.**
- **(1):** if the swap does keep damage, A is cheaper per tick; this is a swap of variants, and the tests are unchanged.
- **(2):** an iPad re-look at the RP only.
- **(3):** the off hand is a one-line component change.
- **(5):** a different fire constant.
- **(7):** none for players; it is only a corner case on the acceptance sheet.






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






### ASM-L0-38 · Underwater Bow semantics (L0-xasm38)

---
title: "ASM-L0-38 · Underwater Bow semantics: def identity, arming gesture, what counts as a hit, fire overlap, the 14 HP"
aliases: ["L0-xasm38", "Underwater Bow semantics"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-uwbw", "L0-xcx33", "L0-adr-ubfl", "L0-lgnd"]
see_also: ["underwaterbowmacefireworksenchantingspecv2ruen-part-1", "underwaterbowmacefireworksenchantingspecv2ruen-part-2"]
---
# ASM-L0-38 · Underwater Bow semantics

**Assumption (CAN_ASSUME).** The spec leaves these gaps:

- **Identity.** The item is `andrew:underwater_bow`. It is def #8, an `ActiveLegendaryDef` with prefix `ub`, token `andrew:underwater_bow_crafted`, command `andrew:bow`, `cooldownTicks` 600 and its own `hudKeys`, including `armed`.
- **Arming.** Sneak + the start of Use arms the charge (`xcx33`). One charge is held at a time. It survives logout, restart, death (it is a player flag) and changing which bow is held.
- **Successful hit.** The arrow lands on a **living entity** (a player or a mob, but not an armour stand, boat, minecart or item frame), and the hurt before-event recorded damage > 0. Each of these is a **miss** that keeps the charge:
  - a block;
  - a shield block;
  - a target in invulnerability frames whose damage the window swallowed;
  - an arrow that despawned;
  - a hit on the shooter.

  An arrow shot before arming is never charged. Only the first arrow fired after arming carries the charge.
- **14 HP.** It **replaces** vanilla arrow damage: exactly 14 before armour, ignoring Power and crit (C-29). Armour, Protection and Resistance then apply as vanilla. Punch knockback still applies.
- **Normal fire.** Fire lasts 2 s, or Flame's duration if that is longer; the two never add. A target in water is put out as vanilla.
- **Super Fire.** It refreshes on a second charged hit; it does not stack. Fire Resistance and fire-immune mobs take no burn damage. The visual runs underwater as particles.
- **Lava.** "Speed in lava as in air" applies to the arrow only. Contact with lava does not destroy the arrow before it hits.
- **Ammunition.** The bow uses vanilla arrows: plain, tipped and spectral, with their effects kept. Infinity follows vanilla.

**Impact if wrong.**
- **A different gesture:** a change to the input handler only.
- **14 *added* to vanilla damage:** the armed hit calls `raiseHit` (opted into projectiles) in place of the replace-mode `setHit` (`L0-uwbw-adex`, amended at reduce v10).
- **Armour stands counting as targets:** the hit filter changes.
- **Super Fire that must stack or spread:** C-43 has to be reopened.






### ASM-L0-39 · Recipes and enchanting semantics (L0-xasm39)

---
title: "ASM-L0-39 · Recipes and enchanting semantics: rocket flight, recipe shapes, the rare-stage unit, the 'context max', the Mace at the table"
aliases: ["L0-xasm39", "Recipes and enchanting semantics"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-uwbw", "L0-ench", "L0-adr-enrl", "L0-xcx32"]
see_also: ["underwaterbowmacefireworksenchantingspecv2ruen-part-2", "underwaterbowmacefireworksenchantingspecv2ruen-part-3"]
---
# ASM-L0-39 · Recipes and enchanting semantics

**Assumption (CAN_ASSUME).**

**Recipes**
- **The recipe shapes.**
  - **The Mace** is a 1×2 shaped recipe: Iron Block over Breeze Rod, anywhere in the 2×2 or 3×3 grid.
  - **The rockets** are a 1×2 shaped recipe: Paper over String.

  Neither collides with a vanilla recipe. Vanilla mace is Heavy Core over Breeze Rod; vanilla rockets are shapeless Paper + Gunpowder.
- **"Flight Duration 1".** Bedrock recipe JSON cannot attach firework NBT. **We assume a plain `minecraft:firework_rocket` result boosts an Elytra at flight 1**, as a Creative rocket with no data does. The `uwbw` probe verifies this. If it does not, the result is reported as a limitation (C-16), with no script workaround, because the script cannot write firework NBT in 2.10.0.

**Enchanting**
- **The unit of the 20 % stage** is one enchanting *result*: the enchantment set applied by one table use. It is not each of the three preview slots, because only the result is observable (`xcx32`). For a 1000+ test, a sample is a "valid generation" with at least one eligible rare enchantment for the item.
- **"Formerly table-inaccessible"** means the vanilla treasure set for the item's slot on 1.26.51: Mending, Frost Walker, Soul Speed, Swift Sneak, Wind Burst and any others, minus curses. The `ench` probe produces the exact list for that version.
- **"Context max"** means the vanilla maximum for the enchantment, further capped by the table tier: tier 1 ≤ I, tier 2 ≤ II, tier 3 = the vanilla max. Bookshelf counts are not observable after the fact.
- **The Mace at the table.** If 1.26.51 does not offer the Mace at the table (enchant slot `mace` not table-enchantable), Wind Burst via the table needs the hook itself. The probe records which.
- **Spear Lunge** is left as vanilla if the probe finds it is already offered.

**Impact if wrong.**
- **Rockets that land at flight 0 or 3:** the acceptance bullet is downgraded to a reported limitation.
- **A per-slot rare stage:** the roller's sampling unit changes. That is a small change, but the statistical test is rewritten.
- **A tier cap that must be the bookshelf-based vanilla cost:** that is not reachable after the fact, so it becomes a deviation.






### ASM-L0-40 · Release scope across `uwbw` and `ench` (L0-xasm40)

---
title: "ASM-L0-40 · 1.11.0 ships the bow and the recipes without waiting for xq11; the two probes share the checks server but not criteria"
aliases: ["L0-xasm40", "v10 release scope"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-uwbw", "L0-ench", "L0-xq11", "L0-xcx32", "L0-xcx33", "L0-adr-enrl", "L0-uwbw-pprb", "L0-ench-prob"]
---
# ASM-L0-40 · Release scope across `uwbw` and `ench`

**Assumed (CAN_ASSUME).**
1. **There is no build dependency between the halves.**
   - The bow needs only `minecraft:enchantable` slot `bow`.
   - The roller sees def #8 through that slot.
   - Neither component waits on the other's probe.
2. **1.11.0 does not wait for `xq11`.** It ships:
   - the bow, the Mace and Rocket recipes;
   - the `ench` verdict and the dormant, tested roller.

   If `xq11` has no answer by then, the ending is (c): the acceptance sheet and the release notes mark §5 bullets 4–6 "not deliverable on stable Bedrock" (C-38). An approved adapter goes in a later minor version.
3. **The probes share one server.** Both run on checks (19136) in parallel, as distinct criterion sets, each on its own private BDS copy named after its full task id. Neither runs the full suite.
4. **`xcx33` rides on `xq11`** as a non-blocking sub-question. With no answer, the `xasm38` gesture ships, with a note on the acceptance sheet.

**Impact if wrong.**
- **Andrey wants one release with the table:** 1.11.0 waits on `xq11` plus the adapter. The bow's work is unchanged.
- **The probes must be serial:** stage 11 loses some parallelism; nothing else changes.






### ASM-L0-41 · "The bobber strikes a pressure plate" = the hook comes to rest in a plate cell (L0-xasm41)

---
title: "ASM-L0-41 · \"The bobber strikes a pressure plate\" = the hook comes to rest in a plate cell"
aliases: ["L0-xasm41", "Bobber strike definition"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-pear", "L0-adr-prbd"]
see_also: ["underwaterbowfinalspecv3ruen-part-2", "underwaterbowfinalspecv3ruen-part-4"]
---
# ASM-L0-41 · "The bobber strikes a pressure plate" = the hook comes to rest in a plate cell

**Class:** CAN_ASSUME.

**Gap.**
- The spec says "когда поплавок попадает именно в существующую нажимную плиту" (when the bobber lands precisely in an existing pressure plate), and "Только плиты, в которые действительно попал поплавок" (only plates the bobber actually hit).
- A plate is 1/16 of a block tall and has no collision box, so the hook cannot strictly "hit" it. The hook falls into the plate's cell and rests on the support block.

**Assumption.** The hook strikes the plate when **both** of these hold:
- its location is inside the cell of a block whose typeId ends in `pressure_plate`;
- its height above that cell's floor is ≤ 0.25, or it is on the ground or has stopped (|velocity| < 0.05).

The check runs every tick while the hook exists. These do not bind:
- a hook flying through a plate cell higher up;
- a hook on a block next to a plate;
- a hook stuck in an entity.

The binding records the **plate's** cell, not the support block.

**Hook ownership.** Only a hook cast from a marked rod can bind. It is identified either:
- by its projectile owner, if the probe shows it is readable; or
- by an `itemUse` from a marked-rod holder in the same tick as the hook's `entitySpawn`, matched to the nearest hook within 3 blocks of that player.

**Impact if wrong.**
- If the hook rests above the threshold, plates never bind. The probe measures the resting height per plate type.
- If vanilla hooks bounce off or pass through, a fast cast that skims a plate may bind. Lowering the threshold is a one-constant change.






### ASM-L0-42 · Pearl Rod outcome table (L0-xasm42)

---
title: "ASM-L0-42 · Pearl Rod outcome table: what clears the binding, what keeps it, who may use it"
aliases: ["L0-xasm42", "Pearl Rod outcomes"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-pear", "L0-adr-prbd", "L0-xcx34", "L0-xq12"]
see_also: ["underwaterbowfinalspecv3ruen-part-4", "underwaterbowfinalspecv3ruen-part-5"]
---
# ASM-L0-42 · Pearl Rod outcome table

**Class:** CAN_ASSUME.

**Gap.** The spec defines only three outcomes: success (clear), a broken or replaced plate (invalid), and a failed load or no safe spot (fail safely and report). It is silent on whether a failed use also casts, on non-owners, on riders, and on re-binding.

**Assumption.**

| Situation on use of a bound rod | Cast? | Teleport? | Binding after | Message |
|---|---|---|---|---|
| The owner, with the same epoch, and everything valid | no | yes | **cleared** | arrival line |
| The owner, but the plate is missing, another type, or has a bumped generation (`xcx34`) | no | no | **cleared** | "plate gone, bind again" |
| The owner, but the preload timed out, the pool is full, or the dimension is refused | no | no | **kept** | the specific reason, "try again" |
| The owner, but there is no safe spot at the plate or its 8 neighbours | no | no | **kept** | "destination unsafe" |
| The owner, with a teleport already pending | no | no | unchanged | "already travelling" |
| The owner dies, or dies while the teleport is pending | — | aborted | void (epoch) | none |
| A non-owner, or the owner after death (epoch mismatch) | **yes (vanilla cast)** | no | unchanged until their own hook binds, which **overwrites** it | none |
| The owner is riding | no | yes, after dismounting (`xq12` item 4) | cleared | arrival line |

- **One binding per rod.** Binding again overwrites. Bindings on different rods are independent.
- **Timeout.** The preload timeout is 10 s (200 ticks).
- **Lore.** The lore shows "bound: <dimension> x y z" or "unbound". It never shows the owner's name.

**Impact if wrong.**
- If Andrey wants a failed load to clear the binding, or a failed use to cast, each is a one-cell change in the table and in the scenario expectations.
- If a non-owner should be blocked from even casting a rod that someone else bound, the cancel branch widens. The spec only forbids *using the binding*.






### ASM-L0-43 · Recipe positions and "infinite durability" (L0-xasm43)

---
title: "ASM-L0-43 · \"Fixed positions\" = a full 3×3 pattern with blanks; infinite durability = damage held at 0"
aliases: ["L0-xasm43", "Pearl Rod recipe and durability"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-pear", "L0-uwbw", "L0-adr-prbd", "L0-xq12"]
see_also: ["underwaterbowfinalspecv3ruen-part-3", "underwaterbowfinalspecv3ruen-part-4"]
---
# ASM-L0-43 · Recipe positions and "infinite durability"

**Class:** CAN_ASSUME.

**Gap 1: positions.**
- The spec says "Позиции фиксированы, прочие клетки пустые" (positions are fixed; the other cells are empty) and "Верстак 3×3" (a 3×3 crafting table).
- A Bedrock shaped recipe with a 1×2 pattern (`["P","R"]`) matches in any column and row, including the 2×2 inventory grid.

**Assumption 1.**
- The recipe is written as a full 3×3 pattern: `[" P ", " R ", "   "]`, with P = `minecraft:ender_pearl` and R = `minecraft:fishing_rod`.
- On the assumption that Bedrock does not trim blank rows and columns, this matches only at top-middle and centre, and only on a crafting table.
- The probe confirms it: a shifted layout and the 2×2 grid must produce nothing. If Bedrock trims, the limitation is reported and the 1×2 pattern ships.
- **Seam for reduce:** the spec draws the v10 Mace and Rocket recipes at fixed cells too (centre and bottom-centre), so the same rule is offered to `uwbw`.

**Gap 2: durability.** "Бесконечная прочность" (infinite durability) on a vanilla rod, which has 64 durability and no stable "Unbreakable" flag.

**Assumption 2.**
- `durability.damage` is written back to 0 after every reel and release of a marked rod, and on the shared interval's hand check.
- The bar may flicker for a tick on the iPad. The rod never breaks.
- Mending and Unbreaking stay legal; they are harmless.

**Gap 3: input rod.** The spec does not say what happens to an enchanted or damaged input rod.

**Assumption 3.** The output is always a fresh rod with no enchantments. The input's enchantments are lost; the token cannot carry them, the same limitation as craftgate's refund.

**Impact if wrong.**
- If fixed positions cannot be enforced, players can craft the rod with shifted ingredients. That is cosmetic and gets reported.
- If damage cannot be written, the fallback is to swap in a fresh marked rod that keeps the binding and the enchantments, which the probe checks.
- If the input's enchantments must carry over, the swap would read the consumed rod. That is impossible after the craft (C-16).






### ASM-L0-44 · Release scope across v10 and v11 (L0-xasm44)

---
title: "ASM-L0-44 · v3 supersedes v2 by content only; the Pearl Rod ships in 1.11.x independently of the bow and xq11"
aliases: ["L0-xasm44", "v11 release scope"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-pear", "L0-uwbw", "L0-ench", "L0-xasm40", "L0-xq11"]
see_also: ["underwaterbowfinalspecv3ruen-part-1", "underwaterbowfinalspecv3ruen-part-5", "underwaterbowmacefireworksenchantingspecv2ruen-part-1"]
---
# ASM-L0-44 · Release scope across v10 and v11

**Class:** CAN_ASSUME.

**Gap.**
- The new document calls itself "FINAL Specification v3". It repeats v2 §1–§5 verbatim and says "Preserve all v2 … rules above".
- Both documents are now in the KV, with priorities 640 and 650.
- The spec does not say whether the Pearl Rod belongs to the same release as the bow.

**Assumption.**
- **v3 is the governing text for §1–§8.** v2 is retained as an identical earlier copy, not a conflicting source. Version labels do not drive supersession here, but the content is the same, so nothing in `uwbw` or `ench` changes. Their `see_also` gains the v3 fragments at rollout.
- **The Pearl Rod is its own epic.** It shares no code path with the bow beyond the recipe-collision test, and none with `ench` beyond eligibility data.
  - It ships in the first 1.11.x build where its criteria are closed.
  - It neither waits for nor blocks the bow, and it never waits for `xq11` (`xasm40` carries).
  - It does not wait for `xq12`, which has defaults.
- **The probe order is distinct criterion sets on checks (19136)**, run in parallel with the `uwbw` and `ench` probes. It must never be run against production (19132).

**Impact if wrong.**
- If Andrey wants one bundled 1.11.0, the release simply waits for the slower epic. The work does not change.
- If v3 was meant to *change* a v2 rule, it did not say which. A diff found none, so a re-run of `uwbw` or `ench` would be needed only on a new document.






### ASM-L0-45 · A marked Pearl Rod is a plain fishing rod to every recipe (L0-xasm45)

---
title: "ASM-L0-45 · A marked Pearl Rod is a plain fishing rod to every recipe, the Orbital Cannon's included"
aliases: ["L0-xasm45"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-pear", "L0-lgnd", "L0-orbc", "L0-ench", "L0-pear-pr01", "L0-pear-ru04", "L0-pear-ent1"]
see_also: ["L0-adr-prbd", "L0-xasm43"]
---
# ASM-L0-45 · A marked Pearl Rod is a plain fishing rod to every recipe

**Is a:** assumption (CAN_ASSUME). This interaction spans components and is visible only at L0.

**Observation (reduce, 2026-10-12).**
- The Pearl Rod is a marked vanilla `minecraft:fishing_rod` (`L0-adr-prbd`).
- Recipes match by item type, and the craftgate's refunds return plain stacks.
- As read during reduce:
  - `packs/behavior/recipes/orbital_cannon.json` takes `minecraft:fishing_rod` in its centre (TNT on the four sides);
  - `ORBITAL_CANNON.refund` in `src/legendary/registry.ts` returns `["minecraft:fishing_rod", 1]`.
- Vanilla carrot-on-a-stick and warped-fungus-on-a-stick also take any fishing rod. So does the Pearl Rod's own recipe (`L0-pear-pr01`).

**Assumption.** This is accepted, not prevented:
- A Pearl Rod used as an ingredient is consumed, along with its id, its binding and its enchantments.
- If the craftgate refunds a duplicate Orbital Cannon, the player gets a **plain** fishing rod back, not the Pearl Rod.
- A Pearl Rod used in its own recipe yields a fresh unbound Pearl Rod.
- The Pearl Rod's crafting is unlimited (C-46), so the loss is one Ender Pearl at most. Nothing is duplicated.
- `ench` treats the rod as `minecraft:fishing_rod` with no adapter.

**Why not prevent it.** Stable recipes cannot exclude an item stack by its dynamic properties. Preventing it would need a craftgate-style rejection on *vanilla* outputs, which C-46 rules out for this item.

**Obligations.**
- `pear` lists "using the rod as a crafting ingredient consumes it as a plain rod" among its reported limitations (C-16).
- The C-40 collision test in `L0-pear-ac01` keeps the Orbital Cannon recipe in its shape set (it already covers every `packs/behavior/recipes/*` file).

**Impact if wrong:** if Andrey wants the rod protected from recipes, it becomes a craft-time rejection plus refund for `orbital_cannon`, carrot-on-a-stick and warped-fungus-on-a-stick. That means a new `lgnd` touchpoint.







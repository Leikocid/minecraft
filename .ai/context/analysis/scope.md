---
title: Scope
type: analysis
generated_at: "2026-09-24T19:42:02.865Z"
source_channel: rollout
node_id: rollout-scope
aliases: ["rollout-scope","scope"]
is_a: ["rollout","scope"]
relates_to: ["L0-infr-ac01","L0-infr-ac02","L0-infr-ac03","L0-infr-ac04","L0-infr-ac05","L0-infr-ac06","L0-infr-ac07","L0-lgnd-ac01","L0-lgnd-ac02","L0-lgnd-ac03","L0-lgnd-ac04","L0-lgnd-ac05","L0-lgnd-ac06","L0-lgnd-ac07","L0-lgnd-ac08","L0-lgnd-ac09","L0-lgnd-ac10","L0-lgnd-ac11","L0-lgnd-ac12","L0-lgnd-ac13","L0-lgnd-ac14","L0-pick-ac01","L0-pick-ac02","L0-pick-ac03","L0-pick-ac04","L0-pick-ac05","L0-pick-ac06","L0-pick-ac07","L0-scyt-ac01","L0-scyt-ac02","L0-scyt-ac03","L0-scyt-ac04","L0-scyt-ac11","L0-scyt-ac15","L0-scyt-ac16","L0-sprj-ac05","L0-sprj-ac06","L0-sprj-ac07","L0-sprj-ac08","L0-sprj-ac09","L0-sprj-ac10","L0-sprj-ac11","L0-sprj-ac12","L0-sprj-ac13","L0-sprj-ac14","L0-webs-ac01","L0-webs-ac02","L0-webs-ac03","L0-webs-ac04","L0-webs-ac05","L0-webs-ac06","L0-webs-ac07","L0-webs-ac08"]
priority: 520
---

# Scope

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## _other

### Infr ac01 concept acceptance criterion (L0-infr-ac01)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]`

GIVEN a clean clone of the repository, WHEN `npm run build` is run, THEN it produces `dist/andrew.mcaddon` and `tsc` compiles `src/` with no errors against the installed `@minecraft/server` types. [src: stage-0-infrastructure criterion 1]


- **level**: 2

### Infr ac02 concept acceptance criterion (L0-infr-ac02)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]`

GIVEN the built packs, WHEN `npm run validate` (or the validate step inside `npm run build`) runs, THEN every manifest and every item/JSON file under `packs/**` passes structural validation (`validatePacks`/`validateSelfTestPack`) with zero `ValidationError`s. [src: stage-0-infrastructure criterion 2]


- **level**: 2

### Infr ac03 concept acceptance criterion (L0-infr-ac03)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]`

GIVEN `dist/andrew.mcaddon` staged into a BDS world in Docker, WHEN `npm run bds:check` runs, THEN the server log shows no manifest/dependency errors naming the add-on's packs, a `Pack Stack` line names the behavior and selftest pack uuids, and `SCRIPT_LOADED` appears in the log. [src: stage-0-infrastructure criterion 3]


- **level**: 2

### Infr ac04 concept acceptance criterion (L0-infr-ac04)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]`

GIVEN the built `.mcaddon` imported on the iPad (or delivered via the LAN server) with both packs enabled in a world, WHEN the player spawns, THEN a chat message appears at `initialSpawn`, and the test item is visible in Creative with both RU and EN names. This criterion is typed `manual`/`ipad`-channel and does not block autopilot merge — a green `bds` run never closes it. [src: stage-0-infrastructure criterion 4; C-6; decision-verification-approach-automatic]


- **level**: 2

### Infr ac05 concept acceptance criterion (L0-infr-ac05)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]`

GIVEN the Stage 0 deliverable is complete, WHEN the repository is inspected, THEN the project exists in git with a first commit covering the minimal add-on. [src: stage-0-infrastructure criterion 5]


- **level**: 2

### Infr ac06 concept acceptance criterion (L0-infr-ac06)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-infr-as01"]`

GIVEN a built add-on plus the `packs/gametest` beta pack, WHEN `npm run bds:gametest` runs, THEN a `SimulatedPlayer` completes the registered scenario on a dedicated `gametest` world with the Beta APIs experiment enabled, without a human or an iPad, and the run's log-derived verdict is PASS/FAIL with exit code 0/1 accordingly. [src: scripts/bds-gametest.mjs; decision-q-012]

Note: see `L0-infr-as01` — this criterion is treated as an additional verification lane, not one of Stage 0's five original closing criteria.


- **level**: 2

### Infr ac07 concept acceptance criterion (L0-infr-ac07)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]`

GIVEN `docker/bds/compose.yaml`'s `VERSION` and `scripts/targets.mjs`'s `BDS_VERSION` disagree, WHEN `npm run bds:check` or `npm run bds:up` is run, THEN `assertComposePinsVersion()` fails the run immediately, before any Docker or build work happens. [src: scripts/bds-lib.mjs assertComposePinsVersion; C-2/C-3]


- **level**: 2

### Lgnd ac01 concept acceptance criterion (L0-lgnd-ac01)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r006"]
---
**AC-lgnd-01: Upgrade from 0.3.0 keeps the flag, the cooldown, the pending token and the marks.** Channel: `bds`.

GIVEN a world saved by 0.3.0 where:
- the Web Sword was Survival-crafted;
- player P has `andrew:ws_cooldown_until` = now + 20 s;
- player Q has a single-object `ws_pending`;
- a marked sword has no `ws_gen`

WHEN the server restarts on the framework build
THEN a Survival Web Sword craft is refunded with `andrew.web_sword.craft_blocked` and no broadcast,
AND P's HUD shows the Web Sword cooling with ≤ 20 s,
AND Q receives exactly one sword on the next spawn,
AND the gen-less sword casts.


- **level**: 2

### Lgnd ac02 concept acceptance criterion (L0-lgnd-ac02)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r002"]
---
**AC-lgnd-02: Craft budgets are independent per weapon.** Channel: `bds`.

GIVEN the Web Sword flag is claimed and the Scythe flag is unset
WHEN a Survival player crafts the Scythe
THEN the craft succeeds, exactly one broadcast naming the crafter and the Scythe is sent, and the Scythe flag is set,
AND a second Survival Scythe craft (by any player, also after restart) is refunded with 2 golden apples, 2 obsidian and 1 diamond hoe,
AND `/andrew:legendary reset scythe_of_calamity` leaves the Web Sword flag set,
AND a Creative-mode Scythe craft neither claims the flag nor is refunded.


- **level**: 2

### Lgnd ac03 concept acceptance criterion (L0-lgnd-ac03)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r003"]
---
**AC-lgnd-03: Cooldowns do not bleed between weapons.** Channel: `build` (unit, stubbed clock) + `bds`.

GIVEN player P with both abilities ready
WHEN `start(P, "web_sword")` is called
THEN `isReady(P, "web_sword")` is false for 30 000 ms (± 50 ms),
AND `isReady(P, "scythe_of_calamity")` stays true throughout,
AND for another player R, both stay ready.


- **level**: 2

### Lgnd ac04 concept acceptance criterion (L0-lgnd-ac04)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r004"]
---
**AC-lgnd-04: A ready main hand wins, even when it refuses.** Channel: `bds`.

GIVEN P holds the Scythe in the main hand and the Web Sword in the off hand, both ready, and no player is within 20 blocks
WHEN P presses Use
THEN only the Scythe ability runs:
- the "no player here" message is shown,
- no cobweb is placed,
- neither cooldown starts.


- **level**: 2

### Lgnd ac05 concept acceptance criterion (L0-lgnd-ac05)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r004", "L0-lgnd-r009"]
---
**AC-lgnd-05: The off hand fires when the main hand is cooling or busy.** Channel: `bds`.

GIVEN P holds the Scythe in the main hand, cooling or busy with a volley, and a ready Web Sword in the off hand, aimed at a valid trap target
WHEN P presses Use
THEN the Web Sword trap is placed and the Web Sword cooldown starts,
AND the Scythe cooldown and busy state are unchanged.

Also:
- If neither weapon is ready, the same press does nothing, sends no message and changes no state.
- With an empty main hand and a ready Web Sword in the off hand, Use does nothing.


- **level**: 2

### Lgnd ac06 concept acceptance criterion (L0-lgnd-ac06)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r007", "L0-lgnd-p005"]
---
**AC-lgnd-06: Two-hand Action Bar.** Channel: `build` (stubbed HUD test) + `ipad` (visual).

GIVEN P holds a ready Scythe in the main hand and a Web Sword with 12 s left in the off hand
WHEN the HUD renders
THEN P's bar shows the Scythe "Ready" segment and then the Web Sword "12" segment, in P's client language,
AND a player holding no legendary receives no `setActionBar` call,
AND a player holding only the Web Sword in the main hand receives exactly the 0.3.0 rawtext: the shipped HUD cases in `tests/web-sword-cooldown.test.mjs` pass unmodified.


- **level**: 2

### Lgnd ac07 concept acceptance criterion (L0-lgnd-ac07)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r008"]
---
**AC-lgnd-07: Death with several legendaries returns each exactly once.** Channel: `bds`.

GIVEN P carries a marked Web Sword in the off hand, a marked Scythe in the hotbar, and an admin Web Sword in the inventory
WHEN P dies (also in the Void), respawns, disconnects and reconnects, and the server restarts
THEN P holds exactly those three instances (same ids),
AND no item entity of any of them is left at the death spot,
AND no fourth copy exists.


- **level**: 2

### Lgnd ac08 concept acceptance criterion (L0-lgnd-ac08)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p003", "L0-lgnd-r011"]
---
**AC-lgnd-08: Void return to the last holder, exactly once.** Channel: `bds`.

GIVEN P last held a marked Scythe (gen g) and drops it into the Void
WHEN the item entity falls below the dimension's minimum height
THEN P receives it with the same id and gen g + 1, plus a private "returned" message,
AND the Scythe craft flag is unchanged.

If P is offline, the owed entry survives a restart and is redeemed exactly once on P's next join.


- **level**: 2

### Lgnd ac09 concept acceptance criterion (L0-lgnd-ac09)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p003"]
---
**AC-lgnd-09: Ordinary destruction returns the instance; a pickup does not.** Channel: `bds`.

GIVEN a marked legendary item entity last held by P
WHEN it burns in lava or fire, is destroyed by cactus or an explosion, or despawns
THEN P receives it back per ac08 (Web Sword and Scythe alike),
AND an ordinary pickup of the entity by any player triggers **no** return and no generation bump,
AND an unmarked (Creative) copy is destroyed as in vanilla.


- **level**: 2

### Lgnd ac10 concept acceptance criterion (L0-lgnd-ac10)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r005"]
---
**AC-lgnd-10: A stale-generation copy is voided.** Channel: `bds`.

GIVEN an instance whose generation was bumped by a return while the original stack survived (for example collected by a hopper into a chest)
WHEN any player moves the stale stack into their inventory
THEN it is deleted in the handling of that event and the player gets a `voided` message,
AND during that window it could neither cast nor be retained on death,
AND the live copy is unaffected.


- **level**: 2

### Lgnd ac11 concept acceptance criterion (L0-lgnd-ac11)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad06", "L0-lgnd-cx04"]
---
**AC-lgnd-11: Web Sword regression after migration.** Channel: `build` + `bds`.

GIVEN the framework build
WHEN `npm test`, `bds:check` and `bds:gametest` run
THEN every existing test passes **without edits to its assertions**:
- `tests/web-sword-*.test.mjs`;
- the nine `andrew:websword_*` GameTests listed in `scripts/bds-gametest.mjs`;
- the pickaxe and autosmelt suites.
AND `grep -rnE "andrew:(ws|sc)_|andrew:hidden_until" src/` matches only `src/legendary/state.ts`,
AND `/andrew:websword give|reset` still works.


- **level**: 2

### Lgnd ac12 concept acceptance criterion (L0-lgnd-ac12)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad03", "L0-lgnd-r007"]
---
**AC-lgnd-12: No standing watcher when nothing is watched.** Channel: `bds`.

GIVEN no marked legendary item entity exists in any loaded dimension and no volley is alive
WHEN the server runs for 60 s
THEN only the HUD interval is registered.

The loss-watcher interval starts on the first watched `entitySpawn` and is cleared when the last watched entity is gone. This is checked via debug log lines in `bds:check`.


- **level**: 2

### Lgnd ac13 concept acceptance criterion (L0-lgnd-ac13)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r009", "L0-sprj"]
---
**AC-lgnd-13: busy blocks re-use, is volatile, and hands off to cooldown without a gap.** Channel: `build` (unit) + `bds`.

GIVEN `setBusy(P, "scythe_of_calamity", true)`
THEN `isReady` is false, the HUD shows the `active` key, and a Use press with the Scythe in the main hand does not call its ability.

WHEN `setBusy(false)` and `start()` are called in the same turn
THEN no tick observes `isReady == true`.

WHEN `setBusy(false)` is called alone
THEN the ability is ready at once.

AND after a server restart with busy set, `isBusy` is false.


- **level**: 2

### Lgnd ac14 concept acceptance criterion (L0-lgnd-ac14)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r010", "L0-stgt", "L0-sqat"]
---
**AC-lgnd-14: `isHiddenFromTargeting` contract.** Channel: `build` + `bds`.

GIVEN player T with no `andrew:hidden_until`
THEN `isHiddenFromTargeting(T)` is false.

WHEN `/andrew:hide 10 T` (or GameTest) sets it to now + 10 s
THEN it is true.

- After 10 s → false.
- After a server restart within the window → still true.
- A non-number value → false, with no throw.


- **level**: 2

### Pick ac01 concept acceptance criterion (L0-pick-ac01)

GIVEN a clean clone, WHEN `npm run build` runs and the resulting `.mcaddon` is loaded on BDS in Docker and imported on iPad, THEN there are no dependency or manifest errors involving this item's manifest/recipe/item entries. [channel: bds + ipad; src: `minerspickaxetestspec` pass criteria]


- **level**: 2

### Pick ac02 concept acceptance criterion (L0-pick-ac02)

GIVEN Creative mode, WHEN the player opens Equipment → pickaxe group or searches Creative inventory, THEN `andrew:miners_pickaxe` is visible with its RU/EN localized name and icon; `/give <player> andrew:miners_pickaxe` also works. [channel: ipad; src: `minerspickaxetestspec` scope + pass criteria]


- **level**: 2

### Pick ac03 concept acceptance criterion (L0-pick-ac03)

GIVEN 3× Iron Ingot, 2× Raw Gold, 2× Stick in the exact shape of `L0-pick-r005`, WHEN placed in a crafting table, THEN exactly 1× `andrew:miners_pickaxe` is produced. [channel: bds; src: `packs/behavior/recipes/miners_pickaxe.json`]


- **level**: 2

### Pick ac04 concept acceptance criterion (L0-pick-ac04)

GIVEN a Survival player holding `andrew:miners_pickaxe`, WHEN they break any of the 7 allow-listed blocks (`L0-pick-r003`), THEN the smelted product spawns with count 1 and the raw material never drops. Verified in-engine for `minecraft:iron_ore` → `minecraft:iron_ingot` by GameTest `pickaxe_autosmelt`; the other 6 pairs follow the same code path with no per-block special-casing. [channel: bds; src: `src/gametest/main.ts` L189-196]


- **level**: 2

### Pick ac05 concept acceptance criterion (L0-pick-ac05)

GIVEN the same pickaxe, WHEN the player breaks `minecraft:stone` (not on the allow-list), THEN it drops vanilla `minecraft:cobblestone`, not an auto-smelt product. [channel: bds; src: `src/gametest/main.ts` `pickaxe_keeps_vanilla_drops`, L198-207]


- **level**: 2

### Pick ac06 concept acceptance criterion (L0-pick-ac06)

GIVEN a fresh `andrew:miners_pickaxe` ItemStack, WHEN queried in-engine, THEN `ItemEnchantableComponent.canAddEnchantment === true`, `EnchantmentSlot.Pickaxe` is among its enchantable slots, and `minecraft:durability` is absent. [channel: bds; src: `SELFTEST-01-AA` / `src/selftest/main.ts` `pickaxe-enchantable` + `pickaxe-no-durability`, L127-150]


- **level**: 2

### Pick ac07 concept acceptance criterion (L0-pick-ac07)

GIVEN `copper_ore`, `deepslate`, and `ancient_debris` placed in the GameTest structure, WHEN each is broken with `andrew:miners_pickaxe` vs. a real `minecraft:diamond_pickaxe` in the same run, THEN the pickaxe finishes within `SPEED_TOLERANCE_TICKS` (4) of vanilla and within `BREAK_LIMIT_TICKS` (300). [channel: bds; src: `src/gametest/main.ts` `pickaxe_digs_at_diamond_speed`, L864-962]


- **level**: 2

### AC-scyt-01 — No player within 20 blocks: message shown, no cooldown (§8 test 1) (L0-scyt-ac01)

# AC-scyt-01 — No player within 20 blocks: message shown, no cooldown (§8 test 1)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-scyt-r003"]`

**GIVEN** owner O holds a ready Scythe, and the nearest other player is 25 blocks away, or there is none,
**WHEN** O presses Use,
**THEN**:
- O (and only O) receives `andrew.scythe_of_calamity.no_target`: «Здесь нет игрока» in `ru_RU`, "There is no player here" in `en_US`;
- `sc_cooldown_until` is unchanged, and busy is false;
- no particles and no volley are created;
- a second press in the next tick behaves the same way, with no cooldown in between.

**Also:** a zombie or villager 5 blocks away does not change the result, because mobs are ignored.


- **level**: 2

### AC-scyt-02 — The nearest visible player is chosen; mobs, hidden and occluded players are skipped (§8 test 2) (L0-scyt-ac02)

# AC-scyt-02 — The nearest visible player is chosen; mobs, hidden and occluded players are skipped (§8 test 2)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-scyt-r001", "L0-scyt-r002", "L0-scyt-ad02"]`

**GIVEN** owner O, with player A at 8 blocks behind a solid 3-high stone wall, player B at 12 blocks in the open, player C at 15 blocks in the open, and a zombie at 3 blocks,
**WHEN** O presses Use,
**THEN** the lock is on **B**: the log shows `targetId = B`. A is skipped because it is not visible, and the zombie is skipped because it is not a player.

**Variants:**
- A player in Spectator mode at 4 blocks is skipped.
- A player whose feet are behind a slab but whose head is exposed at 6 blocks **is** chosen (`L0-scyt-ad02`).
- A player in another dimension is never considered.


- **level**: 2

### AC-scyt-03 — A player hidden by Shadow Blade is not chosen (§8 test 3) (L0-scyt-ac03)

# AC-scyt-03 — A player hidden by Shadow Blade is not chosen (§8 test 3)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-scyt-r001", "CTR-014", "ASM-024"]`

**GIVEN** owner O, with player H at 5 blocks for whom `isHiddenByShadowBlade(H)` returns true, and player V at 10 blocks, both visible,
**WHEN** O presses Use,
**THEN** the lock is on V. If V is absent, the no-target message appears and there is no cooldown.

**Verification today:** a unit or GameTest injects a predicate stub that returns true for H. End-to-end verification with a real Shadow Blade is **blocked** by CTR-014 / Q-020. Record this AC as "verified at the seam". Do not report it as fully passed.


- **level**: 2

### AC-scyt-04 — Equal distance: the view-direction tie-break decides (§8 test 4) (L0-scyt-ac04)

# AC-scyt-04 — Equal distance: the view-direction tie-break decides (§8 test 4)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-scyt-r002"]`

**GIVEN** owner O at (0, y, 0) facing +X, with player P1 at (10, y, 0) and player P2 at (0, y, 10). Both are exactly 10 blocks away and visible.
**WHEN** O presses Use,
**THEN** the lock is on P1, and the log shows `tieBroken = true`.

**AND WHEN** O turns to face +Z and presses again, after the cooldown or after an escape with no hit,
**THEN** the lock is on P2.

**Edge:** P1 at 10.000 and P2 at 10.005 still count as tied, within ε = 0.01. P1 at 10.0 and P2 at 10.5 are not tied, so P1 wins on distance whatever the view direction.


- **level**: 2

### AC-scyt-11 — One Survival craft per world, kept across restart (§8 test 11) (L0-scyt-ac11)

# AC-scyt-11 — One Survival craft per world, kept across restart (§8 test 11)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-scyt-p004", "L0-scyt-r009", "L0-lgnd"]`

**GIVEN** a Survival world where no Scythe has been crafted, and the Web Sword may or may not have been crafted,
**WHEN** player A crafts the recipe (2 golden apples, 2 obsidian, 1 diamond hoe),
**THEN** A receives 1× `andrew:scythe_of_calamity`, and every player sees the localized announcement naming the Scythe and A.

**AND WHEN** player B crafts it again, before or after a BDS restart,
**THEN** the craft is blocked, the ingredients are refunded, and no second Scythe appears.

**AND** the Web Sword's flag is unaffected in either direction. `/give` and Creative copies never set the flag.


- **level**: 2

### AC-scyt-15 — Item, melee and durability (§1, §9 DoD) (L0-scyt-ac15)

# AC-scyt-15 — Item, melee and durability (§1, §9 DoD)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-scyt-r009", "L0-sitm", "L0-scyt-r008"]`

- **BDS:** a melee hit on a zombie with the Scythe removes as much health as a hit with a vanilla `netherite_sword`. After 500 hits the item has no durability loss.
- **BDS:** a melee hit starts no cooldown, spawns no projectiles and does not set busy.
- **BDS:** the enchanting table and anvil accept Sharpness and Fire Aspect, and reject Efficiency.
- **BDS:** Use on grass or dirt does not till it (no hoe tag).
- **iPad (C-9):** the item shows in Creative under Equipment → Swords and in search. The names are «Коса бедствия» / "Scythe of Calamity". The icon renders. `/give @s andrew:scythe_of_calamity` works.


- **level**: 2

### AC-scyt-16 — Action Bar state in either hand, and hand priority (§6) (L0-scyt-ac16)

# AC-scyt-16 — Action Bar state in either hand, and hand priority (§6)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-lgnd", "CTR-017", "CTR-012"]`

**GIVEN** O holds the Scythe in the main hand **or** the off hand,
**THEN** the action bar shows «Готово» / "Ready" while the Scythe is ready, "active" while a volley flies, and the remaining seconds during the cooldown. The remaining seconds count down to 0 and then return to Ready.

**GIVEN** O holds a ready Web Sword in the main hand and a ready Scythe in the off hand,
**WHEN** O presses Use on a valid Web Sword target,
**THEN** only the Web Sword fires.

**AND GIVEN** the Web Sword is on cooldown, **WHEN** O presses Use, **THEN** the Scythe fires. If CTR-012 rules off-hand activation infeasible, this half is dropped and noted.


- **level**: 2

### AC-sprj-05 — Exactly 3 projectiles, through blocks, no block changes (§8 test 5) (L0-sprj-ac05)

# AC-sprj-05 — Exactly 3 projectiles, through blocks, no block changes (§8 test 5)

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-sprj-r001", "L0-sprj-r002", "L0-sqat"]` · channel: `bds` (GameTest) + `ipad` (visual)

**GIVEN** a target sealed in a 3×3×3 obsidian shell, with a glass pane and a closed door on the line between owner and target, 10 blocks away,
**WHEN** the owner activates the Scythe,
**THEN** the volley record holds exactly 3 projectiles (released on ticks +0, +4, +8), at least one reaches the target, **AND** a type-hash of every block within the 20-block sphere is identical before and after, **AND** no new entities of any type exist in that sphere after the volley.


- **level**: 2

### AC-sprj-06 — One hit = 3 HP true damage + a launch of about 10 blocks (§8 test 6) (L0-sprj-ac06)

# AC-sprj-06 — One hit = 3 HP true damage + a launch of about 10 blocks (§8 test 6)

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-sprj-r003", "L0-sprj-p003", "L0-sprj-as04"]` · channel: `bds`

**GIVEN** a target at 20 HP with no effects, in full Netherite armour with Protection IV on every piece,
**WHEN** exactly one projectile hits (the other two are removed via the core in the test harness),
**THEN** the target's health reads exactly 17.0 immediately after the hit, before landing.

**AND GIVEN** the same target **without** armour on flat ground,
**WHEN** one hit lands,
**THEN** the maximum Y reached is 8–12 blocks above the hit Y (ASM-019), **AND** the fall damage on landing is non-zero and matches vanilla fall damage for that height.


- **level**: 2

### AC-sprj-07 — Three hits total 9 HP true damage, including while airborne (§8 test 7) (L0-sprj-ac07)

# AC-sprj-07 — Three hits total 9 HP true damage, including while airborne (§8 test 7)

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-sprj-r003", "L0-sprj-as01", "L0-sprj-as02"]` · channel: `bds`

**GIVEN** an armoured target at 20 HP, no absorption, 8 blocks from the owner, with fall damage disabled for the test (`falldamage false`) so it does not mix into the reading,
**WHEN** all 3 projectiles hit, the 2nd and 3rd while the target is in the air,
**THEN** `volley.hits == 3`, the target's health is exactly 11.0, and the outcome is `COMPLETED`.


- **level**: 2

### AC-sprj-08 — Escape before the first hit cancels with no cooldown (§8 test 8) (L0-sprj-ac08)

# AC-sprj-08 — Escape before the first hit cancels with no cooldown (§8 test 8)

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-sprj-r004", "L0-sprj-r005"]` · channel: `bds`

**GIVEN** a volley launched at a target 15 blocks away,
**WHEN** the target is teleported 25 blocks from `launchPoint` before any projectile connects (the owner stays put, then separately: the owner moves 10 blocks toward the target and the target is placed 21 blocks from `launchPoint`),
**THEN** in both cases, in the same tick: every projectile is `GONE`, the outcome is `ESCAPED_NO_HIT`, the target's health is unchanged, `cooldown.isBusy` is false, `cooldown.isReady` is true, **AND** an immediate second activation launches a new volley.


- **level**: 2

### AC-sprj-09 — Escape after a hit gives a full 30 s cooldown (§8 test 9) (L0-sprj-ac09)

# AC-sprj-09 — Escape after a hit gives a full 30 s cooldown (§8 test 9)

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-sprj-r005", "L0-sprj-ad01", "L0-lgnd"]` · channel: `bds`

**GIVEN** a volley where exactly one projectile has hit,
**WHEN** the target is then moved 25 blocks from `launchPoint`,
**THEN** the remaining projectiles are `GONE` the same tick, the outcome is `ESCAPED_AFTER_HIT`, busy is false, **AND** `cooldown.remaining(owner, "scythe")` is 30 s ± 1 tick measured from that tick, **AND** a Use at +29 s is refused while a Use at +30.1 s selects a target again.


- **level**: 2

### AC-sprj-10 — Target death, logout or dimension change leaves nothing behind (§8 test 10) (L0-sprj-ac10)

# AC-sprj-10 — Target death, logout or dimension change leaves nothing behind (§8 test 10)

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-sprj-p004", "L0-sprj-r006", "C-14"]` · channel: `bds`

**GIVEN** a live volley with `hits = 0`, run 3 separate times,
**WHEN** the target is (a) killed with `/kill`, (b) disconnected, (c) teleported to the Nether,
**THEN** within 1 tick the volley map is empty, the `runInterval` handle is cleared (no other volleys), busy is false, there is no cooldown, no entity was created, and no Scythe-related dynamic property changed on the target.

**AND** repeating (a)–(c) with `hits = 1` gives the same cleanup plus a committed 30 s cooldown.


- **level**: 2

### AC-sprj-11 — Owner death, logout or dimension change cancels the volley (ASM-023) (L0-sprj-ac11)

# AC-sprj-11 — Owner death, logout or dimension change cancels the volley (ASM-023)

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-sprj-p004", "L0-sprj-ad01", "L0-sprj-as06", "ASM-023"]` · channel: `bds`

**GIVEN** a live volley,
**WHEN** the owner dies, disconnects, or changes dimension,
**THEN** within 1 tick the volley resolves `OWNER_INVALID`, all projectiles are `GONE`, the target takes no further damage, and busy is cleared by id.

**AND WHEN** the owner had already scored ≥ 1 hit and disconnected, **THEN** on reconnect their Scythe cooldown is active, and remaining ≤ 30 s measured from the first hit (`L0-sprj-ad01`).
**AND WHEN** there were 0 hits, **THEN** on reconnect the ability is ready and not busy.


- **level**: 2

### AC-sprj-12 — One tick loop at most, and none at idle (C-4, C-13) (L0-sprj-ac12)

# AC-sprj-12 — One tick loop at most, and none at idle (C-4, C-13)

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-sprj-r006", "L0-sprj-r007"]` · channel: `bds`

**GIVEN** two owners who activate the Scythe on different targets 2 ticks apart,
**WHEN** both volleys are live,
**THEN** exactly one interval handle exists (spied on `system.runInterval` and `clearRun` calls, or an exported debug counter), **AND** after both resolve, the handle is null and `runInterval` was called exactly once for the pair.

**AND GIVEN** no volleys, **THEN** the Scythe module registers no per-tick callback at all.

**AND** a second Use by the same owner during flight creates no second volley (busy).


- **level**: 2

### AC-sprj-13 — Completion and expiry outcomes (§5 normal completion, ASM-018) (L0-sprj-ac13)

# AC-sprj-13 — Completion and expiry outcomes (§5 normal completion, ASM-018)

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-sprj-ent3", "L0-sprj-r005", "L0-sprj-ad03"]` · channel: `build` (pure-core unit tests) + `bds`

**GIVEN** the pure volley core,
- **WHEN** 1 projectile hits and 2 expire inside the leash → **THEN** `COMPLETED` and `commitCooldown` is emitted.
- **WHEN** all 3 expire inside the leash with 0 hits (the target is moved faster than 0.5 block/tick for 200 ticks) → **THEN** `EXPIRED_NO_HIT`, no `commitCooldown` event.
- **WHEN** a hit and a leash crossing happen in the same step → **THEN** `ESCAPED_AFTER_HIT` (`L0-sprj-r008`).
- **WHEN** 3 hits land → **THEN** `COMPLETED` in the same step as the third hit.


- **level**: 2

### AC-sprj-14 — A lethal hit kills through the vanilla path; restart leaves no orphans (L0-sprj-ac14)

# AC-sprj-14 — A lethal hit kills through the vanilla path; restart leaves no orphans

**Links:** `part_of: ["L0-sprj"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-sprj-p003", "L0-sprj-cx02", "L0-sprj-p004", "C-14", "ADR-022"]` · channel: `bds`

**GIVEN** a target at 2 HP (no totem), **WHEN** one projectile hits, **THEN** the target dies, the chat death message names the owner, and the volley resolves `TARGET_INVALID` with the cooldown committed.

**GIVEN** the same with a Totem of Undying in the off hand, **THEN** the totem is consumed, the target survives, and the volley continues.

**GIVEN** a live volley after ≥ 1 hit, **WHEN** the BDS is stopped and restarted, **THEN** after load there are no volleys, no interval and no Scythe entities in the world, **AND** the owner's cooldown is still active (`L0-sprj-ad01`).


- **level**: 2

### Webs ac01 concept acceptance criterion (L0-webs-ac01)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-r001"]
---
**AC-webs-01 (channel: bds+build).** GIVEN the exact shaped recipe (4× Cobweb + 1× Diamond Sword, empty corners), WHEN crafted, THEN the result is exactly 1× `andrew:web_sword` with melee damage equal to the server's vanilla Diamond Sword and infinite durability (no durability bar, never breaks after extended use). Source: spec §13 tests 2 & 5.


- **level**: 2

### Webs ac02 concept acceptance criterion (L0-webs-ac02)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-r005"]
---
**AC-webs-02 (channel: bds).** GIVEN a Web Sword, WHEN the player performs a normal melee attack (not the ability), THEN damage matches vanilla Diamond Sword + applied compatible enchantments, no Cobweb is placed, and the cooldown is untouched. Source: spec §13 test 6.


- **level**: 2

### Webs ac03 concept acceptance criterion (L0-webs-ac03)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-p001", "L0-webs-r003"]
---
**AC-webs-03 (channel: bds).** GIVEN a valid target within reach (block or entity) and an unobstructed, fully-loaded 3×3×3 volume, WHEN the ability is used, THEN all 27 cells become Cobweb, centered per `L0-webs-r002`. Source: spec §13 test 7.


- **level**: 2

### Webs ac04 concept acceptance criterion (L0-webs-ac04)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-r002"]
---
**AC-webs-04 (channel: bds).** GIVEN no block or entity within reach (blocks >5, entities >3, or aim into open air), WHEN the ability is used, THEN nothing is created or altered in the world and the cooldown does not start. Source: spec §13 test 8.


- **level**: 2

### Webs ac05 concept acceptance criterion (L0-webs-ac05)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-r004"]
---
**AC-webs-05 (channel: bds).** GIVEN a target whose 3×3×3 volume overlaps a chest and/or bedrock, WHEN the ability is used, THEN the chest/bedrock cells are left completely untouched (no destruction, no data loss) while every other eligible cell in the volume is still filled with Cobweb. Source: spec §13 test 10; decision Q-013.


- **level**: 2

### Webs ac06 concept acceptance criterion (L0-webs-ac06)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-r005"]
---
**AC-webs-06 (channel: bds).** GIVEN a valid target whose entire 3×3×3 volume is protected, entity-occupied, and/or unloaded (zero fillable/already-satisfied cells), WHEN the ability is used, THEN no cooldown starts and the player sees a localized "No room for cobweb" actionbar message in both RU and EN. Source: decision Q-017, closing CTR-008.


- **level**: 2

### Webs ac07 concept acceptance criterion (L0-webs-ac07)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-r004"]
---
**AC-webs-07 (channel: bds).** GIVEN a target near the edge of the loaded/simulated area such that part of the 3×3×3 volume falls outside it, WHEN the ability is used, THEN the component never forces those chunks to load or writes into them — those cells are treated as `skipped-unloaded` (same as a protected cell) and the rest of the volume fills normally. Source: spec §6 ("не пытаться создавать паутину вне загруженной/доступной области") and §12 edge case.


- **level**: 2

### Webs ac08 concept acceptance criterion (L0-webs-ac08)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-p001"]
---
**AC-webs-08 (channel: bds).** GIVEN two clients/SimulatedPlayers observing the same cast, WHEN the ability resolves, THEN both see an identical set of filled cells (server-authoritative geometry, no client-side divergence). Source: spec §9 (server-computed ability) and §13 test 12, scoped here to trap geometry specifically (craft/retention determinism is `L0-lgnd`'s).


- **level**: 2


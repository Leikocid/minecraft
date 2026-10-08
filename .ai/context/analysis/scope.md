---
title: Scope
type: analysis
generated_at: "2026-10-08T20:34:41.368Z"
source_channel: rollout
node_id: rollout-scope
aliases: ["rollout-scope","scope"]
is_a: ["rollout","scope"]
relates_to: ["L0-katn-ac01","L0-katn-ac02","L0-katn-ac03","L0-katn-ac04","L0-katn-ac05","L0-katn-ac06","L0-katn-ac07","L0-katn-ac08","L0-katn-ac09","L0-lgnd-ac01","L0-lgnd-ac02","L0-lgnd-ac03","L0-lgnd-ac04","L0-lgnd-ac05","L0-lgnd-ac06","L0-lgnd-ac07","L0-lgnd-ac08","L0-lgnd-ac09","L0-lgnd-ac10","L0-lgnd-ac11","L0-lgnd-ac12","L0-lgnd-ac13","L0-lgnd-ac14","L0-lgnd-ac15","L0-lgnd-ac16","L0-lgnd-ac17","L0-lgnd-ac18","L0-lgnd-ac19","L0-lgnd-ac20","L0-lgnd-ac21","L0-lgnd-ac22","L0-lgnd-ac23","L0-lgnd-ac24","L0-lgnd-ac25","L0-lgnd-ac26","L0-lgnd-ac27","L0-magn-a04","L0-magn-a05","L0-magn-a06","L0-magn-a07","L0-magn-a08","L0-magn-a09","L0-magn-a10","L0-magn-a11","L0-magn-a12","L0-magn-a13","L0-magn-a14","L0-magn-aipd","L0-magn-atps","L0-sauc-ac01","L0-sauc-ac02","L0-sauc-ac03","L0-sauc-ac04","L0-sauc-ac05","L0-sauc-ac06","L0-sclk-ac01","L0-sclk-ac02","L0-sclk-ac03","L0-sclk-ac04","L0-sclk-ac05","L0-sclk-ac06","L0-sclk-ac07","L0-sclk-ac08","L0-sclk-ac09","L0-sclk-ac10","L0-sclk-ac11","L0-sclk-ac12","L0-sclk-ac13","L0-sclk-ac14","L0-sclk-ac15","L0-sclk-ac16","L0-sclk-ac17","L0-sclk-ac18","L0-sclk-ac19","L0-sclk-ac20","L0-sclk-ac21","L0-sclk-ac22","L0-sclk-ac23","L0-sclk-ac24","L0-sclk-ac25","L0-sclk-ac26","L0-sclk-ac27","L0-strm-acd","L0-strm-aci","L0-strm-acr","L0-strm-act","L0-strm-acv","L0-ufoc-ac01","L0-ufoc-ac02","L0-ufoc-ac03","L0-ufoc-ac04","L0-ufoc-ac05","L0-ufoc-ac06","L0-ufoc-ac07","L0-ufoc-ac08"]
priority: 620
---

# Scope

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## _other

### Katn ac01 concept acceptance criterion (L0-katn-ac01)

---
title: "AC-katn-01 (T01, bds + build): the Katana recipe yields the craft token (gate assertions: L0-lgnd-ac23)"
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-lgnd-p001", "L0-lgnd-ac23", "L0-katn-r001", "L0-xasm22"]
---
The rule is owned by `L0-lgnd-p001`. **The gate, flag, refund, restart, Creative/`/give` and broadcast assertions (T01–T03) are `L0-lgnd-ac23`** (reconciled at reduce v6: this card used to repeat them). `katn` owns only the recipe JSON that feeds the gate:
- **Shape.** GIVEN a Crafter loaded by `/replaceitem` with `. G . / P S P / . G .` (G golden apple, P ender pearl, S diamond sword, any damage or enchantment), WHEN it fires, THEN it outputs exactly one `andrew:dragon_katana_crafted` token and never the item itself.
- **Negative controls.** An iron sword in the centre, an enchanted golden apple for G, or a mirrored or shifted layout produces nothing.
- **Build.** `packs/behavior/recipes/dragon_katana*.json` names only `andrew:dragon_katana_crafted` as output (a node grep test).


- **level**: 2

### Katn ac02 concept acceptance criterion (L0-katn-ac02)

---
title: "AC-katn-02 (T04, T14, T15, bds): melee equals a Diamond Sword, works on cooldown, no wear"
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-katn-r001", "L0-katn-r005"]
---
- **T04.** GIVEN two identical husks (spawnWithoutBehaviors, full health), WHEN one SimulatedPlayer hits one with a vanilla Diamond Sword and the other with the Katana (no crit, same cooldown charge), THEN the health losses measured via `entityHurt` are equal.
- **T14.** GIVEN `andrew:cd_dragon_katana` armed (cooldown > 25 s), WHEN the player attacks a husk, THEN the hit deals the T04 damage and the cooldown value is unchanged.
- **T15.** WHEN the player lands 50 hits and 3 successful activations, THEN the stack has no durability component, and `getComponent("durability")` stays `undefined`, as it was before.


- **level**: 2

### Katn ac03 concept acceptance criterion (L0-katn-ac03)

---
title: "AC-katn-03 (T05, T06, bds): open-range teleport, cooldown, clamp, no-op on cooldown"
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-katn-p001", "L0-katn-r002", "L0-katn-r005", "L0-xasm18"]
---
- **T05.** GIVEN a flat floor and a SimulatedPlayer facing +X, looking at a floor block 19 blocks ahead, WHEN Use runs with the Katana, THEN in the same tick the feet are on top of that block (±0.5) and the yaw is unchanged. `andrew:cd_dragon_katana − Date.now()` lies in 29 500–30 000 ms.
- **Cooldown no-op.** WHEN Use runs again 1 s later, THEN the position is unchanged and the cooldown value is bit-identical.
- **T06.** GIVEN open air ahead and a 60-block runway, WHEN the player looks level and uses, THEN the head displacement is ≤ 20.0 and ≥ 19.0. A play with the yaw at 45° also holds ≤ 20.0.
- **Off hand.** The Katana in the off hand with the main hand empty → the same teleport.


- **level**: 2

### Katn ac04 concept acceptance criterion (L0-katn-ac04)

---
title: "AC-katn-04 (T07–T10, bds): walls, liquids, safe cell, no block edits"
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-katn-r003", "L0-katn-r004", "L0-katn-r002"]
---
- **T07.** GIVEN a 3-thick stone wall 10 blocks ahead (5 wide, 5 high), WHEN the player aims at a point 15 blocks out through it, THEN the feet x is < the wall's near face, within 1.5 of it, and the player is on the near side.
- **T08.** GIVEN a water column and, separately, a lava pool lying across the path with an open floor beyond, WHEN the player aims past them, THEN they land beyond the liquid. The lava case uses a fire-resistance effect so the test is not about the landing.
- **T09.** GIVEN aim at a 2-high gap that is 1 block high, or a ceiling 1 block above the floor hit, WHEN the player uses, THEN the feet and head cells after the teleport are free, `entityHurt` with cause `suffocation` is absent for 40 ticks, and the player is in a different cell than at the start.
- **Refusal.** GIVEN the player boxed in with no fit within the search, WHEN they use, THEN there is no move and the cooldown is unset.
- **T10.** GIVEN the full test area (`getBlocks` volume) snapshotted before the use, THEN every block typeId and permutation is unchanged after it.


- **level**: 2

### Katn ac05 concept acceptance criterion (L0-katn-ac05)

---
title: "AC-katn-05 (T11, T12, bds): one-shot fall protection"
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-katn-p002", "L0-katn-r006", "L0-adr-ktfl"]
---
- **T11.** GIVEN a player teleported to an air point 15 blocks above stone (SimulatedPlayers regenerate, so damage is measured with `entityHurt`), WHEN they land, THEN no `entityHurt` with cause `fall` fires for that landing, and the fall flag map is empty afterwards.
- **T11 at height.** The same from a 20-block cap point over a 30-block drop, with health set to 4. The player survives.
- **T12.** GIVEN the flag consumed, WHEN the same player drops 10 blocks with `/tp` and then lands, THEN `entityHurt` cause `fall` fires with ≥ 6 damage.
- **Expiry.** A flag with no landing in 10 s is cleared.
- **Negative control** (in-test): with the watcher disabled, the T11 landing hurts.


- **level**: 2

### Katn ac06 concept acceptance criterion (L0-katn-ac06)

---
title: "AC-katn-06 (T13, bds): the trail is harmless and bounded"
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-katn-r007"]
---
GIVEN a husk and a second SimulatedPlayer standing on the A→B line, WHEN the Katana teleport passes over them:
- no `entityHurt` fires for either;
- their velocity stays ≤ 0.01 apart from gravity;
- the entity count in the area does not grow;
- the T10 block snapshot is unchanged.

A wrapped `spawnParticle` counter records between 1 and 130 calls, all within ≤ 10 ticks of the use, and none on a refused or cooldown press. (Visual reading is in `L0-katn-ac09`.)


- **level**: 2

### Katn ac07 concept acceptance criterion (L0-katn-ac07)

---
title: "AC-katn-07 (T16–T18, bds): Katana instances of the framework's protection tests"
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-lgnd-ac24", "L0-lgnd-p002", "L0-lgnd-p003", "L0-lgnd-p008", "L0-xcx21", "L0-xasm22", "L0-adr-ktgr"]
---
These are framework rules. **The test text is `L0-lgnd-ac24`** (reconciled at reduce v6: this card used to restate it, and had drifted on two points). `katn` owns none of the assertions; it contributes only:
- the Katana def and item JSON that `L0-lgnd-ac24` runs against (`L0-katn-ent1`);
- the one Katana-specific case in that criterion, **death after a teleport** (into lava, or below the one-shot flag's cover), which `L0-lgnd-ac24` T16 already names.

**Reconciled points:**
- T16: retention keeps the **same id and gen**. `retention.ts` restore does not bump the gen (as read during reduce at v6). The earlier `gen + 1` here was wrong.
- T18: the return target is **`mark.owner`** until `L0-xcx11` closes. "Last owner" in Katana §3 is the open `L0-adr-hold` question, not a passing test today.
- T17: under C-16 (`L0-xcx21`, settled by `L0-adr-ktgr`).

Do not create a separate task criterion from this card. It would duplicate `L0-lgnd-ac24`.


- **level**: 2

### Katn ac08 concept acceptance criterion (L0-katn-ac08)

---
title: "AC-katn-08 (probe, bds): engine facts confirmed before the build"
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-adr-ktob", "L0-adr-ktfl", "L0-katn-ad01", "L0-katn-p002"]
---
A probe GameTest on BDS 1.26.51 (checks instance, port 19136) records:
1. A SimulatedPlayer falling from 25 blocks and self-teleported 2 blocks above the floor takes no fall damage. The control without the self-teleport does take it.
2. `getBlockFromRay` with `{includePassableBlocks:false, includeLiquidBlocks:false}`:
   - passes water, lava, grass, flowers, cobweb, carpet;
   - stops at stone, a bottom slab, a fence and a glass pane.
3. The same ray through a cell column hits a bottom slab and a top slab when cast vertically (`L0-katn-ad01`).
4. The same ray reaching into an unloaded chunk: hit, no hit, or throw.
5. `spawnParticle("minecraft:cherry_leaves_particle")` does not throw.

Each fact goes to the memory and to the ADR status. A failed fact supersedes the relevant ADR before the build tasks start.


- **level**: 2

### Katn ac09 concept acceptance criterion (L0-katn-ac09)

---
title: "AC-katn-09 (ipad, manual): what only the operator can see"
is_a: ["acceptance-criterion"]
part_of: ["L0-katn"]
relates_to: ["L0-katn-r007", "L0-katn-r008", "L0-katn-ent1", "L0-katn-as02", "L0-xasm21"]
---
On the iPad, on the production server, the operator confirms:
1. **Icon.** The Katana icon reads as a katana in the hotbar and in the inventory.
2. **Creative.** It is found under Equipment → swords and by searching "Katana" / "Катана".
3. **HUD.** Holding it shows "Dragon Katana — Ready", or "Катана дракона — Готово" in Russian. After a use, the HUD counts down whole seconds from 30.
4. **Trail.** A pink petal trail runs visibly from A to B and fades within about 1.5 s. A second player nearby sees it too.
5. **Aim.** Tapping on air and tapping on a block both teleport toward the screen centre (view direction), and this feels right (`L0-katn-as02`).
6. **Escape.** The answer on a Web Sword trap and UFO magnet escape (`L0-xasm21`) is recorded.

The orchestrator must not auto-verify this criterion.


- **level**: 2

### Lgnd ac01 concept acceptance criterion (L0-lgnd-ac01)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r006", "L0-lgnd-cx07", "L0-adr-wpn2", "L0-lgnd-ad08"]
---
**AC-lgnd-01: An upgrade keeps the craft flags, the pending token and the marks.** Channel: `bds`.

The cooldown clause was dropped by the `wpn2` ruling on `cx07`.

GIVEN a world saved by the pre-v3 build where:
- the Web Sword and the Scythe were Survival-crafted;
- player Q has a single-object `ws_pending`;
- a marked sword and a marked Scythe carry no `_gen` and no `_holder`

WHEN the server restarts on the v3 build
THEN crafting either weapon in Survival (a token arrives) is refunded with its `craft_blocked` message and no broadcast,
AND Q receives exactly one sword on the next spawn,
AND both pre-v3 stacks cast, are retained on death and return to their `owner` after a Void loss (no holder recorded yet),
AND once the pre-v3 sword enters a player's inventory, it carries `_holder` = that player,
AND the Orbital Cannon flag is unset.


- **level**: 2

### Lgnd ac02 concept acceptance criterion (L0-lgnd-ac02)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r002", "L0-lgnd-r014", "L0-lgnd-ac17"]
---
**AC-lgnd-02: Craft budgets are independent per weapon.** Channel: `bds`.

GIVEN the Web Sword flag is claimed and the Scythe and Cannon flags are unset
WHEN a Survival player crafts the Scythe
THEN the craft succeeds, and exactly one broadcast names the crafter and the Scythe,
AND the Scythe flag is set,
AND a second Survival Scythe craft (by any player, also after a restart) is refunded with 2 golden apples, 2 obsidian and 1 diamond hoe,
AND `/andrew:scythe reset` leaves the Web Sword flag set. The as-built command is per weapon; there is no `/andrew:legendary` (`ad07`).
AND the Cannon flag stays unset throughout.


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
relates_to: ["L0-lgnd-r007", "L0-lgnd-p005", "L0-lgnd-ad07", "L0-lgnd-cx08"]
---
**AC-lgnd-06: Two-hand Action Bar, three weapons.** Channel: `build` (stubbed HUD test) + `ipad` (visual; needs `allow_off_hand`, `cx08`).

GIVEN P holds a ready Orbital Cannon in the main hand and a Web Sword with 12 s left in the off hand
WHEN the HUD renders
THEN P's bar shows "Orbital Cannon — Ready" and then "Web Sword — 12s", in P's client language, using `andrew.legendary.ready` / `andrew.legendary.cooldown`,
AND "Ready" stays on while the item is held (continuous, decision-legendary-ready-hud),
AND a player holding no legendary receives no `setActionBar` call.

This replaces the v1 clause "Web Sword-only rawtext equals 0.3.0", which the continuous-Ready decision retired.


- **level**: 2

### Lgnd ac07 concept acceptance criterion (L0-lgnd-ac07)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r008", "L0-lgnd-cx10", "L0-adr-wpn2"]
---
**AC-lgnd-07: Death returns one marked copy of each weapon, including the off-hand one, exactly once.** Channel: `bds` + `ipad` (off hand).

This is narrowed by the `wpn2` ruling on `cx10` (b).

GIVEN P carries a marked Web Sword in the **off hand**, a marked Scythe in the hotbar and a marked Orbital Cannon in the inventory
WHEN P dies (also in the Void), respawns, disconnects and reconnects, and the server restarts
THEN P holds exactly those three instances (same ids, same `gen`),
AND no item entity of any of them is left at the death spot,
AND no fourth copy exists.

A second marked copy of the same weapon is outside this AC (a known limit).


- **level**: 2

### Lgnd ac08 concept acceptance criterion (L0-lgnd-ac08)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p003", "L0-lgnd-r011", "L0-lgnd-ad11", "L0-lgnd-ent4"]
---
**AC-lgnd-08: Void return to the last holder, exactly once.** Channel: `bds`.

GIVEN P last held a marked Orbital Cannon (gen g) and drops it into the Void
WHEN the item entity falls below the dimension's minimum height
THEN P receives it with the same id, gen g + 1 and `holder` = P, plus a private `andrew.legendary.recovered` message,
AND the Cannon craft flag is unchanged.

If P is offline:
- the entry sits in `andrew:oc_owed[P]`;
- it survives a restart;
- it is redeemed exactly once on P's next join.

Two different instances owed to P while P is offline are **both** redeemed (list, not map).

The same holds for the Web Sword and the Scythe.


- **level**: 2

### Lgnd ac09 concept acceptance criterion (L0-lgnd-ac09)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p003", "L0-lgnd-r012", "L0-lgnd-as11"]
---
**AC-lgnd-09: Vanilla item-entity destruction returns the instance; a pickup does not.** Channel: `bds`.

GIVEN a marked legendary item entity (any of the three) last held by P
WHEN it is destroyed by cactus or a **vanilla** TNT explosion, or despawns (in lava or fire it stays where it lies, same gen, nothing owed)
THEN P receives it back per `ac08`,
AND an ordinary pickup of the entity by any player triggers **no** return and no gen bump, and that player becomes `holder`,
AND an unmarked (Creative or vanilla `/give`) copy is destroyed as in vanilla (`as11`).

Destruction by the Orbital Cannon is not covered here, because the item must not be destroyed at all (`ac19`).


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
relates_to: ["L0-lgnd-ad07", "L0-lgnd-ad08", "L0-adr-lgnd"]
---
**AC-lgnd-11: Regression gate for the v3 framework change.** Channel: `build` + `bds`.

GIVEN the v3 build
WHEN `npm test`, `bds:check` and `bds:gametest` run
THEN every existing test passes **without edits to its assertions**:
- `tests/web-sword-*.test.mjs`;
- the `andrew:websword_*` and Scythe GameTests;
- the pickaxe and autosmelt suites.

Harness changes are allowed (`L0-adr-lgnd`, cx04 reading), for example a simulated craft now inserting the craft token.

AND `grep -rnE "andrew:(ws|sc|oc)_|andrew:(cd|busy)_|andrew:hidden_until" src/` matches only files in `src/legendary/`,
AND `/andrew:websword`, `/andrew:scythe` and `/andrew:orbital` `give|reset` all work,
AND a node test asserts that `itemId`, `keyPrefix`, `abilityKey`, `command` and `craftTokenId` are unique across `LEGENDARIES`.


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
relates_to: ["L0-lgnd-r009", "L0-lgnd-ad07", "L0-scyt"]
---
**AC-lgnd-13: Busy blocks re-use, expires by deadline, and hands off to cooldown without a gap.** Channel: `build` (unit) + `bds`.

This is rewritten to the as-built durable busy deadline (`ad07` §2).

GIVEN `setBusy(P, "scythe_of_calamity", ms)`
THEN `isReady` is false, and a Use press with the Scythe in the main hand does not call its ability. The HUD keeps showing the Scythe line; there is no `active` segment.

WHEN `clearBusy` and `startCooldown` are called in the same turn
THEN no tick observes `isReady == true`.

WHEN `clearBusy` is called alone
THEN the ability is ready at once.

AND after a server restart with busy set, the ability becomes ready no later than the stored deadline.

AND the Orbital Cannon never sets busy.


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

### Lgnd ac15 concept acceptance criterion (L0-lgnd-ac15)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r014", "L0-lgnd-ad08", "L0-xcx9", "L0-lgnd-as13"]
---
**AC-lgnd-15: `/give` and Creative copies never touch the craft flag (Orbital AC-2, all three weapons).** Channel: `bds` + `ipad` (crafting preview).

GIVEN a fresh world with every flag unset and Survival player S
WHEN the console runs `/give S andrew:orbital_cannon`, `/give S andrew:web_sword` and `/give S andrew:scythe_of_calamity`,
AND Creative player C takes a Cannon from the Creative inventory and drops it to S
THEN S holds four **unmarked** stacks, and no flag is set, no broadcast is sent and nothing is refunded,
AND S's first Survival Cannon craft afterwards claims the flag, sends exactly one broadcast and yields a stack marked `origin: craft` with `holder` = S,
AND a Cannon crafted by C in Creative is unmarked, and the flag stays as it was.

On the iPad, the crafting-table preview shows the Orbital Cannon icon and name. The token id is never visible in the inventory after the next tick.


- **level**: 2

### Lgnd ac16 concept acceptance criterion (L0-lgnd-ac16)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r015", "L0-lgnd-ad09", "L0-lgnd-p009", "L0-lgnd-as14"]
---
**AC-lgnd-16: Attack and Use resolve through one function and share one cooldown.** Channel: `build` (unit, stubbed hands and clock) + `bds`.

GIVEN P with a ready Cannon in the main hand
THEN `resolveActivation(P, "attack")` and `resolveActivation(P, "use")` both return the Cannon.

WHEN one mode activates (charges spawn)
THEN in the same tick both modes return `undefined` for 30 000 ms (± 50 ms),
AND a second Cannon copy in P's hotbar is also blocked,
AND another player R's Cannon stays ready.

GIVEN P holds a Web Sword in the main hand and a ready Cannon in the off hand
THEN `resolveActivation(P, "attack")` is `undefined`,
AND `resolveActivation(P, "use")` returns the Cannon only while the Web Sword is cooling.

GIVEN no block within 10
WHEN P presses either mode
THEN no cooldown is written and no message or sound is played.

The existing Web Sword and Scythe callers (no `mode` argument) behave as before.


- **level**: 2

### Lgnd ac17 concept acceptance criterion (L0-lgnd-ac17)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ent1", "L0-lgnd-p001", "L0-lgnd-r002", "L0-adr-orbc"]
---
**AC-lgnd-17: The Orbital Cannon is a registered legendary with its own craft budget and refund (Orbital AC-1).** Channel: `build` + `bds`.

GIVEN `LEGENDARIES` contains `ORBITAL_CANNON` (`oc`, `orbital_cannon`, 600 ticks, `andrew:orbital`)
WHEN Survival player A crafts the Cannon
THEN one localized broadcast names A and "Orbital Cannon", and `andrew:oc_crafted` is set,
AND after a server restart, player B's Survival craft is refunded with exactly 4 TNT + 1 Fishing Rod, sends `andrew.orbital.craft_blocked`, and removes the result,
AND the Web Sword and Scythe flags are unchanged,
AND `/andrew:orbital reset` clears only `oc_crafted`,
AND `/andrew:orbital give B` yields an `origin: admin` stack without touching the flag.


- **level**: 2

### Lgnd ac18 concept acceptance criterion (L0-lgnd-ac18)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad11", "L0-lgnd-ent2", "L0-adr-hold", "L0-xcx11"]
---
**AC-lgnd-18: A transferred legendary returns to the last holder, not to the crafter.** Channel: `bds`.

GIVEN A crafted the Scythe and hands it to B (drop and pickup, or through a chest)
THEN the stack's `holder` is B, and `owner` is still A.

WHEN B drops it into the Void or lava
THEN B receives it (`gen + 1`), and A receives nothing and no message.

WHEN B is offline at that moment
THEN `andrew:sc_owed[B]` holds it, and B gets it on the next join.

GIVEN the Scythe sits in a chest that A placed it in, and A dies
THEN nothing happens to it.

WHEN it passes through a hopper into another chest
THEN `holder` stays A: a container never becomes the holder.

`L0-adr-hold` was accepted by `decision-resolve-l0-xcx11` (2026-09-29); this AC is unbuilt work, filed as `LGND-HOLD` (`L0-adr-hldb`).


- **level**: 2

### Lgnd ac19 concept acceptance criterion (L0-lgnd-ac19)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p008", "L0-lgnd-r012", "L0-lgnd-r013", "L0-pntr", "L0-ring"]
---
**AC-lgnd-19: The Orbital Cannon never destroys a legendary.** Channel: `bds` (GameTest `orbital:protect_*`).

GIVEN a chest holding a marked Scythe inside the LMB column,
AND a marked Web Sword item entity on the ground inside an RMB blast AABB,
AND a stone block holding nothing, for control
WHEN the Cannon fires LMB, and separately RMB
THEN the chest is gone and its ordinary contents are gone,
AND the Scythe exists as an item entity outside the column footprint, on solid ground, with the same id and gen and no `returned` message,
AND the Web Sword survives the RMB, moved outside the AABB, with the same id and gen,
AND RMB drop suppression removed no legendary,
AND neither owed list changed.

Negative check: a test effect that removes the chest **without** calling `protectLegendariesIn` makes this test fail. That proves the check sees the difference.

In the End, with no support within 16 blocks: the item goes to its holder, the gen is unchanged, and the log line says `handedBack=1`.


- **level**: 2

### Lgnd ac20 concept acceptance criterion (L0-lgnd-ac20)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r013", "L0-lgnd-r012", "L0-lgnd-cx12"]
---
**AC-lgnd-20: A vanilla container destruction spills the legendary and never loses it.** Channel: `bds`.

GIVEN a barrel holding a marked Orbital Cannon last held by P
WHEN a Survival player breaks the barrel
THEN the Cannon lies on the ground as an item entity and is watched.

WHEN instead primed vanilla TNT destroys the barrel
THEN the Cannon ends up either on the ground or back with P (`gen + 1`, `returned` message), and **never** both or neither,
AND a count over the world (every player inventory plus item entities near the spot) finds exactly one live Cannon.

A Cannon inside a **shulker-box item** is outside this AC (`cx12`).


- **level**: 2

### Lgnd ac21 concept acceptance criterion (L0-lgnd-ac21)

**AC-lgnd-21 (v7): Legendary weapons are pulled, tokens are not, and no instance is lost or duplicated (operator tuning 1.6.0).** Channel: `build` (node unit test) + `bds` (GameTest `ufo_magnet_legendaries` and `ufo_magnet_hold*`).

Related: L0-lgnd-r016, L0-magn, L0-lgnd-ac22.

**Predicate.** `isMagneticStack` is true for every def's `itemId` (all five once def #5 lands), marked, unmarked or stale. It is false for every `_crafted` token, for `undefined` and for an empty slot.

GIVEN a magnet zone with iron candidates and:
- a marked Scythe on the ground;
- a hopper **block** holding only a marked Orbital Cannon;
- a craft token item entity on the ground;
- a Survival player holding a marked Katana and no iron
WHEN the magnet runs and releases
THEN the Scythe was selected as a ground candidate,
AND the hopper block is still in place, holding the Cannon (a non-empty hopper is a container),
AND the token was never selected,
AND the player was lifted,
AND after release the world holds exactly one live copy of each marked instance, every gen is unchanged, and no owed list changed.

Negative control: `isLegendaryWeapon` stubbed to `false` makes the "Scythe selected" and "player lifted" clauses fail.

The pre-1.6.0 "never within 6 blocks of the hover column" clause is retired.


- **level**: 2

### Lgnd ac22 concept acceptance criterion (L0-lgnd-ac22)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p002", "L0-lgnd-r008", "L0-lgnd-ac07", "L0-lgnd-r016", "L0-magn", "L0-lgnd-as16"]
---
**AC-lgnd-22: Dying from a magnet fall keeps every held legendary.** Channel: `bds` (GameTest).

UFO §6 makes a fall from the hover height lethal (U2: 33 damage from 37 blocks). Retention is cause-agnostic: `entityDie` path B (`retention.ts:74-152`) does not read the damage source. This AC pins that down for the magnet.

GIVEN Survival player P holds an iron ingot in the main hand, a marked Web Sword in the off hand, and a marked Scythe and a marked Orbital Cannon in the hotbar
WHEN the magnet lifts P to the hold point, the magnet releases, and P dies from the fall
THEN on respawn P holds exactly those three instances (same ids, same gen; the Web Sword is in the inventory or off hand),
AND no item entity of any of them exists at the landing spot, or in the saucer's cloud after the death,
AND the iron ingot dropped as a vanilla death drop,
AND no owed entry and no `returned` message was produced.

Variant: the same after `/andrew:ufo stop` mid-hold, and after a server restart between death and respawn.


- **level**: 2

### Lgnd ac23 concept acceptance criterion (L0-lgnd-ac23)

**AC-lgnd-23: The Dragon Katana is def #4, with its own craft budget (Katana T01–T03, framework side).** Channel: `build` + `bds`. Shipped in 1.5.0 (`KATA-LGND-01-AA`).

Related: L0-lgnd-ad14, L0-lgnd-ac02, L0-lgnd-ac15, L0-lgnd-ac17, L0-lgnd-ac21, L0-katn.

**Build.**
- `tests/legendary-registry.test.mjs` asserts `keysFor(DRAGON_KATANA).crafted === "andrew:dk_crafted"` and the other `dk_*` keys.
- The uniqueness test covers `itemId`, `keyPrefix`, `abilityKey`, `command`, `craftTokenId` and `textPrefix` over all defs.
- `isLegendaryStack` is true for `andrew:dragon_katana` and `andrew:dragon_katana_crafted`, and false for `minecraft:diamond_sword`.

**BDS.** GIVEN the Web Sword, Scythe and Cannon flags are set and `andrew:dk_crafted` is unset
WHEN Survival player A crafts the Katana
THEN exactly one broadcast names A and the localized "Dragon Katana", A holds a marked `andrew:dragon_katana` with origin `craft`, and `dk_crafted` is set.
AND after a restart, B's Survival craft is refunded with exactly 2 golden apples, 2 ender pearls and 1 diamond sword, with `andrew.katana.craft_blocked` and no broadcast.
AND `/give` and Creative copies leave the flag unchanged; `/andrew:katana reset` clears only `dk_crafted`; the other flags never change.
AND (v7, replaces the "never pulled" clause) the Katana is magnetic like the other weapons with no edit to `magn` (`ac21`).


- **level**: 2

### Lgnd ac24 concept acceptance criterion (L0-lgnd-ac24)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r017", "L0-lgnd-ac07", "L0-lgnd-ac08", "L0-lgnd-ac09", "L0-lgnd-ac19", "L0-xcx21", "L0-xasm22", "L0-xcx11", "L0-katn"]
see_also: ["dragonkatanaspecv1ruen-part-3"]
---
**AC-lgnd-24: Katana T16–T18 under C-16, and a teleport trips no recovery.** Channel: `bds` (GameTests `legendary_katana_*`, run with the shipped scenarios parameterised by def).

- **T16.** P has a marked Katana in the hotbar and dies (also in lava, after a teleport). THEN on respawn P holds the same id and gen, and no item entity remains.
- **T17, prevent.** A marked Katana item entity:
  - in fire, or in lava, is still there after 10 s, with the same id and gen;
  - in a chest in an Orbital LMB column, and on the ground in an RMB blast and ring AABB, ends up outside the volume with the same id and gen, and no `andrew.legendary.recovered` message, nothing in `dk_owed`.
- **T17, return (C-16, `L0-xcx21`).** A marked Katana entity on cactus, or hit by primed vanilla TNT: afterwards exactly one live Katana exists, either in the owner's inventory (at their feet if it is full, `retention.ts:270-275`) with `gen + 1` and `andrew.legendary.recovered`, or in `dk_owed` if the owner is offline.
- **T18.** A Katana dropped into the Void, or inside a chest minecart that falls into the Void, returns to **`mark.owner`** exactly once. The clause "to the last holder" waits for `L0-xcx11`.
- **Teleport (`r017`).** GIVEN a marked Katana on the ground near P, and P holding a second def's marked stack
  WHEN P activates the Katana 20 blocks away 3 times, then walks until the ground item's chunk unloads and returns
  THEN no `legendary recovery: … now gen` line appears, both gens are unchanged, `dk_owed` is empty and the ground Katana is watched again.
- **Same dimension.** A Katana teleport whose ray reaches the edge of a loaded area stops before the unloaded cell, and the player's `dimension.id` before and after is equal.


- **level**: 2

### Lgnd ac25 concept acceptance criterion (L0-lgnd-ac25)

**AC-lgnd-25: The Sculk Crossbow is def #5 with its own craft budget (Crossbow T01–T03, framework side).** Channel: `build` + `bds`.

Related: L0-lgnd-ad16, L0-lgnd-as18, L0-lgnd-cx15, L0-lgnd-ac23, L0-sclk.

**Build.**
- `keysFor(SCULK_CROSSBOW).crafted === "andrew:sk_crafted"`, and the other `sk_*` keys.
- The uniqueness test covers `itemId`, `keyPrefix`, `craftTokenId`, `textPrefix`, `command` over all five defs, and `abilityKey` over the four active ones. It fails if def #5 uses `sc`.
- `isLegendaryStack` is true for `andrew:sculk_crossbow` and its token; `isLegendaryWeaponStack` is true for the crossbow only; both are false for `minecraft:crossbow`.

**BDS.** GIVEN the other four flags are set and `andrew:sk_crafted` is unset
WHEN Survival player A crafts the crossbow (the token reaches the inventory)
THEN exactly one broadcast names A and the localized "Sculk Crossbow",
AND A holds a marked `andrew:sculk_crossbow` with origin `craft`, and `sk_crafted` is set,
AND no `andrew:sc_*` key changed.
AND after a restart, B's Survival craft is refunded with exactly 2 echo shards, 2 deepslate and 1 crossbow, with `andrew.crossbow.craft_blocked` and no broadcast (T02).
AND `/give B andrew:sculk_crossbow` and a Creative copy leave the flag unchanged (T03).
AND `/andrew:crossbow reset` clears only `sk_crafted`.


- **level**: 2

### Lgnd ac26 concept acceptance criterion (L0-lgnd-ac26)

**AC-lgnd-26: A passive def has no timer, no Use claim and no HUD line; defs #1–#4 are unchanged.** Channel: `build` (node unit tests, stubbed hands) + `bds`.

Related: L0-lgnd-ad15, L0-lgnd-r018, L0-xcx24.

**Build.**
- `hasAbility` is true for the four shipped defs and false for `SCULK_CROSSBOW`. `defForAbility` never returns a passive def.
- `cooldownKey`/`busyKey` for the four shipped abilities are byte-identical to 1.6.1.

**BDS.** GIVEN P holds the crossbow in the main hand and a ready Katana in the off hand
WHEN P presses Use
THEN `resolveActivation(P)` returns the Katana (off hand),
AND P's Action Bar shows only the Katana line.

GIVEN P holds only the crossbow, in either hand, for 5 s
THEN the HUD makes no `setActionBar` call for P,
AND P has no `andrew:cd_*` or `andrew:busy_*` property that was not there before.

**Regression gate.** `npm test` and the legendary, Web Sword, Scythe, Orbital and Katana GameTests pass **without assertion edits**.


- **level**: 2

### Lgnd ac27 concept acceptance criterion (L0-lgnd-ac27)

**AC-lgnd-27: Crossbow T19, T20 and Void return under C-16, against `returnTarget(mark)`.** Channel: `bds` (the shipped legendary scenarios parameterised by def).

Related: L0-lgnd-ad16, L0-lgnd-ad17, L0-lgnd-cx16, L0-lgnd-ac24, L0-xcx21, L0-xcx25.

`returnTarget(mark)` is `mark.owner` until `LGND-HOLD` ships, then `holder ?? owner` (`ad17`).

- **T19.** P has a marked crossbow in the hotbar or off hand and dies (also by a magnet fall). On respawn P holds the same id and gen; no item entity remains.
- **T20, prevent.** A marked crossbow item entity in fire or lava is still there after 10 s, same id and gen. In a chest in an Orbital LMB column, in an RMB/ring AABB, **or inside a crossbow crater** (`sclk` calls `protectLegendariesIn` first), it ends outside the volume with the same id and gen, no message, nothing in `sk_owed`.
- **T20, return.** On cactus or hit by primed vanilla TNT: exactly one live crossbow exists, with `returnTarget(mark)` (gen + 1, `andrew.legendary.recovered`) or in `sk_owed` if that player is offline.
- **Void.** Dropped into the Void, or inside a chest minecart or held by an armour stand that falls in: it returns to `returnTarget(mark)` exactly once; offline → `sk_owed`, redeemed once on the next join, also after a restart.
- **Known deviation until `LGND-HOLD`:** A crafts, gives to B, B loses it in the Void → A receives it.
- No crossbow-specific line in `src/legendary/` is needed for any clause above.


- **level**: 2

### Magn a04 concept acceptance criterion (L0-magn-a04)

**UFO AC-4 (bds).**
- **GIVEN** two Survival players in the zone, A with `iron_ingot` in the main hand and B with `shears` in the off hand (`allow_off_hand` via `/replaceitem`),
- **WHEN** the magnet turns on,
- **THEN**:
  - both rise at ≤ 0.6 blocks per tick (per-tick displacement measured);
  - within (hover depth / 0.6 + 20) ticks, both are within 0.5 blocks of saucer − (0, 6, 0);
  - both stay within 0.5 blocks of it until release.
- An Adventure player behaves the same (`L0-xasm14`).

The iPad check that the lift looks smooth is in `L0-magn-aipd`.


- **level**: 2

### Magn a05 concept acceptance criterion (L0-magn-a05)

**UFO AC-5 (bds).**
- **GIVEN** the following players in the zone during the magnet:
  - C, in Survival, with a stack of iron_ingot in inventory and empty hands;
  - D, in Survival, wearing a full iron armour set with a dirt block in hand;
  - E, in Creative, holding an iron_sword;
  - F, in Spectator, holding an iron_sword;
- **WHEN** 60 ticks pass,
- **THEN** no player's y rises by more than 0.1 blocks, and no player is moved toward the saucer.


- **level**: 2

### Magn a06 concept acceptance criterion (L0-magn-a06)

**UFO AC-6 (bds).**
- **GIVEN** player A held 6 blocks below the saucer with an iron_ingot in the main hand,
- **WHEN** A runs `dropSelectedItem()`,
- **THEN**:
  - from the next tick A's y decreases monotonically until landing;
  - the dropped ingot entity becomes an `X` element and reaches a ring slot, beyond 10 already-selected elements (the element count becomes 11).

**Second case.**
- **GIVEN** a player B held the same way,
- **WHEN** B's selected slot is switched to a non-iron slot,
- **THEN** B falls, and is pulled again after switching back during the magnet.

**Negative control.** An ingot dropped by a ground player more than 12 blocks from the hover point is not pulled.


- **level**: 2

### Magn a07 concept acceptance criterion (L0-magn-a07)

**UFO AC-7 (bds).**

**Case 1.**
- **GIVEN** a Survival player held at the hover target (≥ 34 blocks above the ground) for the full 60 s,
- **WHEN** the magnet goes off,
- **THEN** the player takes vanilla fall damage and dies (with 20 HP and no armour).

**Case 2.**
- **GIVEN** a player held by the same knockback mechanism for 60 s at a target only 2 blocks above the ground (a test hook lowers the target),
- **WHEN** the magnet goes off,
- **THEN** no damage is taken (`entityHurt` with cause fall is never seen). This proves that knockback holding does not accumulate fall distance.

The iPad check that the fall is visible is in `L0-magn-aipd`.


- **level**: 2

### Magn a08 concept acceptance criterion (L0-magn-a08)

**UFO AC-8 (bds).**
- **GIVEN** a zone seeded with:
  - 3 iron ground items;
  - a chest with 4 iron stacks;
  - 2 iron golems and 1 minecart;
  - 3 iron blocks;
  - 2 iron ore;
- **WHEN** the magnet turns on,
- **THEN** exactly 10 elements are held: 3 ground items, then 4 stacks, then the 3 entities nearest first. No blocks are pulled and the ore is untouched.

**Second scenario.** With 1 ground item and 12 iron blocks at distinct distances, the item and the 9 nearest blocks are pulled, and the 3 farthest remain.

Players held at the same time do not reduce the count.


- **level**: 2

### Magn a09 concept acceptance criterion (L0-magn-a09)

**UFO AC-9 (bds).**
- **GIVEN** these containers, each holding 1 iron stack in slot 0 and 3 dirt in its last slot:
  - chest, double chest (iron in its second half), trapped chest, barrel, hopper;
  - furnace, blast furnace, smoker;
  - dispenser, dropper, brewing stand;
  - undyed shulker box;

  Across several runs at ≤ 10 per event, every type is covered.
- **WHEN** the magnet turns on,
- **THEN**:
  - each iron stack becomes an item element with the same id and amount;
  - the slot is empty;
  - the dirt is unchanged;
  - every container block, the hopper included, is still in place;
  - the double chest yields its stack exactly once;
  - a crafter holding iron is untouched.


- **level**: 2

### Magn a10 concept acceptance criterion (L0-magn-a10)

**UFO AC-10 (bds).**
- **GIVEN** isolated iron_block, iron_bars, rail, anvil, cauldron, chain and lantern, an iron door (2 high), and one iron_ore, with nothing else in the zone,
- **WHEN** the magnet turns on,
- **THEN**:
  - every source position (both door cells included) is air;
  - exactly one new item entity exists per source: the block's item, one `iron_door`, and one `raw_iron` for the ore;
  - the total count of new item entities in the zone equals the number of sources (9);
  - this holds again 10 ticks later.


- **level**: 2

### Magn a11 concept acceptance criterion (L0-magn-a11)

**UFO AC-11 (bds).**
- **GIVEN** iron_ore 20 blocks below the centre, enclosed in stone, and no other iron in the zone,
- **WHEN** the magnet turns on,
- **THEN**:
  - the ore cell becomes air;
  - one raw_iron entity is spawned there;
  - within 80 ticks it is within 1 block of its ring slot (saucer − 3, r 5);
  - the stone between them is unchanged (no other cell becomes air).


- **level**: 2

### Magn a12 concept acceptance criterion (L0-magn-a12)

**UFO AC-12 (bds).**
- **GIVEN** the following in the zone, with no other iron:
  - an iron golem;
  - an empty minecart;
  - a zombie wearing an iron_helmet (`/replaceitem`);
  - an armour stand wearing iron_leggings;
  - a bare zombie;
  - a zombie holding only an iron_sword;
- **WHEN** the magnet turns on,
- **THEN**:
  - the golem, the minecart, the helmeted zombie and the armour stand reach ring slots;
  - the bare zombie and the sword zombie are never moved toward the saucer;
  - after release, no entity still carries the tag `andrew:ufo_iron`.


- **level**: 2

### Magn a13 concept acceptance criterion (L0-magn-a13)

**UFO AC-13, call-site half (bds; the rule half is in `lgnd`).**
- **GIVEN** each of the three legendaries placed in the zone:
  - on the ground;
  - in a chest together with an iron stack;
  - in a chest minecart;
  - held by an armour stand wearing iron armour;
  - in the off hand of a player whose main hand is empty;
- **WHEN** the magnet runs its full 60 s,
- **THEN**:
  - no legendary entity or stack moves or changes container;
  - the chest's iron stack is extracted;
  - the chest minecart and the armour stand are not pulled (`L0-magn-aslh`);
  - the player is not pulled;
  - legendary ledger counts are unchanged.


- **level**: 2

### Magn a14 concept acceptance criterion (L0-magn-a14)

**UFO AC-14 (bds).**
- **GIVEN** 10 held elements (items, a golem, a minecart, a zombie) and a held player,
- **WHEN** the magnet goes off,
- **THEN**:
  - in the release tick, every element's velocity is ≈ 0;
  - from the next tick, every y decreases with no script teleport (no `teleport` calls are logged after release);
  - every element lands on the ground below its last slot;
  - the items can be picked up;
  - the zombie takes fall damage and the golem takes none.
- Release from a shoot-down and from `/andrew:ufo stop` behaves identically. Both go through the `requestMagnetOff` latch (`L0-adr-ufpc`), so the release runs at the start of the next UFO interval tick, at most one hold step after the request.

The iPad check that the cloud and the fall are visible is in `L0-magn-aipd`.


- **level**: 2

### Magn aipd concept acceptance criterion (L0-magn-aipd)

**UFO DoD, iPad eye check for the magnet (ipad, manual).** This is the iPad half of AC-4, AC-7 and AC-14, lifted out of those GameTest criteria (`L0-xcx19`). It is written like `L0-sauc-ac06`.

- **GIVEN** the production world on the iPad, with a second player (or a held sim player on QA) and some iron in the zone: ground items, a chest stack and a golem,
- **WHEN** a person triggers `/andrew:ufo come` and watches the whole magnet phase and the release,
- **THEN** that person confirms on the iPad, with screenshots or a short recording attached to the task:
  1. **Lift (AC-4).** A player holding iron rises smoothly under the saucer, with no visible stutter or rubber-banding while held.
  2. **Cloud (AC-14).** The pulled iron is visible as a cloud circling under the saucer for the whole hold, and items visibly fly in from the ground, including any that rise through stone.
  3. **Fall (AC-7, AC-14).** On release the player and every element visibly fall at once.

**Closing rule.**
- No GameTest can close this criterion. A passing `bds` run of `a04`, `a07` or `a14` is not evidence for it.
- It is reopened after every epic merge that touches `src/ufo/`.


- **level**: 2

### Magn atps concept acceptance criterion (L0-magn-atps)

**UFO DoD, "the event does not drop TPS" (bds).**
- **GIVEN** a zone with ≥ 200 chests, a full scan type list, 2 players and 10 + 2 elements,
- **WHEN** a full magnet phase runs,
- **THEN**:
  - the magnet-on tick cost (scan + selection + extraction) is logged and is ≤ 12 ms;
  - the mean per-tick hold step is ≤ 2 ms and p99 ≤ 5 ms;
  - all three numbers are written to the task's run-check artifact.


- **level**: 2

### AC-sauc-1 (bds · UFO AC-2, path half) · The saucer comes in from 90 blocks, hovers at the centre + 40, and leaves 90 blocks the opposite way (L0-sauc-ac01)

# AC-sauc-1 (bds · UFO AC-2, path half) · The saucer comes in from 90 blocks, hovers at the centre + 40, and leaves 90 blocks the opposite way

**GIVEN**
- a flat Overworld test area with a `tickingarea` covering 100 blocks around the centre (`as04`);
- 2 simulated players (C-20′);
- `/andrew:ufo come` (or the `ufoc` test seam) at real phase durations.

**WHEN** the event runs to its end.

**THEN**
- At the spawn tick, exactly one `andrew:ufo_saucer` exists:
  - horizontal distance from the centre = 90 ± 0.5;
  - y = `hoverY` + 10 ± 0.1.
- At arrival + 400 ticks, the saucer is within 0.1 of `(centre.x + 0.5, hoverY, centre.z + 0.5)`, with `hoverY` = centre.y + 40.
- It holds there through the magnet.
- At release + 300 ticks:
  - the last sampled position is 90 ± 0.5 horizontal on the bearing opposite the spawn (the dot product of the unit bearings ≤ −0.99);
  - in the next tick no `andrew:ufo_saucer` exists.
- On every sampled tick, the horizontal distance is ≤ 100 and the step between ticks is ≤ 0.5.
- The saucer stays valid for the whole ~95 s.

**Negative control:** the same scenario with the departure leg forced to the same bearing must fail the opposite-bearing assertion.


- **level**: 2

### AC-sauc-2 (bds · UFO AC-16) · Nothing but the Cannon affects the saucer or the beam (L0-sauc-ac02)

# AC-sauc-2 (bds · UFO AC-16) · Nothing but the Cannon affects the saucer or the beam

**GIVEN** a hovering saucer with the beam on, and 2 simulated players.

**WHEN** the following are applied to it in turn:
1. `entity.applyDamage(1000, {cause})` for every `EntityDamageCause`;
2. `/damage @e[type=andrew:ufo_saucer] 100`;
3. `dimension.createExplosion` at its position (power 4);
4. an arrow fired through the disc;
5. a zombie spawned overlapping the hull, and a player teleported into it;
6. a stone wall placed across the departure path.

**THEN**
- After each one, the saucer is valid and its position equals the scripted path position (Δ < 0.01). No knockback.
- The zombie and the player are not displaced by the saucer (Δ < 0.05 over 20 ticks).
- The saucer passes through the wall on schedule, and the wall is unchanged.
- `downed` stays false, and there is no reward and no broadcast.

**Control:** an Orbital charge whose column crosses the hull in the same scenario *does* shoot the saucer down (`ac03`).


- **level**: 2

### AC-sauc-3 (bds · UFO AC-15) · A Cannon charge through the hull shoots the saucer down in any phase (L0-sauc-ac03)

# AC-sauc-3 (bds · UFO AC-15) · A Cannon charge through the hull shoots the saucer down in any phase

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-sauc-r001", "L0-sauc-r004", "L0-sauc-p002", "L0-sauc-as05", "L0-sauc-as06", "L0-orbc", "L0-ring"]`

**GIVEN**
- 2 simulated players: shooter A on the ground, and B, held by the magnet with an iron ingot.
- A aims at a ground block whose column is ≤ 6 from the saucer axis. The block is ≤ 25 from A's eye, and **≥ 7 for RMB** (Orbital v1.4.4, `RING_MIN_RANGE`; a nearer RMB aim is refused silently and would leave the scenario with nothing to test).
- Block snapshots of the 13 × 13 column under the saucer and of 8 blocks around the blast point.

**WHEN** A fires once per phase (arrival, magnet, departure) and once per mode (LMB, RMB). The phases need separate scenarios; the modes can be parametrised.

**THEN**
- Every charge whose column is ≤ 6 from the axis ends `"intercepted"`, with no column or ring effect. For RMB that is the centre plus the ring-3.5 columns inside the hull (`as06`), counted through `observeChargeEnds`.
- On the same tick, `ufoc` is released and B and the pulled items start falling (magnet phase only).
- The saucer descends for ≤ 60 ticks, then it is gone.
- At the blast:
  - **LMB:** no block in either snapshot changed.
  - **RMB:** the RMB columns outside the hull detonate normally at their ring power (7 → 2, 10.5 and 14 → 1). Ring 7's craters reach into the 13 × 13 snapshot. So for RMB the check is a diff of the 8-block blast area from the tick before the blast to the tick after it, plus "no `onDetonate` for an intercepted offset".
  - No player's health drops **in the blast tick**.
  - Exactly 8 `diamond` and 1 `totem_of_undying` item entities appear within 2 blocks of the blast point.
- One `andrew.ufo.shot_down` message with A's name reaches both A and B.
- `ufoc`'s next arrival = shot time + 15 min ± 1 s.

**Sub-cases:**
- *Two charges cross in one tick* (an RMB salvo does this): one reward, one broadcast.
- *An LMB charge 7 from the axis*: no shoot-down, and a normal detonation.
- *A charge crossing during the fall*: absorbed, with no second reward (`as05`).


- **level**: 2

### AC-sauc-4 (bds · gate) · The `orbc` interceptor seam is additive: the Orbital suite stays unchanged (L0-sauc-ac04)

# AC-sauc-4 (bds · gate) · The `orbc` interceptor seam is additive: the Orbital suite stays unchanged

**GIVEN** the task branch with the `registerInterceptor` change in `src/orbital/flight.ts`.

**WHEN** the full GameTest suite runs (every Orbital flight, penetrator and ring scenario, plus every other scenario), along with the node tests.

**THEN**
- Every pre-existing scenario passes with unchanged assertions.
- A node test shows that `advance()` returns identical results with an empty interceptor set.
- A new scenario with a stub interceptor at target + 30 shows:
  - the charge ends `intercepted`;
  - zero blocks changed;
  - no `onDetonate` call;
  - the cooldown was started;
  - `observeChargeEnds` saw the outcome `intercepted`.
- The same scenario with the stub unregistered detonates normally. This is the in-test negative control.
- An interceptor that throws is logged, and the charge detonates normally.

The merge happens only after the whole suite is green on the task branch, not after an `--only` run.


- **level**: 2

### AC-sauc-5 (bds) · The beam property and the sounds follow the magnet phase (L0-sauc-ac05)

# AC-sauc-5 (bds) · The beam property and the sounds follow the magnet phase

**GIVEN** a full event on scaled or real durations, with the `playUfoSound` wrapper spied.

**THEN**
- `andrew:beam` is false on every tick of arrival and departure.
- It is true from the magnet-on tick through the last magnet tick.
- It is false from the release tick on.
- `andrew:beam_len` = `hoverY` − centre.y.
- The sound log is exactly:
  - `beacon.activate` once, at magnet-on;
  - `beacon.ambient` every 40 ticks during the magnet (29 or 30 calls for 1200 ticks);
  - `beacon.deactivate` once, at release.
- No UFO sound plays after removal.

**Shoot-down variant** (in the magnet phase): the beam turns false and `beacon.deactivate` plays in the shot tick, then `random.explode` plays once at the blast. If the shot comes during arrival there is no `beacon.deactivate`.


- **level**: 2

### AC-sauc-6 (ipad · UFO DoD visuals + AC-2 look) · Looked at on the iPad by a person (L0-sauc-ac06)

# AC-sauc-6 (ipad · UFO DoD visuals + AC-2 look) · Looked at on the iPad by a person

This is a manual criterion. It must be reopened after every epic merge, and an orchestrator auto-verify does not count.

**GIVEN** the production or QA world on the iPad at default render settings, with `/andrew:ufo come`.

**THEN the person confirms:**
1. The saucer is visible from the moment it appears ~90 blocks out and comes in smoothly, with no jumps.
2. It reads as a metal disc about 12 blocks across, with a glass dome and glowing rim lights, and it spins slowly.
3. During the magnet, a green **translucent** cone joins the underside to the ground. It is visible **whole**, top to bottom, including when the disc itself is off screen. The terrain shows through it, and it vanishes at release.
4. The hum is audible from the ground every ~2 s, and the on and off sounds play.
5. After a Cannon hit, the saucer falls with smoke for up to 3 s and explodes visibly and audibly, with no crater. The diamonds and the totem lie at the spot, and the chat shows "<name> сбил НЛО!" (RU client) or "<name> shot down the UFO!".
6. It leaves the opposite way and disappears in the distance.

**Evidence:** screenshots or a screen recording for points 1, 3 and 5, attached to the task. Item 1 also notes the client's render distance (`as04`).


- **level**: 2

### Sclk ac01 concept acceptance criterion (L0-sclk-ac01)

**AC-sclk-01 (T01) · First Survival craft** · channel `bds` · the rule is in `lgnd`, this is the crossbow call site

GIVEN a fresh world and a Survival SimulatedPlayer, WHEN a Crafter (a real recipe craft, loaded via `/replaceitem`) is loaded with the pattern ` E / DCD / E ` (E echo shard, D deepslate, C crossbow) and crafts,
THEN:
- the output token becomes one marked `andrew:sculk_crossbow` in the player's inventory;
- the world's `sk` craft flag is set (`L0-adr-sckp`);
- the localized first-craft broadcast names the player.

The same pattern with cobbled deepslate produces nothing.


- **level**: 2

### Sclk ac02 concept acceptance criterion (L0-sclk-ac02)

**AC-sclk-02 (T02) · A repeat craft is blocked after a restart** · channel `bds` · the rule is in `lgnd`

GIVEN the `sk` flag was set (ac01) and the BDS was restarted, WHEN the recipe is crafted again in Survival,
THEN:
- no crossbow is produced;
- the token is swapped for the refund (echo shard ×2, deepslate ×2, crossbow ×1);
- the localized `craft_blocked` message is shown.

The proof uses the restart harness: SimulatedPlayers do not survive a restart, so a fresh one is spawned after it.


- **level**: 2

### Sclk ac03 concept acceptance criterion (L0-sclk-ac03)

**AC-sclk-03 (T03) · Creative and `/give` do not spend the flag** · channel `bds`

GIVEN the `sk` flag is unset, WHEN `/give @s andrew:sculk_crossbow` runs and a copy is taken from the Creative inventory,
THEN:
- both stacks are usable crossbows (they fire bolts);
- the flag is still unset;
- a following Survival craft still succeeds as a first craft.


- **level**: 2

### Sclk ac04 concept acceptance criterion (L0-sclk-ac04)

**AC-sclk-04 (T04) · A shot spawns a bolt with a trail along its real path** · channel `bds` (visual on the iPad: ac23)

GIVEN a shooter SimulatedPlayer with the crossbow and arrows, aimed level at a wall 20 blocks away, WHEN it fires one charged shot,
THEN:
- exactly one `andrew:sculk_bolt` exists and no `minecraft:arrow` survives the spawn tick;
- the bolt's owner is the shooter, and its initial speed is within 5 % of the arrow's;
- the log shows trail emissions on ≥ 5 ticks, at points whose y drops over the flight (they follow gravity, not a straight ray).


- **level**: 2

### Sclk ac05 concept acceptance criterion (L0-sclk-ac05)

**AC-sclk-05 (T05) · The trail harms nothing** · channel `bds`

GIVEN a bystander SimulatedPlayer standing 0.6 blocks beside the bolt's line (no collision), plus a column of glass and grass 0.6 blocks off the line, WHEN a bolt flies past both and ends in the Void or expires,
THEN:
- the bystander's health and position are unchanged (an `entityHurt` witness records none);
- no block within 2 of the line changed;
- the record ends as `expired`.


- **level**: 2

### Sclk ac06 concept acceptance criterion (L0-sclk-ac06)

**AC-sclk-06 (T06) · A direct hit deals exactly D, and no arrow damage** · channel `bds`

GIVEN an unarmoured target SimulatedPlayer at 20 HP, 8 blocks from the shooter, WHEN one bolt hits it,
THEN:
- its health is exactly `20 − SONIC_BOOM_DAMAGE` (10) after the hit tick, with exactly one `entityHurt` from the shooter;
- no `minecraft:arrow` entity existed during the test.

**Negative control:** with Power V on the crossbow the result is still 10.


- **level**: 2

### Sclk ac07 concept acceptance criterion (L0-sclk-ac07)

**AC-sclk-07 (T07) · Difficulty does not change D** · channel `bds`

GIVEN the setup of ac06, WHEN it is repeated at `/difficulty easy` and at `/difficulty hard` (peaceful is skipped: it heals players and empties hostile structures),
THEN the target loses exactly D on each.

The test restores the original difficulty in `finally`.


- **level**: 2

### Sclk ac08 concept acceptance criterion (L0-sclk-ac08)

**AC-sclk-08 (T08) · Armour, Protection and a shield do not reduce D** · channel `bds`

GIVEN a target SimulatedPlayer in full netherite with Protection IV,
WHEN:
- (a) it is hit by one bolt;
- (b) it holds a shield in the off hand, raised by sneaking, faces the shooter, and is hit by one bolt;

- (c) it holds a raised shield and its health is ≤ D;
- (d) it holds a raised shield and a totem of undying in the other hand.

THEN in (a) and (b) it loses exactly D; the case (b) bolt resolves once, as an entity hit, through `projectileHitEntity` — a raised shield neither deflects the bolt nor suppresses the event (measured 5/5). In (c) it dies from the one bolt, with the kill credited to the shooter. In (d) the totem is used. The log names the path used.


- **level**: 2

### Sclk ac09 concept acceptance criterion (L0-sclk-ac09)

**AC-sclk-09 (T09) · Neighbours take nothing** · channel `bds`

GIVEN a target SimulatedPlayer and a bystander SimulatedPlayer 1.5 blocks beside it, plus a zombie 2 blocks behind it (`spawnWithoutBehaviors`), WHEN one bolt hits the target,
THEN:
- only the target loses health;
- the bystander and the zombie record no `entityHurt` during the hit tick and the 40 ticks after it (the patch placement included).


- **level**: 2

### Sclk ac10 concept acceptance criterion (L0-sclk-ac10)

**AC-sclk-10 (T10) · An entity hit makes a patch and no crater** · channel `bds`

GIVEN a target standing on a flat 9×9 stone floor, WHEN a bolt hits it,
THEN:
- no floor cell became air;
- 9 ≤ (sculk cells) ≤ 25, all within the 5×5 centred on the target's feet column and all on the top surface;
- at least one 5×5 cell is not sculk (irregular).

A second case: a target 10 blocks above the floor gets no patch (`xasm24`).


- **level**: 2

### Sclk ac11 concept acceptance criterion (L0-sclk-ac11)

**AC-sclk-11 (T11) · A block hit carves an irregular crater ≤ 5×5×3** · channels `bds` + node

GIVEN a solid stone block 7×7×5, WHEN a bolt hits the top face centre,
THEN:
- every air cell created lies within the 5×5 footprint and ≤ 3 deep;
- the centre column is ≥ 2 deep;
- 12 ≤ (air cells) ≤ 75, and the footprint is not a full 5×5;
- no item entity spawned.

**Node:** `craterCells` is deterministic for a given seed and never leaves the box across 1000 seeds × 6 faces. Deny-list cells and liquids in the fixture stay.


- **level**: 2

### Sclk ac12 concept acceptance criterion (L0-sclk-ac12)

**AC-sclk-12 (T12) · The crater does no explosion damage** · channel `bds`

GIVEN a bystander SimulatedPlayer standing 2 blocks from the impact cell, on a cell outside the crater box, WHEN a bolt hits the block,
THEN:
- the bystander records no `entityHurt` from any cause in the hit tick and the 20 ticks after it;
- no `minecraft:tnt` entity and no explosion event occurred.


- **level**: 2

### Sclk ac13 concept acceptance criterion (L0-sclk-ac13)

**AC-sclk-13 (T13) · Permanent sculk around the crater** · channel `bds`

GIVEN the crater of ac11, THEN:
- ≥ 8 exposed surface cells inside the 5×5 around the impact are `minecraft:sculk`;
- no `sculk_sensor`, `sculk_shrieker`, `sculk_catalyst` or `sculk_vein` is present in the box.

AND after a BDS restart (the restart harness), the same cells are still sculk.


- **level**: 2

### Sclk ac14 concept acceptance criterion (L0-sclk-ac14)

**AC-sclk-14 (T14) · Quick Charge works, and the reload still limits** · channel `bds`

GIVEN two shooter SimulatedPlayers, one with Quick Charge III and one without, WHEN each repeatedly holds use until the shot fires,
THEN the Quick Charge III shooter's measured charge-to-shot time is ≤ 50 % of the plain one's (vanilla: 0.5 s vs 1.25 s, ±2 ticks). This does **not** hold natively — it rests on the scripted scheme in `as05`.

AND a release after 2 ticks spawns **no** bolt for either shooter (`cx02`) — this one the engine already enforces; it stays as a guard.


- **level**: 2

### Sclk ac15 concept acceptance criterion (L0-sclk-ac15)

**AC-sclk-15 (T15) · Piercing cannot stay or act** · channels `bds` + node

GIVEN a crossbow stack with `piercing 4` + `quick_charge 3` + `unbreaking 3`, put into a SimulatedPlayer's inventory by script (this fires `playerInventoryItemChange`), THEN by the next tick:
- the stack has no `piercing`;
- it still has `quick_charge 3` and `unbreaking 3`.

Piercing and Multishot exclude each other in the engine, so no stack ever carries both. The production strip is armed in the gametest pack: the release pack reads `event.player` as undefined for a SimulatedPlayer.

AND a bolt fired by a stack that has Piercing (set in the same tick, before the strip) hitting two targets in a line damages only the first.

**Node:** the strip helper keeps the other enchantments.


- **level**: 2

### Sclk ac16 concept acceptance criterion (L0-sclk-ac16)

**AC-sclk-16 (T16) · Multishot: three independent bolts** · channel `bds`

GIVEN a Survival shooter with a Multishot crossbow and 10 arrows, aiming at a wall 15 blocks away, WHEN it fires one charged shot,
THEN:
- three bolts with distinct records exist;
- exactly one arrow was spent;
- three separate block-hit outcomes are logged, each with its own seed and its own crater/sculk job;
- no record resolves twice.


- **level**: 2

### Sclk ac17 concept acceptance criterion (L0-sclk-ac17)

**AC-sclk-17 (T17) · Three Multishot bolts, three full hits on one player** · channel `bds`

GIVEN a target SimulatedPlayer in full netherite with Protection IV at 40 HP (health boosted by an effect), placed 2 blocks in front of the shooter so that all three bolts connect within ≤ 2 ticks, WHEN one Multishot shot fires,
THEN:
- three entity-hit outcomes are logged for that target;
- its health drops by exactly 3 × D = 30, despite the invulnerability window (`xcx22`).

**In-test negative control:** the same volley with the `setCurrentValue` step disabled by a test flag must lose less than 30.


- **level**: 2

### Sclk ac18 concept acceptance criterion (L0-sclk-ac18)

**AC-sclk-18 (T18) · No durability loss** · channels `bds` + node

GIVEN a Survival shooter, WHEN it fires 30 charged shots and lands 10 melee hits with the crossbow,
THEN:
- the stack's `minecraft:durability` component is absent (option A), or its damage is 0 (option B);
- the stack is the same item, not broken or replaced.

**Node:** the item JSON has no `minecraft:durability`.


- **level**: 2

### Sclk ac19 concept acceptance criterion (L0-sclk-ac19)

**AC-sclk-19 (T19) · Death retention, crossbow instance** · channel `bds` · the rule is in `lgnd`

GIVEN a SimulatedPlayer holding a marked crossbow, WHEN it dies, THEN:
- no `andrew:sculk_crossbow` item entity spawns where it died;
- after respawn, the player's inventory holds exactly one marked crossbow, with its enchantments kept.

The framework's per-def retention scenario covers it with def #5 added to its def list.


- **level**: 2

### Sclk ac20 concept acceptance criterion (L0-sclk-ac20)

**AC-sclk-20 (T20) · The item entity survives hazards, crossbow instance** · channel `bds` · the rule is in `lgnd` (C-16 reading of `xcx21`)

GIVEN a dropped marked crossbow, WHEN it is put through fire, lava, cactus, TNT, an Orbital LMB blast and the Void,
THEN after each, **exactly one** marked crossbow exists, held or owed to `mark.owner` (`xasm26`).

AND a crossbow lying inside a crossbow crater box is protected by `protectLegendariesIn` before the carve.


- **level**: 2

### Sclk ac21 concept acceptance criterion (L0-sclk-ac21)

**AC-sclk-21 · The probe is recorded before any build task** · channel `bds` (checks, 19136)

GIVEN the probe pack (p001), THEN:
- Q1–Q9 each have a logged yes/no and a measured value in the probe artifact;
- `L0-adr-scbs` and `L0-adr-scdm` are marked `accepted` or `superseded`, citing those values;
- `cx01` and `cx02` are updated with the Q2 and Q5 results.

No `sclk` item, pipeline or crater task starts before this.


- **level**: 2

### Sclk ac22 concept acceptance criterion (L0-sclk-ac22)

**AC-sclk-22 · The deny-list move changes nothing for the Orbital** · channels `bds` + node

GIVEN `PENETRATOR_KEEP` moved to `src/terrain/keep.ts`, THEN:
- the node set-equality test against the pre-move list passes;
- the four `pntr_*` GameTests and the node bundle are green (blast-radius gate; the ring is not a consumer of the list);
- reinforced deepslate is carved, like obsidian and ancient debris — asserted explicitly, so nobody turns the shared list into a per-weapon extension;
- a crossbow bolt hitting bedrock or a barrier leaves it in place.


- **level**: 2

### Sclk ac23 concept acceptance criterion (L0-sclk-ac23)

**AC-sclk-23 · iPad: the trail looks like a Sonic Boom and follows the bolt** · channel `ipad` (manual, by the operator)

GIVEN the production world on the iPad, WHEN the operator fires a bolt at a target 25 blocks away, THEN they see:
- a row of teal Sonic Boom rings that follows the bolt's arc, not a straight beam;
- the rings fade within about 1 s after the bolt ends;
- no visible frame drop with a Multishot volley.

Reopen after every `sclk` epic merge.


- **level**: 2

### Sclk ac24 concept acceptance criterion (L0-sclk-ac24)

**AC-sclk-24 · iPad: the crater reads as a small irregular hole** · channel `ipad` (manual)

WHEN the operator shoots grass/dirt ground and a stone wall, THEN:
- each hit leaves a ragged hole about 5 wide and 2–3 deep, not a cube and not a TNT-sized pit;
- no item drops lie around;
- there is no explosion sound or flash.


- **level**: 2

### Sclk ac25 concept acceptance criterion (L0-sclk-ac25)

**AC-sclk-25 · iPad: the sculk looks natural and stays** · channel `ipad` (manual)

WHEN the operator hits a mob on flat ground and then shoots the ground, THEN:
- each time, a ragged sculk patch about 5×5 appears on the surface, under the mob or around the crater;
- after leaving and rejoining the world, the sculk is still there;
- there are no sensors or shriekers.


- **level**: 2

### Sclk ac26 concept acceptance criterion (L0-sclk-ac26)

**AC-sclk-26 · iPad: icon, name and tooltip** · channel `ipad` (manual)

GIVEN the operator holds the crossbow, THEN:
- the hotbar and inventory icon is a recognisable crossbow with sculk colouring (not the missing-texture square);
- the name reads «Скалковый арбалет» in Russian and "Sculk Crossbow" in English;
- the tooltip line is localized;
- no "Ready" Action Bar line appears while it is held (r009).


- **level**: 2

### Sclk ac27 concept acceptance criterion (L0-sclk-ac27)

**AC-sclk-27 · iPad: Creative entry and shooting feel** · channel `ipad` (manual)

GIVEN the Creative inventory, THEN:
- the crossbow appears under Снаряжение/Equipment next to the crossbows;
- searching «арбалет» or "crossbow" finds it.

AND in Survival:
- the shot charges like a crossbow: hold to load, press to fire;
- a quick tap does not fire;
- a Quick Charge copy charges visibly faster (scripted, not native).


- **level**: 2

### AC strm-acd (bds) (L0-strm-acd)

---
title: "AC strm-acd · Exact pre-armour 10 / +6, in-window proof, passive rate (bds)"
is_a: ["acceptance-criterion"]
part_of: ["L0-strm"]
relates_to: ["L0-strm-rdmg", "L0-xcx26", "L0-strm-asm1"]
---
# AC strm-acd (bds)

1. **Active, out of window.**
   - GIVEN an armoured SimulatedPlayer A and a twin B, WHEN A is hit by the beam and B by `applyDamage(10, entityAttack)` from a control source, THEN Δhealth(A) = Δhealth(B), and both are > 0 and < 10.
   - The same holds against a zombie with armour.
2. **Passive, in window, with the RNG forced to proc.** Stands: R meets this (3.80 = 2.24 + 1.56 on diamond, diagnose-CNTR-X26).
   - Δhealth(target) after a blade melee + bonus = Δhealth(twin, vanilla diamond sword) + Δhealth(twin2, a native `applyDamage(6)` out of window).
   - **Negative control (red proof) in the same test:** a plain `applyDamage(6)` inside the window takes 0 while returning true.
3. **Active inside a melee window** (meleed ≤ 10 ticks before) nets the full armoured 10, not f(10) − f(L) (2.00 bare, 0.76 in diamond).
4. **No double count.** A forced passive with no active, and an active with no passive, each change health by exactly one event's amount.
5. **Lethal path.** At low health a target holding a totem pops it. A target without one dies, the death message names the wielder, and XP and kill credit go to the wielder.
6. **Bystanders.** A second mob ≤ 2 blocks from the target has Δhealth = 0 for both events.
7. **Rate.**
   - Seeded: N = 10 000, rate in [0.29, 0.31], and both stub branches are covered.
   - Live: N ≥ 600 real hits, rate in [0.25, 0.35].
   - A forced proc while the active is on cooldown leaves the cooldown remaining unchanged.


- **level**: 2

### AC strm-aci (ipad, manual; reopen after every epic merge) (L0-strm-aci)

---
title: "AC strm-aci · Operator checks on the iPad (ipad)"
is_a: ["acceptance-criterion"]
part_of: ["L0-strm"]
relates_to: ["L0-strm-rvis", "L0-strm-edef", "L0-strm-ercp"]
---
# AC strm-aci (ipad, manual; reopen after every epic merge)

1. **The trace and the strikes read as lightning** to the operator: a visible straight line and three distinct strikes on the active, one on a passive proc, with thunder heard at the point. If the operator says it does not read as lightning, that opens the adr-sblt B follow-up.
2. **The icon** shows in the hotbar and inventory. It is not the missing-texture placeholder.
3. **The HUD line** shows «Клинок бури — Готово» in RU and "Storm Blade — Ready" in EN, then counts down after a Use (long-press).
4. **The Creative "Equipment" tab** contains the Storm Blade. The token is not listed.
5. **The recipe book** shows the Storm Blade recipe (holding a lightning rod), and Elytra (feather) and Totem (gold ingot). Shift-crafting the blade from the book on a world that already has one is refused, with a refund.
6. **A real totem pop.** A crafted totem saves the operator from a lethal fall, with the vanilla animation and effects.
7. **An elytra glide.** A crafted elytra deploys and glides from a jump off a height, and firework boosting works.


- **level**: 2

### AC strm-acr (bds) (L0-strm-acr)

---
title: "AC strm-acr · Craft once, Creative copy, melee parity, legendary rules with def #6 (bds)"
is_a: ["acceptance-criterion"]
part_of: ["L0-strm"]
relates_to: ["L0-lgnd", "L0-magn", "L0-strm-edef"]
---
# AC strm-acr (bds)

1. **Once per world.**
   - GIVEN a fresh world, WHEN a Survival player crafts the recipe through a Crafter, THEN they hold `andrew:storm_blade` and one broadcast with the localised name and the player's name is sent.
   - WHEN BDS restarts and a second craft is attempted, THEN no blade appears and the inputs are refunded (2 rods, 2 wind charges, 1 diamond sword).
2. **Simultaneous crafts** of two tokens in the same tick yield exactly one blade (the existing `lgnd` gate scenario, run with def #6).
3. **A Creative or `/give` copy** does not spend the flag: a later Survival craft still succeeds.
4. **Melee parity** (xasm30). Against the same armoured SimulatedPlayer, a blade hit's Δhealth equals a vanilla `diamond_sword` hit's Δhealth, with the RNG forced to "no proc". The same holds with Sharpness V on both.
5. **Unbreakable.** After 200 hits the stack has no durability component and is unchanged.
6. **Legendary rules.** The `lgnd` death-retention, chest-stays, hazards (fire, lava, cactus, TNT, Orbital) and Void → last holder (incl. offline) scenarios iterate over def #6 and pass.
7. **The magnet's** legendary scenarios include def #6 and pass.
8. **Framework diff:** outside `src/storm/`, `packs/`, lang and tests, only `registry.ts` (+def), `main.ts` (+subscriptions) and `src/katana/plan.ts` (exports, per `L0-strm-adtr`) change.


- **level**: 2

### AC strm-act (bds) (L0-strm-act)

---
title: "AC strm-act · Range, wall stop, first target only, cooldown (bds)"
is_a: ["acceptance-criterion"]
part_of: ["L0-strm"]
relates_to: ["L0-strm-rcd", "L0-strm-pact", "L0-strm-adtr"]
---
# AC strm-act (bds)

1. **Range.**
   - A target at 9.5 blocks Euclidean is hit.
   - A target at 10.5 is not hit, and the cooldown is still spent.
   - The same holds on a diagonal (x = z): one target at 9.5 is hit, another at 10.5 is not. This guards the cell-step trap.
2. **Wall stop.** A 1-block solid wall at 5 blocks with a target at 7 behind it: the target is untouched, the trace ends at the wall face, and the cooldown is spent.
3. **Non-stopping blocks.** Tall grass and carpet between the wielder and the target at 6 do not stop the hit.
4. **First target only** (C-20⁗). Two mobs in a line at 4 and 6: only the first loses health. That holds even when the first dies from the hit.
5. **Cooldown.**
   - After a valid release, a second Use at +1 s deals nothing and the cooldown remaining is unchanged (invalid attempts are free).
   - At ≥ 600 ticks a Use fires again.
   - A miss into air spends the cooldown.
6. **Hand priority.** Main hand on cooldown + a second blade-free legendary or a blade in the off hand: the off hand activates per `resolveActivation` (the `lgnd` hand scenarios with def #6).
7. **HUD.** The action-bar text equals the lang "Ready" string when ready and the ceil seconds while cooling down (read through the HUD formatter in a unit test).
8. **Katana unchanged.** The Katana unit and BDS scenarios pass after the `plan.ts` export.


- **level**: 2

### AC strm-acv (bds) (L0-strm-acv)

---
title: "AC strm-acv · Visuals act on nothing; vanilla recipes yield vanilla items (bds)"
is_a: ["acceptance-criterion"]
part_of: ["L0-strm"]
relates_to: ["L0-strm-rvis", "L0-strm-ercp", "L0-adr-sbvr"]
---
# AC strm-acv (bds)

1. **No lightning entity.** After an active hit and a forced passive proc on a pig and a villager:
   - the count of `minecraft:lightning_bolt` in the dimension is 0;
   - there are no `zombie_pigman`/`zombified_piglin` or `witch` entities, and the pig and villager are still present;
   - no fire block lies within 3 cells of either point;
   - no block in the test volume has changed.
2. **Grep check.** `lightning_bolt` does not appear in `src/storm/` (CI check).
3. **Elytra.**
   - Two Crafter crafts of 6 feathers + a diamond chestplate yield 2× `minecraft:elytra`: the exact type id, no dynamic properties, no lore, and empty inputs.
   - A Survival player with no prior craft can do it twice: there is no uniqueness flag.
4. **Totem.**
   - Two Crafter crafts of 8 gold ingots + an emerald yield 2× `minecraft:totem_of_undying` with the same checks.
   - A crafted totem in the off hand saves a SimulatedPlayer from lethal `applyDamage`, the same as a `/give` totem.
5. **Ordinary items.** A crafted elytra and totem dropped into lava burn. They are not protected, and they are not pulled by the magnet's legendary path.


- **level**: 2

### AC-ufoc-1 · UFO AC-1 (first-arrival window), GameTest on a scaled clock (L0-ufoc-ac01)

# AC-ufoc-1 · UFO AC-1 (first-arrival window), GameTest on a scaled clock

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-ufoc-r001", "L0-ufoc-ad01", "L0-xasm14"]`

**GIVEN** a world where `andrew:ufo_next_ms` is absent, a core built on the scaled test clock, and the `random` stub returning 0, then 1, then 0.5,
**WHEN** a simulated Overworld player makes its first join and the test clock advances,
**THEN:**
- `next_ms` equals join + 600 000 for `random` 0, join + 1 200 000 for 1, and join + 900 000 for 0.5;
- no arrival starts before `next_ms`;
- the arrival starts within 100 ticks after the clock passes `next_ms`.

**Negative control:** a second `initialSpawn` while `next_ms` is present does not change it.


- **level**: 2

### AC-ufoc-2 · UFO AC-1 (+15 min after a departure or shoot-down), GameTest on a scaled clock (L0-ufoc-ac02)

# AC-ufoc-2 · UFO AC-1 (+15 min after a departure or shoot-down), GameTest on a scaled clock

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-ufoc-p001", "L0-ufoc-p002", "L0-ufoc-as03", "L0-adr-ufpc"]`

**GIVEN** a live event on the scaled clock with a stub saucer, with short tick durations,
**WHEN**:
- (a) the departure completes;
- (b) the stub calls `reportShotDown` during the magnet phase;
- (c) `reportShotDown` is called twice with the same `eventId`;

**THEN:**
- (a) `next_ms` = the end tick's `now()` + 900 000;
- (b) `next_ms` = the shot's `now()` + 900 000, and `onPhase("release")` comes on the next UFO tick, not inside the caller;
- (c) the second call changes nothing;
- in every case the next arrival starts within 100 ticks after `next_ms`, and not before it.


- **level**: 2

### AC-ufoc-3 · UFO AC-1 (the timer survives a restart) and AC-17 (`disable` persists), `bds-check` restart scenario (L0-ufoc-ac03)

# AC-ufoc-3 · UFO AC-1 (the timer survives a restart) and AC-17 (`disable` persists), `bds-check` restart scenario

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-xcx17", "L0-xasm13", "L0-ufoc-ad03", "L0-ufoc-r006"]`

These run on the checks instance (19136), never on production or QA. They are counted as "automated on BDS" pending `L0-xcx17`.

**Case 1: pause.**
- GIVEN: seed `next_ms = T` in the future.
- WHEN: restart the server.
- THEN: a selftest probe reads `next_ms === T`.

**Case 2: in flight.**
- GIVEN: start an event with `come`; assert `next_ms = 0` before the restart.
- WHEN: restart.
- THEN: `next_ms` ∈ [load time + 900 000, load time + 900 000 + 5 000].

**Case 3: disabled.**
- GIVEN: run `/andrew:ufo disable` as op, and seed `next_ms` in the past.
- WHEN: restart.
- THEN: `andrew:ufo_enabled === false`, and no `andrew:ufo` entity has appeared after 200 ticks with a player connected.

**Red proof.** A build without the load-time marker handling fails case 2.


- **level**: 2

### AC-ufoc-4 · UFO AC-2 (timing half), GameTest with real durations (L0-ufoc-ac04)

# AC-ufoc-4 · UFO AC-2 (timing half), GameTest with real durations

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-ufoc-p002", "L0-ufoc-r003", "L0-sauc-ac01"]`

**GIVEN** the product duration table (400/1200/300 ticks) and a recording stub consumer,
**WHEN** the event is started with `come` for a simulated player standing on a block at Y = c,
**THEN:**
- `onPhase` is called in the order arrival → magnet → release → departure → pause;
- the magnet starts 400 ± 1 ticks after arrival;
- the release and the departure start in the same tick, 1200 ± 1 ticks later;
- the pause comes 300 ± 1 ticks after that;
- every payload carries the same `eventId` and `hoverY = min(c + 40, 316)`;
- `saucerStep` is called on every active tick, and `magnetStep` only during the magnet phase, after `saucerStep`.

**Second case:** a platform at Y = 290 gives `hoverY = 316`.

The geometry half of AC-2 (90 blocks out, the saucer reaches the hover point) belongs to `sauc`.


- **level**: 2

### AC-ufoc-5 · UFO AC-3 (Overworld only, waits, one saucer) and AC-18 (no saucer after a restart) (L0-ufoc-ac05)

# AC-ufoc-5 · UFO AC-3 (Overworld only, waits, one saucer) and AC-18 (no saucer after a restart)

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-ufoc-r004", "L0-ufoc-p003", "L0-xasm17"]`

**AC-3, GameTest:**
- **GIVEN** `next_ms` in the past and the only simulated player in the Nether, **THEN** no arrival starts for 300 ticks. **WHEN** the player teleports to the Overworld, **THEN** the arrival starts within 100 ticks, centred on that player.
- **GIVEN** a live event, **WHEN** `come` runs again, **THEN** it is refused and there is still exactly one session. The stub saucer counts as 1.
- The centre, `onPhase` and the saucer are always in `minecraft:overworld`.

**AC-18, `bds-check` restart on 19136:**
1. Start an event with `come` at a centre more than 200 blocks from spawn, so it is outside the spawn chunks.
2. Restart during the magnet phase.
3. The selftest probe finds 0 entities tagged `andrew:ufo` at load, and still 0 after a ticking area loads the saucer's chunk.
4. Entities tagged `andrew:ufo_iron` have lost the tag.
5. `next_ms` is about load time + 15 min.


- **level**: 2

### AC-ufoc-6 · UFO AC-17 (commands are operator-only and have their effects) (L0-ufoc-ac06)

# AC-ufoc-6 · UFO AC-17 (commands are operator-only and have their effects)

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-ufoc-p004", "L0-ufoc-ad04", "L0-ufoc-r006"]`

**GIVEN** the command is registered at `GameDirectors`:
- **non-op:** `/andrew:ufo come` from a non-operator player on the checks instance is refused by the engine, no session starts, and `andrew:ufo_enabled` is unchanged after `disable`;
- **op `come`:** a session starts, targeting the invoker;
- **op `stop`** during the magnet phase: `onPhase("release")` comes on the next tick, then `pause`, with no saucer left and `next_ms` = now + 15 min;
- **op `disable`:** the flag is false and no scheduled arrival starts while `next_ms` is due;
- **op `enable`:** the flag is true, and an overdue `next_ms` moves to now + 15 min.

The non-op case runs as a `bds-check` with a real client or a deop'd player, because GameTest simulated players are operators. The rest run in GameTest. Persistence across a restart is `ac03`.


- **level**: 2

### AC-ufoc-7 · Arrival notice within 150 blocks, RU/EN (L0-ufoc-ac07)

# AC-ufoc-7 · Arrival notice within 150 blocks, RU/EN

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-ufoc-r005", "L0-ufoc-as05"]`

**(bds, GameTest)**
- **GIVEN** simulated players A at 0, B at 149 and C at 151 horizontal blocks from the target, and D in the Nether,
- **WHEN** the arrival starts,
- **THEN** A and B each receive exactly one message with `translate: "andrew.ufo.arrival"`, and C and D receive none. The message is captured through a send-message spy on the core's player provider.
- **Static check:** `en_US.lang` and `ru_RU.lang` both define `andrew.ufo.arrival`, with exactly the spec's texts.

**(ipad, manual, separate criterion; reopen after every epic merge)** On the iPad with the game language set to Russian, `/andrew:ufo come` shows "В небе НЛО!" in chat. A screenshot is attached.


- **level**: 2

### AC-ufoc-8 · One interval and an idle cost near zero (C-5d) (L0-ufoc-ac08)

# AC-ufoc-8 · One interval and an idle cost near zero (C-5d)

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-ufoc-ad02", "L0-ufoc-r004", "L0-xasm16"]`

- **GIVEN** `registerUfo()` has run, **THEN** a source check of `src/ufo/` finds exactly one `runInterval`, and no `runTimeout` or `runJob`.
- **GIVEN** no session for 2 000 ticks, **THEN** the environment seam's `now()` and the property store are read at most 20 times. Both are counted through spies.
- **GIVEN** a full real-duration event with stub consumers, **THEN** the measured mean cost of the `ufoc` step alone, excluding the consumers, is recorded in the task proof as an input to the `L0-xasm16` budget.


- **level**: 2


---
title: Glossary
type: project-knowledge
generated_at: "2026-10-03T14:58:23.855Z"
source_channel: rollout
node_id: rollout-glossary
aliases: ["rollout-glossary","glossary","project-knowledge/glossary"]
is_a: ["rollout","glossary"]
relates_to: ["L0-katn-ac01","L0-katn-ac02","L0-katn-ac03","L0-katn-ac04","L0-katn-ac05","L0-katn-ac06","L0-katn-ac07","L0-katn-ac08","L0-katn-ac09","L0-katn-gl01","L0-katn-gl02","L0-katn-gl03","L0-katn-gl04","L0-katn-gl05","L0-lgnd-ac01","L0-lgnd-ac02","L0-lgnd-ac03","L0-lgnd-ac04","L0-lgnd-ac05","L0-lgnd-ac06","L0-lgnd-ac07","L0-lgnd-ac08","L0-lgnd-ac09","L0-lgnd-ac10","L0-lgnd-ac11","L0-lgnd-ac12","L0-lgnd-ac13","L0-lgnd-ac14","L0-lgnd-ac15","L0-lgnd-ac16","L0-lgnd-ac17","L0-lgnd-ac18","L0-lgnd-ac19","L0-lgnd-ac20","L0-lgnd-ac21","L0-lgnd-ac22","L0-lgnd-ac23","L0-lgnd-ac24","L0-lgnd-gl01","L0-lgnd-gl02","L0-lgnd-gl03","L0-lgnd-gl04","L0-lgnd-gl05","L0-lgnd-gl06","L0-lgnd-gl07","L0-lgnd-gl08","L0-lgnd-gl09","L0-lgnd-gl10","L0-lgnd-gl11","L0-lgnd-gl12","L0-lgnd-gl13","L0-lgnd-gl14","L0-lgnd-gl15","L0-lgnd-gl16","L0-lgnd-gl17","L0-lgnd-gl18"]
priority: 600
---

# Glossary

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

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


- **node**: L0-katn-ac01

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


- **node**: L0-katn-ac02

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


- **node**: L0-katn-ac03

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


- **node**: L0-katn-ac04

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


- **node**: L0-katn-ac05

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


- **node**: L0-katn-ac06

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


- **node**: L0-katn-ac07

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


- **node**: L0-katn-ac08

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


- **node**: L0-katn-ac09

### Katn gl01 concept glossary term (L0-katn-gl01)

**Dragon Katana** (RU: Катана дракона)

The fourth legendary weapon, `andrew:dragon_katana`. It is a Diamond Sword clone whose Use teleports the holder up to 20 blocks along their view, with a 30 s cooldown. Its craft token is `andrew:dragon_katana_crafted`, its ability key `dragon_katana`, and its key prefix `dk`.

**Synonyms**: Katana, `katn` (the KV node), DK.


- **node**: L0-katn-gl01

### Katn gl02 concept glossary term (L0-katn-gl02)

**Trace (Katana)**

The server-side block ray from the use-time head location along the view direction, ≤ 20 blocks. It uses `includePassableBlocks:false, includeLiquidBlocks:false`.
- It stops at the first block the engine treats as collidable, or before an unreadable cell.
- Its end is the **endpoint E**: the hit point pulled back 0.3, or the point in the air at the range.

Not the Scythe's line of sight (`hasLineOfSight`), which treats every non-air, non-liquid block as blocking.

**Synonyms**: ability ray, teleport ray.


- **node**: L0-katn-gl02

### Katn gl03 concept glossary term (L0-katn-gl03)

**Safe cell**

A feet cell B where a standing player (2 cells high, centred) can be placed. It must:
- pass the column-ray fit check (`L0-katn-ad01`);
- contain no lava or fire;
- lie on the owner's side of the hit face;
- be reachable from the head by a clear ray;
- leave the head within 20 blocks of its start.

A cell in mid-air qualifies. "Owner's side" means the half-space of the hit-face plane that contains the head.

**Synonyms**: safe position, destination B, landing cell.


- **node**: L0-katn-gl03

### Katn gl04 concept glossary term (L0-katn-gl04)

**Fall flag**

A per-player, in-memory, one-shot protection that is armed by a successful Katana teleport. It is consumed by the first landing, liquid, climb, glide, death, dimension change or logout, or after 10 s.
- While it is armed and the player is about to hit the ground, a self-teleport resets the fall distance, so that landing deals no damage.
- It is never persisted and never blocks other damage.

**Synonyms**: one-shot fall protection, landing flag.


- **node**: L0-katn-gl04

### Katn gl05 concept glossary term (L0-katn-gl05)

**Petal trail**

The one-shot visual of a successful Katana teleport. It is a line of pink cherry-blossom particles from A+1 to B+1, spawned through `dimension.spawnParticle` (`minecraft:cherry_leaves_particle`, or the fallback `andrew:katana_petal`) within ≤ 10 ticks.
- Visual only: no entities, damage, knockback or block changes.

**Synonyms**: sakura trail, cherry trail.


- **node**: L0-katn-gl05

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


- **node**: L0-lgnd-ac01

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


- **node**: L0-lgnd-ac02

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


- **node**: L0-lgnd-ac03

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


- **node**: L0-lgnd-ac04

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


- **node**: L0-lgnd-ac05

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


- **node**: L0-lgnd-ac06

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


- **node**: L0-lgnd-ac07

### Lgnd ac08 concept acceptance criterion (L0-lgnd-ac08)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p003", "L0-lgnd-r011", "L0-lgnd-ad11", "L0-lgnd-ent4"]
---
**AC-lgnd-08: Void return to the last holder, exactly once.** Channel: `bds`.

GIVEN P last held a marked Orbital Cannon (gen g) and drops it into the Void
WHEN the item entity falls below the dimension's minimum height
THEN P receives it with the same id, gen g + 1 and `holder` = P, plus a private `andrew.orbital.returned` message,
AND the Cannon craft flag is unchanged.

If P is offline:
- the entry sits in `andrew:oc_owed[P]`;
- it survives a restart;
- it is redeemed exactly once on P's next join.

Two different instances owed to P while P is offline are **both** redeemed (list, not map).

The same holds for the Web Sword and the Scythe.


- **node**: L0-lgnd-ac08

### Lgnd ac09 concept acceptance criterion (L0-lgnd-ac09)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p003", "L0-lgnd-r012", "L0-lgnd-as11"]
---
**AC-lgnd-09: Vanilla item-entity destruction returns the instance; a pickup does not.** Channel: `bds`.

GIVEN a marked legendary item entity (any of the three) last held by P
WHEN it burns in lava or fire, is destroyed by cactus or a **vanilla** TNT explosion, or despawns
THEN P receives it back per `ac08`,
AND an ordinary pickup of the entity by any player triggers **no** return and no gen bump, and that player becomes `holder`,
AND an unmarked (Creative or vanilla `/give`) copy is destroyed as in vanilla (`as11`).

Destruction by the Orbital Cannon is not covered here, because the item must not be destroyed at all (`ac19`).


- **node**: L0-lgnd-ac09

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


- **node**: L0-lgnd-ac10

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


- **node**: L0-lgnd-ac11

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


- **node**: L0-lgnd-ac12

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


- **node**: L0-lgnd-ac13

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


- **node**: L0-lgnd-ac14

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


- **node**: L0-lgnd-ac15

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


- **node**: L0-lgnd-ac16

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


- **node**: L0-lgnd-ac17

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

Pending the client's confirmation of `L0-adr-hold`.


- **node**: L0-lgnd-ac18

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


- **node**: L0-lgnd-ac19

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


- **node**: L0-lgnd-ac20

### Lgnd ac21 concept acceptance criterion (L0-lgnd-ac21)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r016", "L0-lgnd-ad13", "L0-magn", "ufomagnetspecv1ruen-part-4"]
---
**AC-lgnd-21: Legendary weapons are never pulled (UFO AC 13, rule side).** Channel: `build` (node unit test for the predicate) + `bds` (GameTest `ufo:legendary_*`).

**Predicate.** `isLegendaryStack` is true for each of `andrew:web_sword`, `andrew:scythe_of_calamity`, `andrew:orbital_cannon` and their three `_crafted` tokens, whether marked, unmarked or stale. It is false for `iron_sword`, for `undefined` and for an empty slot.

GIVEN, inside a magnet zone with at least 10 iron candidates, the following and a Survival player holding iron:
- a marked Scythe on the ground;
- an unmarked Web Sword in a chest next to an iron ingot;
- a marked Orbital Cannon in a hopper **block**;
- a chest minecart holding a marked Web Sword and an iron ingot;
- an armour stand in iron armour holding a marked Scythe

WHEN the magnet runs its full 60 s and releases
THEN:
- no legendary stack is ever within 6 blocks of the saucer's hover column;
- the ground Scythe and the chest's Web Sword have not moved;
- the hopper block is still in place and the Cannon is still inside it, untouched. A hopper is a container only and never a pulled block (`L0-magn-adhp`, `L0-adr-ufnd`); an iron ingot placed in the same hopper is extracted;
- the chest minecart and the armour stand were not selected;
- the iron ingot in the chest was extracted;
- the world holds exactly one live copy of each marked instance, and neither owed list changed.

Negative control: the same scenario with `isLegendaryStack` stubbed to return `false` must fail the "never within 6 blocks" clause. (Reconciled at reduce v4: the earlier control, a hopper pull without `protectLegendariesIn`, has no code path to exercise once the hopper is never a block.)


- **node**: L0-lgnd-ac21

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


- **node**: L0-lgnd-ac22

### Lgnd ac23 concept acceptance criterion (L0-lgnd-ac23)

---
is_a: ["acceptance-criterion"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad14", "L0-lgnd-ac02", "L0-lgnd-ac15", "L0-lgnd-ac17", "L0-lgnd-ac21", "L0-katn"]
see_also: ["dragonkatanaspecv1ruen-part-3"]
---
**AC-lgnd-23: The Dragon Katana is def #4, with its own craft budget (Katana T01–T03, framework side).** Channel: `build` + `bds`.

**Build.**
- `tests/legendary-registry.test.mjs` asserts `keysFor(DRAGON_KATANA).crafted === "andrew:dk_crafted"` and the other `dk_*` keys.
- The uniqueness test covers `itemId`, `keyPrefix`, `abilityKey`, `command`, **`craftTokenId` and `textPrefix`** over all four defs.
- `isLegendaryStack` is true for `andrew:dragon_katana` and `andrew:dragon_katana_crafted`, and false for `minecraft:diamond_sword`.

**BDS.** GIVEN the Web Sword, Scythe and Cannon flags are set and `andrew:dk_crafted` is unset
WHEN Survival player A crafts the Katana (the token reaches the inventory)
THEN exactly one broadcast names A and the localized "Dragon Katana",
AND A holds a marked `andrew:dragon_katana` with origin `craft`,
AND `dk_crafted` is set.

AND after a restart, player B's Survival craft is refunded with exactly 2 golden apples, 2 ender pearls and 1 diamond sword, with `andrew.katana.craft_blocked` and no broadcast.

AND `/give B andrew:dragon_katana` and a Creative copy leave the flag unchanged.
AND `/andrew:katana reset` clears only `dk_crafted`.
AND the other three flags never change.
AND the UFO `ufo:legendary_*` "never pulled" test passes with an added Katana stack, with no edit to `magn`.


- **node**: L0-lgnd-ac23

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
  - in a chest in an Orbital LMB column, and on the ground in an RMB blast and ring AABB, ends up outside the volume with the same id and gen, and no `returned` message.
- **T17, return (C-16, `L0-xcx21`).** A marked Katana entity on cactus, or hit by primed vanilla TNT: afterwards exactly one live Katana exists, either in the owner's inventory with `gen + 1` and `andrew.katana.returned`, or in `dk_owed` if the owner is offline.
- **T18.** A Katana dropped into the Void, or inside a chest minecart that falls into the Void, returns to **`mark.owner`** exactly once. The clause "to the last holder" waits for `L0-xcx11`.
- **Teleport (`r017`).** GIVEN a marked Katana on the ground near P, and P holding a second def's marked stack
  WHEN P activates the Katana 20 blocks away 3 times, then walks until the ground item's chunk unloads and returns
  THEN no `lost`/`returned` log line appears, both gens are unchanged, `dk_owed` is empty and the ground Katana is watched again.
- **Same dimension.** A Katana teleport whose ray reaches the edge of a loaded area stops before the unloaded cell, and the player's `dimension.id` before and after is equal.


- **node**: L0-lgnd-ac24

### Lgnd gl01 concept glossary term (L0-lgnd-gl01)

**Legendary weapon** (легендарное оружие)

An item with an entry in the static `LEGENDARIES` array (`src/legendary/registry.ts`), bound by the shared rules:
- one Survival craft per world, spent only by a craft token, with a first-craft broadcast;
- death retention;
- the destruction policy (prevent / spill / return to the last holder);
- one cooldown per ability, shared by all its activation modes, with a busy deadline;
- hand priority;
- one Action Bar HUD.

Today these are the Web Sword (`andrew:web_sword`), the Scythe of Calamity (`andrew:scythe_of_calamity`) and the Orbital Cannon (`andrew:orbital_cannon`, v3). Shadow Blade is named in the Scythe spec but not specified.

Only **marked** copies get protection. Plain `/give` and Creative copies cast, but are ordinary items (`L0-lgnd-as11`).

**Synonyms:** legendary.


- **node**: L0-lgnd-gl01

### Lgnd gl02 concept glossary term (L0-lgnd-gl02)

**Marked instance / live instance**

**Marked:** an `ItemStack` that carries the `andrew:<p>_origin/_owner/_id` dynamic properties, with origin `craft` or `admin`. Only marked stacks get legendary protection. An unmarked stack, for example from Creative, is an ordinary item.

**Live:** a marked stack whose `_gen` equals the ledger generation. Only live stacks are retained or returned, and a stale marked stack cannot cast.

**Opposite:** stale (see gen).


- **node**: L0-lgnd-gl02

### Lgnd gl03 concept glossary term (L0-lgnd-gl03)

**Instance generation (gen)**

An integer stored on each marked stack (`andrew:<p>_gen`) and in the world ledger (`andrew:<p>_gen:<id>`). The framework bumps it every time it re-issues a lost instance.

A stack whose gen is lower than the ledger's is **stale**: it cannot cast, and it is deleted when a player picks it up. Stacks made before the framework have no gen and read as 0.


- **node**: L0-lgnd-gl03

### Lgnd gl04 concept glossary term (L0-lgnd-gl04)

**Busy (ability state)**

A durable deadline, `andrew:busy_<abilityKey>` in epoch ms, that runs from activation until the end of a multi-tick effect. The Scythe volley is the only one today (`L0-lgnd-ad07` §2). While busy:
- the ability is not ready;
- a repeat Use resolves to nothing, silently;
- the HUD keeps showing the weapon line. There is no separate "active" segment.

If the owner never clears it, for example after a crash, busy expires by itself at the deadline.

It is distinct from **cooldown** (`andrew:cd_<abilityKey>`), which the ability owner starts. The Orbital Cannon never sets busy: its cooldown starts at launch.

**States:** Ready → (Busy) → Cooldown or Ready.


- **node**: L0-lgnd-gl04

### Lgnd gl05 concept glossary term (L0-lgnd-gl05)

**Pending / owed (return tokens)**

Durable tokens that each authorise exactly one grant of an instance.

- **Pending:** per player, stored in `andrew:<p>_pending`. Written on death, redeemed on respawn.
- **Owed:** per world, stored in `andrew:<p>_owed`. Written when an item is lost to the Void or destroyed while its last holder is offline. Redeemed on that player's next join.

The token is removed in the same turn as the grant, and there is never a grant without a token.


- **node**: L0-lgnd-gl05

### Lgnd gl06 concept glossary term (L0-lgnd-gl06)

**Last holder**

The player whose inventory most recently contained a given marked instance. Stored in `andrew:<p>_holder` and updated on `playerInventoryItemChange`.

The last holder is who gets the item back after a Void loss or destruction (Scythe §1, "последнему владельцу"). This is not necessarily the crafter (`owner`). On 0.3.0 stacks the field is absent, and the crafter (`owner`) is used instead.


- **node**: L0-lgnd-gl06

### Lgnd gl07 concept glossary term (L0-lgnd-gl07)

**Refund (blocked craft)**

The after-the-fact reversal of a Survival craft once the weapon's per-world budget is spent (Q-008):
- the unmarked result is removed;
- that weapon's `refundIngredients` are added back to the inventory, and any leftovers spawn at the player's feet.

The base tool comes back as a new stack, so its enchantments and durability are lost. This is a known limitation.


- **node**: L0-lgnd-gl07

### Lgnd gl08 concept glossary term (L0-lgnd-gl08)

**Activation resolver (`resolveActivation`)**

The single function in `src/legendary/hands.ts` that answers "which held legendary does this Use press activate?". The answer is:
- the main hand, if its ability is ready and not busy;
- otherwise, the off hand, if its ability is ready and not busy;
- otherwise, none.

Every ability module calls it and acts only when the answer is its own weapon. It replaces the planned central dispatcher (`L0-lgnd-ad07`).

**Synonyms:** hand-priority resolver.


- **node**: L0-lgnd-gl08

### Lgnd gl09 concept glossary term (L0-lgnd-gl09)

**Craft token** (крафт-токен)

A hidden item such as `andrew:orbital_cannon_crafted` that a legendary recipe outputs in place of the weapon itself.
- It has the weapon's icon and name and is not in the Creative menu.
- The craft gate swaps it, in the same slot, for either a marked weapon (claim) or the refund ingredients (refund).
- This is the only way to spend a weapon's one-per-world Survival craft. Plain `/give` and Creative copies of the weapon never touch the flag (`L0-lgnd-r014`).

**Synonyms:** crafted token, `craftTokenId`.


- **node**: L0-lgnd-gl09

### Lgnd gl10 concept glossary term (L0-lgnd-gl10)

**Activation mode** (`"use"` | `"attack"`)

The kind of input a press is: **use** is RMB, or a tap on iPad; **attack** is LMB, or hold on iPad (`L0-xasm10`).
- Each `LegendaryDef` lists the modes it accepts in `activations`. Only the Orbital Cannon accepts `attack`.
- `resolveActivation(player, mode)` picks the activated weapon:
  - use: main hand, then off hand;
  - attack: main hand only.
- All modes of one weapon share one cooldown.

**Synonyms:** LMB/RMB mode, input mode.


- **node**: L0-lgnd-gl10

### Lgnd gl11 concept glossary term (L0-lgnd-gl11)

**Protection pass (`protectLegendariesIn`)**

A synchronous framework call that a destructive effect makes **before** it removes blocks or explodes.
- It takes live marked legendaries out of the containers in a volume and off the ground in it.
- It re-drops them, as the same stack with the same `gen`, at a safe spot outside the volume.
- If no safe spot exists, it hands them to the holder.

This is tier 1 ("prevent") of the destruction policy (`L0-lgnd-p008`).

**Synonyms:** protect pass, legendary evacuation.


- **node**: L0-lgnd-gl11

### Lgnd gl12 concept glossary term (L0-lgnd-gl12)

**Destruction policy tiers: prevent / spill / return**

How the framework meets "a legendary is not destroyed" (Orbital §5) within the stable API. The first tier that applies wins:
1. **Prevent:** destruction this add-on causes, such as the Cannon, runs the protection pass first, so the item stays in the world.
2. **Spill:** vanilla destruction of a container drops its contents, including the legendary.
3. **Return:** when the engine destroys the item entity (fire, lava, cactus, vanilla TNT, despawn, the Void), the item is re-issued to the last holder with `gen + 1`. This tier is the documented deviation (C-16).

See `L0-lgnd-r012`.


- **node**: L0-lgnd-gl12

### Lgnd gl13 concept glossary term (L0-lgnd-gl13)

---
is_a: ["glossary-term"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad12", "L0-lgnd-p003"]
---
**Departure (in-flight instance)**

A live marked legendary that has just left a player's inventory slot or off hand. Recovery records it in `inFlight` (`recovery.ts:106`) and resolves it after a short grace period.

- If the player swung to drop within ±2 ticks, the instance is searched for: watched ground entities, every player's inventory and off hand, and block containers around the departure cell. Found nowhere means lost, which means returned (v1.4.2 fix `5a68b84`).
- A departure without a drop swing is a store the script cannot see (a shulker item or the ender chest), and is never a loss.

**Synonyms**: in-flight, left-a-slot.


- **node**: L0-lgnd-gl13

### Lgnd gl14 concept glossary term (L0-lgnd-gl14)

---
is_a: ["glossary-term"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad13", "L0-lgnd-r016"]
---
**Legendary stack vs. legendary item entity**

- **Legendary stack** (`isLegendaryStack(stack)`): any `ItemStack` whose type is a registered legendary `itemId` or craft token, in any mark state (marked, unmarked or stale). It answers "is this a legendary weapon?", and the magnet uses it to never pull one.
- **Legendary item entity** (`isLegendaryItemEntity(entity)`): a `minecraft:item` entity carrying a **live marked** instance. It answers "is this a protected instance?", and `ring` drop suppression and `protectLegendariesIn` use it.

An unmarked `/give` copy is a legendary stack but not a legendary item entity.


- **node**: L0-lgnd-gl14

### Lgnd gl15 concept glossary term (L0-lgnd-gl15)

---
is_a: ["glossary-term"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p008", "L0-lgnd-as15", "L0-lgnd-cx13"]
---
**Holder block vs. entity holder**

- **Holder block**: a block type in `HOLDER_TYPES` (`recovery.ts:491`) that can contain a legendary as a stack: chests, barrels, hoppers, droppers, dispensers, the crafter, furnaces, shulker boxes, copper chests, shelves, decorated pots and item frames. `protectLegendariesIn` and the departure search read only these. Writing over one (`setType`, `fillBlocks`, a structure place) erases its contents, so script writers protect first.
- **Entity holder**: an entity that carries stacks: a chest or hopper minecart, an armour stand or a mob hand. Recovery never reads it. Its contents become watchable only when the entity is destroyed and spills them. The UFO magnet must not select one that carries a legendary (`r016`).


- **node**: L0-lgnd-gl15

### Lgnd gl16 concept glossary term (L0-lgnd-gl16)

**Void holder**

An **entity** with an inventory that the engine removes below the dimension floor with no death event and no spill, so its contents never become item entities. As of 1.4.4, `VOID_HOLDER_TYPES` = `minecraft:chest_minecart` and `minecraft:hopper_minecart` (`recovery.ts:135`). Recovery reads their containers in `beforeEvents.entityRemove`. The armour stand is a Void holder that is **not** covered (`cx14`).

**Not the same as:** `HOLDER_TYPES`, the **block** containers that `protectLegendariesIn` empties before a script removes them.


- **node**: L0-lgnd-gl16

### Lgnd gl17 concept glossary term (L0-lgnd-gl17)

**Wielder teleport**

An ability that moves the **player** holding the legendary, rather than a target or the world. The Dragon Katana is the first. It always stays in the player's own dimension and edits no block. To the framework it is invisible: a wielder teleport is not a loss event (`r017`), because the stacks travel inside the player's inventory.

**Synonyms:** self-teleport, Katana blink.


- **node**: L0-lgnd-gl17

### Lgnd gl18 concept glossary term (L0-lgnd-gl18)

**`hudKeys` / uniqueness flag**

- **`hudKeys`.** An optional `LegendaryDef` field that names the weapon's own Action Bar lang keys (`ready`, `cooldown`). They take the same arguments as the shared `andrew.legendary.ready|cooldown` (`%s: Ready` / `%s: %s s`). A def uses them when its spec asks for a different string shape: the Orbital Cannon, and the Katana with "Dragon Katana — Ready".
- **Uniqueness flag (craft flag).** The world dynamic property `andrew:<keyPrefix>_crafted`: `ws`, `sc`, `oc`, and `dk` for the Katana. It is set by the one legal Survival craft, and it persists across restarts. Only `/andrew:<cmd> reset` clears it.

**Synonyms:** Survival craft flag, `crafted` key.


- **node**: L0-lgnd-gl18


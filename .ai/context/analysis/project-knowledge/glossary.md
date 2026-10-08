---
title: Glossary
type: project-knowledge
generated_at: "2026-10-08T18:47:14.720Z"
source_channel: rollout
node_id: rollout-glossary
aliases: ["rollout-glossary","glossary","project-knowledge/glossary"]
is_a: ["rollout","glossary"]
relates_to: ["L0-katn-ac01","L0-katn-ac02","L0-katn-ac03","L0-katn-ac04","L0-katn-ac05","L0-katn-ac06","L0-katn-ac07","L0-katn-ac08","L0-katn-ac09","L0-katn-gl01","L0-katn-gl02","L0-katn-gl03","L0-katn-gl04","L0-katn-gl05","L0-lgnd-ac01","L0-lgnd-ac02","L0-lgnd-ac03","L0-lgnd-ac04","L0-lgnd-ac05","L0-lgnd-ac06","L0-lgnd-ac07","L0-lgnd-ac08","L0-lgnd-ac09","L0-lgnd-ac10","L0-lgnd-ac11","L0-lgnd-ac12","L0-lgnd-ac13","L0-lgnd-ac14","L0-lgnd-ac15","L0-lgnd-ac16","L0-lgnd-ac17","L0-lgnd-ac18","L0-lgnd-ac19","L0-lgnd-ac20","L0-lgnd-ac21","L0-lgnd-ac22","L0-lgnd-ac23","L0-lgnd-ac24","L0-lgnd-ac25","L0-lgnd-ac26","L0-lgnd-ac27","L0-lgnd-gl01","L0-lgnd-gl02","L0-lgnd-gl03","L0-lgnd-gl04","L0-lgnd-gl05","L0-lgnd-gl06","L0-lgnd-gl07","L0-lgnd-gl08","L0-lgnd-gl09","L0-lgnd-gl10","L0-lgnd-gl11","L0-lgnd-gl12","L0-lgnd-gl13","L0-lgnd-gl14","L0-lgnd-gl15","L0-lgnd-gl16","L0-lgnd-gl17","L0-lgnd-gl18","L0-lgnd-gl19","L0-lgnd-gl20","L0-lgnd-gl21","L0-magn-a04","L0-magn-a05","L0-magn-a06","L0-magn-a07","L0-magn-a08","L0-magn-a09","L0-magn-a10","L0-magn-a11","L0-magn-a12","L0-magn-a13","L0-magn-a14","L0-magn-aipd","L0-magn-atps","L0-magn-gcls","L0-magn-gelm","L0-magn-gexm","L0-magn-glat","L0-magn-gring","L0-magn-gtag","L0-magn-gzon","L0-sauc-ac01","L0-sauc-ac02","L0-sauc-ac03","L0-sauc-ac04","L0-sauc-ac05","L0-sauc-ac06","L0-sauc-gl01","L0-sauc-gl02","L0-sauc-gl03","L0-sauc-gl04","L0-sauc-gl05","L0-sclk-ac01","L0-sclk-ac02","L0-sclk-ac03","L0-sclk-ac04","L0-sclk-ac05","L0-sclk-ac06","L0-sclk-ac07"]
priority: 620
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
THEN P receives it with the same id, gen g + 1 and `holder` = P, plus a private `andrew.legendary.recovered` message,
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
WHEN it is destroyed by cactus or a **vanilla** TNT explosion, or despawns (in lava or fire it stays where it lies, same gen, nothing owed)
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

`L0-adr-hold` was accepted by `decision-resolve-l0-xcx11` (2026-09-29); this AC is unbuilt work, filed as `LGND-HOLD` (`L0-adr-hldb`).


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
  - in a chest in an Orbital LMB column, and on the ground in an RMB blast and ring AABB, ends up outside the volume with the same id and gen, and no `andrew.legendary.recovered` message, nothing in `dk_owed`.
- **T17, return (C-16, `L0-xcx21`).** A marked Katana entity on cactus, or hit by primed vanilla TNT: afterwards exactly one live Katana exists, either in the owner's inventory (at their feet if it is full, `retention.ts:270-275`) with `gen + 1` and `andrew.legendary.recovered`, or in `dk_owed` if the owner is offline.
- **T18.** A Katana dropped into the Void, or inside a chest minecart that falls into the Void, returns to **`mark.owner`** exactly once. The clause "to the last holder" waits for `L0-xcx11`.
- **Teleport (`r017`).** GIVEN a marked Katana on the ground near P, and P holding a second def's marked stack
  WHEN P activates the Katana 20 blocks away 3 times, then walks until the ground item's chunk unloads and returns
  THEN no `legendary recovery: … now gen` line appears, both gens are unchanged, `dk_owed` is empty and the ground Katana is watched again.
- **Same dimension.** A Katana teleport whose ray reaches the edge of a loaded area stops before the unloaded cell, and the player's `dimension.id` before and after is equal.


- **node**: L0-lgnd-ac24

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


- **node**: L0-lgnd-ac25

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


- **node**: L0-lgnd-ac26

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


- **node**: L0-lgnd-ac27

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
3. **Return:** when the engine destroys the item entity (cactus, vanilla TNT, despawn, the Void; fire and lava are prevented by `minecraft:fire_resistant`), the item is re-issued to `mark.owner` (last holder waits for `L0-xcx11`) with `gen + 1`. This tier is the documented deviation (C-16).

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

### Lgnd gl19 concept glossary term (L0-lgnd-gl19)

**Passive legendary (passive def)**

A `LegendaryDef` with no ability (`PassiveLegendaryDef`, `hasAbility(def) === false`). It obeys every legendary rule (craft gate, mark, retention, return, protection, magnetism) but has no cooldown or busy key, never claims a Use in `resolveActivation`, and never draws an Action Bar line. The first one is the Sculk Crossbow (def #5). Opposite: **active def** (Web Sword, Scythe, Orbital Cannon, Dragon Katana).

**Synonyms**: no-ability def. Not to be confused with a **stale** copy, which is a voided instance, not a kind of def.


- **node**: L0-lgnd-gl19

### Lgnd gl20 concept glossary term (L0-lgnd-gl20)

**Return target**

The player who receives a legendary after a tier-3 loss (Void, cactus, vanilla TNT, despawn) or a protect hand-back, and whose id keys the `<prefix>_owed` entry when offline. As built at 1.6.1 it is `mark.owner` (the crafter, or the `/give` target of an admin copy). After `LGND-HOLD` it becomes `holder ?? owner` (the last player whose inventory held the stack). GameTests read it through `returnTarget(mark)`.

**Synonyms**: "последний владелец" (spec wording, = last holder); not the same as **owner** (crafter) while the holder is unbuilt.


- **node**: L0-lgnd-gl20

### Lgnd gl21 concept glossary term (L0-lgnd-gl21)

**Magnetic legendary**

A legendary **weapon** stack (any def's `itemId`, marked or not) that the UFO magnet treats like iron since 1.6.0: pulled from the ground and containers, a player holding one is lifted, and a mob or armour stand holding one is a class-3 holder. Decided by `isLegendaryWeaponStack`. A **craft token** is never magnetic. An operator-tuned exception to the UFO spec's "legendaries are never pulled".


- **node**: L0-lgnd-gl21

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


- **node**: L0-magn-a04

### Magn a05 concept acceptance criterion (L0-magn-a05)

**UFO AC-5 (bds).**
- **GIVEN** the following players in the zone during the magnet:
  - C, in Survival, with a stack of iron_ingot in inventory and empty hands;
  - D, in Survival, wearing a full iron armour set with a dirt block in hand;
  - E, in Creative, holding an iron_sword;
  - F, in Spectator, holding an iron_sword;
- **WHEN** 60 ticks pass,
- **THEN** no player's y rises by more than 0.1 blocks, and no player is moved toward the saucer.


- **node**: L0-magn-a05

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


- **node**: L0-magn-a06

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


- **node**: L0-magn-a07

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


- **node**: L0-magn-a08

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


- **node**: L0-magn-a09

### Magn a10 concept acceptance criterion (L0-magn-a10)

**UFO AC-10 (bds).**
- **GIVEN** isolated iron_block, iron_bars, rail, anvil, cauldron, chain and lantern, an iron door (2 high), and one iron_ore, with nothing else in the zone,
- **WHEN** the magnet turns on,
- **THEN**:
  - every source position (both door cells included) is air;
  - exactly one new item entity exists per source: the block's item, one `iron_door`, and one `raw_iron` for the ore;
  - the total count of new item entities in the zone equals the number of sources (9);
  - this holds again 10 ticks later.


- **node**: L0-magn-a10

### Magn a11 concept acceptance criterion (L0-magn-a11)

**UFO AC-11 (bds).**
- **GIVEN** iron_ore 20 blocks below the centre, enclosed in stone, and no other iron in the zone,
- **WHEN** the magnet turns on,
- **THEN**:
  - the ore cell becomes air;
  - one raw_iron entity is spawned there;
  - within 80 ticks it is within 1 block of its ring slot (saucer − 3, r 5);
  - the stone between them is unchanged (no other cell becomes air).


- **node**: L0-magn-a11

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


- **node**: L0-magn-a12

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


- **node**: L0-magn-a13

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


- **node**: L0-magn-a14

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


- **node**: L0-magn-aipd

### Magn atps concept acceptance criterion (L0-magn-atps)

**UFO DoD, "the event does not drop TPS" (bds).**
- **GIVEN** a zone with ≥ 200 chests, a full scan type list, 2 players and 10 + 2 elements,
- **WHEN** a full magnet phase runs,
- **THEN**:
  - the magnet-on tick cost (scan + selection + extraction) is logged and is ≤ 12 ms;
  - the mean per-tick hold step is ≤ 2 ms and p99 ≤ 5 ms;
  - all three numbers are written to the task's run-check artifact.


- **node**: L0-magn-atps

### Magn gcls concept glossary term (L0-magn-gcls)

**Priority class**

The selection tier of a candidate element:
1. ground item;
2. container stack;
3. mob or minecart;
4. built block;
5. ore.

Lower classes fill only the slots that higher classes leave free. Within a class, candidates go nearest to the centre first.

**Built block** means any placed iron block from IRON_BLOCKS (an empty hopper included; one holding anything is a container), natural structures included.


- **node**: L0-magn-gcls

### Magn gelm concept glossary term (L0-magn-gelm)

**Element (magnet element)**

One non-player entity pulled by the UFO magnet. It is one of:
- a ground item stack;
- a stack extracted from one container slot;
- a mob, minecart or armour stand;
- the single item produced from a block or ore.

At most 10 elements are chosen per event, plus exempt drops. Players are never elements.

**Synonyms:** pulled thing, «элемент».


- **node**: L0-magn-gelm

### Magn gexm concept glossary term (L0-magn-gexm)

**Exempt drop (class X)**

An iron item that spawns within 12 blocks of the hover point while the magnet is on, typically one dropped by a held player. It is pulled beyond the 10-element limit.


- **node**: L0-magn-gexm

### Magn glat concept glossary term (L0-magn-glat)

**Magnet-off latch**

The way `requestMagnetOff(reason)` works (`L0-adr-ufpc`). The call only records the request, with reason `"shot"`, `"stop"` or `"abort"`. `ufoc` runs the release (`L0-magn-prel`) at the start of its next interval tick. Every UFO world mutation therefore stays inside the one shared interval, whichever interval detected the shoot-down.

**Synonyms:** release latch.


- **node**: L0-magn-glat

### Magn gring concept glossary term (L0-magn-gring)

**Cloud ring (ring slot)**

The hold formation for elements: evenly spaced slots on a circle of radius 5, 3 blocks below the saucer, rotating slowly. Items are kept ≥ 3 blocks from players to avoid pickup.

**Hold point** (players) is a separate point: 6 blocks below the saucer, on its axis.

**Synonyms:** cloud, «облако», «кольцо».


- **node**: L0-magn-gring

### Magn gtag concept glossary term (L0-magn-gtag)

**`andrew:ufo_iron`**

A transient entity tag that the four `hasitem` selector commands set at magnet-on on mobs and armour stands wearing iron armour. It is used only to fetch them through `getEntities({tags})`, and is removed at release and at world load.


- **node**: L0-magn-gtag

### Magn gzon concept glossary term (L0-magn-gzon)

**Magnet zone**

The cylinder of radius 50 blocks around the event centre (the block under the target player at arrival). It spans vertically from centre − 20 to the hover height, and only loaded chunks count.

**Synonyms:** zone, «зона магнита».


- **node**: L0-magn-gzon

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


- **node**: L0-sauc-ac01

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


- **node**: L0-sauc-ac02

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


- **node**: L0-sauc-ac03

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


- **node**: L0-sauc-ac04

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


- **node**: L0-sauc-ac05

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


- **node**: L0-sauc-ac06

### Sauc gl01 concept glossary term (L0-sauc-gl01)

**Saucer** (тарелка, НЛО)

The single custom entity `andrew:ufo_saucer` that plays the UFO Magnet event: a disc, a dome, rim lights and the beam bone. It is moved only by script, immune to everything, and removed at the end of every event.

**Synonyms:** UFO, flying saucer. Not "UFO event", which is the whole cycle owned by `ufoc`.


- **node**: L0-sauc-gl01

### Sauc gl02 concept glossary term (L0-sauc-gl02)

**Hull** (корпус)

The script-side hit volume of the saucer: a vertical cylinder of radius 6 and height 3 at the saucer's position (`[y, y + 3]`, `L0-sauc-as01`). It exists only in the interceptor test. It is not a collision box, so nothing physically collides with it.

**Synonyms:** hull cylinder, hit volume.


- **node**: L0-sauc-gl02

### Sauc gl03 concept glossary term (L0-sauc-gl03)

**Beam** (луч, луч-магнит)

The translucent green cone under the saucer, visible only during the magnet phase. It is a bone of the saucer model toggled by the actor property `andrew:beam` (`L0-sauc-ad01`). It is purely visual: the magnet's reach is the 50-block zone owned by `magn`, not the cone's footprint.

**Synonyms:** magnet beam, tractor beam.


- **node**: L0-sauc-gl03

### Sauc gl04 concept glossary term (L0-sauc-gl04)

**Interceptor** / **`intercepted` outcome**

A callback registered on the Orbital charge flight loop (`registerInterceptor`, `L0-adr-ufoi`). It sees each charge's swept segment per tick and can end the charge mid-air. The charge then ends with the new `Outcome` value `"intercepted"`: it is removed and no effect runs. The saucer's hull test is the only interceptor.

**Synonyms:** absorption ("the charge is absorbed").


- **node**: L0-sauc-gl04

### Sauc gl05 concept glossary term (L0-sauc-gl05)

**Shoot-down / downed** (сбитие, сбить НЛО)

The terminal branch of an event, started by the first charge that crosses the hull. The steps are:
1. the magnet goes off;
2. `ufoc` enters `downed` and schedules the next arrival at +15 min;
3. a smoking fall of ≤ 3 s;
4. a harmless blast;
5. 8 diamonds + 1 totem;
6. a broadcast naming the **shooter**, the owner of that charge.

**Hover point** (точка зависания): `(centre, hoverY)`, with `hoverY` = centre + 40, capped at ceiling − 4. **Arrival bearing** θ: the random horizontal direction the saucer arrives from. It departs along θ + 180°.


- **node**: L0-sauc-gl05

### Sclk ac01 concept acceptance criterion (L0-sclk-ac01)

**AC-sclk-01 (T01) · First Survival craft** · channel `bds` · the rule is in `lgnd`, this is the crossbow call site

GIVEN a fresh world and a Survival SimulatedPlayer, WHEN a Crafter (a real recipe craft, loaded via `/replaceitem`) is loaded with the pattern ` E / DCD / E ` (E echo shard, D deepslate, C crossbow) and crafts,
THEN:
- the output token becomes one marked `andrew:sculk_crossbow` in the player's inventory;
- the world's `sk` craft flag is set (`L0-adr-sckp`);
- the localized first-craft broadcast names the player.

The same pattern with cobbled deepslate produces nothing.


- **node**: L0-sclk-ac01

### Sclk ac02 concept acceptance criterion (L0-sclk-ac02)

**AC-sclk-02 (T02) · A repeat craft is blocked after a restart** · channel `bds` · the rule is in `lgnd`

GIVEN the `sk` flag was set (ac01) and the BDS was restarted, WHEN the recipe is crafted again in Survival,
THEN:
- no crossbow is produced;
- the token is swapped for the refund (echo shard ×2, deepslate ×2, crossbow ×1);
- the localized `craft_blocked` message is shown.

The proof uses the restart harness: SimulatedPlayers do not survive a restart, so a fresh one is spawned after it.


- **node**: L0-sclk-ac02

### Sclk ac03 concept acceptance criterion (L0-sclk-ac03)

**AC-sclk-03 (T03) · Creative and `/give` do not spend the flag** · channel `bds`

GIVEN the `sk` flag is unset, WHEN `/give @s andrew:sculk_crossbow` runs and a copy is taken from the Creative inventory,
THEN:
- both stacks are usable crossbows (they fire bolts);
- the flag is still unset;
- a following Survival craft still succeeds as a first craft.


- **node**: L0-sclk-ac03

### Sclk ac04 concept acceptance criterion (L0-sclk-ac04)

**AC-sclk-04 (T04) · A shot spawns a bolt with a trail along its real path** · channel `bds` (visual on the iPad: ac23)

GIVEN a shooter SimulatedPlayer with the crossbow and arrows, aimed level at a wall 20 blocks away, WHEN it fires one charged shot,
THEN:
- exactly one `andrew:sculk_bolt` exists and no `minecraft:arrow` survives the spawn tick;
- the bolt's owner is the shooter, and its initial speed is within 5 % of the arrow's;
- the log shows trail emissions on ≥ 5 ticks, at points whose y drops over the flight (they follow gravity, not a straight ray).


- **node**: L0-sclk-ac04

### Sclk ac05 concept acceptance criterion (L0-sclk-ac05)

**AC-sclk-05 (T05) · The trail harms nothing** · channel `bds`

GIVEN a bystander SimulatedPlayer standing 0.6 blocks beside the bolt's line (no collision), plus a column of glass and grass 0.6 blocks off the line, WHEN a bolt flies past both and ends in the Void or expires,
THEN:
- the bystander's health and position are unchanged (an `entityHurt` witness records none);
- no block within 2 of the line changed;
- the record ends as `expired`.


- **node**: L0-sclk-ac05

### Sclk ac06 concept acceptance criterion (L0-sclk-ac06)

**AC-sclk-06 (T06) · A direct hit deals exactly D, and no arrow damage** · channel `bds`

GIVEN an unarmoured target SimulatedPlayer at 20 HP, 8 blocks from the shooter, WHEN one bolt hits it,
THEN:
- its health is exactly `20 − SONIC_BOOM_DAMAGE` (10) after the hit tick, with exactly one `entityHurt` from the shooter;
- no `minecraft:arrow` entity existed during the test.

**Negative control:** with Power V on the crossbow the result is still 10.


- **node**: L0-sclk-ac06

### Sclk ac07 concept acceptance criterion (L0-sclk-ac07)

**AC-sclk-07 (T07) · Difficulty does not change D** · channel `bds`

GIVEN the setup of ac06, WHEN it is repeated at `/difficulty easy` and at `/difficulty hard` (peaceful is skipped: it heals players and empties hostile structures),
THEN the target loses exactly D on each.

The test restores the original difficulty in `finally`.


- **node**: L0-sclk-ac07


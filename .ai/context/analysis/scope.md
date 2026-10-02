---
title: Scope
type: analysis
generated_at: "2026-10-02T19:12:17.161Z"
source_channel: rollout
node_id: rollout-scope
aliases: ["rollout-scope","scope"]
is_a: ["rollout","scope"]
relates_to: ["L0-airs-ac01","L0-airs-ac02","L0-airs-ac03","L0-airs-ac04","L0-airs-ac05","L0-airs-ac06","L0-airs-ac07","L0-airs-ac08","L0-bast-ac01","L0-bast-ac02","L0-bast-ac03","L0-bast-ac04","L0-bast-ac05","L0-bast-ac06","L0-bast-ac07","L0-bast-ac08","L0-bast-ac09","L0-infr-ac01","L0-infr-ac02","L0-infr-ac03","L0-infr-ac04","L0-infr-ac05","L0-infr-ac06","L0-infr-ac07","L0-infr-ac08","L0-infr-ac09","L0-infr-ac10","L0-infr-ac11","L0-lgnd-ac01","L0-lgnd-ac02","L0-lgnd-ac03","L0-lgnd-ac04","L0-lgnd-ac05","L0-lgnd-ac06","L0-lgnd-ac07","L0-lgnd-ac08","L0-lgnd-ac09","L0-lgnd-ac10","L0-lgnd-ac11","L0-lgnd-ac12","L0-lgnd-ac13","L0-lgnd-ac14","L0-lgnd-ac15","L0-lgnd-ac16","L0-lgnd-ac17","L0-lgnd-ac18","L0-lgnd-ac19","L0-lgnd-ac20","L0-lgnd-ac21","L0-lgnd-ac22","L0-loot-ac01","L0-loot-ac02","L0-loot-ac03","L0-loot-ac04","L0-loot-ac05","L0-loot-ac06","L0-loot-ac07","L0-loot-ac08","L0-loot-ac09","L0-loot-ac10","L0-magn-a04","L0-magn-a05","L0-magn-a06","L0-magn-a07","L0-magn-a08","L0-magn-a09","L0-magn-a10","L0-magn-a11","L0-magn-a12","L0-magn-a13","L0-magn-a14","L0-magn-aipd","L0-magn-atps","L0-orbc-ac01","L0-orbc-ac02","L0-orbc-ac03","L0-orbc-ac04","L0-orbc-ac05","L0-orbc-ac06","L0-orbc-ac07","L0-orbc-ac08","L0-orbc-ac09","L0-orbc-ac10","L0-orbc-ac11","L0-orbc-ac16","L0-orbc-ac18","L0-orbc-ac19","L0-pick-ac01","L0-pick-ac02","L0-pick-ac03","L0-pick-ac04","L0-pick-ac05","L0-pick-ac06","L0-pick-ac07","L0-pntr-ac01","L0-pntr-ac02","L0-pntr-ac03","L0-pntr-ac04","L0-pntr-ac05","L0-pntr-ac06"]
priority: 580
---

# Scope

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## _other

### AC — fixed modern appearance, size and randomized rotation (L0-airs-ac01)

# AC — fixed modern appearance, size and randomized rotation

**Links:** `part_of: ["L0-airs"]` · `is_a: ["acceptance-criterion"]`

**GIVEN** a placed Airship instance, **WHEN** it is inspected, **THEN**:
- Its palette is grey/light-grey concrete with intact glass windows and working lights; there is no vine, cobweb, crack, or other decay decoration anywhere on it.
- Its upper hull is a single decorative oval volume containing no chest and no spawner.
- Its overall footprint is 75×13×18 (L×W×H), template `[75, 18, 13]`.
- Across a sample of generated instances, the placed rotation is drawn from {0°, 90°, 180°, 270°} and is not fixed to a single value.

(Spec §5.1; raw tests 24, 25.)


- **level**: 2

### AC — two opposite doors, no assisted ground access (L0-airs-ac02)

# AC — two opposite doors, no assisted ground access

**Links:** `part_of: ["L0-airs"]` · `is_a: ["acceptance-criterion"]`

**GIVEN** a placed Airship, **WHEN** its lower hull is inspected, **THEN** it has exactly 2 doors on opposite sides, and there is no ladder, staircase, lift, waterfall, or teleporter connecting it to the ground. Reaching it is left entirely to the player.

(Spec §5.2; raw test 26.)


- **level**: 2

### AC — interior corridor + 4 rooms, one lamp per room (L0-airs-ac03)

# AC — interior corridor + 4 rooms, one lamp per room

**Links:** `part_of: ["L0-airs"]` · `is_a: ["acceptance-criterion"]`

**GIVEN** a placed Airship, **WHEN** its interior is inspected, **THEN** it has exactly 1 central corridor and 4 small rooms, each room has exactly 1 ceiling lamp, and the spawner cell's light level stays within the engine's spawner-suppression threshold despite the decorative lighting.

(Spec §5.2; raw test 27.)


- **level**: 2

### AC — exactly 10 chests at fixed positions (L0-airs-ac04)

# AC — exactly 10 chests at fixed positions

**Links:** `part_of: ["L0-airs"]` · `is_a: ["acceptance-criterion"]`

**GIVEN** a placed Airship, **WHEN** its chests are counted, **THEN** there are exactly 10: 2 in each of the 4 rooms (8 total) and 2 in the corridor, all at the same template-local positions (rotated per instance) across every instance, each reachable without breaking blocks.

(Spec §5.3; raw test 28.)


- **level**: 2

### AC — exactly one iron-axe Vindicator spawner at the corridor centre (L0-airs-ac05)

# AC — exactly one iron-axe Vindicator spawner at the corridor centre

**Links:** `part_of: ["L0-airs"]` · `is_a: ["acceptance-criterion"]`

**GIVEN** a placed Airship, **WHEN** its spawner is inspected, **THEN** there is exactly 1 `mob_spawner`, positioned at the corridor's centre, and it produces Vindicators equipped with a vanilla iron axe.

(Spec §5.3; raw test 29.)


- **level**: 2

### AC — altitude clearance and rejection over water / near the world ceiling (L0-airs-ac06)

# AC — altitude clearance and rejection over water / near the world ceiling

**Links:** `part_of: ["L0-airs"]` · `is_a: ["acceptance-criterion"]`

**GIVEN** a rolled Airship candidate, **WHEN** its footprint is validated, **THEN**:
- Its bottom sits at least 40 blocks above the highest terrain point (including trees) under its whole rotated footprint, with a target clearance of 40–70 blocks where the build height allows it.
- A candidate whose footprint is significantly over open water is rejected.
- A candidate that cannot fit below the world ceiling even at the minimum 40-block clearance is rejected, with no downgrade below 40.

(Spec §5.4; raw tests 30, 31.)


- **level**: 2

### AC — independent generation at 2 % on suitable land chunks only (L0-airs-ac07)

# AC — independent generation at 2 % on suitable land chunks only

**Links:** `part_of: ["L0-airs"]` · `is_a: ["acceptance-criterion"]`

**GIVEN** a large enough sample of newly discovered Overworld chunks with no Windmill involved, **WHEN** independent Airship generation is measured statistically, **THEN** the observed rate on suitable chunks (land, valid footprint, no collision) is consistent with a 2 % per-chunk roll, and no Airship appears on an unsuitable chunk (open water, colliding, or failing the altitude/ceiling check).

(Spec §5.5; raw test 32.)


- **level**: 2

### AC — the Windmill-linked attempt runs regardless of a nearby independent Airship (L0-airs-ac08)

# AC — the Windmill-linked attempt runs regardless of a nearby independent Airship

**Links:** `part_of: ["L0-airs"]` · `is_a: ["acceptance-criterion"]`

**GIVEN** a Windmill instance that already has an independent Airship within 100 blocks of it, **WHEN** that Windmill's `afterPlace` hook runs, **THEN** `airs` still performs its own linked-attempt search in the 40–100-block ring — the existing independent Airship does not substitute for, skip, or block the linked attempt — and the two Airships, if the linked attempt also succeeds, do not physically overlap.

(Spec §5.6; raw test 33.)


- **level**: 2

### Bast ac01 concept acceptance criterion (L0-bast-ac01)

**AC-bast-01** (spec test 51)

The rate belongs to `L0-strf-r002` §1 and is proven by `tests/structures-roll.test.mjs:148`.

GIVEN a statistically sufficient sample of suitable Nether chunks,
WHEN candidate generation runs,
THEN `StructureDef.chance = 0.05` (`src/structures/config.ts:27`) — no exact-match requirement is imposed on small samples.

**Source:** §14.7 test 51.


- **level**: 2

### Bast ac02 concept acceptance criterion (L0-bast-ac02)

**AC-bast-02** (spec test 52)

GIVEN suitable terrain in any Nether biome,
WHEN a candidate rolls,
THEN generation proceeds regardless of biome identity;
AND GIVEN a candidate site over a lava ocean,
WHEN evaluated,
THEN generation never occurs there.

**Source:** §14.7 test 52.


- **level**: 2

### Bast ac03 concept acceptance criterion (L0-bast-ac03)

**AC-bast-03** (spec test 53)

GIVEN a generated Mini Bastion,
WHEN measured,
THEN its footprint is ~20×20, height ~10-12, with 2-3 levels;
AND across multiple instances, all four rotations (0°/90°/180°/270°) are observed.

**Source:** §14.7 test 53.


- **level**: 2

### Bast ac04 concept acceptance criterion (L0-bast-ac04)

**AC-bast-04** (spec test 54)

GIVEN a generated Mini Bastion,
WHEN the treasure room is inspected,
THEN it sits centrally/low with ordinary vanilla lava behavior (bucketable, blockable, water-reactive);
AND both access methods work: building/routing a safe path through the lava area, and descending/falling from the level above.

**Source:** §14.7 test 54.


- **level**: 2

### Bast ac05 concept acceptance criterion (L0-bast-ac05)

**AC-bast-05** (spec test 55)

GIVEN a generated Mini Bastion,
WHEN all chests are counted,
THEN there are exactly 10: 3 treasure chests in the center + 7 regular chests elsewhere in the structure.

**Source:** §14.7 test 55.


- **level**: 2

### Bast ac06 concept acceptance criterion (L0-bast-ac06)

**AC-bast-06** (spec test 56)

GIVEN the treasure room,
WHEN inspected,
THEN it contains a random count of 2-4 Gold Blocks.

**Source:** §14.7 test 56.


- **level**: 2

### Bast ac07 concept acceptance criterion (L0-bast-ac07)

**AC-bast-07** (spec test 57)

GIVEN a freshly initialized Mini Bastion,
WHEN the guard roster is counted,
THEN there are 7-10 regular Piglins + exactly 2 Piglin Brutes, zero Hoglins,
AND one Brute is positioned at/guarding the treasure room.

**Source:** §14.7 test 57.


- **level**: 2

### Bast ac08 concept acceptance criterion (L0-bast-ac08)

**AC-bast-08** (spec test 58)

GIVEN a Mini Bastion with guards killed, loot taken, and lava altered,
WHEN the server restarts,
THEN none of those changes revert — guards are not respawned, loot is not refilled, and altered lava/blocks stay altered.

**Source:** §14.7 test 58.


- **level**: 2

### Bast ac09 concept acceptance criterion (L0-bast-ac09)

**AC-bast-09** (spec test 59)

GIVEN a candidate site that physically intersects another detected structure (custom or vanilla, including a real Bastion Remnant),
WHEN the candidate is evaluated,
THEN generation is cancelled outright with no relocation attempt and no damage to the existing structure (`L0-strf-r006`).

**Source:** §14.7 test 59, §15.


- **level**: 2

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

### Infr ac08 concept acceptance criterion (L0-infr-ac08)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-infr-p005"]`

GIVEN checked-in structure layout sources, WHEN the structure-compilation step of `npm run build` runs, THEN it emits one `.mcstructure` file per structure under `packs/behavior/structures/andrew/`, and a round-trip unit test confirms each file's chest/spawner/shrieker/door counts and footprint bounds match its source definition, for all four structures. [src: L0-adr-tmpl; L0-infr-p005]


- **level**: 2

### Infr ac09 concept acceptance criterion (L0-infr-ac09)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-infr-p006"]`

GIVEN a template built into the pack, WHEN the BDS/GameTest placement test places it via `structureManager.place` in each of the 4 rotations (0/90/180/270) in the `gametest` world, THEN in-world block-entity counts and states (chest count, spawner `EntityIdentifier`, shrieker `can_summon`) match the compiled template in every rotation. [src: L0-adr-tmpl; L0-infr-p006]


- **level**: 2

### Infr ac10 concept acceptance criterion (L0-infr-ac10)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-infr-p006", "L0-infr-as03"]`

GIVEN the statistical chunk-roll check drives `strf`'s roll formula over a large synthetic sample of chunk coordinates per structure, WHEN the harness tallies successful rolls, THEN the observed rate falls inside the configured tolerance band of that structure's chance constant, and the run exits 0/1 by that verdict alone, with no human eye needed. [src: L0-adr-strc; L0-infr-p006; L0-infr-as03]


- **level**: 2

### Infr ac11 concept acceptance criterion (L0-infr-ac11)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-infr-p007", "L0-infr-as04"]`

GIVEN a `gametest` world where at least one structure has completed one-time init, WHEN the BDS server process is restarted without re-staging the world, THEN no chest/spawner/guard/marker is duplicated and the instance registry's `placed`/`lootFilled`/`guardsSpawned` flags are byte-identical before and after the restart. [src: L0-adr-strs; C-7; L0-infr-p007; L0-infr-as04]


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
THEN P receives it with the same id, gen g + 1 and `holder` = P, plus a private `andrew.orbital.returned` message,
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
WHEN it burns in lava or fire, is destroyed by cactus or a **vanilla** TNT explosion, or despawns
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

Pending the client's confirmation of `L0-adr-hold`.


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

### Loot ac01 concept acceptance criterion (L0-loot-ac01)

GIVEN a Windmill or Airship chest is initialized, WHEN the fill algorithm runs, THEN it performs between 5 and 12 fill attempts inclusive, and each individual attempt yields at most one loot category (never zero-or-more-than-one simultaneous categories from a single attempt).

Source: spec AC34.


- **level**: 2

### Loot ac02 concept acceptance criterion (L0-loot-ac02)

GIVEN repeated custom-table fills across many chests, WHEN Sticks/Logs/Iron Ingot/Copper Ingot/Gold Ingot/Diamond categories are selected, THEN their quantities fall within 2–8 / 2–6 / 2–8 / 3–10 / 1–5 / 1–3 respectively, on every occurrence.

Source: spec AC35.


- **level**: 2

### Loot ac03 concept acceptance criterion (L0-loot-ac03)

GIVEN a statistically sufficient sample of equipment-category rolls (armor, sword, axe; enchanted and unenchanted) across many chests, WHEN material is rolled, THEN iron appears in ~80% and diamond in ~20% of rolls (no exact-match requirement on small samples — statistical tolerance, not a per-roll assertion).

Source: spec AC36.


- **level**: 2

### Loot ac04 concept acceptance criterion (L0-loot-ac04)

GIVEN multiple armor-category attempts succeed in the same chest, WHEN slots are rolled, THEN identical armor pieces (e.g. two diamond helmets) are permitted to co-occur in one chest — the implementation must not de-duplicate or reject repeats.

Source: spec AC37.


- **level**: 2

### Loot ac05 concept acceptance criterion (L0-loot-ac05)

GIVEN any Enchanted Armor/Sword/Axe roll from the custom table, WHEN its enchantments are inspected, THEN none of them is a curse (Curse of Binding, Curse of Vanishing), and every enchantment level present is within that enchantment's vanilla maximum.

Source: spec AC38, §3.3.


- **level**: 2

### Loot ac06 concept acceptance criterion (L0-loot-ac06)

GIVEN a full custom-table chest fill (5–12 attempts), WHEN the resulting contents are inspected, THEN at most one Golden Apple stack exists, its quantity is 1–3, it is always a regular (never Enchanted) Golden Apple, and Enchanted Golden Apple never appears via the custom table.

Source: spec AC39, §3.3.


- **level**: 2

### Loot ac07 concept acceptance criterion (L0-loot-ac07)

GIVEN a chest where Diamonds is selected on more than one attempt, WHEN contents are inspected, THEN multiple Diamond stacks/successes are permitted in the same chest (unlike Golden Apple).

Source: spec AC40.


- **level**: 2

### Loot ac08 concept acceptance criterion (L0-loot-ac08)

GIVEN any structure chest (custom or vanilla path) whose contents have already been rolled, WHEN the chest is reopened, the chunk is unloaded/reloaded, or the server restarts, THEN its contents are unchanged — no re-roll, no refill.

Source: spec §2, §3 preamble, §13.6/§13.7, §15.


- **level**: 2

### Loot ac09 concept acceptance criterion (L0-loot-ac09)

GIVEN Mini Warden City's 40 chests, WHEN their contents are inspected, THEN all 40 use the real vanilla `chests/ancient_city` loot table unmodified — including the normal possibility of rare vanilla drops such as Enchanted Golden Apple or Swift Sneak books — and the custom weighted table is never applied to them.

Source: spec §13.6, AC48.


- **level**: 2

### Loot ac10 concept acceptance criterion (L0-loot-ac10)

GIVEN Mini Bastion's 10 chests, WHEN their contents are inspected, THEN the 3 central treasure chests draw from vanilla `chests/bastion_treasure` and the 7 distributed chests draw from vanilla `chests/bastion_other`, with no custom-table influence on either.

Source: spec §14 addendum, AC55 (loot portion — chest counts/gold blocks/guards belong to `L0-bast`, not this component).


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

### AC-orbc-01 · Item components: no durability, not enchantable, punch damage, stack of 1 `[bds]` (L0-orbc-ac01)

# AC-orbc-01 · Item components: no durability, not enchantable, punch damage, stack of 1 `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r001", "L0-orbc-ent1"]`

**GIVEN** `new ItemStack("andrew:orbital_cannon")`.

**THEN**
- `getComponent("minecraft:durability")` is undefined.
- `getComponent("minecraft:enchantable")` is undefined, or `canAddEnchantment` is false for sharpness and unbreaking.
- `maxAmount === 1`.
- A static JSON test asserts the absence of `damage`, `digger`, `use_modifiers` and `shooter`, and the presence of `icon: fishing_rod` and `menu_category.category: equipment`.
- **Punch:** P hits a zombie with the Cannon, and the health lost equals the loss from an empty-hand hit in the same setup (1.0). P uses the Cannon 50 times, and the stack is still the same instance with the same mark `id`, with no wear.
- The recipe JSON matches `r002`'s shape exactly (a static test).


- **level**: 2

### AC-orbc-02 · Look, no fishing, anvil and table refuse it, Creative placement `[ipad]` (manual) (L0-orbc-ac02)

# AC-orbc-02 · Look, no fishing, anvil and table refuse it, Creative placement `[ipad]` (manual)

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-xcx13", "L0-orbc-r001"]`

On the iPad, on the current stable client:
1. The inventory icon is indistinguishable from a vanilla fishing rod placed beside it.
2. In hand, it reads as a rod. A screenshot goes into the task, per `xcx13`.
3. Tapping use in the air or on water casts **no** bobber, and nothing is ever caught.
4. The enchanting table does not accept it into the slot. In the anvil, the Cannon plus an enchanted book gives no result.
5. It appears under Creative → Equipment, and search "Orbital" finds it.
6. The name is shown as "Orbital Cannon" (EN) and "Орбитальная пушка" (RU).
7. The recipe book shows the TNT-cross recipe.

**Not auto-verifiable.** The orchestrator must not close it from a `bds` run (memory: "Orchestrator auto-verifies manual criteria").


- **level**: 2

### AC-3 · With no block within 10, nothing fires and no cooldown starts `[bds]` (L0-orbc-ac03)

# AC-3 · With no block within 10, nothing fires and no cooldown starts `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r004", "L0-orbc-r003"]`

**GIVEN**
- a SimulatedPlayer P in Survival, holding the Cannon, with no cooldown;
- P facing open sky, with the nearest block along the view ray 11 or more blocks away. A variant looks at water only, or at tall grass with air behind it within 10.

**WHEN** P uses the item (RMB) and attacks (LMB, a forced `entityHitBlock` path).

**THEN**
- No `andrew:orbital_charge` exists in the dimension.
- `andrew:cd_orbital_cannon` on P is unset or unchanged.
- No chat or title message was sent to P.
- An immediate retry facing a block at distance 9.5 **succeeds**: one charge exists and the cooldown is set.


- **level**: 2

### AC-4 · Spawn height is +30 in the Overworld and End and +10 in the Nether, with the ceiling clamped `[bds]` (L0-orbc-ac04)

# AC-4 · Spawn height is +30 in the Overworld and End and +10 in the Nether, with the ceiling clamped `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r007", "L0-orbc-cx03"]`

**GIVEN** the stub effect, which records `spawnY` and does not break blocks, and a target block T.

**THEN**
| Case | Expected spawn Y |
|---|---|
| Overworld, T.y = 64 | 94 |
| End, T.y = 60 | 90 |
| Nether, T.y = 40 | 50 |
| Overworld, T.y = 300 | 319 (clamped) |
| Nether, T.y = 120 | 127 (clamped) |

- The charge's (x, z) equals T's column centre.
- Every case is a pure unit test of `spawnY(dimId, T.y, heightRange)`, plus one BDS run per dimension that reads the entity position in the spawn tick.


- **level**: 2

### AC-5 · A charge spawned inside a solid block detonates at once `[bds]` (L0-orbc-ac05)

# AC-5 · A charge spawned inside a solid block detonates at once `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r008", "L0-orbc-p002"]`

**GIVEN**
- a stone block placed exactly at the computed spawn cell (T.y + 30) above target T;
- the stub effect, which records `(point, tick)`.

**WHEN** P fires at T.

**THEN**
- `onDetonate` is called once, in the activation tick, with `point` equal to the stone block's location.
- No charge entity remains one tick later.
- A control run with air at the spawn cell detonates at T (the top contact) after ≥ 1 tick.


- **level**: 2

### AC-6 · Entities do not stop falling charges `[bds]` (L0-orbc-ac06)

# AC-6 · Entities do not stop falling charges `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r008"]`

**GIVEN**
- target T on flat stone.
- In T's column, between T+5 and T+15, three things lie in the charge's path:
  - a second SimulatedPlayer Q in Creative flight;
  - a named `minecraft:cow` (summoned with a name, so it persists) kept in place with a slowness effect;
  - a boat.

**WHEN** P fires at T with the stub effect.

**THEN**
- `onDetonate.point` equals T, not Q's, the cow's or the boat's position.
- The charge's Y, sampled per tick, decreases monotonically through the entities' Y.
- Q, the cow and the boat are not displaced by the charge. Their position change is below 0.05 while it passes.

**Variant:** water 5 deep above T. `point` equals T (the stone floor), not the water surface.


- **level**: 2

### AC-orbc-07 · A charge falling into the Void vanishes with no effect and keeps the cooldown `[bds]` (L0-orbc-ac07)

# AC-orbc-07 · A charge falling into the Void vanishes with no effect and keeps the cooldown `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r009", "L0-orbc-r005"]`

**GIVEN**
- In the End: a single block T at y = 60 with nothing below it.
- The test calls the core's `spawnCharge` hook directly at a column offset one block beside T, so the column is empty down to `heightRange.min`.

**WHEN** the charge falls.

**THEN**
- No `onDetonate` is called.
- The entity is gone once its Y would pass below `heightRange.min`.
- P's cooldown remaining is still greater than 0.
- No `andrew:orbital_charge` entity remains in the dimension.


- **level**: 2

### AC-orbc-08 · Touch input and aim on the iPad `[ipad]` (manual) (L0-orbc-ac08)

# AC-orbc-08 · Touch input and aim on the iPad `[ipad]` (manual)

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-xcx8", "L0-orbc-cx02", "L0-xasm10", "L0-orbc-ad01"]`

**Blocked** until `L0-xq5` is answered. The THEN lines below are for option 1 (LMB within reach, RMB up to 10). Rewrite them if the answer is different.

On the iPad with the default touch controls, using the stub effect (one sound at detonation):
1. **Tap** on a highlighted block 3 blocks away → one RMB attack lands on **that** block, the tapped one.
2. **Hold** on a highlighted block 3 blocks away → one LMB attack. The block is not mined, even when the hold continues.
3. A block 8 blocks away with RMB (by the gesture that `cx02` settles) → the attack lands on the block under the crosshair/aim.
4. Each gesture gives exactly one attack and one cooldown. There is never a double shot from tap-plus-hold (`r006`).
5. Tapping the sky gives no sound, no text and no HUD change.

Record the actual outcome of each case in the task, and the deviation note (`r013`).


- **level**: 2

### AC-orbc-09 · One activation per tick; the target is locked; hits count on any face `[bds]` (L0-orbc-ac09)

# AC-orbc-09 · One activation per tick; the target is locked; hits count on any face `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r006", "L0-orbc-r003", "L0-orbc-ent2"]`

1. **Dedup.** P's handlers receive `itemUse`, `itemUseOn` and `entityHitBlock` for the same tick. The test drives the core's input entry with three synthetic calls. Exactly one attack is registered, and its mode is the first call's.
2. **Lock.** P fires at T. On the next tick P turns 180° and moves 5 blocks. The charge's (x, z) still equals T's column, and `onDetonate.point` equals T.
3. **Faces.** P looks at T's bottom face from a cave below, at T's side from 4 blocks, and at the top from above. Each gives `target == T.location`, not the adjacent air block.
4. **Passable.** Tall grass stands in front of stone S at a distance of 6. The target is S.


- **level**: 2

### AC-orbc-10 · The HUD shows Ready or the countdown in either hand (L0-orbc-ac10)

# AC-orbc-10 · The HUD shows Ready or the countdown in either hand

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r012", "L0-orbc-cx01", "L0-lgnd-cx08"]`

**`[bds]`** Call `hudMessage(P)`:
- The Cannon in the main hand with no cooldown gives rawtext `andrew.legendary.ready` with the Cannon's name.
- After firing, at t+60, it gives `andrew.legendary.cooldown` with `27`.
- With the Cannon in the off hand only, the same output. This needs `allow_off_hand` (`lgnd-cx08`).
- Holding no Cannon gives `undefined`.
- Player Q, who has not fired, gets Ready at the same moment.

**`[ipad]`** (manual): in EN and RU, the Action Bar text matches the wording `cx01` settles, for example `Orbital Cannon — Ready` and `Орбитальная пушка — 27с`. It updates about twice a second.


- **level**: 2

### AC-orbc-11 · No leftovers and no idle loop `[bds]` (L0-orbc-ac11)

# AC-orbc-11 · No leftovers and no idle loop `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-p003", "L0-orbc-p002", "L0-orbc-ad02"]`

**GIVEN** three players each fire RMB in the same tick, using a stub `ring.layout` that returns 160 columns.

**THEN**
- 480 charges exist in the spawn tick.
- Once every charge has detonated or voided, the count of `andrew:orbital_charge` is 0, and the core's registry holds 0 attacks.
- The job handle is released. `system.clearJob` was reached, or the generator returned.
- The mean added script time per tick while the charges are live stays within the budget `ring` publishes (C-5a′). It is measured with `system.currentTick` deltas against a control run.
- A world startup with a pre-placed `andrew:orbital_charge`, left over from a crash, removes it within 1 s.


- **level**: 2

### AC-16 · The shared 30 s cooldown starts at once and blocks both modes `[bds]` (L0-orbc-ac16)

# AC-16 · The shared 30 s cooldown starts at once and blocks both modes `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r005", "L0-orbc-r006"]`

**GIVEN** two SimulatedPlayers, P and Q, each holding a Cannon with no cooldown, and a target within 10.

**WHEN** P fires RMB at tick t.

**THEN**
- In tick t, before any charge has moved, P's `remainingTicks` is between 599 and 600.
- At t+20, P's LMB and RMB each create **no** new charge, and the charge count is unchanged.
- At t+20, Q's RMB succeeds. Q's cooldown is independent (C-20).
- At t+600, P's LMB succeeds.
- Reverse order: the first shot is LMB, and RMB is blocked.
- The cooldown is set even if the charge later voids or its chunk unloads (covered by `ac07` and `ac19`).


- **level**: 2

### AC-18 · The owner dying, logging out or changing dimension does not cancel charges `[bds]` (L0-orbc-ac18)

# AC-18 · The owner dying, logging out or changing dimension does not cancel charges `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r010", "L0-orbc-p003"]`

**GIVEN**
- P fires RMB at a target 1 block high with the stub effect, so the fall is about 30 ticks.
- Observer Q stands near the target and keeps the area loaded.

**WHEN**, in three separate runs, P is killed, disconnected, or teleported to the Nether one tick after firing.

**THEN**
- In every run, every charge reaches `onDetonate`, at the same points as a control run where P does nothing.
- The ownerId passed equals P's id.
- The detonations happen in the Overworld.
- No charge appears in P's new dimension.


- **level**: 2

### AC-19 · Unload and shutdown discard in-flight charges and refund nothing `[bds]` (L0-orbc-ac19)

# AC-19 · Unload and shutdown discard in-flight charges and refund nothing `[bds]`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-orbc-r011", "L0-orbc-p003", "L0-orbc-ad03"]`

**Unload run**
- **GIVEN** P fires at a target, and in the next tick P and every other player are teleported more than 300 blocks away, so the area unloads.
- **WHEN** 200 ticks pass and P returns.
- **THEN**
  - no `onDetonate` was ever called for that attack;
  - after the chunk reloads, no `andrew:orbital_charge` entity exists there (the `entityLoad` sweep);
  - the target block is intact;
  - P's cooldown was not cleared early.

**Restart run** (BDS `stop`, then restart on the checks instance on port 19136)
- **GIVEN** P fires, and the server stops within 10 ticks.
- **THEN**, after the restart:
  - no charge entity exists in the loaded area;
  - no late detonation happens in the next 100 ticks;
  - P's `andrew:cd_orbital_cannon` deadline equals its pre-stop value, so the cooldown persisted.


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

GIVEN a fresh `andrew:miners_pickaxe` ItemStack, WHEN queried in-engine, THEN `ItemEnchantableComponent.canAddEnchantment === true`, `canAddEnchantment` accepts unbreaking and efficiency and refuses sharpness, and `minecraft:durability` is absent. [channel: bds; src: `SELFTEST-01-AA` / `src/selftest/main.ts` `pickaxe-enchantable`]


- **level**: 2

### Pick ac07 concept acceptance criterion (L0-pick-ac07)

GIVEN `copper_ore`, `deepslate`, and `ancient_debris` placed in the GameTest structure, WHEN each is broken with `andrew:miners_pickaxe` vs. a real `minecraft:diamond_pickaxe` in the same run, THEN the pickaxe finishes within `SPEED_TOLERANCE_TICKS` (4) of vanilla and within `BREAK_LIMIT_TICKS` (300). [channel: bds; src: `src/gametest/main.ts` `pickaxe_digs_at_diamond_speed`, L864-962]


- **level**: 2

### AC-7 (bds) · Irregular ~5×5 column to the bottom (L0-pntr-ac01)

**GIVEN** an Overworld test area of stone from y=80 down to bedrock. It contains a 3×3 water pocket at y=40 and a bedrock block placed at y=20 in the column centre, and the column is seeded with a fixed `attackId`.
**WHEN** an LMB charge detonates on the stone at y=80.
**THEN**, after the removal job reports done:
- every cell of `planColumn(attackId)` between y=80 and `heightRange.min` that was stone is air;
- no cell outside the plan changed (except by liquid flow);
- the 3×3 core is air on every layer, and at least one layer is not a perfect 5×5 square;
- per-layer removed counts are within 9…33;
- the placed bedrock at y=20 and the bottom bedrock are still bedrock;
- the stone directly below the placed bedrock (y=19) is air, so the column did not stop;
- the water cells are still water or have flowed; none were turned into air by the script.


- **level**: 2

### AC-7 (bds) · Works in Nether and End; keep list holds (L0-pntr-ac02)

**GIVEN** three test columns:
- (a) Nether: netherrack from y=100 to 0, with a lava cell at y=50;
- (b) End: end stone, with an `end_portal_frame` and a `barrier` placed in the column;
- (c) Overworld: a waterlogged oak fence in the column.

**WHEN** an LMB detonates on the top of each.

**THEN**:
- (a) all netherrack in the plan down to y=0 is gone, the Nether bottom bedrock and the lava remain, and the column reaches y=0;
- (b) the frame and the barrier remain, and the end stone below them is gone;
- (c) the fence cell is `minecraft:water`.

The unit test for `PENETRATOR_KEEP` equals the `xasm6` list exactly.


- **level**: 2

### AC-8 (bds) · Obsidian, portal, containers, spawners removed with no drops (L0-pntr-ac03)

**GIVEN** the column plan contains:
- obsidian and crying obsidian;
- a lit Nether portal (frame and `portal` blocks);
- a chest filled with 27 cobblestone stacks, a barrel, a placed shulker box with items, and a furnace with output;
- a `mob_spawner` and reinforced deepslate.

A snapshot of the `minecraft:item` and `minecraft:xp_orb` entity ids in a 9×9 AABB around the column is taken before the LMB.

**WHEN** an LMB detonates above them.

**THEN**:
- every listed block in the plan is air;
- the portal blocks outside the plan are gone too (vanilla invalidation);
- **zero** new item or XP entities exist in the plan cells' AABB after the job plus 20 ticks.

Neighbour pops outside the plan are excluded (`L0-pntr-as06`).


- **level**: 2

### AC-8 (bds) · Legendary in a column container survives exactly once (L0-pntr-ac04)

**GIVEN** two players, A (the owner) and B.
- Chest X lies in the column plan and contains a Web Sword crafted by B and ordinary items.
- Chest Y lies in the column of a *second* LMB fired by B in the same tick, and its column overlaps A's column.

**WHEN** both LMBs detonate.

**THEN**:
- the world plus all inventories hold exactly **one** instance of the Web Sword, with the same mark id and generation;
- it lies as an item entity outside every column's footprint, or is delivered by `lgnd`'s rules;
- the ordinary items are gone;
- no second copy appears after a restart.

**AND** if `protectLegendariesIn` is mocked to throw, the container cell is **kept** and still holds the sword.


- **level**: 2

### AC-9 (bds) · No direct damage; environment still harms (L0-pntr-ac05)

**GIVEN**:
- a zombie and simulated player B standing on the detonation surface inside the plan, each at full health;
- a cow on a 1-block ledge beside the column but outside the plan;
- the owner A standing 6 blocks away.

**WHEN** the LMB detonates.

**THEN**:
- in the detonation tick and the next tick, no entity receives damage (no `entityHurt` event with any cause from `pntr`), and the cow and A do not move;
- the zombie and B then fall and take fall damage (`entityHurt` with cause `fall`);
- if lava is placed at the rim, an entity that ends up in it takes `lava` damage.

Note: the simulated player is only valid on the gametest pack (memory: SimulatedPlayer limits). Real-player feel belongs to `L0-pntr-ac08`.


- **level**: 2

### AC-10 (bds) · One sound, 20-tick wave, nothing left behind (L0-pntr-ac06)

**GIVEN** a spy wrapped around `dimension.playSound` and `dimension.spawnParticle` in the gametest build.
**WHEN** one LMB detonates on a 140-layer column.
**THEN**:
- `playSound` was called exactly once, with `random.explode`, at the detonation point, in the detonation tick;
- `spawnParticle` calls span exactly 20 consecutive ticks starting at the detonation tick;
- the per-tick call count is ≤ 16;
- the particle y-coordinates are non-increasing across ticks, and the last tick includes `bottom`;
- 25 ticks after detonation, no `pntr` job is running, and the entity count in the column AABB equals the pre-attack count minus entities that fell out.


- **level**: 2


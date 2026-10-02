---
title: Glossary
type: project-knowledge
generated_at: "2026-10-02T19:12:16.990Z"
source_channel: rollout
node_id: rollout-glossary
aliases: ["rollout-glossary","glossary","project-knowledge/glossary"]
is_a: ["rollout","glossary"]
relates_to: ["L0-airs-ac01","L0-airs-ac02","L0-airs-ac03","L0-airs-ac04","L0-airs-ac05","L0-airs-ac06","L0-airs-ac07","L0-airs-ac08","L0-airs-g001","L0-airs-g002","L0-airs-g003","L0-airs-g004","L0-airs-g005","L0-bast-ac01","L0-bast-ac02","L0-bast-ac03","L0-bast-ac04","L0-bast-ac05","L0-bast-ac06","L0-bast-ac07","L0-bast-ac08","L0-bast-ac09","L0-bast-gl01","L0-bast-gl02","L0-bast-gl03","L0-bast-gl04","L0-bast-gl05","L0-infr-ac01","L0-infr-ac02","L0-infr-ac03","L0-infr-ac04","L0-infr-ac05","L0-infr-ac06","L0-infr-ac07","L0-infr-ac08","L0-infr-ac09","L0-infr-ac10","L0-infr-ac11","L0-infr-g001","L0-infr-g002","L0-infr-g003","L0-infr-g004","L0-infr-g005","L0-infr-g006","L0-infr-g007","L0-infr-g008","L0-infr-g009","L0-lgnd-ac01","L0-lgnd-ac02","L0-lgnd-ac03","L0-lgnd-ac04","L0-lgnd-ac05","L0-lgnd-ac06","L0-lgnd-ac07","L0-lgnd-ac08","L0-lgnd-ac09","L0-lgnd-ac10","L0-lgnd-ac11","L0-lgnd-ac12","L0-lgnd-ac13","L0-lgnd-ac14","L0-lgnd-ac15","L0-lgnd-ac16","L0-lgnd-ac17","L0-lgnd-ac18","L0-lgnd-ac19","L0-lgnd-ac20","L0-lgnd-ac21","L0-lgnd-ac22","L0-lgnd-gl01","L0-lgnd-gl02","L0-lgnd-gl03","L0-lgnd-gl04","L0-lgnd-gl05","L0-lgnd-gl06","L0-lgnd-gl07","L0-lgnd-gl08","L0-lgnd-gl09","L0-lgnd-gl10","L0-lgnd-gl11","L0-lgnd-gl12","L0-lgnd-gl13","L0-lgnd-gl14","L0-lgnd-gl15","L0-loot-ac01","L0-loot-ac02","L0-loot-ac03","L0-loot-ac04","L0-loot-ac05","L0-loot-ac06","L0-loot-ac07","L0-loot-ac08","L0-loot-ac09","L0-loot-ac10","L0-loot-gl01","L0-loot-gl02","L0-loot-gl03","L0-loot-gl04","L0-loot-gl05","L0-magn-a04"]
priority: 580
---

# Glossary

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

### AC — fixed modern appearance, size and randomized rotation (L0-airs-ac01)

# AC — fixed modern appearance, size and randomized rotation

**Links:** `part_of: ["L0-airs"]` · `is_a: ["acceptance-criterion"]`

**GIVEN** a placed Airship instance, **WHEN** it is inspected, **THEN**:
- Its palette is grey/light-grey concrete with intact glass windows and working lights; there is no vine, cobweb, crack, or other decay decoration anywhere on it.
- Its upper hull is a single decorative oval volume containing no chest and no spawner.
- Its overall footprint is 75×13×18 (L×W×H), template `[75, 18, 13]`.
- Across a sample of generated instances, the placed rotation is drawn from {0°, 90°, 180°, 270°} and is not fixed to a single value.

(Spec §5.1; raw tests 24, 25.)


- **node**: L0-airs-ac01

### AC — two opposite doors, no assisted ground access (L0-airs-ac02)

# AC — two opposite doors, no assisted ground access

**Links:** `part_of: ["L0-airs"]` · `is_a: ["acceptance-criterion"]`

**GIVEN** a placed Airship, **WHEN** its lower hull is inspected, **THEN** it has exactly 2 doors on opposite sides, and there is no ladder, staircase, lift, waterfall, or teleporter connecting it to the ground. Reaching it is left entirely to the player.

(Spec §5.2; raw test 26.)


- **node**: L0-airs-ac02

### AC — interior corridor + 4 rooms, one lamp per room (L0-airs-ac03)

# AC — interior corridor + 4 rooms, one lamp per room

**Links:** `part_of: ["L0-airs"]` · `is_a: ["acceptance-criterion"]`

**GIVEN** a placed Airship, **WHEN** its interior is inspected, **THEN** it has exactly 1 central corridor and 4 small rooms, each room has exactly 1 ceiling lamp, and the spawner cell's light level stays within the engine's spawner-suppression threshold despite the decorative lighting.

(Spec §5.2; raw test 27.)


- **node**: L0-airs-ac03

### AC — exactly 10 chests at fixed positions (L0-airs-ac04)

# AC — exactly 10 chests at fixed positions

**Links:** `part_of: ["L0-airs"]` · `is_a: ["acceptance-criterion"]`

**GIVEN** a placed Airship, **WHEN** its chests are counted, **THEN** there are exactly 10: 2 in each of the 4 rooms (8 total) and 2 in the corridor, all at the same template-local positions (rotated per instance) across every instance, each reachable without breaking blocks.

(Spec §5.3; raw test 28.)


- **node**: L0-airs-ac04

### AC — exactly one iron-axe Vindicator spawner at the corridor centre (L0-airs-ac05)

# AC — exactly one iron-axe Vindicator spawner at the corridor centre

**Links:** `part_of: ["L0-airs"]` · `is_a: ["acceptance-criterion"]`

**GIVEN** a placed Airship, **WHEN** its spawner is inspected, **THEN** there is exactly 1 `mob_spawner`, positioned at the corridor's centre, and it produces Vindicators equipped with a vanilla iron axe.

(Spec §5.3; raw test 29.)


- **node**: L0-airs-ac05

### AC — altitude clearance and rejection over water / near the world ceiling (L0-airs-ac06)

# AC — altitude clearance and rejection over water / near the world ceiling

**Links:** `part_of: ["L0-airs"]` · `is_a: ["acceptance-criterion"]`

**GIVEN** a rolled Airship candidate, **WHEN** its footprint is validated, **THEN**:
- Its bottom sits at least 40 blocks above the highest terrain point (including trees) under its whole rotated footprint, with a target clearance of 40–70 blocks where the build height allows it.
- A candidate whose footprint is significantly over open water is rejected.
- A candidate that cannot fit below the world ceiling even at the minimum 40-block clearance is rejected, with no downgrade below 40.

(Spec §5.4; raw tests 30, 31.)


- **node**: L0-airs-ac06

### AC — independent generation at 2 % on suitable land chunks only (L0-airs-ac07)

# AC — independent generation at 2 % on suitable land chunks only

**Links:** `part_of: ["L0-airs"]` · `is_a: ["acceptance-criterion"]`

**GIVEN** a large enough sample of newly discovered Overworld chunks with no Windmill involved, **WHEN** independent Airship generation is measured statistically, **THEN** the observed rate on suitable chunks (land, valid footprint, no collision) is consistent with a 2 % per-chunk roll, and no Airship appears on an unsuitable chunk (open water, colliding, or failing the altitude/ceiling check).

(Spec §5.5; raw test 32.)


- **node**: L0-airs-ac07

### AC — the Windmill-linked attempt runs regardless of a nearby independent Airship (L0-airs-ac08)

# AC — the Windmill-linked attempt runs regardless of a nearby independent Airship

**Links:** `part_of: ["L0-airs"]` · `is_a: ["acceptance-criterion"]`

**GIVEN** a Windmill instance that already has an independent Airship within 100 blocks of it, **WHEN** that Windmill's `afterPlace` hook runs, **THEN** `airs` still performs its own linked-attempt search in the 40–100-block ring — the existing independent Airship does not substitute for, skip, or block the linked attempt — and the two Airships, if the linked attempt also succeeds, do not physically overlap.

(Spec §5.6; raw test 33.)


- **node**: L0-airs-ac08

### Airs g001 concept glossary term (L0-airs-g001)

**Gondola / Гондола**

The Airship's lower hull: an elongated oval volume of grey/light-grey concrete containing the 1 corridor + 4 rooms, 10 chests, 1 Vindicator spawner, and the 2 opposite doors. Everything script-relevant (chests, spawner, doors) lives in the gondola, never in the balloon.

**Synonyms:** lower hull, hull.


- **node**: L0-airs-g001

### Airs g002 concept glossary term (L0-airs-g002)

**Balloon / Аэростат** (upper hull)

The Airship's decorative upper volume: a large oval shape in grey/light-grey concrete sitting above the gondola. Contains no chests, no spawner, and is not part of any script contract (`L0-airs-e001`) — purely template geometry for visual identity.

**Synonyms:** upper hull, envelope.


- **node**: L0-airs-g002

### Airs g003 concept glossary term (L0-airs-g003)

**Linked Airship**

An Airship instance created by a Windmill's own one-time `afterPlace` trigger (`L0-airs-r004`), searched inside a hard 40–100-block ring around that Windmill's centre. Every Windmill instance — including the guaranteed spawn Windmill — attempts exactly one. Distinct from an **Independent Airship**; the two never substitute for or deduplicate against each other.

**Synonyms:** Windmill-linked Airship.


- **node**: L0-airs-g003

### Airs g004 concept glossary term (L0-airs-g004)

**Independent Airship**

An Airship instance created by `strf`'s ordinary per-chunk discovery roll (2 % chance, `L0-airs-r003`), with no relationship to any Windmill. It is validated and placed exactly like a Linked Airship but through the normal discovery queue rather than a Windmill's trigger.

**Synonyms:** normal Airship, chunk-roll Airship.


- **node**: L0-airs-g004

### Airs g005 concept glossary term (L0-airs-g005)

**Ring search (hard ring)**

`strf.searchRing(def, centre, rMin, rMax)`: the relocating-candidate-generation mode used only by `wind`'s guaranteed spawn Windmill (0–500 blocks, forced fallback) and by `airs`'s linked-Airship attempt (40–100 blocks, no forced fallback). Contrasts with the ordinary per-chunk roll, which never relocates a candidate (`L0-strf-r002` item 5).

**Synonyms:** annulus search, 40–100 search (for the Airship's case specifically).


- **node**: L0-airs-g005

### Bast ac01 concept acceptance criterion (L0-bast-ac01)

**AC-bast-01** (spec test 51)

The rate belongs to `L0-strf-r002` §1 and is proven by `tests/structures-roll.test.mjs:148`.

GIVEN a statistically sufficient sample of suitable Nether chunks,
WHEN candidate generation runs,
THEN `StructureDef.chance = 0.05` (`src/structures/config.ts:27`) — no exact-match requirement is imposed on small samples.

**Source:** §14.7 test 51.


- **node**: L0-bast-ac01

### Bast ac02 concept acceptance criterion (L0-bast-ac02)

**AC-bast-02** (spec test 52)

GIVEN suitable terrain in any Nether biome,
WHEN a candidate rolls,
THEN generation proceeds regardless of biome identity;
AND GIVEN a candidate site over a lava ocean,
WHEN evaluated,
THEN generation never occurs there.

**Source:** §14.7 test 52.


- **node**: L0-bast-ac02

### Bast ac03 concept acceptance criterion (L0-bast-ac03)

**AC-bast-03** (spec test 53)

GIVEN a generated Mini Bastion,
WHEN measured,
THEN its footprint is ~20×20, height ~10-12, with 2-3 levels;
AND across multiple instances, all four rotations (0°/90°/180°/270°) are observed.

**Source:** §14.7 test 53.


- **node**: L0-bast-ac03

### Bast ac04 concept acceptance criterion (L0-bast-ac04)

**AC-bast-04** (spec test 54)

GIVEN a generated Mini Bastion,
WHEN the treasure room is inspected,
THEN it sits centrally/low with ordinary vanilla lava behavior (bucketable, blockable, water-reactive);
AND both access methods work: building/routing a safe path through the lava area, and descending/falling from the level above.

**Source:** §14.7 test 54.


- **node**: L0-bast-ac04

### Bast ac05 concept acceptance criterion (L0-bast-ac05)

**AC-bast-05** (spec test 55)

GIVEN a generated Mini Bastion,
WHEN all chests are counted,
THEN there are exactly 10: 3 treasure chests in the center + 7 regular chests elsewhere in the structure.

**Source:** §14.7 test 55.


- **node**: L0-bast-ac05

### Bast ac06 concept acceptance criterion (L0-bast-ac06)

**AC-bast-06** (spec test 56)

GIVEN the treasure room,
WHEN inspected,
THEN it contains a random count of 2-4 Gold Blocks.

**Source:** §14.7 test 56.


- **node**: L0-bast-ac06

### Bast ac07 concept acceptance criterion (L0-bast-ac07)

**AC-bast-07** (spec test 57)

GIVEN a freshly initialized Mini Bastion,
WHEN the guard roster is counted,
THEN there are 7-10 regular Piglins + exactly 2 Piglin Brutes, zero Hoglins,
AND one Brute is positioned at/guarding the treasure room.

**Source:** §14.7 test 57.


- **node**: L0-bast-ac07

### Bast ac08 concept acceptance criterion (L0-bast-ac08)

**AC-bast-08** (spec test 58)

GIVEN a Mini Bastion with guards killed, loot taken, and lava altered,
WHEN the server restarts,
THEN none of those changes revert — guards are not respawned, loot is not refilled, and altered lava/blocks stay altered.

**Source:** §14.7 test 58.


- **node**: L0-bast-ac08

### Bast ac09 concept acceptance criterion (L0-bast-ac09)

**AC-bast-09** (spec test 59)

GIVEN a candidate site that physically intersects another detected structure (custom or vanilla, including a real Bastion Remnant),
WHEN the candidate is evaluated,
THEN generation is cancelled outright with no relocation attempt and no damage to the existing structure (`L0-strf-r006`).

**Source:** §14.7 test 59, §15.


- **node**: L0-bast-ac09

### Bast gl01 concept glossary term (L0-bast-gl01)

**Mini Bastion**

The custom Nether structure this component describes: a compact (not full-size) Bastion Remnant-styled structure with a fixed ~20×20×10-12 template, one central lava treasure room, 10 loot chests, and a one-time Piglin/Piglin-Brute garrison.

**Synonyms:** none (distinct from vanilla "Bastion Remnant").


- **node**: L0-bast-gl01

### Bast gl02 concept glossary term (L0-bast-gl02)

**Bastion Remnant**

The vanilla Minecraft structure Mini Bastion visually and mechanically references. Supplies the real loot tables (treasure + regular) and material palette (Blackstone family) that Mini Bastion reuses directly (R-bast-003, ADR-bast-02) rather than reimplementing.


- **node**: L0-bast-gl02

### Bast gl03 concept glossary term (L0-bast-gl03)

**Piglin Brute**

The elevated-tier vanilla Piglin variant used as Mini Bastion's dedicated guards. Exactly 2 spawn per instance (versus 7-10 regular Piglins), and unlike regular Piglins they are explicitly assigned fixed roles: one guards the treasure room, the other roams a second fixed position elsewhere in the template.


- **node**: L0-bast-gl03

### Bast gl04 concept glossary term (L0-bast-gl04)

**Candidate (structure-generation candidate)**

A chunk that has won the per-chunk generation roll (5% for Mini Bastion) and is being evaluated for physical suitability before a structure is actually placed. A candidate that fails suitability checks is simply discarded, never relocated to a neighboring chunk. Same term used across all four custom structures (Windmill, Airship, Mini Warden City, Mini Bastion). Cite: `L0-strf-e003`, `L0-strf-r002`.


- **node**: L0-bast-gl04

### Bast gl05 concept glossary term (L0-bast-gl05)

**One-time persistent (guard/mob)**

The family-wide mob-lifecycle pattern (§15) where an initial set of mobs is spawned exactly once at structure initialization, never despawns from distance/chunk-unload/restart, and is never replenished or respawned after death. Applies to Mini Bastion's Piglins/Piglin Brutes and, with different mob types, to Windmill's field Zombie Villagers. Cite: `L0-strf-r009`.


- **node**: L0-bast-gl05

### Infr ac01 concept acceptance criterion (L0-infr-ac01)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]`

GIVEN a clean clone of the repository, WHEN `npm run build` is run, THEN it produces `dist/andrew.mcaddon` and `tsc` compiles `src/` with no errors against the installed `@minecraft/server` types. [src: stage-0-infrastructure criterion 1]


- **node**: L0-infr-ac01

### Infr ac02 concept acceptance criterion (L0-infr-ac02)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]`

GIVEN the built packs, WHEN `npm run validate` (or the validate step inside `npm run build`) runs, THEN every manifest and every item/JSON file under `packs/**` passes structural validation (`validatePacks`/`validateSelfTestPack`) with zero `ValidationError`s. [src: stage-0-infrastructure criterion 2]


- **node**: L0-infr-ac02

### Infr ac03 concept acceptance criterion (L0-infr-ac03)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]`

GIVEN `dist/andrew.mcaddon` staged into a BDS world in Docker, WHEN `npm run bds:check` runs, THEN the server log shows no manifest/dependency errors naming the add-on's packs, a `Pack Stack` line names the behavior and selftest pack uuids, and `SCRIPT_LOADED` appears in the log. [src: stage-0-infrastructure criterion 3]


- **node**: L0-infr-ac03

### Infr ac04 concept acceptance criterion (L0-infr-ac04)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]`

GIVEN the built `.mcaddon` imported on the iPad (or delivered via the LAN server) with both packs enabled in a world, WHEN the player spawns, THEN a chat message appears at `initialSpawn`, and the test item is visible in Creative with both RU and EN names. This criterion is typed `manual`/`ipad`-channel and does not block autopilot merge — a green `bds` run never closes it. [src: stage-0-infrastructure criterion 4; C-6; decision-verification-approach-automatic]


- **node**: L0-infr-ac04

### Infr ac05 concept acceptance criterion (L0-infr-ac05)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]`

GIVEN the Stage 0 deliverable is complete, WHEN the repository is inspected, THEN the project exists in git with a first commit covering the minimal add-on. [src: stage-0-infrastructure criterion 5]


- **node**: L0-infr-ac05

### Infr ac06 concept acceptance criterion (L0-infr-ac06)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-infr-as01"]`

GIVEN a built add-on plus the `packs/gametest` beta pack, WHEN `npm run bds:gametest` runs, THEN a `SimulatedPlayer` completes the registered scenario on a dedicated `gametest` world with the Beta APIs experiment enabled, without a human or an iPad, and the run's log-derived verdict is PASS/FAIL with exit code 0/1 accordingly. [src: scripts/bds-gametest.mjs; decision-q-012]

Note: see `L0-infr-as01` — this criterion is treated as an additional verification lane, not one of Stage 0's five original closing criteria.


- **node**: L0-infr-ac06

### Infr ac07 concept acceptance criterion (L0-infr-ac07)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]`

GIVEN `docker/bds/compose.yaml`'s `VERSION` and `scripts/targets.mjs`'s `BDS_VERSION` disagree, WHEN `npm run bds:check` or `npm run bds:up` is run, THEN `assertComposePinsVersion()` fails the run immediately, before any Docker or build work happens. [src: scripts/bds-lib.mjs assertComposePinsVersion; C-2/C-3]


- **node**: L0-infr-ac07

### Infr ac08 concept acceptance criterion (L0-infr-ac08)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-infr-p005"]`

GIVEN checked-in structure layout sources, WHEN the structure-compilation step of `npm run build` runs, THEN it emits one `.mcstructure` file per structure under `packs/behavior/structures/andrew/`, and a round-trip unit test confirms each file's chest/spawner/shrieker/door counts and footprint bounds match its source definition, for all four structures. [src: L0-adr-tmpl; L0-infr-p005]


- **node**: L0-infr-ac08

### Infr ac09 concept acceptance criterion (L0-infr-ac09)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-infr-p006"]`

GIVEN a template built into the pack, WHEN the BDS/GameTest placement test places it via `structureManager.place` in each of the 4 rotations (0/90/180/270) in the `gametest` world, THEN in-world block-entity counts and states (chest count, spawner `EntityIdentifier`, shrieker `can_summon`) match the compiled template in every rotation. [src: L0-adr-tmpl; L0-infr-p006]


- **node**: L0-infr-ac09

### Infr ac10 concept acceptance criterion (L0-infr-ac10)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-infr-p006", "L0-infr-as03"]`

GIVEN the statistical chunk-roll check drives `strf`'s roll formula over a large synthetic sample of chunk coordinates per structure, WHEN the harness tallies successful rolls, THEN the observed rate falls inside the configured tolerance band of that structure's chance constant, and the run exits 0/1 by that verdict alone, with no human eye needed. [src: L0-adr-strc; L0-infr-p006; L0-infr-as03]


- **node**: L0-infr-ac10

### Infr ac11 concept acceptance criterion (L0-infr-ac11)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-infr-p007", "L0-infr-as04"]`

GIVEN a `gametest` world where at least one structure has completed one-time init, WHEN the BDS server process is restarted without re-staging the world, THEN no chest/spawner/guard/marker is duplicated and the instance registry's `placed`/`lootFilled`/`guardsSpawned` flags are byte-identical before and after the restart. [src: L0-adr-strs; C-7; L0-infr-p007; L0-infr-as04]


- **node**: L0-infr-ac11

### Infr g001 concept glossary term (L0-infr-g001)

**BDS (Bedrock Dedicated Server)**

**Links:** `part_of: ["L0-infr"]` · `is_a: ["glossary-term"]`

The official headless Minecraft Bedrock server binary. Ships Linux x86_64 only — no native macOS build — so on the Mac mini (Apple Silicon) it runs inside Docker under Rosetta 2, via the `itzg/minecraft-bedrock-server` image [C-5]. Two roles in this project: the one-shot automated check (`bds:check`) and the manual LAN dev server the iPad joins (`bds:up`).

**Synonyms**: Bedrock Dedicated Server, "the server", the `bds` verification channel.


- **node**: L0-infr-g001

### Infr g002 concept glossary term (L0-infr-g002)

**.mcaddon**

**Links:** `part_of: ["L0-infr"]` · `is_a: ["glossary-term"]`

A zip archive containing one or more Minecraft Bedrock behavior/resource packs — Minecraft's native add-on import format. This project's build produces exactly one, `dist/andrew.mcaddon`, containing only the `behavior` and `resource` pack directories (never the dev-only `selftest`/`gametest` packs). Importing it on the iPad installs both packs; re-importing the same uuid+version is a no-op from the device's point of view.


- **node**: L0-infr-g002

### Infr g003 concept glossary term (L0-infr-g003)

**SimulatedPlayer / GameTest harness**

**Links:** `part_of: ["L0-infr"]` · `is_a: ["glossary-term"]`

`@minecraft/server-gametest`'s API for scripting an artificial player inside a running Bedrock world — movement, mining, item use — without a real client. Beta-only (no stable channel), so it's confined to a dev-only pack (`packs/gametest`) and a dedicated, experiments-enabled world (`LEVEL_NAME=gametest`), driven here by `npm run bds:gametest`. Used both for single-player scripted-behavior proof and, per `decision-q-012`, as the accepted stand-in for multiplayer proof (two `SimulatedPlayer`s instead of two physical devices).


- **node**: L0-infr-g003

### Infr g004 concept glossary term (L0-infr-g004)

**Content Log (GUI)**

**Links:** `part_of: ["L0-infr"]` · `is_a: ["glossary-term"]`

An in-game overlay on the iPad (Settings → Creator → Content Log) that streams script/engine diagnostics live, in white text on a translucent background, while playing. The device-side counterpart to reading `docker logs`/`bds-check.log` on the Mac — used for debugging import and script errors that only show up once the pack is actually running on the target hardware.


- **node**: L0-infr-g004

### Infr g005 concept glossary term (L0-infr-g005)

**"Pack Stack" line**

**Links:** `part_of: ["L0-infr"]` · `is_a: ["glossary-term"]`

A specific line BDS prints to its log at world load, naming each loaded behavior pack and its uuid. `bds-check.mjs`'s log analysis treats its presence (for the release and selftest pack uuids) as positive proof those packs were actually loaded by the engine — resource packs get no such line, so their loading is proven negatively instead (absence of a "Configured pack … was not found and was ignored" warning for that uuid).


- **node**: L0-infr-g005

### Infr g006 concept glossary term (L0-infr-g006)

**`.mcstructure` template**

**Links:** `part_of: ["L0-infr"]` · `is_a: ["glossary-term"]`

A little-endian NBT file format Bedrock uses for `structureManager.place()`/structure blocks. This project's four structure bodies (Windmill, Airship, Mini Warden City, Mini Bastion) ship as one file each, generated by `scripts/build-structures.mjs` from repo sources rather than exported from an in-game structure block (no Windows editor, no macOS Bedrock client). Lives at `packs/behavior/structures/andrew/*.mcstructure`, gitignored build output — see `L0-infr-e005`.


- **node**: L0-infr-g006

### Infr g007 concept glossary term (L0-infr-g007)

**worldSalt**

**Links:** `part_of: ["L0-infr"]` · `is_a: ["glossary-term"]`

A random value created once per world and stored in a world dynamic property, used as the seed for `strf`'s deterministic per-chunk roll (`hash(worldSalt, dim, cx, cz, structureId) < chance`, `L0-adr-strc`). Makes re-evaluating an already-seen chunk idempotent — the same chunk always rolls the same outcome — so a lost "evaluated" bit can't double-generate a structure. Owned by `L0-strf`; infra's statistical chunk-roll check (`L0-infr-p006`) exercises it but does not generate or store it itself.


- **node**: L0-infr-g007

### Infr g008 concept glossary term (L0-infr-g008)

**Chunk-roll statistical check**

**Links:** `part_of: ["L0-infr"]` · `is_a: ["glossary-term"]`

An infra-owned GameTest-lane check that drives `strf`'s roll formula over many synthetic chunk coordinates and asserts the observed generation rate matches the configured per-structure constant (1 % Windmill / 2 % Airship / 5 % Warden City & Bastion) within a tolerance band, because the real rate can't be observed by exploring a normal-sized test world. See `L0-infr-p006`, `L0-infr-r006`.

**Synonyms**: statistical chunk-roll test, rate check.


- **node**: L0-infr-g008

### Infr g009 concept glossary term (L0-infr-g009)

**Restart/idempotency check**

**Links:** `part_of: ["L0-infr"]` · `is_a: ["glossary-term"]`

An infra-owned BDS check that restarts the server process mid-lifetime (same world, not a fresh re-stage) and diffs structure-instance state before/after to prove one-time init (loot fill, guard spawn, marker placement) never re-runs — the engine-provable half of the project's no-duplication constraint (C-7). See `L0-infr-p007`.


- **node**: L0-infr-g009

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

### Loot ac01 concept acceptance criterion (L0-loot-ac01)

GIVEN a Windmill or Airship chest is initialized, WHEN the fill algorithm runs, THEN it performs between 5 and 12 fill attempts inclusive, and each individual attempt yields at most one loot category (never zero-or-more-than-one simultaneous categories from a single attempt).

Source: spec AC34.


- **node**: L0-loot-ac01

### Loot ac02 concept acceptance criterion (L0-loot-ac02)

GIVEN repeated custom-table fills across many chests, WHEN Sticks/Logs/Iron Ingot/Copper Ingot/Gold Ingot/Diamond categories are selected, THEN their quantities fall within 2–8 / 2–6 / 2–8 / 3–10 / 1–5 / 1–3 respectively, on every occurrence.

Source: spec AC35.


- **node**: L0-loot-ac02

### Loot ac03 concept acceptance criterion (L0-loot-ac03)

GIVEN a statistically sufficient sample of equipment-category rolls (armor, sword, axe; enchanted and unenchanted) across many chests, WHEN material is rolled, THEN iron appears in ~80% and diamond in ~20% of rolls (no exact-match requirement on small samples — statistical tolerance, not a per-roll assertion).

Source: spec AC36.


- **node**: L0-loot-ac03

### Loot ac04 concept acceptance criterion (L0-loot-ac04)

GIVEN multiple armor-category attempts succeed in the same chest, WHEN slots are rolled, THEN identical armor pieces (e.g. two diamond helmets) are permitted to co-occur in one chest — the implementation must not de-duplicate or reject repeats.

Source: spec AC37.


- **node**: L0-loot-ac04

### Loot ac05 concept acceptance criterion (L0-loot-ac05)

GIVEN any Enchanted Armor/Sword/Axe roll from the custom table, WHEN its enchantments are inspected, THEN none of them is a curse (Curse of Binding, Curse of Vanishing), and every enchantment level present is within that enchantment's vanilla maximum.

Source: spec AC38, §3.3.


- **node**: L0-loot-ac05

### Loot ac06 concept acceptance criterion (L0-loot-ac06)

GIVEN a full custom-table chest fill (5–12 attempts), WHEN the resulting contents are inspected, THEN at most one Golden Apple stack exists, its quantity is 1–3, it is always a regular (never Enchanted) Golden Apple, and Enchanted Golden Apple never appears via the custom table.

Source: spec AC39, §3.3.


- **node**: L0-loot-ac06

### Loot ac07 concept acceptance criterion (L0-loot-ac07)

GIVEN a chest where Diamonds is selected on more than one attempt, WHEN contents are inspected, THEN multiple Diamond stacks/successes are permitted in the same chest (unlike Golden Apple).

Source: spec AC40.


- **node**: L0-loot-ac07

### Loot ac08 concept acceptance criterion (L0-loot-ac08)

GIVEN any structure chest (custom or vanilla path) whose contents have already been rolled, WHEN the chest is reopened, the chunk is unloaded/reloaded, or the server restarts, THEN its contents are unchanged — no re-roll, no refill.

Source: spec §2, §3 preamble, §13.6/§13.7, §15.


- **node**: L0-loot-ac08

### Loot ac09 concept acceptance criterion (L0-loot-ac09)

GIVEN Mini Warden City's 40 chests, WHEN their contents are inspected, THEN all 40 use the real vanilla `chests/ancient_city` loot table unmodified — including the normal possibility of rare vanilla drops such as Enchanted Golden Apple or Swift Sneak books — and the custom weighted table is never applied to them.

Source: spec §13.6, AC48.


- **node**: L0-loot-ac09

### Loot ac10 concept acceptance criterion (L0-loot-ac10)

GIVEN Mini Bastion's 10 chests, WHEN their contents are inspected, THEN the 3 central treasure chests draw from vanilla `chests/bastion_treasure` and the 7 distributed chests draw from vanilla `chests/bastion_other`, with no custom-table influence on either.

Source: spec §14 addendum, AC55 (loot portion — chest counts/gold blocks/guards belong to `L0-bast`, not this component).


- **node**: L0-loot-ac10

### Loot gl01 concept glossary term (L0-loot-gl01)

**Fill Attempt**

One draw within a chest's 5–12-attempt custom fill run. Selects at most one of the 13 loot categories by relative weight, or none. Distinct from a vanilla loot-table roll, which has no attempt concept — it's a single opaque call into vanilla loot generation.

**Synonyms:** attempt, roll.


- **node**: L0-loot-gl01

### Loot gl02 concept glossary term (L0-loot-gl02)

**Relative Weight**

The unit used in the 13-category table (`L0-loot-e001`). Weights are compared to each other, not to a 0–100 percentage scale — the table's weights intentionally do not sum to 100 and must be normalized at selection time (e.g. a cumulative-weight roll). Not to be confused with "drop chance" in vanilla loot tables, which is a true probability.


- **node**: L0-loot-gl02

### Loot gl03 concept glossary term (L0-loot-gl03)

**Custom Table / Vanilla Table**

**Custom Table** — this add-on's own 13-category weighted loot table (`L0-loot-p001`), used only for Windmill and Airship chests.

**Vanilla Table** — an unmodified vanilla Bedrock loot table (`chests/ancient_city`, `chests/bastion_treasure`, `chests/bastion_other`), used only for Mini Warden City and Mini Bastion chests (`L0-loot-p002`). The two are mutually exclusive per chest (`L0-loot-r007`).


- **node**: L0-loot-gl03

### Loot gl04 concept glossary term (L0-loot-gl04)

**Curse (enchantment)**

A vanilla enchantment category (Curse of Binding, Curse of Vanishing) explicitly excluded from every custom-table enchanted roll (`L0-loot-r005`). Not excluded from vanilla-table chests, where normal vanilla curse odds apply unmodified.


- **node**: L0-loot-gl04

### Loot gl05 concept glossary term (L0-loot-gl05)

**One-Time Fill**

The persistence contract shared by both loot mechanisms (`L0-loot-r006`): a chest's contents are decided exactly once, at structure post-place init, and frozen thereafter regardless of reopen/restart/chunk reload. Enforced by `strf`'s instance registry, not by loot itself.


- **node**: L0-loot-gl05

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


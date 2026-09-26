---
title: Glossary
type: project-knowledge
generated_at: "2026-09-26T08:34:28.621Z"
source_channel: rollout
node_id: rollout-glossary
aliases: ["rollout-glossary","glossary","project-knowledge/glossary"]
is_a: ["rollout","glossary"]
relates_to: ["L0-airs-ac01","L0-airs-ac02","L0-airs-ac03","L0-airs-ac04","L0-airs-ac05","L0-airs-ac06","L0-airs-ac07","L0-airs-ac08","L0-airs-g001","L0-airs-g002","L0-airs-g003","L0-airs-g004","L0-airs-g005","L0-bast-ac01","L0-bast-ac02","L0-bast-ac03","L0-bast-ac04","L0-bast-ac05","L0-bast-ac06","L0-bast-ac07","L0-bast-ac08","L0-bast-ac09","L0-bast-gl01","L0-bast-gl02","L0-bast-gl03","L0-bast-gl04","L0-bast-gl05","L0-infr-ac01","L0-infr-ac02","L0-infr-ac03","L0-infr-ac04","L0-infr-ac05","L0-infr-ac06","L0-infr-ac07","L0-infr-ac08","L0-infr-ac09","L0-infr-ac10","L0-infr-ac11","L0-infr-g001","L0-infr-g002","L0-infr-g003","L0-infr-g004","L0-infr-g005","L0-infr-g006","L0-infr-g007","L0-infr-g008","L0-infr-g009","L0-loot-ac01","L0-loot-ac02","L0-loot-ac03","L0-loot-ac04","L0-loot-ac05","L0-loot-ac06","L0-loot-ac07","L0-loot-ac08","L0-loot-ac09","L0-loot-ac10","L0-loot-gl01","L0-loot-gl02","L0-loot-gl03","L0-loot-gl04","L0-loot-gl05","L0-scyt-ac11","L0-scyt-ac16","L0-strf-ac01","L0-strf-ac02","L0-strf-ac03","L0-strf-ac04","L0-strf-ac05","L0-strf-ac06","L0-strf-ac07","L0-strf-ac08","L0-strf-ac09","L0-strf-ac10","L0-strf-ac11","L0-strf-ac12","L0-strf-g001","L0-strf-g002","L0-strf-g003","L0-strf-g004","L0-strf-g005","L0-strf-g006","L0-strf-g007","L0-wind-ac01","L0-wind-ac02","L0-wind-ac03","L0-wind-ac04","L0-wind-ac05","L0-wind-ac06","L0-wind-ac07","L0-wind-ac08","L0-wind-ac09","L0-wind-ac10","L0-wind-ac11","L0-wind-ac12","L0-wind-ac13","L0-wind-ac14","L0-wind-ac15","L0-wind-ac16","L0-wind-ac17"]
priority: 530
---

# Glossary

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

### AC — fixed modern appearance, size and randomized rotation (L0-airs-ac01)

# AC — fixed modern appearance, size and randomized rotation

**Links:** `part_of: ["L0-airs"]` · `is_a: ["acceptance-criterion"]`

**GIVEN** a placed Airship instance, **WHEN** it is inspected, **THEN**:
- Its palette is grey/light-grey concrete with intact glass windows and working lights; there is no vine, cobweb, crack, or other decay decoration anywhere on it.
- Its upper hull is a single decorative oval volume containing no chest and no spawner.
- Its overall footprint is ≈15×7×10–12 (L×W×H).
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

GIVEN a statistically sufficient sample of suitable Nether chunks,
WHEN candidate generation runs,
THEN the observed candidate rate converges to 5% (no exact-match requirement is imposed on small samples).

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
THEN generation is cancelled outright with no relocation attempt and no damage to the existing structure.

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

A chunk that has won the per-chunk generation roll (5% for Mini Bastion) and is being evaluated for physical suitability before a structure is actually placed. A candidate that fails suitability checks is simply discarded, never relocated to a neighboring chunk. Same term used across all four custom structures (Windmill, Airship, Mini Warden City, Mini Bastion).


- **node**: L0-bast-gl04

### Bast gl05 concept glossary term (L0-bast-gl05)

**One-time persistent (guard/mob)**

The family-wide mob-lifecycle pattern (§15) where an initial set of mobs is spawned exactly once at structure initialization, never despawns from distance/chunk-unload/restart, and is never replenished or respawned after death. Applies to Mini Bastion's Piglins/Piglin Brutes and, with different mob types, to Windmill's field Zombie Villagers.


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

GIVEN Mini Warden City's 10 chests, WHEN their contents are inspected, THEN all 10 use the real vanilla `chests/ancient_city` loot table unmodified — including the normal possibility of rare vanilla drops such as Enchanted Golden Apple or Swift Sneak books — and the custom weighted table is never applied to them.

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

### AC-scyt-11 — One Survival craft per world, kept across restart (§8 test 11) (L0-scyt-ac11)

# AC-scyt-11 — One Survival craft per world, kept across restart (§8 test 11)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-scyt-p004", "L0-scyt-r009", "L0-lgnd"]`

**GIVEN** a Survival world where no Scythe has been crafted, and the Web Sword may or may not have been crafted,
**WHEN** player A crafts the recipe (2 golden apples, 2 obsidian, 1 diamond hoe),
**THEN** A receives 1× `andrew:scythe_of_calamity`, and every player sees the localized announcement naming the Scythe and A.

**AND WHEN** player B crafts it again, before or after a BDS restart,
**THEN** the craft is blocked, the ingredients are refunded, and no second Scythe appears.

**AND** the Web Sword's flag is unaffected in either direction. `/give` and Creative copies never set the flag.


- **node**: L0-scyt-ac11

### AC-scyt-16 — Action Bar state in either hand, and hand priority (§6) (L0-scyt-ac16)

# AC-scyt-16 — Action Bar state in either hand, and hand priority (§6)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-lgnd", "CTR-017", "CTR-012"]`

**GIVEN** O holds the Scythe in the main hand **or** the off hand,
**THEN** the action bar shows «Готово» / "Ready" while the Scythe is ready, "active" while a volley flies, and the remaining seconds during the cooldown. The remaining seconds count down to 0 and then return to Ready.

**GIVEN** O holds a ready Web Sword in the main hand and a ready Scythe in the off hand,
**WHEN** O presses Use on a valid Web Sword target,
**THEN** only the Web Sword fires.

**AND GIVEN** the Web Sword is on cooldown, **WHEN** O presses Use, **THEN** the Scythe fires. If CTR-012 rules off-hand activation infeasible, this half is dropped and noted.


- **node**: L0-scyt-ac16

### Strf ac01 concept acceptance criterion (L0-strf-ac01)

**AC-strf-01 · The roll is deterministic and uniform** (`L0-strf-r001`)

GIVEN a fixed salt, WHEN `roll(salt, dim, cx, cz, def)` is computed twice for 100 000 keys, THEN the results are identical. The success share for chance 0.05 is within 0.05 ± 0.004 (≈ 3σ). A χ² test over 100 buckets gives p > 0.01. Three golden keys produce their recorded values.
**Verify:** unit (`npm test`).


- **node**: L0-strf-ac01

### Strf ac02 concept acceptance criterion (L0-strf-ac02)

**AC-strf-02 · Rotation and local-point transform match in-world placement** (`L0-strf-r004`; spec tests 25, 43, 53)

GIVEN the probe template with declared chest, spawner and door points, WHEN `strf` places it at each rotation 0/90/180/270, THEN every declared point transformed by `rotateLocal` holds the expected block type. The occupied AABB equals the computed rotated AABB (no block outside it). Unit: 4×Rotate90 equals the identity, and `rotateLocal` is a bijection.
**Verify:** unit + bds.


- **node**: L0-strf-ac02

### Strf ac03 concept acceptance criterion (L0-strf-ac03)

**AC-strf-03 · Footprint validity rejects water, lava ocean, unevenness and the ceiling** (`L0-strf-r005`, `-r013`, `-r003`; spec tests 31, 42, 52)

GIVEN prepared test sites (flat grass; grass with a 30 % water pond; a 6-block step; a mountain top whose max Y + 40 + H > 319; a Nether lava sea at Y 31; a Nether netherrack shelf), WHEN `validate()` runs for each relevant profile, THEN the results are, in order: valid, `liquid`, `uneven`, `ceiling`, `lavaOcean`, valid. For the Airship on flat ground at Y 64, the chosen `bottomY` is in [104, 134]. With a 20-block tree at one corner, `bottomY ≥ treeTop + 40`.
**Verify:** bds.


- **node**: L0-strf-ac03

### Strf ac04 concept acceptance criterion (L0-strf-ac04)

**AC-strf-04 · Collision cancels, and never damages** (`L0-strf-r006`; spec tests 50, 59)

GIVEN a candidate AABB overlapping (a) an existing `InstanceRecord` AABB, (b) a `minecraft:mob_spawner` 1 block outside the footprint (inside the margin), (c) a column of `deepslate_tiles` inside it, WHEN validation runs, THEN each is rejected with `collision:instance` / `collision:spawner` / `collision:signature`. The world blocks in the region stay byte-identical before and after (compared through `getBlock` snapshots).
**Verify:** bds.


- **node**: L0-strf-ac04

### Strf ac05 concept acceptance criterion (L0-strf-ac05)

**AC-strf-05 · Restart and reload never duplicate anything** (`L0-strf-r008`, `-p004`; spec tests 22, 58, §11)

GIVEN a placed and initialised instance with chests, guards and a spawner, WHEN a player loots a chest, kills 3 guards, and breaks the spawner, AND the server restarts twice, AND the area is unloaded (player > 300 blocks away) and reloaded, THEN: the registry still holds exactly one record in state `done`; the looted chest is still empty; the guard count equals the initial count − 3; the spawner block is still absent; no second copy of the template exists (the chest count within AABB+32 is unchanged).
**Verify:** bds (restart harness from `infr`).


- **node**: L0-strf-ac05

### Strf ac06 concept acceptance criterion (L0-strf-ac06)

**AC-strf-06 · A crash mid-init resumes without duplicates** (`L0-strf-p003`, `-p004`)

GIVEN a test hook that stops the server immediately after (a) the `planned` write, (b) `place`, (c) half the chests are filled, (d) half the guards are spawned, WHEN the server restarts and a player returns, THEN the instance reaches `done` with exactly the spec's chest count filled (each chest's contents equal the deterministic expectation for its seed) and exactly the spec's guard count tagged `andrew:guard:<id>`.
**Verify:** bds.


- **node**: L0-strf-ac06

### Strf ac07 concept acceptance criterion (L0-strf-ac07)

**AC-strf-07 · No write into unloaded chunks; pending candidates wait** (`L0-strf-r007`)

GIVEN a forced-positive roll whose footprint straddles the edge of the loaded area, WHEN discovery evaluates it, THEN no block in the footprint changes, no `InstanceRecord` is written, and the chunk's evaluated bit stays clear. WHEN the player then moves so all covered chunks are loaded, THEN the candidate is revalidated and placed at the same origin and rotation. If the player has built a planks wall inside the footprint in between, THEN it is rejected as `collision:signature` and the wall is intact.
**Verify:** bds.


- **node**: L0-strf-ac07

### Strf ac08 concept acceptance criterion (L0-strf-ac08)

**AC-strf-08 · Guards persist until death and never respawn** (`L0-strf-r009`; spec tests 19, 57, 58)

GIVEN an instance whose def spawns N guards, WHEN init completes, THEN exactly N entities of the declared vanilla types carry the tag `andrew:guard:<id>`. AFTER a walk-away of ≥ 256 blocks for 5 in-game minutes and a restart, all N still exist, unless they were killed. Windmill guards at noon in full sun take 0 damage over 60 s. Killing all N and restarting yields 0 guards. The state is still `done`/`guarded`.
**Verify:** bds.


- **node**: L0-strf-ac08

### Strf ac09 concept acceptance criterion (L0-strf-ac09)

**AC-strf-09 · Template spawners behave as vanilla** (`L0-strf-r010`; spec tests 17, 18, 29)

GIVEN a placed template with a `mob_spawner` for `minecraft:vindicator` in a dark room, WHEN a player stands within 8 blocks for 60 s, THEN ≥ 1 vindicator spawns, holding an iron axe. WHEN the room is lit to light 15 around the spawner, THEN no spawns occur within 60 s. WHEN the spawner is broken in survival, THEN no spawner item drops, XP orbs appear, and it is still absent after a restart.
**Verify:** bds.


- **node**: L0-strf-ac09

### Strf ac10 concept acceptance criterion (L0-strf-ac10)

**AC-strf-10 · The tick budget holds under exploration** (`L0-strf-p005`)

GIVEN 2 players flying in straight lines at elytra speed through fresh terrain for 5 minutes with all four defs registered, WHEN `strf` runs, THEN: no server tick exceeds 50 ms because of `strf` (per `Date.now()` instrumentation in the job); the discovery interval does 0 block reads; the job is idle (not scheduled) whenever the queue is empty; the BDS log has no watchdog / "script took too long" warnings.
**Verify:** bds.


- **node**: L0-strf-ac10

### Strf ac11 concept acceptance criterion (L0-strf-ac11)

**AC-strf-11 · Dimension lock and statistical rates** (`L0-strf-r002`, `-r003`; spec tests 23, 32, 41, 51)

GIVEN a test hook that evaluates K ≥ 4 000 fresh chunks per dimension (Overworld, Nether, End), WHEN discovery runs, THEN End: 0 candidates. Overworld: no Bastion rolls. Nether: no Windmill/Airship/Warden rolls. For each def, the **roll** success share is within ±3σ of its chance. The **placed** share is reported together with the reject-reason counters. Placed ≤ rolled is the only hard assertion.
**Verify:** bds.


- **node**: L0-strf-ac11

### Strf ac12 concept acceptance criterion (L0-strf-ac12)

**AC-strf-12 · The deviation report and probe results exist and agree** (`L0-strf-r012`, `-p006`; §11 DoD)

GIVEN the structures stage is being closed, WHEN the gate runs, THEN `docs/structures/probe-results.md` lists items 1–11 with PASS/FAIL/N/A, `docs/structures/deviations.md` contains entries DEV-STRF-01 (discovery-time generation) and DEV-STRF-02 (heuristic collision), and every FAIL has a deviation entry that references it.
**Verify:** repo check (script) + review.


- **node**: L0-strf-ac12

### Strf g001 concept glossary term (L0-strf-g001)

**Candidate chunk / кандидат-чанк**

A 16×16 chunk of the matching dimension whose seeded roll for a given structure succeeded. It becomes a structure only if its footprint passes validity and collision checks. A failed candidate is cancelled and never moved to a neighbouring chunk.

**Synonyms**: candidate, кандидат. **See**: `L0-strf-e003`, `L0-strf-r002`.


- **node**: L0-strf-g001

### Strf g002 concept glossary term (L0-strf-g002)

**Footprint / горизонтальная проекция**

The rotated horizontal extent (x/z) of a structure's template. Validity checks (land, water, flatness, max terrain height) sample the **whole** footprint, not just its centre. "Footprint + margin" (2 blocks) is the area that must be loaded and free of collisions. The 3D version is the instance **AABB**.

**Synonyms**: projection, AABB (3D). **See**: `L0-strf-r005`, `L0-strf-r007`.


- **node**: L0-strf-g002

### Strf g003 concept glossary term (L0-strf-g003)

**Instance record / запись экземпляра**

The durable registry row for one generated structure: id, def, origin, rotation and init state (`planned → placed → looted → guarded → done`, or `failed`). It is stored in region-sharded world dynamic properties. It is the only proof that a structure exists or has been initialised, and it is never deleted.

**Synonyms**: registry entry, init flag («устойчивый признак инициализации»). **See**: `L0-strf-e002`, `L0-strf-r008`.


- **node**: L0-strf-g003

### Strf g004 concept glossary term (L0-strf-g004)

**World salt / соль мира**

A random string created once per world (`andrew:st:salt`) and mixed into every generation hash: roll, rotation, clearance, depth, loot seed. It makes outcomes reproducible within a world and different between worlds. It is never regenerated.

**See**: `L0-strf-r001`.


- **node**: L0-strf-g004

### Strf g005 concept glossary term (L0-strf-g005)

**Guard (one-time persistent mob) / первоначальная охрана**

A vanilla mob spawned by script exactly once when a structure first initialises: the Windmill's 10 field Zombie Villagers, and the Bastion's 7–10 Piglins plus 2 Brutes. It is tagged `andrew:guard:<instanceId>` and named so it never despawns. It is never respawned or topped up. It is distinct from mobs produced by spawners.

**Synonyms**: initial guards, охрана, полевые зомби-жители. **See**: `L0-strf-r009`.


- **node**: L0-strf-g005

### Strf g006 concept glossary term (L0-strf-g006)

**Deviation report / отчёт об отклонениях**

`docs/structures/deviations.md`: the checked-in list of every place where the implementation approximates the Four Structures spec because stable Bedrock APIs cannot do the exact thing. It is required by §11 DoD and C-3. Each row is a `DeviationEntry`.

**See**: `L0-strf-r012`, `L0-strf-e004`.


- **node**: L0-strf-g006

### Strf g007 concept glossary term (L0-strf-g007)

**Collision signature / сигнатура структуры**

A block type that does not occur naturally at a given dimension and depth, so finding it inside a candidate's AABB is taken as evidence of a vanilla structure (e.g. `deepslate_tiles`, `polished_blackstone_bricks`, `nether_bricks`, rails, `chest`, `bell`). It is the basis of the heuristic collision detector. The heuristic is incomplete by design and recorded in the deviation report.

**Synonyms**: signature block. **See**: `L0-strf-r006`, `L0-xasm3`.


- **node**: L0-strf-g007

### AC-wind-01 · A new world has exactly one spawn Windmill, in the 5×5 area or within 500 blocks (L0-wind-ac01)

# AC-wind-01 · A new world has exactly one spawn Windmill, in the 5×5 area or within 500 blocks

**Spec:** test 14, §4.7.

GIVEN a fresh BDS world with the add-on and no player online
WHEN the server has run until `andrew:st:spawnWindmill.status` is terminal (≤ 5 min)
THEN status is `done`, the registry has exactly one `windmill:S`
AND its plot centre is inside the spawn chunk ±2 chunks, OR (only if no valid site existed there) within 500 blocks of spawn (horizontal)
AND `stage` in the record matches where it was found
AND no `andrew_ws_*` ticking area remains.
Run on ≥ 3 seeds including one with spawn next to ocean.


- **node**: L0-wind-ac01

### AC-wind-02 · Restarts never create a second spawn Windmill, chests, spawners or guards (L0-wind-ac02)

# AC-wind-02 · Restarts never create a second spawn Windmill, chests, spawners or guards

**Spec:** §4.7.13, §6, §11 DoD 2 and 6.

GIVEN a world whose spawn Windmill is `done`
WHEN the server is restarted 3 times, including one kill (`SIGKILL`) during the search on a second fresh world
THEN each world has exactly one `windmill:S`; block counts in its AABB show 25 chests and 3 spawners; tagged guards ≤ 10
AND the killed-mid-search world completes the search after restart with one Windmill only.


- **node**: L0-wind-ac02

### AC-wind-03 · Size and identity of the Windmill in all 4 rotations (L0-wind-ac03)

# AC-wind-03 · Size and identity of the Windmill in all 4 rotations

**Spec:** test 15, §4.1, §2.

GIVEN the built `windmill.mcstructure`
THEN (unit) the plot is 35±2 × 35±2, the building ~15×15 base and ~30 tall, 1 wooden door on the rotor face, 3 floors, stair cells connected F1→F3
AND (BDS) placing it at 0/90/180/270 re-counts the same numbers in-world
AND (iPad, manual) it reads as an old abandoned stone-lower / wood-upper mill with a wooden roof and 4 still blades on the door side.


- **node**: L0-wind-ac03

### AC-wind-04 · 25 chests — 5 / 8 / 12 by floor — all reachable without breaking blocks (L0-wind-ac04)

# AC-wind-04 · 25 chests — 5 / 8 / 12 by floor — all reachable without breaking blocks

**Spec:** test 16, §4.3.

GIVEN a placed Windmill (any rotation)
THEN the AABB holds exactly 25 chests: 5 on floor 1, 8 on floor 2, 12 on floor 3
AND each chest is non-empty after init and was filled by `loot.fillChest` (5–12 attempts)
AND the template BFS (`L0-wind-r002`) reaches every chest access cell from outside the door with no block broken.


- **node**: L0-wind-ac04

### AC-wind-05 · Three floor spawners with the right mobs; the top Vindicator has an iron axe (L0-wind-ac05)

# AC-wind-05 · Three floor spawners with the right mobs; the top Vindicator has an iron axe

**Spec:** test 17, §4.3.

GIVEN a placed Windmill and a player (or SimulatedPlayer) near each spawner
THEN floor 1 spawns `minecraft:zombie_villager_v2`, floor 2 `minecraft:zombie`, floor 3 `minecraft:vindicator`
AND every Vindicator from the floor-3 spawner holds `minecraft:iron_axe` (sample ≥ 10)
AND breaking a spawner drops no spawner item and gives XP.


- **node**: L0-wind-ac05

### AC-wind-06 · The decorative lighting does not disable any spawner (L0-wind-ac06)

# AC-wind-06 · The decorative lighting does not disable any spawner

**Spec:** test 18, §4.3 last bullet.

GIVEN a placed Windmill at night and at noon, lanterns intact
WHEN a player stands within activation range of each spawner for 2 in-game minutes
THEN each of the 3 spawners produces ≥ 1 mob
AND (unit) every spawnable cell near each spawner has computed block light ≤ `Lmax` (`L0-wind-as07`).


- **node**: L0-wind-ac06

### AC-wind-07 · 10 field guards: once, sun-immune, persistent, never restored (L0-wind-ac07)

# AC-wind-07 · 10 field guards: once, sun-immune, persistent, never restored

**Spec:** test 19, §4.5, §9.8.

GIVEN a freshly initialised Windmill on Normal difficulty
THEN exactly 10 `zombie_villager_v2` with tag `andrew:guard:<id>` exist around the fields
WHEN the time is set to noon for 60 s → none is on fire and all 10 have full health
WHEN all players leave for 5 min (chunk unloaded) and the server restarts → all 10 still exist
WHEN 4 are killed and the server restarts twice → exactly 6 remain; the record stays `done`; no new tagged guard appears.


- **node**: L0-wind-ac07

### AC-wind-08 · Curing a field guard yields an ordinary Villager that stays ordinary (L0-wind-ac08)

# AC-wind-08 · Curing a field guard yields an ordinary Villager that stays ordinary

**Spec:** §4.5 bullet 6, §9.9.

GIVEN a field guard
WHEN it is cured the vanilla way (Weakness + golden apple, wait for conversion)
THEN a `minecraft:villager` exists at its position with no `andrew:guard:*` tag and no structure-applied effect
AND after a restart and 5 min it is still a Villager (no script converts it back)
AND the guard count drops by one permanently.


- **node**: L0-wind-ac08

### AC-wind-09 · Fields: mostly mature wheat, water, paths, abandoned patches, old fence with gaps (L0-wind-ac09)

# AC-wind-09 · Fields: mostly mature wheat, water, paths, abandoned patches, old fence with gaps

**Spec:** test 20, §4.4.

GIVEN the template
THEN (unit) ≥ 80 % of wheat blocks have `growth = 7`; water ditch blocks exist; every farmland block is within 4 blocks of water; path blocks connect the fence gaps to the door; the perimeter fence has ≥ 3 gaps; some plot cells are bare dirt / missing wheat
AND (BDS) breaking mature wheat drops wheat and seeds
AND (iPad) the fields look abandoned, not freshly farmed.


- **node**: L0-wind-ac09

### AC-wind-10 · Vines and cobwebs present, main route never blocked (L0-wind-ac10)

# AC-wind-10 · Vines and cobwebs present, main route never blocked

**Spec:** test 21, §4.2.

GIVEN the template
THEN (unit) there are vines on exterior walls and inside, cobwebs on every floor with floor 3 having the most
AND no cobweb, vine or solid block occupies a route cell (`L0-wind-g007`)
AND (iPad) a player walks from the door to the top floor and opens all 25 chests without breaking anything.


- **node**: L0-wind-ac10

### AC-wind-11 · Looted chests, broken spawners and broken walls stay that way after restart (L0-wind-ac11)

# AC-wind-11 · Looted chests, broken spawners and broken walls stay that way after restart

**Spec:** test 22, §2, §6.

GIVEN a Windmill
WHEN a player empties 3 chests, breaks 1 chest, breaks the floor-2 spawner and a wall section, then the server restarts twice and the chunk is unloaded/reloaded
THEN the 3 chests are still empty, the broken chest and spawner are absent, the wall hole remains
AND the broken chest dropped its contents when broken.


- **node**: L0-wind-ac11

### AC-wind-12 · Normal generation hits ~1 % of chunks and only on suitable dry land (L0-wind-ac12)

# AC-wind-12 · Normal generation hits ~1 % of chunks and only on suitable dry land

**Spec:** test 23, §4.6.

GIVEN the seeded roll function
THEN (unit) over 100 000 synthetic chunk keys the Windmill roll rate is 1 % ± 0.1 %
AND (BDS) after exploring ≥ 2 000 Overworld chunks, every placed normal Windmill has liquid share ≤ 5 % and surface Δ ≤ 3 under its plot at placement time (from the debug log), and no Windmill was placed in an ocean chunk
AND the log's roll-success count is consistent with 1 % (no exact match required).


- **node**: L0-wind-ac12

### AC-wind-13 · A normal candidate on rough terrain or colliding is cancelled, never moved or terraformed (L0-wind-ac13)

# AC-wind-13 · A normal candidate on rough terrain or colliding is cancelled, never moved or terraformed

**Spec:** §4.6, §9.2, §9.4.

GIVEN a forced roll (test hook) on a chunk with surface Δ > 3, and another on a chunk overlapping a village/spawner
THEN neither places a Windmill, no block in either plot changed, no neighbouring chunk gets a Windmill as a result
AND the log records reasons `uneven` and `collision:*`.


- **node**: L0-wind-ac13

### AC-wind-14 · Forced preparation levels the plot, blends the edges and leaves deep caves open (L0-wind-ac14)

# AC-wind-14 · Forced preparation levels the plot, blends the edges and leaves deep caves open

**Spec:** §4.7.9–12, §9.2–3.

GIVEN a test world (fixture) with no naturally valid site within 500 blocks and a cave under the best dry site
WHEN the spawn search completes
THEN `stage = 3`, `prepared = true`; the plot surface is one Y; in plot + band no adjacent-column step > 1 that was not natural
AND no field or building block is floating
AND open cave volume still exists deeper than D below the plot
AND (iPad) there is no square platform with vertical walls.


- **node**: L0-wind-ac14

### AC-wind-15 · Forced preparation never damages a structure, a spawner or a player build (L0-wind-ac15)

# AC-wind-15 · Forced preparation never damages a structure, a spawner or a player build

**Spec:** §4.7.10, §6, §9.4.

GIVEN a fixture where the best forced-prep site overlaps (a) a vanilla spawner, (b) a village signature, (c) a player-placed planks hut
WHEN the spawn search runs
THEN none of those blocks changed; the chosen site is a different position
AND no block outside the chosen plot + band + fill volume changed.


- **node**: L0-wind-ac15

### AC-wind-16 · Every Windmill makes exactly one linked-Airship attempt, not replaced by an independent Airship (L0-wind-ac16)

# AC-wind-16 · Every Windmill makes exactly one linked-Airship attempt, not replaced by an independent Airship

**Spec:** test 33, §5.6.

GIVEN the spawn Windmill and a forced normal Windmill that already has an independent Airship within 100 blocks
THEN each Windmill's record has `x.linkedTried` set once with an outcome
AND where the outcome is `placed`, an `airship:L:<windmillId>` exists 40–100 blocks from the Windmill centre and not over its plot
AND the independent Airship did not stop the linked attempt
AND restarts do not create a second linked Airship.


- **node**: L0-wind-ac16

### AC-wind-17 · Overworld only, and all four rotations occur (L0-wind-ac17)

# AC-wind-17 · Overworld only, and all four rotations occur

**Spec:** §2, §15, C-14.

GIVEN extended exploration of the Nether and End with the roll forced to succeed
THEN no Windmill is placed outside the Overworld
AND across ≥ 40 placed Windmills (forced rolls, Overworld), each rotation 0/90/180/270 occurs at least once, and chest/spawner counts match in every rotation.


- **node**: L0-wind-ac17


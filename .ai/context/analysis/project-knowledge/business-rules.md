---
title: Business Rules
type: project-knowledge
generated_at: "2026-10-02T19:12:17.030Z"
source_channel: rollout
node_id: rollout-business-rules
aliases: ["rollout-business-rules","business-rules","project-knowledge/business-rules"]
is_a: ["rollout","business-rules"]
relates_to: ["L0-airs-r001","L0-airs-r002","L0-airs-r003","L0-airs-r004","L0-airs-r005","L0-bast-r001","L0-bast-r002","L0-bast-r003","L0-bast-r004","L0-bast-r005","L0-bast-r006","L0-infr-r001","L0-infr-r002","L0-infr-r003","L0-infr-r004","L0-infr-r005","L0-infr-r006","L0-infr-r007","L0-lgnd-r001","L0-lgnd-r002","L0-lgnd-r003","L0-lgnd-r004","L0-lgnd-r005","L0-lgnd-r006","L0-lgnd-r007","L0-lgnd-r008","L0-lgnd-r009","L0-lgnd-r010","L0-lgnd-r011","L0-lgnd-r012","L0-lgnd-r013","L0-lgnd-r014","L0-lgnd-r015","L0-lgnd-r016","L0-loot-r001","L0-loot-r002","L0-loot-r003","L0-loot-r004","L0-loot-r005","L0-loot-r006","L0-loot-r007","L0-magn-rblk","L0-magn-rcnt","L0-magn-rdup","L0-magn-rexm","L0-magn-rleg","L0-magn-rlim","L0-magn-rply","L0-magn-rrel","L0-magn-rrng","L0-orbc-r001","L0-orbc-r002","L0-orbc-r003","L0-orbc-r004","L0-orbc-r005","L0-orbc-r006","L0-orbc-r007","L0-orbc-r008","L0-orbc-r009","L0-orbc-r010","L0-orbc-r011","L0-orbc-r012","L0-orbc-r013","L0-orbc-r014","L0-pick-r001","L0-pick-r002","L0-pick-r003","L0-pick-r004","L0-pick-r005","L0-pntr-cons","L0-pntr-r001","L0-pntr-r002","L0-pntr-r003","L0-pntr-r004","L0-pntr-r005","L0-pntr-r006","L0-pntr-r007","L0-pntr-r008","L0-pntr-r009","L0-ring-cons","L0-ring-r001","L0-ring-r002","L0-ring-r003","L0-ring-r004","L0-ring-r005","L0-ring-r006","L0-ring-r007","L0-ring-r008","L0-ring-r009","L0-ring-r010","L0-sauc-r001","L0-sauc-r002","L0-sauc-r003","L0-sauc-r004","L0-sauc-r005","L0-sauc-r006","L0-scyt-r001","L0-scyt-r002","L0-scyt-r003","L0-scyt-r004"]
priority: 580
---

# Business Rules

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

### Rule: one fixed Airship template — modern, undamaged, no assisted ground access (L0-airs-r001)

# Rule: one fixed Airship template — modern, undamaged, no assisted ground access

**Links:** `part_of: ["L0-airs"]` · `is_a: ["rule"]`

- Fixed size 75×13×18 (L×W×H), template `[75, 18, 13]` (x, y, z); spec §5.1 said ≈15×7×10–12 (L×W×H, unrotated). Lower hull: elongated oval gondola, grey/light-grey concrete, intact glass windows, working lights. Upper hull: large oval balloon, fully decorative, grey/light-grey concrete — no interior volume that holds chests or a spawner (§5.1).
- No vines, cobwebs, cracks or any abandoned-structure decor. Small iron-block/hatch/chain/lamp details are allowed if they do not complicate the template; propellers/stabilizers are not required (§5.1).
- Exactly 2 doors, on opposite sides of the lower hull. No ladder, lift, waterfall or teleporter down to the ground — the player supplies their own access (building, Elytra, Ender Pearl, or another Add-On item's ability under that item's own rules) (§5.2).
- The hull is breakable like any other block structure; a door or a broken wall/window are both valid entry points (§5.2).
- Only rotation (0/90/180/270, seeded once) varies the placed instance. No mirroring, no alternative templates (`L0-strf-r004`).
- Which axis carries the doors is an assumption, not a spec fact (`L0-airs-as01`).




- **node**: L0-airs-r001

### Rule: fixed contents — 10 chests, 1 Vindicator spawner, no one-time mobs of its own (L0-airs-r002)

# Rule: fixed contents — 10 chests, 1 Vindicator spawner, no one-time mobs of its own

**Links:** `part_of: ["L0-airs"]` · `is_a: ["rule"]`

- Interior: 1 central corridor + 4 small rooms in the lower hull. Each room has exactly 1 ceiling lamp; the corridor is lit enough to be usable but the spawner cell must stay within the engine's light-suppression threshold for spawners (`L0-strf-r010`) (§5.2).
- Exactly 10 chests, all at fixed template-local points, converted to world space by `rotateLocal` (`L0-strf-r004`): 2 per room × 4 rooms = 8, plus 2 in the corridor (§5.3).
- Exactly 1 spawner, at a fixed point approximately at the corridor's centre: a vanilla `minecraft:mob_spawner` baked into the template with `EntityIdentifier` = Vindicator (`L0-adr-tmpl`, `L0-strf-r010`). It spawns with a vanilla iron axe; no equipment script. Fallback if the entity id does not survive `place`: `L0-strf-d002`'s pseudo-spawner — a body-transparent change, `airs` does not special-case it.
- All 10 chests are filled exactly once from the shared custom weighted table (`L0-loot`, custom path only — `airs` never uses the vanilla-loot-table path that `wrdn`/`bast` use). Room/corridor position does not change loot quality (§3.3, §5.3).
- `airs.def.chests.length === 10` and `airs.def.guards === undefined` are asserted by `strf`'s template test and registry init (`L0-strf-e001`, `L0-strf-p004`) — `airs` skips the `looted → guarded` step entirely, going straight to `done` after loot.




- **node**: L0-airs-r002

### Rule: independent generation is a 2 % roll validated over the whole rotated footprint, never terraformed or relocated (L0-airs-r003)

# Rule: independent generation is a 2 % roll validated over the whole rotated footprint, never terraformed or relocated

**Links:** `part_of: ["L0-airs"]` · `is_a: ["rule"]`

- Chance: 2 % per suitable Overworld chunk, one roll per chunk (`airs.def.chance = 0.02`, `L0-strf-r002`). Any land biome/terrain qualifies — forest, plains, mountains, ravines — subject only to footprint, altitude and collision (§5.5).
- Validity is `strf`'s `dryLand` profile sampled over the **whole rotated footprint**, not just the centre point (§5.4): liquid surface samples ≤ 10 % (`L0-strf-as02`), plus `strf`'s `altitude` profile and the generic 3D collision test with a 2-block margin (`L0-strf-r006`, `L0-strf-d004`).
- Altitude/ceiling: bottom Y ≥ `maxSurfaceY(footprint, including trees/leaves) + clearance`, clearance seeded in [40,70] and clamped down to 40 if the structure would otherwise clip the world ceiling; reject the candidate if it still cannot fit at clearance = 40 (`L0-strf-r005`, `-r003`, `-p002`; §5.4, test 31). `airs` contributes no numbers here beyond `verticalMode = "altitude"` — the solver itself is `strf`'s.
- On a failed roll, invalid site, or collision: cancel. `airs` never relocates the candidate to a neighbouring chunk and never terraforms the site (§5.5) — that liberty belongs only to `wind`'s guaranteed spawn path (`L0-strf-r005`).
- At most one independent Airship per candidate chunk (`L0-strf-r002` item 3). Two independent Airships may end up close together with no minimum distance rule between them; only a physical AABB overlap cancels one of them (§5.5, test 33's "no overlap" half).




- **node**: L0-airs-r003

### Rule: the Windmill-linked search is a hard 40–100-block ring, tried once, never widened, never forced, never deduplicated against an independent Airship (L0-airs-r004)

# Rule: the Windmill-linked search is a hard 40–100-block ring, tried once, never widened, never forced, never deduplicated against an independent Airship

**Links:** `part_of: ["L0-airs"]` · `is_a: ["rule"]`

- Every placed Windmill instance — including the guaranteed spawn one — triggers exactly one call to `airs.tryLinked(parentInstance)` from the Placer's `finish` step, guarded by `la` on the Windmill's `InstanceRecord` so it never runs twice for the same instance (`L0-strf-p003` step 7; §5.6).
- `airs` searches only `strf.searchRing(airsDef, windmillCentre, rMin=40, rMax=100)` — an annulus, not a point. Every candidate in the ring is run through the same validation and collision checks as independent generation (`L0-airs-r003`), plus one extra, `airs`-specific 2D exclusion: a candidate is rejected if its horizontal (X/Z) footprint intersects the parent Windmill's own footprint, regardless of vertical separation (`L0-strf-d004`; §5.6 "не должен висеть прямо над Мельницей/полями"). This exclusion is `airs`'s own filter, not part of `strf`'s generic 3D collision test.
- **No dedup, either direction** (`L0-strf-r002` item 6): a pre-existing independent Airship already inside [40,100] of the Windmill does **not** satisfy the linked attempt — `airs` still tries to place its own. Conversely, a successful linked Airship does not consume, or block, that chunk's own independent 2 % roll.
- **No widening, no forcing.** If no position anywhere in [40,100] validates, the linked Airship is simply not created for that Windmill instance. `airs` never expands the search past 100 blocks and never force-prepares a site — that asymmetry with `wind`'s guaranteed-spawn (which always succeeds by forcing terrain) is intentional (§5.6 "не расширять... и не форсировать размещение любой ценой").
- Two Windmills close together each run their own independent linked search; results are never merged or deduplicated between them (§5.6).
- Far ring candidates are loaded by temporary ticking areas. One that cannot be loaded leaves the attempt `pending`.




- **node**: L0-airs-r004

### Rule: the Airship has no one-time persistent mobs — the only spawned actor is the vanilla spawner (L0-airs-r005)

# Rule: the Airship has no one-time persistent mobs — the only spawned actor is the vanilla spawner

**Links:** `part_of: ["L0-airs"]` · `is_a: ["rule"]`

- `airs.def.guards` is absent/undefined. Unlike `wind` (10 field Zombie Villagers) and `bast` (7–10 Piglins + 2 Piglin Brutes), the Airship spawns nothing itself at init time (§5.3, §9; `L0-strf-r009`, `L0-strf-p004`). Its `InstanceRecord` skips the `looted → guarded` step and goes `placed → looted → done`.
- The only mob associated with an Airship instance is whatever the vanilla spawner produces at runtime; those entities are **not** tagged `andrew:guard:<instanceId>` and are not tracked by the registry (`L0-strf-r009` last bullet).
- Persistence is entirely `strf`'s: the registry is the sole source of truth for "already initialised" (`L0-strf-r008`); loot never refreshes and a broken spawner never restores (`L0-strf-r011`, §6, §9). `airs` adds no persistence logic of its own.




- **node**: L0-airs-r005

### Bast r001 concept rule (L0-bast-r001)

**Rule:** Governed by `L0-strf-r001` (5% roll per suitable chunk), `L0-strf-r002` (cancel-outright, no relocation, with `pending` deferral per §2), `L0-strf-p001` (chunk discovery), `L0-strf-r006` (overlap-cancellation against custom or vanilla structures, including a genuine Bastion Remnant), and profile `netherFloor` (`L0-xasm4` §3) for lava-ocean/solid-support suitability. Body: dimension Nether, candidate chance 0.05. All Nether biomes are eligible provided the physical site passes these checks.

**Rationale:** Keeps generation rare and predictable, and guarantees no other content is ever destroyed by Mini Bastion placement.

**Source:** §14.2, §15.




- **node**: L0-bast-r001

### Bast r002 concept rule (L0-bast-r002)

**Rule:** Each Mini Bastion instance uses one fixed template (no template variation) with an approximate 20×20 block footprint and 10-12 block height, containing 2-3 internal levels connected by clear stairs/short transitions — the layout must feel coherent, without excessive random deadly drops. The template is placed with a random rotation of 0°, 90°, 180° or 270°. Exterior materials must read immediately as a small Bastion Remnant (Blackstone, Polished Blackstone, Polished Blackstone Bricks and other vanilla bastion materials), with visible external gold accents for long-range recognizability; no separate artificial marker is used (contrast with Mini Warden City's sculk surface marker, `L0-wrdn`).

**Rationale:** Visual/gameplay parity with vanilla Bastion Remnants without a bespoke marker system.

**Source:** §14.1.




- **node**: L0-bast-r002

### Bast r003 concept rule (L0-bast-r003)

**Rule:** Exactly 10 chests are placed at fixed positions per instance: 3 in the central treasure room, 7 distributed through the rest of the structure (small rooms, niches, side areas, passages). The 3 treasure chests roll against `L0-loot-p002` (`chests/bastion_treasure`); the other 7 roll against `L0-loot-p002` (`chests/bastion_other`). The shared custom weighted loot system used by Windmill/Airship (family §3) does **not** apply to Mini Bastion. `L0-loot-r006`, `L0-loot-r007`.

**Rationale:** Mini Bastion deliberately reuses genuine vanilla loot behavior rather than the custom system, matching Mini Warden City's choice for Ancient City loot (see ADR-bast-02).

**Source:** §14.4.




- **node**: L0-bast-r003

### Bast r004 concept rule (L0-bast-r004)

**Rule:** The treasure room sits approximately at the center of the bastion's interior, below the main traversal levels, surrounded by/approached across ordinary vanilla lava with no special properties (bucketable, blockable, reacts normally with water). It must be reachable both by building/routing a safe path through the lava area and by descending or falling into it from the level above. It contains 2-4 randomly chosen Gold Blocks (ordinary blocks, minable normally) and exactly one of the two Piglin Brutes as its dedicated guard.

**Rationale:** The treasure room is the component's signature risk/reward space; two access methods keep it playable without special-casing lava.

**Source:** §14.3.




- **node**: L0-bast-r004

### Bast r005 concept rule (L0-bast-r005)

**Rule:** On first initialization of a given Mini Bastion instance, spawn — exactly once — 7-10 regular Piglins and exactly 2 Piglin Brutes; Hoglins are never spawned as part of this roster. One Brute guards the treasure room (R-bast-004); the other occupies a second fixed position elsewhere in the template. All of these initial mobs follow `L0-strf-r009`, `L0-adr-strs`. No mob spawners are used for this garrison — it exists solely as the one-time initial set.

**Rationale:** The garrison is a fixed, exhaustible challenge, not a renewable one; matches the "one-time persistent" pattern the family addendum uses for Windmill's field Zombie Villagers too.

**Source:** §14.5, §15.




- **node**: L0-bast-r005

### Bast r006 concept rule (L0-bast-r006)

**Rule:** After generation, every ordinary block, the lava, the chests and the Gold Blocks are normal mutable world state, minable/placeable under standard vanilla rules for those block types. Nothing that is destroyed, looted, or altered by a player — including killed guards — is ever restored, regardless of chunk unload/reload or server restart. Initializing (or re-initializing on load) a given instance must be idempotent: it must never create a second set of chests, Gold Blocks, or mobs for the same bastion. Cite: `L0-strf-r008`, `L0-strf-p004`, `L0-strf-r009`, `L0-adr-strs`.

**Rationale:** Matches the family-wide no-regeneration and idempotent-init invariants shared by all four structures.

**Source:** §14.6, §15.




- **node**: L0-bast-r006

### Rule: version targets live in one place, and drift is fixed by retargeting, never by loosening the API channel (L0-infr-r001)

# Rule: version targets live in one place, and drift is fixed by retargeting, never by loosening the API channel

**Links:** `part_of: ["L0-infr"]` · `is_a: ["rule"]`

`scripts/targets.mjs` is the sole source for three constants: `MIN_ENGINE_VERSION = [1,26,50]`, `SERVER_API_VERSION = '2.10.0'`, `BDS_VERSION = '1.26.51.1'`. Every manifest, `docker/bds/compose.yaml`'s `VERSION`, and the README must agree with it; literal copies that exist: `package.json:27` (npm types, unguarded), `README.md:8-10` (unguarded), `docker/bds/compose.yaml:20` (guarded), `tests/validate.test.mjs:35,41,44,54` (test expectations) [C-2, C-3]. `validate.mjs`, `bds-lib.mjs` (BDS_VERSION), `lib/mcstructure.mjs` (MIN_ENGINE_VERSION) and tests `gametest-pack`/`selftest-pack` import from `targets.mjs`; `bds-gametest.mjs` reaches them through `bds-lib.mjs`. `assertComposePinsVersion()` (run at the top of `bds:check`, `bds:up` and `bds:gametest`) fails the run immediately if `compose.yaml`'s `VERSION` env drifts from `BDS_VERSION`.

**On a version/dependency error** from the game or BDS (`Unsupported version`, `Missing dependency: @minecraft/server …`, `Pack format version mismatch`): read the error text, update the matching constant in `targets.mjs`; for `SERVER_API_VERSION` also `npm install @minecraft/server@<x> --save-exact` (`package.json:27` + lock: `npm ci` alone keeps compiling against the old types), the manifests (`validate` forces them), `README.md:8-10` and `tests/validate.test.mjs:35,41,44,54`; then `npm run build` and re-check. **Never** enable a `-beta`/`-preview`/`-rc` module or an experiments toggle to make the error disappear — that hides a real incompatibility instead of fixing it [C-3; README §7].

**Rationale for centralizing**: hand-syncing the version across every manifest was missed twice on 2026-09-20 (`set-version.mjs` header comment) — the fix was a script (`npm run version:set -- <x.y.z>`) that rewrites `package.json`, `package-lock.json`, and every `packs/*/manifest.json` header/module/dependency version in one pass, because the iPad treats same-uuid + same-version as "already imported" and needs a bump on every content change.




- **node**: L0-infr-r001

### Rule: verification is split across three channels, and only two of them are automatic (L0-infr-r002)

# Rule: verification is split across three channels, and only two of them are automatic

**Links:** `part_of: ["L0-infr"]` · `is_a: ["rule"]`

- **build** — `tsc --noEmit` (types) + `npm run validate` (manifest/JSON structure). Mac-only, no Docker.
- **bds** — `npm run bds:check` / `npm run bds:gametest`. Proves pack loading, manifest/dependency errors, and script/gameplay execution from a Bedrock Dedicated Server log or in-engine GameTest assertions.
- **ipad** — human-eyes-only: rendering, icon, Creative-inventory placement, RU/EN names. **A green `bds` run never closes an `ipad` criterion** [C-6] — the engine-log analysis in `bds:check` can prove the resource pack was *accepted*, but not that it *renders* correctly.

Per `decision-verification-approach-automatic` (full autopilot, 2026-09-20): `build` and `bds` criteria are typed `build`/`unit`/`e2e` and closed automatically by `/verify` from run-check artifacts, no operator involved when green. `ipad` criteria are typed `manual`, are planned minimally, and **do not block merge/autopilot** — they stay open until an operator confirms them (`task_accept` / board button). Auto-smelt specifically must be verified in a **Survival** world; Creative suppresses drops [C-9], so `bds:up` always starts Survival+cheats while `bds:check` stays Creative.




- **node**: L0-infr-r002

### Rule: `npm run build` must succeed from a clean clone; fixed file layout and ownership (L0-infr-r003)

# Rule: `npm run build` must succeed from a clean clone; fixed file layout and ownership

**Links:** `part_of: ["L0-infr"]` · `is_a: ["rule"]` · `relates_to: ["L0-infr-r007"]`

No manual packaging steps, no machine-specific paths [C-8] — `scripts/build-clean-clone.sh` exists to prove this in isolation, separate from the everyday `npm run build`.

Fixed layout:
- `src/` — TS sources, single entry `src/main.ts` (+ `src/selftest/main.ts` for the dev-only self-check). **v2**: structure template layout sources also live under `src/` (assumed `src/structures/templates/`, not yet fixed by an ADR — `L0-infr-as05`).
- `packs/behavior/`, `packs/resource/` — shipped packs; `packs/behavior/scripts/` is **build output**, gitignored, never hand-edited. **v2**: `packs/behavior/structures/andrew/` is likewise generated build output, produced by `scripts/build-structures.mjs`, never hand-edited or committed as a binary — see `L0-infr-r007`.
- `packs/selftest/`, `packs/gametest/` — dev-only, never shipped (see L0-infr-r004, L0-infr-r005).
- `scripts/*.mjs` — build/validate/BDS tooling (**v2**: plus `build-structures.mjs`); `tests/` — `node:test`; `docker/bds/` — the dedicated server; `dist/` — `andrew.mcaddon` + check logs, gitignored.

File ownership (who may write which file, from `constraints.md`):
- `packs/behavior/manifest.json`, `packs/resource/manifest.json` — only PACK-01; uuids are constant, never regenerated at build.
- `package.json` — created by INFRA-01; later tasks only add scripts, never rewrite ownership.
- `.env*` / secrets — none expected in this project; never committed.




- **node**: L0-infr-r003

### Rule: the selftest pack proves content from inside the engine but never ships (L0-infr-r004)

# Rule: the selftest pack proves content from inside the engine but never ships

**Links:** `part_of: ["L0-infr"]` · `is_a: ["rule"]`

`packs/selftest` is a dev-only behavior pack, bundled by `npm run build` (`bundleSelfTest()`) but deliberately **excluded** from `dist/andrew.mcaddon` — only `bds-check.mjs` installs it, straight from the working tree, alongside the release packs. `tests/selftest-pack.test.mjs` asserts the archive's two directory names explicitly, so the selftest pack cannot leak into a release by accident.

It runs inside the engine at world load and prints its own verdict lines (`[selftest] PASS/FAIL …`, terminated by `[selftest] DONE passed=N failed=M`) to the BDS log, which `analyzeLog()` reads as ground truth *independent of* the log-scraping heuristics used for the release script. `--break-selftest` rebundles it with a deliberately-failing fixture (`__SELFTEST_FIXTURE__` esbuild `--define`) for negative testing of the check itself, then unconditionally rebundles clean afterward — so a `--no-build` run right after never inherits the sabotaged bundle.




- **node**: L0-infr-r004

### Rule: GameTest and the Beta APIs experiment never reach the release build (L0-infr-r005)

# Rule: GameTest and the Beta APIs experiment never reach the release build

**Links:** `part_of: ["L0-infr"]` · `is_a: ["rule"]`

`@minecraft/server-gametest` has no stable channel — using it requires the "Beta APIs" experiment on the world. The release product must stay on stable `@minecraft/server` 2.10.0 with no experimental toggles in any manifest [C-2]. Enforced structurally:
- `packs/gametest` is a devDependency-only pack, never zipped into `dist/andrew.mcaddon`.
- The experiment is enabled only in a separate world (`LEVEL_NAME=gametest`, superflat `LEVEL_TYPE=FLAT`), never in the everyday `andrew` world that `bds:check`/`bds:up` use.
- The two worlds are driven by the same `compose.yaml` via `BDS_LEVEL_NAME`/`BDS_LEVEL_TYPE`/`BDS_GAMEMODE` env overrides, not by separate compose files, so the version pin (`assertComposePinsVersion`) and port/image config stay single-sourced.




- **node**: L0-infr-r005

### Rule: statistical chunk-roll checks measure `strf`'s roll, they don't implement it (L0-infr-r006)

# Rule: statistical chunk-roll checks measure `strf`'s roll, they don't implement it

**Links:** `part_of: ["L0-infr"]` · `is_a: ["rule"]` · `relates_to: ["L0-adr-strc", "L0-infr-p006", "L0-xq2"]`

The `bds`/GameTest lane drives `strf`'s deterministic roll formula (`hash(worldSalt, dim, cx, cz, structureId) < chance`, `L0-adr-strc`) over a large synthetic sample of chunk coordinates and asserts the observed success rate lands inside a tolerance band of the configured per-structure constant (1 % Windmill, 2 % Airship, 5 % Warden City/Bastion — pending confirmation, `L0-xq2`). Neither the sample size nor the tolerance is specified by any raw source; infra picks both (`L0-infr-as03`) and must pick them large/wide enough that the check doesn't flake on a correct roll implementation, and tight enough that a broken roll (wrong constant, wrong hash) still fails reliably.

Infra owns only this measurement harness. It does not own, and must not reimplement, the roll formula, `worldSalt` generation, or the chance-constants table — those live in `strf`'s config (`L0-adr-strc` consequences). If the harness's own copy of the formula drifts from `strf`'s, the check would silently validate the wrong thing; the harness must call `strf`'s roll function directly rather than reproducing the hash.




- **node**: L0-infr-r006

### Rule: structure templates are generated build output, never hand-edited or checked in as binaries (L0-infr-r007)

# Rule: structure templates are generated build output, never hand-edited or checked in as binaries

**Links:** `part_of: ["L0-infr"]` · `is_a: ["rule"]` · `relates_to: ["L0-adr-tmpl", "L0-infr-p005", "L0-infr-r003", "L0-infr-r004"]`

Every `.mcstructure` file under `packs/behavior/structures/andrew/` is produced by `scripts/build-structures.mjs` from checked-in TS/JSON layout sources — never hand-built in-game and exported, and never committed as a binary blob [`L0-adr-tmpl`; C-8]. This mirrors the existing rule for `packs/behavior/scripts/` (`L0-infr-r003`): both are gitignored build output regenerated by `npm run build`, and both ship inside the same zip.

**Enforcement**: the round-trip unit test (`L0-infr-p005` step 3) fails the build if a generated file's block-entity counts don't match its own source definition — the structural-content analogue of `validatePacks()` for JSON, run in the `build` channel on every build, not only on template changes.

**Rationale**: the Mac mini + iPad hardware has no Bedrock client on macOS and no Windows editor (`L0-adr-tmpl` context), so in-game structure-block export was never viable; generating from source is also the only way to keep the four templates reproducible from a clean clone (C-8) and to keep spawner/shrieker block-entity state — which the stable Script API can't set at runtime — correct by construction.




- **node**: L0-infr-r007

### Lgnd r001 concept rule (L0-lgnd-r001)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ent1", "L0-stgt", "L0-sprj"]
---
**R-lgnd-001: One implementation per general rule (C-17, ADR-021).**

The craft gate, instance mark, death retention, loss return, cooldown/busy storage, Use dispatch, HUD and the hidden predicate live only in `src/legendary/`.

A weapon module (`src/websword/trap.ts`, `src/scythe/*`) **may**:
- call `registerLegendary(def)`;
- call `isReady / isBusy / setBusy / start / remaining` and `isHiddenFromTargeting`;
- implement its `ability`.

It **may not**:
- subscribe to `itemUse`, `playerInteractWithBlock`, `entityDie`, `playerSpawn`, `playerInventoryItemChange` or `entityRemove` for its own item;
- read or write any `andrew:<prefix>_*` or `andrew:hidden_until` property;
- call `setActionBar`.

**Check:** `grep -rnE "andrew:(ws|sc)_|andrew:hidden_until" src/` matches only `src/legendary/state.ts`. This extends the guard stated in the shipped `state.ts` header.




- **node**: L0-lgnd-r001

### Lgnd r002 concept rule (L0-lgnd-r002)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p001", "L0-lgnd-p007"]
---
**R-lgnd-002: Independent one-per-world craft budget per weapon.**

Source: Scythe §1 (*«один успешный Survival-крафт на мир, сохранение флага после рестарта, глобальное сообщение при первом крафте … Creative и /give … без расходования Survival-флага»*); Web Sword §3; Q-006, Q-008.

- Each registered weapon has its own world flag `andrew:<p>_crafted`. A Scythe craft never reads, consumes or resets the Web Sword budget, and vice versa.
- Only a Survival/Adventure craft of an unmarked result claims the flag. Creative/Spectator results stay unmarked and are ignored. Admin `give` never touches the flag.
- The flag survives logout, save and restart (C-6). Only `reset <weapon>` clears it.
- The broadcast fires exactly once per weapon per world, on the claiming craft.
- A blocked craft is refunded with that weapon's `refundIngredients` and a private message. No result stack remains.




- **node**: L0-lgnd-r002

### Lgnd r003 concept rule (L0-lgnd-r003)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ent3"]
---
**R-lgnd-003: Cooldowns are isolated per (player, abilityKey).**

Source: Scythe §6 (the priority rule presupposes independent cooldowns); ADR-007/ADR-017; Q-009.

- Starting the Scythe cooldown leaves the Web Sword's readiness unchanged, and vice versa. The shipped single slot (where `startCooldown` ignores `_abilityKey`) is replaced by one key per weapon.
- A cooldown belongs to the player, not the stack. Handing the weapon to someone else does not hand over its cooldown.
- The length is `def.cooldownMs`: exactly 30 s for both weapons, measured on `Date.now()`, and it survives reconnect and restart.
- Only the ability owner arms a cooldown. The framework never starts one, neither on dispatch nor on refusal.




- **node**: L0-lgnd-r003

### Lgnd r004 concept rule (L0-lgnd-r004)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p004", "L0-lgnd-as07", "L0-lgnd-as08"]
---
**R-lgnd-004: Hand priority.**

Source: Scythe §6 and Web Sword §8 (*«готовая способность main hand имеет приоритет; если main-hand способность на cooldown, может сработать готовая off-hand способность»*). Q-019 default (a).

- At most one ability runs per Use press.
- A ready main-hand legendary fires **even if it then refuses** (no target, no room). A refusal does not fall through.
- If the main-hand legendary is not ready (cooldown **or busy**, `L0-lgnd-as08`), a ready off-hand legendary with a *different* ability key fires.
- Both not ready → nothing happens and no state changes.
- The off hand can only be triggered through a main-hand legendary press (engine limit, `L0-lgnd-as07`). An empty or non-legendary main hand never casts the off-hand weapon.
- Both items declare `minecraft:allow_off_hand: true`. The JSON change is owned by `L0-webs` (Web Sword) and `L0-sitm` (Scythe), per `L0-adr-cast` §4.




- **node**: L0-lgnd-r004

### Lgnd r005 concept rule (L0-lgnd-r005)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ent2", "L0-lgnd-ent4", "L0-lgnd-p003", "L0-lgnd-ad02"]
---
**R-lgnd-005: At most one live generation per instance.**

Source: C-7 (now including Void return). Every return path is a duplication primitive unless the returned copy supersedes the lost one.

- A marked stack is live iff its `gen` equals the ledger generation for its `(prefix, id)`.
- Re-issuing a lost instance bumps the generation **before** the new stack exists, in the same synchronous turn.
- A stale stack:
  - cannot cast (the dispatcher treats it as absent);
  - is deleted on death, not retained;
  - is not watched or returned;
  - is deleted on the first `playerInventoryItemChange` that shows it in any player's inventory, with a private `voided` message.
- Nothing lowers a generation. `reset` does not touch generations.

**Consequence:** a mis-classified "lost" copy may still exist physically (for example in a hopper chest), but it can never be a second usable legendary.




- **node**: L0-lgnd-r005

### Lgnd r006 concept rule (L0-lgnd-r006)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad01", "L0-lgnd-p006"]
---
**R-lgnd-006: Shipped Web Sword storage is frozen and read as-is.**

Source: ADR-021 (Web Sword storage keys are kept), C-10.

- The Web Sword prefix is `ws` forever. It derives exactly the 0.3.0 names: `andrew:ws_crafted`, `ws_crafted_by`, `ws_pending`, `ws_origin`, `ws_owner`, `ws_id`, `ws_owner_name`.
- 0.3.0 formats must parse:
  - `ws_pending` holding a single serialised mark → a one-element array;
  - a stack without `ws_gen` → gen 0;
  - a stack without `ws_holder` → holder = `ws_owner`;
- New fields are additive. The framework never deletes or renames a key the shipped version wrote, except the cooldown key (`cx07`).
- After the upgrade, a 0.3.0 world where the sword was crafted still refunds a new craft. A sword cooling at the upgrade reads ready (`wpn2` on `cx07`).




- **node**: L0-lgnd-r006

### Lgnd r007 concept rule (L0-lgnd-r007)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p005", "L0-lgnd-cx01", "L0-sitm"]
---
**R-lgnd-007: One HUD, holders only, both hands, translate keys only.**

Source: Scythe §6 (*«в основной или второй руке показывать состояние … Ready / remaining time»*); Web Sword §8; C-9; ADR-021 (a single actionbar HUD).

- Exactly one module writes the Action Bar for legendaries. `L0-stgt`/`L0-sprj` supply state through `setBusy`/`start` and never call `setActionBar`.
- The bar is written only for players holding a legendary in either hand. Everyone else's bar is untouched, not even cleared.
- Order is main hand first, then off hand. Remaining time is shown in whole seconds, rounded up, and never 0 while cooling.
- All text is rawtext `translate`. The keys are owned by `L0-sitm` (Scythe) and the shipped lang files (Web Sword).
- This is the add-on's only standing interval (10 ticks). The loss watcher (`L0-lgnd-ad03`) and volley loops (ADR-025) are transient.




- **node**: L0-lgnd-r007

### Lgnd r008 concept rule (L0-lgnd-r008)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p002", "L0-lgnd-ent4"]
---
**R-lgnd-008: Death retention returns every live legendary, exactly once.**

Source: Scythe §1 (*«сохранение при смерти»* as a general rule); Web Sword §4, §12; Q-016 (unlootable).

The shipped code holds **one** `ws_pending` per player, and `findMarkedSword` returns only the **first** marked sword. With two weapons, admin copies and an off hand, that loses items.

- A player who dies carrying N live legendaries (any mix of weapons and admin copies, in any slot including the off hand) gets back each of them after respawn.
- Pending is per weapon and holds an array of marks.
- Restore is idempotent per `(id, gen)`. A repeated spawn/join, a reconnect or a restart grants nothing extra.
- No live legendary item entity remains at the death spot. Another player can never pick one up (Q-016).
- Unmarked copies follow vanilla death drops.




- **node**: L0-lgnd-r008

### Lgnd r009 concept rule (L0-lgnd-r009)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ent3", "L0-lgnd-ad05", "L0-sprj", "L0-stgt"]
---
**R-lgnd-009: Busy semantics.**

Source: ASM-017, ADR-025, and the decomposition-plan contract `cooldown.{isReady, isBusy, setBusy, start, remaining}`.

- `busy` means a multi-tick activation of that ability is in progress (a Scythe volley). While busy, `isReady` is false, a second Use of that weapon does nothing and says nothing, and the HUD shows `active`.
- busy and cooldown are independent:
  - A volley ending with 0 hits clears busy and does **not** start a cooldown (Scythe §5).
  - A volley ending with ≥ 1 hit clears busy **and** starts the cooldown in one turn, so no tick sees `isReady` true.
- busy is memory-only. It is false after a restart and cleared when the owner leaves. It is never persisted, so it can never strand an ability in "active".
- The Web Sword never sets busy. Its behaviour is unchanged.




- **node**: L0-lgnd-r009

### Lgnd r010 concept rule (L0-lgnd-r010)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-stgt", "L0-lgnd-as09", "L0-lgnd-cx03", "L0-lgnd-ac14"]
---
**R-lgnd-010: `isHiddenFromTargeting(player)` reads `andrew:hidden_until` as an epoch-ms deadline (C-21).** Source: Scythe §3; L0 C-21.

- **Storage.** The player dynamic property `andrew:hidden_until` (`HIDDEN_UNTIL_KEY`, `src/legendary/hidden.ts:21`) holds a `Date.now()` deadline in **milliseconds**. That is the same clock as the cooldown (`andrew:cd_*`) and busy (`andrew:busy_*`) deadlines and the next UFO arrival. C-21 applies: every durable deadline uses epoch ms. `system.currentTick` restarts with the script engine, and `getAbsoluteTime()` stops under `dodaylightcycle false`.
- **Read.** `isHiddenAt(Date.now(), value)`. A missing or non-number value means not hidden; nothing throws.
- **Write.** `hideFromTargeting(player, seconds)` writes `Date.now() + seconds × 1000`. Zero or less clears it. `/andrew:hide <seconds> [target]` is the operator and test seam. The future Shadow Blade writes the same key in ms, and replaces only the body of `isHiddenFromTargeting`.
- **Durability.** It survives reconnect and restart. A deadline written before a restart is still exact after it.
- **Pack scope.** Dynamic properties are per pack. A player hidden by the release pack reads as not hidden in the GameTest pack (`hidden.ts:24-27`), so a GameTest must hide through its own pack.
- **Not hiding.** Vanilla invisibility is not hiding.

This settles `cx03`: C-21 is now the L0 wording, and ASM-020's "ticks" is retired.




- **node**: L0-lgnd-r010

### Lgnd r011 concept rule (L0-lgnd-r011)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p003", "L0-lgnd-r002"]
---
**R-lgnd-011: Returning an item never reopens the craft right.**

Source: Q-014 (destroying the only sword does not give back the craft right), refined by Q-020 default (a): *returning the item ≠ reopening the craft right*.

- Loss return (`L0-lgnd-p003`) and death retention (`L0-lgnd-p002`) never write `andrew:<p>_crafted`.
- An instance that is not returned (for example removed by `/clear` or `/kill`, which are operator actions and not "ordinary means") leaves the budget spent. The operator remedy stays `reset <weapon>`.
- This applies to the Web Sword too. It changes shipped behaviour (lava and the Void used to destroy the sword for good), under Q-020 (a).




- **node**: L0-lgnd-r011

### Lgnd r012 concept rule (L0-lgnd-r012)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad10", "L0-lgnd-p003", "L0-lgnd-p008", "L0-lgnd-ac09", "L0-lgnd-ac19", "L0-xcx10"]
---
**R-lgnd-012: Legendary destruction policy (all weapons)**

A **live marked** legendary is never lost to ordinary destruction. Which outcome applies depends on the cause:

| Cause | Outcome | Mechanism |
|---|---|---|
| This add-on removes blocks or detonates (Cannon LMB/RMB, any future effect) | **Stays in the world.** Same stack, same `gen`, placed at a safe spot outside the volume. No message. | `protectLegendariesIn` (`p008`) is called **before** the removal |
| RMB drop suppression | Legendary item entities are **never** removed | `isLegendaryItemEntity` exemption (`ring`) |
| Vanilla container break (player, TNT, creeper) | **Drops** as an item entity (vanilla spill) | none; the drop is then watched |
| Item entity burnt (fire, lava), cactus, vanilla explosion, despawn | **Returned** to the last holder with `gen + 1`, plus a private `returned` message; queued in the owed list if the holder is offline | `p003` (deviation C-16) |
| Void (below `heightRange.min`) | Returned, as above (Orbital §5) | `p003` |

Invariants:
- No path grants a copy while a live copy exists. A `gen` bump always comes before a re-issue, and a protective move never bumps `gen` (C-7).
- Unmarked (Creative, `/give`) copies are outside this rule. They behave as vanilla items (`as11`).
- The craft flag is never reopened by any destruction (`r011`).
- The Web Sword, the Scythe and the Cannon are treated the same (Orbital §5 "общее правило").




- **node**: L0-lgnd-r012

### Lgnd r013 concept rule (L0-lgnd-r013)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r012", "L0-lgnd-p008", "L0-lgnd-ac19", "L0-lgnd-ac20", "L0-lgnd-cx12", "L0-xcx10", "L0-pntr", "L0-ring"]
---
**R-lgnd-013: Container-destruction rule**

When a block with an inventory (chest, trapped chest, barrel, hopper, dropper, dispenser, furnace family, brewing stand, shulker box, crafter, decorated pot) that holds a live marked legendary is destroyed, the legendary must survive or drop, never vanish (Orbital §5).

1. **Script removal** (`setType`, `fillBlocks`, `structureManager` overwrite, the Cannon LMB): the caller runs `protectLegendariesIn` over the affected volume **before** the first block change of that tick. Removing such a block without the call is a defect. `ac19` detects it.
2. **Script explosion** (`createExplosion`, the Cannon RMB): the helper runs over the blast AABB (centre ± power) before `createExplosion`. Ordinary contents may then be suppressed (`L0-xasm7`), and a legendary cannot be among them.
3. **Vanilla destruction:** rely on the vanilla spill. The dropped legendary falls under `r012` from then on.
4. **Death of the previous owner** while the legendary sits in a container: nothing happens (Orbital §5). Retention reads only the dying player's own inventory and off hand.
5. **Nested storage** (a legendary inside a shulker-box *item* or a bundle): out of reach of every rule here. Known limit, `cx12`.
6. Containers are never scanned outside a destruction volume (C-4). The helper runs only on demand.




- **node**: L0-lgnd-r013

### Lgnd r014 concept rule (L0-lgnd-r014)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad08", "L0-lgnd-p001", "L0-lgnd-r002", "L0-lgnd-ac15", "L0-xcx9"]
---
**R-lgnd-014: Only a craft token can claim or spend a weapon's craft budget**

- A weapon's one-per-world flag (`andrew:<p>_crafted`) is set only when a `def.craftTokenId` stack reaches a Survival or Adventure player's inventory while the flag is unset.
- A token that arrives while the flag is set is refunded with `def.refund`, and the `craft_blocked` message is sent.
- A plain `def.itemId` stack never claims and is never refunded. That covers vanilla `/give`, the Creative inventory, a Creative copy handed to a Survival player, a structure loot table, and `/replaceitem`. Such a stack stays unmarked, and the gate does not look at it.
- A token in Creative or Spectator is swapped for an unmarked `def.itemId`. The flag is unchanged.
- The token → weapon swap keeps the slot index. Only the `claim` branch stamps `origin: craft`, `owner` = `holder` = the crafter, and `gen: 0`.
- Contract on item JSON, owned by the weapon nodes:
  - Every legendary recipe outputs its token.
  - The token has `menu_category: none`, the weapon's icon and name, and `max_stack_size: 1`.
- `/andrew:<cmd> reset` clears the flag (unchanged). It does not delete tokens that are in flight.




- **node**: L0-lgnd-r014

### Lgnd r015 concept rule (L0-lgnd-r015)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad09", "L0-lgnd-r004", "L0-lgnd-r003", "L0-lgnd-p009", "L0-lgnd-ac16", "L0-adr-orbc"]
---
**R-lgnd-015: Activation modes share one cooldown and resolve through one function**

- `resolveActivation(player, mode)` is the only place that decides which held legendary a press activates. Every ability module calls it and acts only if the answer is its own def.
- `mode = "use"`: main hand, then off hand. Each is a candidate only if `"use" ∈ def.activations`, it is ready and it is not busy.
- `mode = "attack"`: main hand only, and only if `"attack" ∈ def.activations`, it is ready and it is not busy.
- All modes of one def share the def's `abilityKey`, and so share one cooldown and one busy deadline. While cooling, every mode resolves to `undefined`. The press creates nothing and sends no message (Orbital §6).
- The ability module calls `startCooldown` in the same synchronous turn as a successful activation. For the Cannon that is the charge spawn, never the hit. So at most one activation happens per player per tick, across modes.
- The cooldown is per player and ability. Several copies held by one player (Creative, `/give`) share it, and different players are independent (Orbital §7, AC-17).
- A press that finds no valid target writes no state.




- **node**: L0-lgnd-r015

### Lgnd r016 concept rule (L0-lgnd-r016)

---
is_a: ["rule"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ad13", "L0-magn", "L0-lgnd-r013", "L0-lgnd-ac21", "L0-lgnd-ac22", "L0-lgnd-cx13"]
---
**R-lgnd-016: The magnet never moves a legendary, and anything it moves that holds one stays recoverable.** Source: UFO §4, AC 13; Agent priorities (1).

1. **Predicate.** "Legendary" for the magnet means `isLegendaryStack(stack)`: the type is a def's `itemId` or `craftTokenId`, in any mark state (`ad13`).
2. **Ground / container stacks.** A stack for which the predicate is true is never selected, never extracted and never teleported. It does not count towards the 10-element limit.
3. **Whole-entity elements.** The magnet does not select:
   - a chest or hopper minecart with any slot holding a legendary;
   - an armour stand or mob with a legendary in a hand slot.
   It takes the next candidate instead.
4. **Holder blocks.** *Reduce v4: dormant.* `L0-magn-adhp` takes the hopper out of the pulled-block list, so the magnet turns no `HOLDER_TYPES` block into air (`L0-adr-ufnd`). The clause stays as the floor for any future change to that list. Turning a `HOLDER_TYPES` block into air is script-caused destruction. `protectLegendariesIn` runs first, in the same synchronous step (`r013`, tier 1). The legendary is then dropped next to the cell with the same id and gen, and is **not** pulled.
5. **Players.** A player is pulled by iron in either hand. A legendary in the other hand rides along as part of the player. That is not "pulling the weapon", and death retention covers it (`ac22`).
6. **Late drops.** A legendary dropped during the magnet within 12 blocks of the hover point is not iron, so it is not pulled beyond the limit either.
7. **Release / stop / restart.** The magnet holds no legendary, so it never has to release, persist or restore one.

**Why the entity case is a rule, not a nicety.** A pulled entity is teleported every tick and dropped with vanilla physics. It may land in lava, cactus or the Void. Its contents then spill as item entities, and recovery only catches them through `entitySpawn`, after the magnet has already moved the weapon. That is visible "pulling" (AC 13).




- **node**: L0-lgnd-r016

### Loot r001 concept rule (L0-loot-r001)

**Rule:** Each Windmill/Airship chest draws 5–12 independent fill attempts. Each attempt selects at most one of the 13 loot categories (never zero-to-many, never a simultaneous multi-category hit) — selection uses relative weights, not independent per-category coin flips, specifically to prevent an attempt from producing more than one category.

**Rationale:** spec §3.1 items 1–2; prevents attempts from being read as independent Bernoulli trials per category (which would make multi-category attempts possible, contrary to the spec's explicit note).

**Scope:** applies only to the custom table (`L0-loot-p001`); does not apply to vanilla-table chests (`L0-loot-r007`).




- **node**: L0-loot-r001

### Loot r002 concept rule (L0-loot-r002)

**Rule:** The custom table has exactly 13 categories, each with a fixed relative weight and quantity range (full table in `L0-loot-e001`): Sticks(45, 2–8), Logs/Wood(24, 2–6), Iron Ingots(32, 2–8), Copper Ingots(30, 3–10), Gold Ingots(17, 1–5), Diamonds(6, 1–3), Golden Apple(7, 1–3), Unenchanted Armor(15, 1 item), Enchanted Armor(5, 1 item), Unenchanted Sword(12, 1), Enchanted Sword(4, 1), Unenchanted Axe(12, 1), Enchanted Axe(4, 1).

**Rationale:** spec §3.2 table. Weights intentionally do not sum to 100 — they are relative weights normalized at selection time, not percentages (explicit spec note: "веса намеренно не обязаны суммироваться до 100").

**Scope:** `L0-loot-p001` only.




- **node**: L0-loot-r002

### Loot r003 concept rule (L0-loot-r003)

**Rule:** Golden Apple succeeds at most once per chest, quantity 1–3 when it does. It is always a regular Golden Apple — Enchanted Golden Apple never appears via the custom table.

**Rationale:** spec §3.1 item 5 ("Золотое яблоко может успешно появиться не более одного раза"), §3.3 last bullet ("Зачарованное золотое яблоко никогда не входит в таблицу").

**Scope:** `L0-loot-p001` only — vanilla Ancient City chests (`L0-loot-p002`) may legitimately contain Enchanted Golden Apple since that's a normal, unmodified vanilla drop there.




- **node**: L0-loot-r003

### Loot r004 concept rule (L0-loot-r004)

**Rule:** For every armor/sword/axe category (enchanted or not), material rolls 80% iron / 20% diamond independently per attempt. Armor additionally rolls one random slot (helmet/chestplate/leggings/boots) independently per attempt — duplicate pieces across a chest (e.g. two diamond helmets) are explicitly allowed.

**Rationale:** spec §3.2 rules column ("Железо 80% / алмаз 20%; случайный слот брони"), §3.3 first two bullets ("Каждая попытка независима; дубликаты разрешены").

**Scope:** `L0-loot-p001` only.




- **node**: L0-loot-r004

### Loot r005 concept rule (L0-loot-r005)

**Rule:** "Enchanted" categories (Armor/Sword/Axe) roll random compatible vanilla enchantments; an item may carry several enchantments at once; allowed levels go up to the vanilla maximum per enchantment; curse enchantments (Curse of Binding, Curse of Vanishing) are excluded from the candidate pool.

**Rationale:** spec §3.3 third bullet ("случайные совместимые ванильные зачарования... Разрешены максимальные ванильные уровни. Проклятия исключены").

**Scope:** `L0-loot-p001` only. See `L0-loot-asm3` for the assumed compatibility-check mechanism.




- **node**: L0-loot-r005

### Loot r006 concept rule (L0-loot-r006)

**Rule:** A chest's contents (custom or vanilla path) are determined exactly once, at structure init, and never regenerate — not on reopen, not on chunk unload/reload, not on server restart. If the chest block itself is broken, its already-rolled contents drop per normal vanilla block-break rules (this component does not special-case that).

**Rationale:** spec §2 (shared structure rules), §3 preamble ("Содержимое каждого сундука определяется один раз при создании/первой инициализации"), §13.6/§13.7, §15 shared addendum.

**Scope:** both `L0-loot-p001` and `L0-loot-p002` — the one rule shared across both mechanisms. The "exactly once" guarantee is enforced by `strf`'s instance registry (`L0-adr-strs`), not by this component; this component's obligation is simply to not re-trigger itself.




- **node**: L0-loot-r006

### Loot r007 concept rule (L0-loot-r007)

**Rule:** The custom weighted table (`L0-loot-p001`) applies only to Windmill (25 chests) and Airship (10 chests). Mini Warden City (40 chests) and Mini Bastion (10 chests) use only their respective vanilla loot tables (`L0-loot-p002`) — never the custom table, and the custom table's constraints (Golden Apple cap, no curses, 80/20 split) never apply to vanilla-table chests. Floor/room location never changes loot quality on either path.

**Rationale:** spec §3.3 last bullet ("Одна и та же таблица... во всех 25 сундуках Мельницы и всех 10 сундуках Дирижабля"), §13.6 ("Общая пользовательская таблица лута Мельницы/Дирижабля к Mini Warden City НЕ применяется"), §15 shared addendum ("Mini Warden City и Mini Bastion используют только соответствующие ванильные loot tables").

**Scope:** boundary rule for the whole component; this is the rule a sibling body component would violate if it tried to reuse the wrong mechanism.




- **node**: L0-loot-r007

### Magn rblk concept rule (L0-magn-rblk)

**Rule (UFO §5 Blocks, U6, U3; AC-10, AC-11).**

**Built block.** A selected built iron block becomes `minecraft:air` plus **exactly one** item entity of that block's own item, spawned at the block centre. There is no vanilla drop for the block itself; U6 found that `setType(air)` drops nothing.

**Door.** An iron door is removed whole (both halves) and yields **one** `iron_door`. The lower half is removed, and the upper half goes with it (U6).

**Ore.** `iron_ore` and `deepslate_iron_ore` yield **one `raw_iron`** (like Survival mining without Fortune), never the ore block. The cavity remains as air.

**Underground.** Items born underground fly to their ring slot **through** stone. They move by teleport each tick with velocity cleared, so they neither collide nor fall (U3). This holds for ore 20 blocks deep (the zone floor is centre − 20).

**The hopper** is never selected as a block (`L0-magn-adhp`).

**Other block entities.** No other block entity is ever removed by the magnet.




- **node**: L0-magn-rblk

### Magn rcnt concept rule (L0-magn-rcnt)

**Rule (UFO §5 Containers, U5, AC-9).** From a placed container, only stacks whose typeId is in IRON_ITEMS are removed. Each one becomes one element. Everything else is untouched: non-iron stacks, legendaries, shulker-box *items* held inside, and the container block itself.

**Containers in scope:**
- chest, double chest, trapped chest, barrel;
- **hopper** (`L0-magn-adhp`);
- furnace, blast furnace, smoker;
- dispenser, dropper, brewing stand;
- every placed shulker box.

**Out of scope:**
- The crafter, which has no inventory in the API.
- Contents of bundles or nested shulker items.

**Double chest.**
- Either half exposes the 54-slot paired container (U5).
- The pair is visited **once**, keyed by its canonical half (the lower x, then the lower z). Slots therefore cannot be listed twice, and one stack cannot take two of the 10 places.

**Minecarts.** A chest or hopper minecart is not a container source. It is pulled whole, as a class 3 entity, with its contents (but see `L0-magn-rleg`).

**Order.** Containers go nearest first; within a container, slots go in index order. Partial extraction is fine: if the limit is reached mid-container, the remaining iron stays.




- **node**: L0-magn-rcnt

### Magn rdup concept rule (L0-magn-rdup)

**Rule (C-7″, C-15 priority 1).** Every materialisation is **remove first, spawn second, roll back on failure**.

**Container slot.**
1. Re-read the stack.
2. Run `setItem(k, undefined)`.
3. Run `spawnItem`.
4. If the spawn throws, run `setItem(k, stack)`.

**Block.**
1. Save the permutation and the item.
2. Run `setType(air)`.
3. Run `spawnItem`.
4. If the spawn throws, run `setPermutation(saved)`.

**Never** spawn before the removal. A throw after the spawn would duplicate.

**Invariant, checked by GameTest.** For each source, the number of iron items in the world after the event equals the number before. Block sources follow this mapping:
- block → 1 item;
- door → 1 item;
- ore → 1 raw_iron.

Non-iron container contents are byte-identical before and after.

**Ownership.** The magnet never writes to a block or entity in an unloaded chunk (C-12′). It never touches inventories of players, minecarts or armour stands.




- **node**: L0-magn-rdup

### Magn rexm concept rule (L0-magn-rexm)

**Rule (UFO §5, AC-6).** Iron dropped near the saucer during the magnet is pulled **in addition to** the 10-element limit.

- **Trigger.** An `entitySpawn` of `minecraft:item` happens while the magnet is on. The stack is in IRON_ITEMS and is not legendary. The spawn point is ≤ 12 blocks (3-D) from the hover point, the saucer position.
- **Effect.** The item is appended as a class `X` element with the next ring slot (the ring is re-spaced over n slots).
- **Source.** No attribution is made to a player; any iron item spawning in that sphere qualifies (`L0-magn-adex`). Items spawned by the magnet itself (extraction, block items) are already elements and are ignored by the listener.
- **No cap.** Each drop needs a player action, so the number of `X` elements is not capped.
- **Further out.** An iron item dropped more than 12 blocks from the hover point (a player on the ground, for example) is not pulled.




- **node**: L0-magn-rexm

### Magn rleg concept rule (L0-magn-rleg)

**Rule (UFO §4, AC-13, C-7″).** A legendary weapon is never iron and is never pulled, wherever it lies.

**Predicate.** "Legendary" means `isLegendaryStack(stack)` from `lgnd` v4 (`L0-lgnd-ad13`): the stack's type is a def's `itemId` **or** `craftTokenId`, in any mark state.
- **Before `lgnd` v4 ships**, use `defForStack(s) !== undefined || defForToken(s) !== undefined` from `src/legendary/registry.ts`. `defForStack` alone matches only `itemId`, so it would miss a craft token inside a pulled minecart.
- **Item entities** are judged by that predicate on their `minecraft:item` stack, **not** by `isLegendaryItemEntity`. That one is true only for a live marked instance, so it would let the magnet take an unmarked `/give` or Creative copy (`lgnd-ad13`, rejected option a).

**Call sites in `magn`:**
- ground items;
- container stacks;
- the player hand test;
- the drop exemption;
- every slot of a chest or hopper minecart, and the hand and armour slots of an armour stand or mob, before it is selected as a holder.

**Holders.** A class 3 holder whose inventory or equipment holds a legendary is **not selected**; the next candidate takes its place. A legendary therefore never moves through the magnet, not even inside its holder (`L0-magn-aslh`).

**Players.** A pulled player who carries a legendary is still pulled. The player is not "the legendary", and `lgnd` retention covers their death.

**Owned by `lgnd`, not restated here:** the predicate itself (`L0-lgnd-ad13`), the never-pulled rule including holders and players (`L0-lgnd-r016`), the watching of moved holders (`L0-lgnd-as15`), and death retention (`L0-lgnd-ac22`). The call sites above implement `L0-lgnd-r016` §2, §3, §5 and §6. Its §4 (holder blocks) is dormant, because the hopper is never a pulled block (`L0-adr-ufnd`). Where the two read differently, `lgnd` wins.




- **node**: L0-magn-rleg

### Magn rlim concept rule (L0-magn-rlim)

**Rule (UFO §5, AC-8).** One event pulls at most **10 non-player elements**.

- **An element** is one entity: a ground item stack, a stack extracted from one container slot, a mob, a minecart, or the single item produced by a block (a door counts once).
- **When.** The set is chosen once, at magnet-on. Nothing found later joins it, except exempt drops (`L0-magn-rexm`).
- **Priority** is strict between classes:
  1. iron ground items;
  2. iron container stacks;
  3. mobs and minecarts;
  4. built iron blocks;
  5. ore.

  A lower class is considered only if the higher classes leave free slots.
- **Within a class,** candidates are ordered nearest first by 3-D distance from the event centre (the block under the target at arrival). Ties go by entity id or block position, so the order is deterministic in tests.
- **Players** never count toward the 10 and are never in the set (`L0-magn-rply`).
- **A lost slot is not refilled.** An element that becomes invalid during the hold (picked up, killed) leaves its slot empty.




- **node**: L0-magn-rlim

### Magn rply concept rule (L0-magn-rply)

**Rule (UFO §5, §6; AC-4, AC-5, AC-6).** A player is pulled in a given tick **if and only if** all of the following hold:
- they are inside the zone cylinder and alive;
- their game mode is neither Creative nor Spectator; Adventure is pulled (`L0-xasm14`);
- the **main-hand or off-hand** stack is in IRON_ITEMS.

**What does not count.** Iron in the inventory or in worn armour slots. A legendary in hand is never iron.

**How.**
- `applyKnockback`, each tick, toward the point 6 blocks below the saucer, with the step capped at **0.6 blocks per tick**.
- Once there, the player is held, with a measured deviation of ≤ 0.03 (U1).

**Stop and resume (U10).**
- The hand state is re-read every tick. After a drop (`Q`) or a slot switch to non-iron, no knockback is sent from that tick on, and the player falls.
- Taking iron back into a hand while the magnet is on resumes the pull on the next tick.
- Leaving the zone horizontally stops the pull in the same way.

**Unlimited.** Any number of players can be pulled; they are outside the 10-element limit.




- **node**: L0-magn-rply

### Magn rrel concept rule (L0-magn-rrel)

**Rule (UFO §6; U1, U2; AC-7, AC-14).**

**One tick.** When the magnet goes off, every element and every held player is released in the **same tick**, with no staggering.

**Vanilla physics.**
- After the release the magnet applies no impulse and no teleport.
- Things fall from where they are, under vanilla gravity.

**Fall damage.**
- Fall damage is vanilla, counted **from the release point only**; time spent hovering adds nothing.
- U2: release at 37 blocks dealt 33 damage, a death; this is intended.
- A player lowered near the ground before release takes none (U1).
- If `applyKnockback` holding is found to accumulate fall distance, `magn` resets it before release (`L0-xasm16`, `L0-magn-a07`).

**Mobs.** Mobs take vanilla fall damage; iron golems are immune.

**Afterwards.** Released items are ordinary items: they can be picked up and despawn on the vanilla timer.

**Death from the fall.** A player who dies from the fall keeps legendaries under `lgnd` death retention; the other drops are vanilla.




- **node**: L0-magn-rrel

### Magn rrng concept rule (L0-magn-rrng)

**Rule (UFO §6, U11).** Elements hold on a ring of **radius 5 at 3 blocks below the saucer**, spaced evenly and rotating slowly. Players are held 6 blocks below the saucer on its axis, so a held player is about 5.8 blocks from every slot.

**Keep-away.** A hovering player picks up items within about 2 blocks (U11). In every tick, an **item** element's target that comes within 3 blocks of any player (for example, a player rising past the ring) is moved radially outward until it is 3 blocks clear. If it cannot clear radially, it is moved up instead. The margin is an assumption (`L0-magn-asrg`).

**Scope.** Mobs, minecarts and armour stands are not subject to pickup, but they use the same ring.

**On the way in.** Elements still flying toward the ring use the same keep-away offset for their next step.




- **node**: L0-magn-rrng

### Rule · Item identity: a rod icon with no rod behaviour (L0-orbc-r001)

# Rule · Item identity: a rod icon with no rod behaviour

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-orbc-ent1", "L0-xcx13"]`

The Cannon must:
- show the vanilla `fishing_rod` icon, with no custom texture;
- never cast a bobber or catch anything;
- never lose durability;
- be rejected by the enchanting table and the anvil, including combining with books;
- deal an empty-hand punch in melee, with no knockback or effect bonus;
- appear under Creative → Equipment and in search/All;
- be obtainable with `/give`.

**Implementation.** These follow from the item JSON **omitting** `durability`, `enchantable`, `damage`, `digger`, `use_modifiers`, `shooter` and `throwable` (`ent1`). Nothing is enforced by script.

Source: Orbital §2 and §4. Deviation: the in-hand model is the icon sprite, not the vanilla cast/reeled model (`xcx13`, C-16).




- **node**: L0-orbc-r001

### Rule · Recipe and lang (L0-orbc-r002)

# Rule · Recipe and lang

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-lgnd", "L0-orbc-cx01"]`

**Recipe** (`packs/behavior/recipes/orbital_cannon.json`, shaped, `crafting_table`):
```
 T
TRT
 T
```
- `T = minecraft:tnt`, `R = minecraft:fishing_rod`, result 1× `andrew:orbital_cannon`.
- Spaces are empty and must stay empty. A shaped recipe with no `unlock` shows in the recipe book, as the other legendaries do.
- A *damaged or enchanted* fishing rod is still accepted, because the recipe matches by item id. The item is consumed.
- Whether a craft counts is decided by `lgnd` (`L0-lgnd` craft gate, ACs 1–2). The refund is `4 TNT + 1 fishing rod` (`ent1`).

**Lang** (`en_US.lang`, `ru_RU.lang`), minimum set:
| Key | EN | RU |
|---|---|---|
| `item.andrew:orbital_cannon.name` | Orbital Cannon | Орбитальная пушка |
| `andrew.orbital.first_craft` | §e%s§r forged the legendary §b%s§r! | the RU equivalent |
| `andrew.orbital.craft_blocked` | The world's only Orbital Cannon already exists — ingredients returned | the RU equivalent |
| `andrew.orbital.returned` / `admin_given` / `reset` | as for the other legendaries | the RU equivalent |

The Ready and cooldown strings come from the shared `andrew.legendary.ready` and `andrew.legendary.cooldown` keys (`r012`). See `cx01` for the wording gap. No user-facing string is hard-coded (§13).




- **node**: L0-orbc-r002

### Rule · The target is a block within 10 blocks, on any face (L0-orbc-r003)

# Rule · The target is a block within 10 blocks, on any face

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-orbc-ad01", "L0-xcx8", "L0-orbc-ent2"]`

- The target is the **block that was hit**, on top, bottom or side. It is not the adjacent block. Its (x, z) column is the attack's column. Its Y is the reference for spawn height (`r007`).
- The range is measured from the eye to the hit point: `maxDistance: 10`.
- Blocks that do not count as targets:
  - air;
  - liquids (`includeLiquidBlocks: false`);
  - passable blocks such as grass, flowers, torches and snow layer (`includePassableBlocks: false`). The ray passes through these to the block behind them.
- Entities in the way do not block the ray. `getBlockFromViewDirection` ignores entities.
- Both modes use the same rule and the same distance, **subject to `L0-xcx8`**: until `L0-xq5` is answered, LMB is physically limited to the vanilla reach.
- **No marker.** There is no particle, outline or HUD hint. The vanilla highlight is the only aim cue (§6).

Source: Orbital §6.




- **node**: L0-orbc-r003

### Rule · With no target, nothing happens (L0-orbc-r004)

# Rule · With no target, nothing happens

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-orbc-p001", "L0-orbc-ac03"]`

When the target resolution in `p001` step 5 returns nothing:
- no charge is spawned;
- no cooldown is written, so `andrew:cd_orbital_cannon` is unchanged;
- no chat message, Action Bar override, title or sound is shown;
- the dedup tick is **not** consumed, so a second event in the same tick may still succeed.

This differs deliberately from the Scythe, which says `andrew.scythe.no_target`. The Cannon has no `no_target` lang key.

Source: Orbital §6 and AC-3.




- **node**: L0-orbc-r004

### Rule · One shared 30 s cooldown, started on activation (L0-orbc-r005)

# Rule · One shared 30 s cooldown, started on activation

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-lgnd", "L0-orbc-p001", "L0-orbc-ac16"]`

- LMB and RMB read and write **one** key, `cooldownKey("orbital_cannon")` = `andrew:cd_orbital_cannon`. Its length is `cooldownTicks 600` (30 s). The storage is `lgnd`'s `cooldown.ts`: an epoch-ms deadline in a player dynamic property. It is per player and shared by all of that player's copies (C-17, AC-17 is owned by `lgnd`).
- The cooldown is written in the activation tick, after the target is validated and **before** any charge moves (`xasm10`). It is not written on hit, detonation or when the charge lands.
- While the cooldown runs, both modes are blocked silently (`as06`).
- It is **never refunded or shortened** by any charge outcome: void, lost, unload, restart or timeout. It is also unaffected by the owner dying or leaving.
- Operators can clear it through `/andrew:orbital reset`, if `lgnd` commands expose it. Otherwise only time clears it.

Source: Orbital §6, §8, §11; C-17.




- **node**: L0-orbc-r005

### Rule · At most one activation per player per tick (L0-orbc-r006)

# Rule · At most one activation per player per tick

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-xasm10", "L0-orbc-p001", "L0-orbc-ac09"]`

- A single press can raise several events in one tick:
  - `itemUse` together with `itemUseOn` or `playerInteractWithBlock`;
  - on touch, `entityHitBlock` together with a use.
- The **first** event in a tick that passes `p001` steps 1–5 activates.
- Every later event from the same player in that tick is ignored. It creates no charge and makes no second cooldown write.
- The mode is that of the first event.

**Implementation.** `Map<playerId, tick>` in memory. It is cleared on `playerLeave`, and nothing is persisted.

The cooldown check alone already stops a second attack. The explicit tick guard also covers the window where `startCooldown` has been written but a same-tick event was queued before it. Script events are synchronous, so this is defensive rather than required.




- **node**: L0-orbc-r006

### Rule · Charge spawn height per dimension, clamped to the ceiling (L0-orbc-r007)

# Rule · Charge spawn height per dimension, clamped to the ceiling

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-orbc-cx03", "L0-orbc-as01", "L0-orbc-ac04"]`

`spawnY = min(target.y + OFFSET[dim], dim.heightRange.max − 1)`

| Dimension | `OFFSET` |
|---|---|
| `minecraft:overworld` | 30 |
| `minecraft:the_end` | 30 |
| `minecraft:nether` | 10 |
| any other dimension (future-proof) | 30 |

- `heightRange.max` is the first Y *above* the build limit (`src/structures/site.ts`). So `max − 1` is the highest placeable cell: 319 in the Overworld, 127 in the Nether and 255 in the End.
- There is no lower clamp. `target.y` is always ≥ `heightRange.min`.
- **All charges of one attack share `spawnY`**, which is derived from the target block. They do not use their own column's terrain. RMB "fall at the same time" therefore holds (§10), and the actual blast time varies with the terrain.
- The clamp is only an upper bound. If the clamped cell is solid (for example the Nether's bedrock roof), `r008`'s inside-solid rule applies. See `cx03`.

Source: Orbital §8 and AC-4.




- **node**: L0-orbc-r007

### Rule · Contact: charges stop on blocks, never on entities (L0-orbc-r008)

# Rule · Contact: charges stop on blocks, never on entities

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-orbc-as03", "L0-orbc-p002", "L0-orbc-ac05", "L0-orbc-ac06"]`

`isContact(block)` is true when all of these hold:
- the block is not air;
- it is not a liquid (water, lava, or a flowing variant);
- it is not in the `PASS_THROUGH` set (`as03`).

The rule:
- **At spawn**, if the spawn cell is a contact block, the charge detonates at once, at that cell (§8, AC-5). This holds even at the clamped ceiling.
- **In flight**, the first contact cell swept (`p002`) is the detonation point. No cell is skipped, whatever the fall speed.
- **Entities never stop a charge.** Collision is 0, physics has no collision, and the sweep never queries entities. Players, mobs, item entities, boats and minecarts are all passed through (AC-6).
- **Liquids never stop a charge.** It sinks through water and lava to the solid floor. That is what lets `ring`'s "underwater = damage only" case (§10) and `pntr`'s "liquids stay" case (§9) occur.
- **Survival-unbreakable blocks** (bedrock and so on) are contact blocks. A charge landing on bedrock detonates there. Whether the effect continues below it is `pntr`'s business (`xasm6`).




- **node**: L0-orbc-r008

### Rule · The Void destroys a charge without effect (L0-orbc-r009)

# Rule · The Void destroys a charge without effect

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-orbc-p002", "L0-orbc-r005", "L0-orbc-ac07"]`

- A charge whose next Y is below `dim.heightRange.min` without meeting a contact cell is removed. For example, the End outer islands, or a column already cut to bedrock-less air by an earlier LMB.
- It gets **no** `onDetonate`, no sound and no particle.
- The attack's cooldown stays (§8).
- This is the *charge* Void rule. The Void rule for the *item* (return to the last holder) is `lgnd`'s (`L0-xcx11`, `L0-adr-hold`).




- **node**: L0-orbc-r009

### Rule · After firing, the attack does not depend on its owner and stays in its dimension (L0-orbc-r010)

# Rule · After firing, the attack does not depend on its owner and stays in its dimension

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-orbc-p003", "L0-ring", "L0-orbc-ac18"]`

Once charges are spawned, none of these cancels, pauses, redirects or accelerates them:
- the owner's death;
- a hand or slot change, or dropping or giving away the Cannon;
- the owner logging out;
- the owner changing dimension.

**Details.**
- Charges only ever exist in the `dimensionId` of the attack. They are moved with `teleport` inside that dimension and are never re-spawned elsewhere.
- The attack keeps `ownerId` as a string. The effects may *look up* the owner (for example `ring`'s explosion `source` and self-damage), but they must accept that the owner is absent. With no owner, the blast still happens, with no source.
- It is not required that the owner's own position keeps the area loaded. If the area stays loaded because of another player, the attack completes. If it does not, `r011` applies.

Source: Orbital §11 and AC-18.




- **node**: L0-orbc-r010

### Rule · On unload or restart, in-flight charges are lost (L0-orbc-r011)

# Rule · On unload or restart, in-flight charges are lost

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-orbc-p003", "L0-orbc-ad03", "L0-orbc-ac19"]`

- There is no ticking area, force-load or chunk pinning for charges (§11).
- A charge whose entity is invalidated, or whose next cell is in an unloaded chunk, is **lost**:
  - it is removed from the attack;
  - it gets no `onDetonate`;
  - no cooldown change is made.
- Charges that were in flight during a server shutdown are not saved or restored. On the next start, and on each later chunk load, stale charge entities are removed and **never detonate** (`p003`).
- What survives a restart: the cooldown (a `lgnd` dynamic property) and the craft flag (`lgnd`).
- A lost charge leaves no entity behind once its chunk is next loaded (C-19).

Source: Orbital §11 and AC-19.




- **node**: L0-orbc-r011

### Rule · HUD (Action Bar) (L0-orbc-r012)

# Rule · HUD (Action Bar)

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-lgnd", "L0-orbc-cx01", "L0-orbc-ac10"]`

- The HUD is rendered by the shared `src/legendary/hud.ts`, every 10 ticks. The Cannon joins by being in `LEGENDARIES`. It adds no HUD code of its own.
- It is shown while the Cannon is in the **main or off hand** (§7). The off hand needs `allow_off_hand` (`ent1`, `L0-lgnd-cx08`).
- **Ready:** `{name} — Ready`, `Орбитальная пушка — Готово`.
- **Cooldown:** `{name} — {ceil(remaining s)}s`, `…— 27с`.

  The remaining time is read from the shared per-player key. Every copy the player holds shows the same number.
- If a Web Sword or Scythe is held in the other hand, both segments are shown, separated by three spaces (existing behaviour).
- The HUD is independent per player. It never shows another player's cooldown.
- The wording is **pending `cx01`**. The shared keys currently render `Orbital Cannon: Ready` and `Orbital Cannon: 27 s`.




- **node**: L0-orbc-r012

### Rule · Deviation notes live next to the code (L0-orbc-r013)

# Rule · Deviation notes live next to the code

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-xcx8", "L0-xcx13", "L0-orbc-cx02", "L0-orbc-cx03", "L0-orbc-ad02"]`

The header of `src/orbital/README.md` or `src/orbital/index.ts` must list every stable-API compromise the core makes, each with its KV id (C-16). The list includes:
1. The item is a custom item with the rod icon, not a real fishing rod (`xcx13`).
2. LMB reach and the answer to `xq5` (`xcx8`).
3. The touch aim point (`cx02`).
4. Nether roof behaviour under the clamp (`cx03`).
5. The charge is script-teleported, not physics-driven, so it has no interpolation guarantee (`ad02`).
6. In-flight charges are lost on unload or restart (§11).
7. There is no stable "swing at nothing" event.

A task is not done until the list matches the shipped behaviour.




- **node**: L0-orbc-r013

### Rule · The charge contract published to `pntr` and `ring` (L0-orbc-r014)

# Rule · The charge contract published to `pntr` and `ring`

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["rule"]` · `relates_to: ["L0-pntr", "L0-ring", "L0-orbc-p002", "L0-orbc-r007", "L0-orbc-r011"]`

`src/orbital/charge.ts` exports:
```ts
type Mode = "lmb" | "rmb";
interface Effect {
  /** Charge columns (x,z) for an attack locked on `target`. LMB: [target.xz]. */
  layout(target: Vector3): Array<{x: number; z: number}>;
  /** Called once per charge at its contact cell. Must be synchronous-safe; heavy work goes to its own bounded runJob. */
  onDetonate(dim: Dimension, point: Vector3, ownerId: string, mode: Mode, attackId: string): void;
  scale: 0 | 1;          // 1.2× TNT for LMB, 1.0× for RMB
}
registerEffect(mode: Mode, effect: Effect): void;
```

**Guarantees from `orbc`:**
- `point` is an integer block location of a contact block (`r008`) in a loaded chunk.
- `onDetonate` is called at most once per charge.
- It is never called for a voided or lost charge, or an orphan.
- The owner may be offline.
- There is no refund path.

**Duties of effects:**
- Never move or remove other charges.
- Tolerate multiple `onDetonate` calls for one `attackId` in one tick (RMB).
- Own all block, entity and drop rules.

Any effect that needs a different charge behaviour (speed, collision, height) raises an L0 contradiction; it does not fork the charge (L0 reduce plan).




- **node**: L0-orbc-r014

### Pick r001 concept rule (L0-pick-r001)

**Rule R1 — Dig speed must be verified against a live vanilla diamond pickaxe, not assumed from the tag query alone.**

`minecraft:digger` on `andrew:miners_pickaxe` has exactly one `destroy_speeds` entry: `query.any_tag('minecraft:is_pickaxe_item_destructible')` → speed 8, `use_efficiency: true`. Bedrock's tag-query digger has **no engine-level tier fallback** — a block the query misses does not fall back to a lower pickaxe tier, it falls back to speed 1 (bare hand). The shipped 0.3.0 build hit exactly this: copper ore took 302 ticks (15.1s) instead of a diamond pickaxe's 0.65s, and ancient debris never broke at all within the test limit.

**Enforcement:** `pickaxe_digs_at_diamond_speed` (GameTest) breaks three representative blocks — one per distinct tag family actually present in the live block data (`copper_ore`: `stone_pick_diggable`-family only; `deepslate`: `is_pickaxe_item_destructible` only; `ancient_debris`: `diamond_tier_destructible` only) — with the pickaxe and, in the same run, with a real `minecraft:diamond_pickaxe`, and asserts the pickaxe finishes within `SPEED_TOLERANCE_TICKS` (4) of vanilla and within `BREAK_LIMIT_TICKS` (300). Self-calibrating: no hardcoded tick counts that drift when Mojang retunes hardness.

**Rationale:** any future edit to `destroy_speeds` (narrowing the tag query, or adding a second entry) must keep covering all three tag families or this exact bug regresses silently. [src: `packs/behavior/items/miners_pickaxe.json`; `src/gametest/main.ts` L864-962] [see also: `L0-pick-ad01`]




- **node**: L0-pick-r001

### Pick r002 concept rule (L0-pick-r002)

**Rule R2 — Pickaxe-slot enchantability without a durability component.**

`andrew:miners_pickaxe` declares `minecraft:enchantable` with `slot: "pickaxe"`, `value: 10`, and declares **no** `minecraft:durability` component at all (not "very high durability" — the component is absent). This is the Stage 1 prototype's chosen way to get "infinite durability": omission, not a huge number.

Confirmed empirically on the actual target engine, not just declared in JSON: `SELFTEST-01-AA` (in-engine self-test on BDS 1.26.51.1) checks `ItemEnchantableComponent.canAddEnchantment === true` and that the engine accepts unbreaking + efficiency and refuses sharpness (`enchantable.slots` reads `[undefined]` on 2.10.0, so slot membership is not observable), with `minecraft:durability` absent. Operator accepted the matching iPad check for DEMO-S1 on 2026-09-21. This closed decision `decision-q-007-enchantable-without-durability-podtverzhde` — before that check, "does Bedrock allow an enchantable item with no durability component" was an open risk, not an assumption.

**Invariant:** if a future task adds `minecraft:durability` to this item (e.g. to later support Unbreaking-only balance), `pickaxe-no-durability` (selftest) and the GameTest mining scenario's own durability-absence assertion must be updated together — they currently encode "no durability" as a hard pass/fail, not a default. [src: `packs/behavior/items/miners_pickaxe.json`; `src/selftest/main.ts` L127-150]




- **node**: L0-pick-r002

### Pick r003 concept rule (L0-pick-r003)

**Rule R3 — Auto-smelt is a closed 7-entry allow-list, not a general ore→ingot transform.**

`src/autosmelt.ts` maps exactly these block type ids to a smelted item, via a `Map` (not an object literal, to avoid prototype-pollution lookups like `"constructor"`):

| Block | Smelted drop |
|---|---|
| `minecraft:iron_ore` / `minecraft:deepslate_iron_ore` | `minecraft:iron_ingot` |
| `minecraft:gold_ore` / `minecraft:deepslate_gold_ore` | `minecraft:gold_ingot` |
| `minecraft:copper_ore` / `minecraft:deepslate_copper_ore` | `minecraft:copper_ingot` |
| `minecraft:ancient_debris` | `minecraft:netherite_scrap` |

The override only fires when `event.itemStack.typeId === "andrew:miners_pickaxe"` **and** the broken block is in this map. It cancels the vanilla break in a `beforeEvents.playerBreakBlock` handler, then — because before-events must never mutate the world synchronously — defers the actual `setBlockType(air)` + `spawnItem(drop)` to the next tick via `system.run`.

**Count is always 1**, even for blocks whose vanilla raw drop varies (copper ore normally drops 2–5 raw copper) — the spec's wording ("copper ore → copper ingot") is read literally (`L0-pick-asm1`). **No XP is granted**: all seven raw drops give 0 XP in vanilla, so cancelling the break takes nothing away; furnace XP is intentionally not replicated (`L0-pick-asm2`). [src: `src/autosmelt.ts`]




- **node**: L0-pick-r003

### Pick r004 concept rule (L0-pick-r004)

**Rule R4 — Everything outside the auto-smelt allow-list, and every other tool, keeps vanilla behavior unchanged.**

The auto-smelt handler returns immediately (no-op) unless both conditions hold: held item is `andrew:miners_pickaxe` **and** the target block is one of the seven ids in R3's map (`L0-pick-r003`). A block outside the list (e.g. stone) breaks and drops normally even when mined with the pickaxe; the pickaxe on a non-listed block, and any other tool on a listed block, both fall through to vanilla. Enforced by `pickaxe_keeps_vanilla_drops` (GameTest): mines `minecraft:stone` with the pickaxe and asserts the drop is `minecraft:cobblestone`, not `minecraft:iron_ingot`. This is the scope boundary that keeps Stage 1 a probe rather than a general "pickaxe mining rework." [src: `src/gametest/main.ts` L198-207]




- **node**: L0-pick-r004

### Pick r005 concept rule (L0-pick-r005)

**Rule R5 — Recipe is a single fixed shape, no substitutions.**

One `minecraft:recipe_shaped` entry, `crafting_table` tag only:

```
III
GSG
 S
```

`I` = Iron Ingot, `G` = Raw Gold, `S` = Stick, blank = empty. Result: 1× `andrew:miners_pickaxe`. Matches the raw spec exactly (top row 3 iron; middle row raw gold/stick/raw gold; bottom row empty/stick/empty). `unlock` is granted on picking up an Iron Ingot. No shapeless or alternate-ingredient variants exist. [src: `packs/behavior/recipes/miners_pickaxe.json`; `minerspickaxetestspec`]




- **node**: L0-pick-r005

### Penetrator NFRs (refining C-5a′, C-14, C-15, C-16 and C-19) (L0-pntr-cons)

# Penetrator NFRs (refining C-5a′, C-14, C-15, C-16 and C-19)

| ID | NFR | Measured by |
|---|---|---|
| PN-1 | **Looks instant.** The top 16 layers are removed in the detonation tick. The whole column is removed within **≤ 3 ticks** for a typical Overworld column (~140 layers) and **≤ 6 ticks** for the worst case (y 319 → −64, ~9,600 cells) on BDS 1.26.x. | `report.ticksUsed` in a gametest |
| PN-2 | **Budget.** No `pntr` job step exceeds its `runJob` slice. The server tick time must not rise above 50 ms because of one LMB, and with **3 concurrent LMBs** it must not stay above 50 ms for more than 2 consecutive ticks. | A BDS tick-time probe, next to the `ring` load probe |
| PN-3 | **Bounded.** 2 jobs per attack, both self-terminating, and 0 entities spawned. The wave is ≤ 16 `spawnParticle` calls per tick for 20 ticks. | Code review plus a gametest entity count |
| PN-4 | **No force-load.** Unloaded cells are skipped (C-14). | A gametest at a chunk edge |
| PN-5 | **Safety first.** A protection failure keeps the container (C-15 rank 1 beats rank 4). | A unit test with a mocked `lgnd` that throws |
| PN-6 | **Documented deviations** (C-16), next to the code: the keep list is a list, not a hardness query; item frames (`cx01`); nested storage items (`as05`); waterlogged handling (`as04`). | Code review |

If PN-1 and PN-2 cannot both hold, PN-2 wins (C-15 rank 3 over rank 4). The fallback is to relax PN-1 to "≤ 10 ticks", documented as a deviation (see `L0-pntr-as03`).




- **node**: L0-pntr-cons

### Column geometry (L0-pntr-r001)

**Rule R-pntr-1 · Column geometry.**
- **Vertical:** from the detonation cell (inclusive) down to `dimension.heightRange.min` (inclusive). Nothing above the detonation cell is affected.
- **Horizontal:** a roughly 5×5 footprint centred on the detonation cell's `(x, z)`:
  - the 3×3 core is always included;
  - each of the 12 non-corner cells of the 5×5 ring is included with high probability;
  - each of the 4 corners is included with ~50% probability;
  - a few cells on the 7×7 rim are included with low probability.
- The mask changes every 4-layer band, so the walls look blast-ragged rather than square (Orbital §9: "not perfectly square… like TNT aftermath").
- The number of removed cells per layer (before classification) stays between 9 and 33. The expected value is about 25.

**Rationale.** The spec asks for "approximately 5×5" with "small natural irregularity". The 3×3 core guarantees a continuous, passable shaft for AC-7. The band-level variation avoids per-block noise that would look like a render glitch.

**Test hook.** The mask is a pure function of `attackId` (`L0-pntr-ent1`), so a gametest can assert the exact cell set.




- **node**: L0-pntr-r001

### Keep liquids and Survival-unbreakable blocks, never stop below them (L0-pntr-r002)

**Rule R-pntr-2 · Keep set, and no early stop.**

A column cell is **kept** (left untouched) when it is:
- air of any kind;
- a liquid: `water`, `flowing_water`, `lava`, `flowing_lava`;
- on the `L0-xasm6` deny list of Survival-unbreakable blocks: `bedrock`, `end_portal_frame`, `end_portal`, `end_gateway`, `barrier`, `light_block`, the command blocks, `structure_block`, `structure_void`, `jigsaw`, `allow`, `deny`, `border_block`, `invisible_bedrock`, `moving_block`, and the piston arm collisions.

A kept cell **never** ends the column. Processing continues with the next layer down (Orbital §9: "must not stop the calculation below them"). For example, a 5×5 column through an ocean floor removes the stone under the water and keeps the water, and the water then falls. A column through bedrock at the Overworld bottom keeps the bedrock and removes nothing else, because nothing is below it.

Waterlogged solids are neither purely kept nor purely removed: the solid part goes and the water stays (`L0-pntr-as04`).

**Source of truth.** The list is one exported constant in `src/orbital/` with a unit test (`xasm6`). `ring` does not use it.




- **node**: L0-pntr-r002

### Remove everything else, ignoring blast resistance (L0-pntr-r003)

**Rule R-pntr-3 · Remove everything not kept.**

Every column cell that is not in the keep set (`L0-pntr-r002`) is removed, **whatever its blast resistance** (Orbital §9: "even if ordinary TNT does not destroy them"). This explicitly includes:
- `obsidian`, `crying_obsidian`, `respawn_anchor`, `ancient_debris`, `reinforced_deepslate`, `enchanting_table`, `anvil`s and `netherite_block`;
- active `portal` (Nether portal) blocks **and** their obsidian frame. Portal blocks outside the column become invalid and vanish by vanilla rules, which is acceptable;
- all containers (chests, trapped chests, barrels, placed shulker boxes, hoppers, droppers, dispensers, furnaces, brewing stands, lecterns, crafters and so on);
- `mob_spawner` and `trial_spawner`, and `vault`;
- non-solid breakables such as torches, flowers, snow layers, cobweb, rails and item frames (`L0-pntr-as08`; see `L0-pntr-cx01` for item frames);
- blocks of generated structures, which are ordinary (C-13).

This is the opposite of `ring`, which follows TNT resistance (Orbital §10). The two effects must not share a block classifier.




- **node**: L0-pntr-r003

### No drops, no contents, no XP (L0-pntr-r004)

**Rule R-pntr-4 · No drops.** Removing a column cell produces **no item entity and no experience orb**:
- Blocks are removed with `Block.setType`, never with `/setblock … destroy`, `/fill … destroy` or `createExplosion`.
- For a container, its inventory is cleared (`container.clearAll()`) *after* legendary protection and *before* `setType`. This guarantees "ordinary contents disappear" even if the engine were to spill block-entity contents on replacement (`L0-pntr-as02`).
- Spawners and vaults drop nothing and give no XP.

**Not covered by this rule (environmental, allowed):**
- Blocks *outside* the column that lose their support (a torch on the shaft wall, sand or gravel falling in, a door half) behave by vanilla rules and may drop items (`L0-pntr-as06`).
- Item entities already on the ground in the column are not touched. They just fall.

**Exception.** Legendaries are never destroyed (`L0-pntr-r005`).




- **node**: L0-pntr-r004

### Protect legendaries before removing a container (L0-pntr-r005)

**Rule R-pntr-5 · Legendaries survive the column.**

Before a container cell is cleared, `pntr` calls `lgnd.protectLegendariesIn(dim, cellVolume)`, which is proposed in `L0-xcx10`. That call:
- moves every legendary out of the container;
- re-drops it at a safe spot **outside** the column footprint, using `lgnd`'s logic for the item entity and the holder.

The protect call, `clearAll()` and `setType(air)` for one container happen **in one synchronous step with no `yield` in between**. That way no player, hopper or second job can move items between "protected" and "cleared" (C-7′: no loss, no copy).

`pntr` does not restate retention, loss return, or holder rules. Those are `lgnd-*`. Legendary *item entities* already lying in the column are not touched, so they fall and `lgnd` recovery covers the Void.

**Known gaps:**
- Item frames have no stable API (`L0-pntr-cx01`).
- Legendaries nested inside a shulker-box *item* inside a container (`L0-pntr-as05`).

Priority: C-15 rank 1 (no loss or duplication) overrides the visual "instant" requirement. If protection throws, the container cell is **kept** and the error is logged. It is not removed blind.




- **node**: L0-pntr-r005

### No direct entity damage (L0-pntr-r006)

**Rule R-pntr-6 · No direct damage; environment stays live.**
- `pntr` never calls `applyDamage`, `createExplosion`, `applyKnockback`, `teleport` or `kill` on any entity, and never runs `/damage` or `/kill`.
- Entities inside or above the column are not moved by the effect. They fall under vanilla gravity once their support is gone.
- Secondary harm is expected and must **not** be suppressed: fall damage, lava flowing in, drowning, suffocation from sand or gravel falling in, and mobs dropping into the Void at the End's bottom.
- The owner is treated like everyone else: no damage from the effect itself, and normal fall damage if they stand over the target.

Rationale: Orbital §9, "LMB does not deal direct damage… may receive ordinary secondary damage", and AC-9.




- **node**: L0-pntr-r006

### Concurrent and overlapping columns are idempotent (L0-pntr-r007)

**Rule R-pntr-7 · Concurrency.**
- Each LMB attack owns an independent job keyed by `attackId`. Jobs from different players, or from one player after the cooldown, may run at the same time and overlap in space.
- Removal is idempotent. A cell already turned to air or water is re-classified and skipped. A container already cleared yields no legendaries.
- The job keeps no shared mutable state between attacks and no world dynamic property. A column is never resumed after a restart (Orbital §11).
- With several players firing at once, the total cost of all running `pntr` jobs must stay inside C-5a′. `runJob` interleaves them, so each extra concurrent column adds latency and not a per-tick spike (`L0-pntr-cons`).




- **node**: L0-pntr-r007

### Skip unloaded cells; never force-load (L0-pntr-r008)

**Rule R-pntr-8 · Unloaded chunks are skipped.**
- A column is at most 7×7, so it can straddle up to 4 chunks. The detonation chunk is loaded, because the charge was in it, but a neighbour may not be (at the edge of simulation distance).
- Cells whose chunk is not loaded are skipped and counted in the job report. There is no ticking area, force-load or retry (C-14; Orbital §11: "not required to keep chunks loaded").
- If the dimension or chunk unloads mid-job, the remaining cells are abandoned. The column may end up partial, which the spec accepts as equivalent to "charges lost". The cooldown is not refunded (C-17).
- Particles and the sound towards unloaded cells are try/catch no-ops.




- **node**: L0-pntr-r008

### Exactly one explosion sound per LMB (L0-pntr-r009)

**Rule R-pntr-9 · One sound.** Each LMB detonation plays exactly one main explosion sound. It plays at the detonation point, in the detonation tick, and before any removal. The removal job, the particle wave and block updates add no sounds of their own (Orbital §9: "no extra sounds along the wave"). Vanilla sounds caused by consequences, such as liquid flowing, sand landing or a mob falling, are not suppressed and do not count as "extra".




- **node**: L0-pntr-r009

### Ring NFRs (refining C-5a′, C-12, C-15, C-16 and C-19) (L0-ring-cons)

# Ring NFRs (refining C-5a′, C-12, C-15, C-16 and C-19)

| ID | NFR | Measured by |
|---|---|---|
| RG-1 | **Bounded work.** ≤ `RING_MAX_BLASTS_PER_TICK` (48) `createExplosion` calls per tick across all attacks. One `protectLegendariesIn` call per dimension per queue step. 0 entities spawned by `ring`. | Code review plus the gametest report `maxBlastsInTick` |
| RG-2 | **Latency.** The first blast happens in its contact tick. The queue drains in ≤ 4 ticks for 1 attack and ≤ 10 ticks for 3 concurrent attacks on flat ground. | The report's `ticksToDrain` in a 3-player gametest |
| RG-3 | **Tick budget.** With 3 concurrent RMBs over flat stone on BDS 1.26.x, tick time stays above 50 ms for no more than 3 consecutive ticks, and never above 150 ms. If this fails, lower the cap (`as05`) before touching anything else. | BDS tick-time probe, shared with PN-2 |
| RG-4 | **Entity hygiene.** The `minecraft:item` count within footprint ± 8 after the attack is at most the count before, plus the vanilla drops of mobs and players killed (C-19). There are no orphan charges. | Gametest entity diff |
| RG-5 | **Rank-1 safety.** `doTileDrops` is restored in `finally` in the same call. A thrown error in any blast or in protection never leaves the rule toggled, and never deletes a legendary. | A unit test with a throwing `createExplosion` mock and a throwing `lgnd` mock |
| RG-6 | **Documented deviations** (C-16), next to the code: the queue delay (`ad02`), the gamerule toggle (`ad01`), item frames and nested storage (`r008`), and the container fallback if it is enabled (`as02`). | Code review |

If RG-2 and RG-3 conflict, RG-3 wins (C-15 rank 3 over rank 4). Relax RG-2 to "≤ 20 ticks for 3 attacks" and document it.




- **node**: L0-ring-cons

### Ring r001 concept rule (L0-ring-r001)

**R-ring-001 · Five continuous rings at d ≈ 1/5/10/15/20 around the target column** (Orbital §10; AC-11; `L0-xasm8`)

- **Centre.** The rings are centred on the locked target block's (x, z). The face that was hit does not matter.
- **d = 1** means exactly one charge directly over the target.
- **d = 5, 10, 15, 20** are rings of radius r = d/2, rasterised as 8-connected closed midpoint circles (`p001`):
  - There are no deliberate gaps. Every ring cell has exactly two ring neighbours in its 8-neighbourhood.
  - Each cell is within r ± 0.75.
- **Columns** are de-duplicated. Each column carries one charge of normal TNT size (scale 1.0, `L0-orbc-ent3`).
- **The geometry is fixed.** It does not adapt to terrain, loaded chunks or dimension. Charges whose column is unloaded or voided are handled by `orbc` (`r009`/`r011`), and the ring is not re-shaped to compensate.

**Rationale:** "as continuous as possible, discrete grid allowed" (§10). 8-connectivity is the thinnest ring with no diagonal gap visible from above.




- **node**: L0-ring-r001

### Ring r002 concept rule (L0-ring-r002)

**R-ring-002 · All charges spawn in one tick. Detonation time follows terrain plus at most the queue delay** (Orbital §10)

- `orbc` spawns every column of the layout in the activation tick, at the dimension's `spawnY` (`L0-orbc-p002`, `r007`), and they start falling together. `ring` provides only the layout. It must not stagger spawns.
- A charge spawned inside a solid cell detonates in the spawn tick (`L0-orbc-r008`). The others detonate on first block contact, so differences in terrain height give different contact ticks. §10 accepts this.
- `ring`'s detonation queue (`p003`) may add **≤ 4 ticks** for one attack and **≤ 10 ticks** with 3 concurrent attacks (RG-2). This delay is the only one `ring` is allowed to add. It must never reorder blasts across attacks (FIFO).

**Rationale:** §10 says "created simultaneously … start falling simultaneously". The queue delay is covered by "actual explosion time may differ slightly" and by the C-15 rank-3 priority over rank-4 visual fidelity.




- **node**: L0-ring-r002

### Ring r003 concept rule (L0-ring-r003)

**R-ring-003 · Every charge is independent: no chain push, no chain destruction, no chain priming** (Orbital §10; AC-12)

- A blast must not move, remove, prime, re-time or re-aim any other charge, from the same attack or from another one.
- Independence is guaranteed structurally, not by ordering:
  - The charge entity has zero collision, no physics, `knockback_resistance 1` and a damage sensor that ignores all damage (`L0-orbc-ent3`).
  - Its motion is script-teleported along a fixed column (`L0-orbc-ad02`).
  - Its contact is re-evaluated each tick against the *current* terrain. When a neighbour's blast removed the block below, the charge simply falls further. That is terrain, not a push.
- `ring` code never iterates over, removes or teleports charge entities (`L0-orbc-r014` duty).
- Each blast is a separate `createExplosion` call, and each produces its own engine sound (AC-12). Blasts are never merged into one larger explosion, even when several share a tick.
- **Out of scope:** vanilla `minecraft:tnt` *blocks* in the world that a ring blast primes. They behave like vanilla (`L0-ring-as07`).




- **node**: L0-ring-r003

### Ring r004 concept rule (L0-ring-r004)

**R-ring-004 · TNT-equivalent entity damage, including the owner** (Orbital §10; AC-13)

- Each blast is `createExplosion(centre, 4, …)`. Power 4 is vanilla TNT, so damage, falloff, exposure (occlusion) and knockback are the engine's TNT values. `ring` computes no damage itself.
- **The owner is not exempt.** An owner standing in range takes normal TNT damage and can die from their own RMB.
- **`source` is the owner when resolvable.** It is resolved at blast time: the entity must be valid and in the blast's dimension. Otherwise `source` is omitted, and the blast still happens (`L0-orbc-p003`, AC-18). The source gives kill attribution only. It must never exempt the owner. If a BDS probe shows that `source` exempts it, drop `source` entirely (`L0-ring-as03`).
- **Other players** take the same damage whatever the PvP settings of the owner. The explosion follows the world `pvp` gamerule the way vanilla TNT does.
- Damage applies underwater too (`r007`).
- Legendary *item entities* are protected (`r008`). Players' own inventories are vanilla: armour durability and death drops are unaffected by `ring` (`r006`).




- **node**: L0-ring-r004

### Ring r005 concept rule (L0-ring-r005)

**R-ring-005 · Blocks break by TNT resistance only, and there is never fire** (Orbital §10; AC-14)

- The engine explosion (`breaksBlocks: true`, power 4) decides which blocks break. Blast-resistant blocks such as Obsidian, Crying Obsidian, Reinforced Deepslate, Ancient Debris, Enchanting Table, Anvil, Ender Chest, Bedrock and End Portal Frame survive, exactly as with vanilla TNT.
- `ring` never adds its own block removal. It keeps no keep-list and no remove-list. This is the opposite of `pntr` (`L0-pntr-r003`).
- `causesFire: false` on every blast. No fire block may appear in the blast AABB that was not there before.
- Liquids behave like vanilla TNT: source blocks are not removed, and flow into craters happens naturally.
- Structure blocks (C-13) are ordinary. Rings may crater the Windmill, the Bastion, the Warden City or the Airship.
- Protected spawners (`L0-strf-r006`) are protected against *generation* only, not against weapons. A spawner breaks if TNT would break it.




- **node**: L0-ring-r005

### Ring r006 concept rule (L0-ring-r006)

**R-ring-006 · No block drops and no container spill. Everything else drops as in vanilla** (Orbital §10, §15; AC-14; `L0-xasm7`)

**Suppressed:**
- Every item a *block* would drop because the ring explosion broke it.
- The ordinary contents of a container the ring explosion destroyed (`xasm7`).

**Not suppressed (stays vanilla):**
- Loot and XP from mobs killed by the blast.
- The death drops of players killed by the blast, under `keepInventory` false.
- Item entities that already lay on the ground (they may be destroyed by blast damage, as in vanilla).
- Items spilled later by world TNT that a ring blast primed (`as07`).

**Never suppressed or lost:**
- Live marked legendaries (`r008`).

**Mechanism:** `L0-ring-ad01`. `doTileDrops` is false only during the synchronous explosion call. It is restored in `finally`, to its previous value.

**Rationale:**
- §10 says "blocks the explosion destroyed disappear WITHOUT item drops". It is about blocks.
- Deleting a killed player's inventory would be a C-15 rank-2 violation, and it is not asked for.
- C-19 ("no uncontrolled item entities") is met by never *creating* block drops, instead of deleting them afterwards.




- **node**: L0-ring-r006

### Ring r007 concept rule (L0-ring-r007)

**R-ring-007 · Underwater blasts damage entities but change no blocks** (Orbital §10; AC-15)

- **Definition.** A blast is *underwater* when its centre cell (`r010`) is at blast time one of:
  - `minecraft:water` or `minecraft:flowing_water`;
  - a waterlogged block (`Block.isWaterlogged`).
- Lava, bubble columns over soul sand or magma, and cauldrons do **not** count.
- **Underwater blasts** use `breaksBlocks: false, allowUnderwater: true` (`ad03`):
  - no block in the AABB changes;
  - entities in range take normal TNT damage and knockback;
  - the sound and particles still play.
- **Per blast, not per attack.** In one RMB, a ring that crosses a shoreline craters the land and leaves the seabed intact.
- Classification happens at blast time, so a blast queued behind a neighbour that let water into a crater sees the current water state. Water flows over ticks, so within one queue step the result is the terrain as it stands.

**Rationale:** vanilla TNT in water does not break blocks but still hurts. The script decides explicitly, so the result does not depend on the undocumented `allowUnderwater` semantics (`as04`).




- **node**: L0-ring-r007

### Ring r008 concept rule (L0-ring-r008)

**R-ring-008 · Legendaries are never destroyed by RMB** (Orbital §5, §10; `L0-lgnd-ad10` tier 1; `L0-lgnd-r013` §2)

- **Before the first explosion of every queue step**, `ring` calls `protectLegendariesIn` (`L0-lgnd-p008`):
  - once per dimension per step (`ad04`);
  - over the union of the step's blast centres ± 8;
  - with `avoid` = the attack's ring footprint ± 8.
- ±8 = 2 × power, which covers item entities that explosion damage can destroy, not only broken containers (±~5). See `L0-ring-cx02`.
- **Protection failure wins over the blast** (C-15 rank 1): if the helper throws, the step's blasts are skipped and dropped as lost, and the error is logged. The cooldown is not refunded (`L0-orbc-ent2`).
- **The fallback container sweep (`ad01`) must skip** any entity where `isLegendaryItemEntity` holds.
- **Players' inventories** are not touched. A player killed by the blast keeps legendaries under `lgnd` retention.
- **Known gaps, inherited and not re-raised:**
  - Item frames are blocks in Bedrock and have resistance 0. A legendary in a frame is removed with `doTileDrops` false (`L0-pntr-cx01`).
  - Nested shulker boxes and bundles (`L0-lgnd-cx12`).
  - These go in the C-16 notes of `ring.ts`.




- **node**: L0-ring-r008

### Ring r009 concept rule (L0-ring-r009)

**R-ring-009 · Nothing temporary survives the attack** (Orbital §15; C-19)

- `ring` spawns **no entities**. Charges belong to `orbc`, which removes them on detonation, Void, loss or timeout and sweeps orphans (`L0-orbc-p003`).
- After the last blast of an attack, all of the following hold:
  - no `andrew:orbital_charge` is tagged with that attack id;
  - no new `minecraft:item` from broken blocks or destroyed containers exists within the ring footprint ± 8 (`r006`);
  - `world.gameRules.doTileDrops` equals its pre-attack value;
  - the queue interval is cleared once the queue is empty.
- Mass RMB (3 players × 1 attack each) must not raise the item-entity count in the area by more than the vanilla mob/player drops of what the blasts killed.
- `ring`'s in-memory state per attack (the counters for the report) is deleted when the attack has no pending charges and no queued blasts.




- **node**: L0-ring-r009

### Ring r010 concept rule (L0-ring-r010)

**R-ring-010 · The explosion centre is where a landed TNT would sit**

`orbc` passes `point`, the solid contact cell (`L0-orbc-r014`). `ring` maps it to the explosion centre:
- **Normal case.** The cell above `point` is not solid, which covers air, liquid and plants. The centre is `(x+0.5, y+1.5, z+0.5)`: the middle of the TNT block resting on the contact block. This matches vanilla TNT, which explodes from its own cell, and it makes the crater bite into the surface instead of starting one block deep.
- **Buried case.** The cell above `point` is solid, as with a spawn inside a solid block (`L0-orbc-r008`) or a charge under an overhang. The centre is `(x+0.5, y+0.5, z+0.5)`: the middle of `point` itself.
- Solidity uses the same `isContact` predicate as `orbc`, so the two components agree on what "solid" means.
- Underwater classification (`r007`) reads the centre's cell.




- **node**: L0-ring-r010

### R-sauc-1 · Hull hit test: a charge's swept segment against a cylinder of r 6 × h 3, in any phase (L0-sauc-r001)

# R-sauc-1 · Hull hit test: a charge's swept segment against a cylinder of r 6 × h 3, in any phase

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["rule"]` · `relates_to: ["L0-sauc-p002", "L0-sauc-p003", "L0-sauc-as01", "L0-adr-ufoi"]`

**Rule.** A charge hits the saucer in a tick when all of the following hold:
1. `attack.dimensionId` is the Overworld.
2. The horizontal distance between the charge column `(x, z)` and the saucer position `(sx, sz)` **in that tick** is ≤ 6.0.
3. The vertical segment `[to.y, from.y]` swept this tick overlaps the hull band `[sy, sy + 3]`, closed at both ends (`as01`).

The test holds in every phase while the saucer entity exists: arrival, magnet, departure, and the downed fall (`as05`).

**Why a segment.** Charges fall 1 block per tick, so a point test at the charge position could miss nothing at today's speed. But `FALL_SPEED` is a tunable, and the sweep keeps the test exact at any speed, the same way the block-contact sweep does.

**Saucer position.** The test uses the position the saucer holds when the flight loop runs. The order of `ufoc`'s interval relative to the orbital interval is not fixed. A ≤ 0.225 block-per-tick lag during arrival is accepted: the hull edge tolerance is effectively ±0.25.

**Not a hit:**
- A charge column at a horizontal distance greater than 6.
- A charge whose whole fall lies above or below the band.
- Charges in the Nether or the End.




- **node**: L0-sauc-r001

### R-sauc-2 · Flight-path geometry and timing (L0-sauc-r002)

# R-sauc-2 · Flight-path geometry and timing

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["rule"]` · `relates_to: ["L0-sauc-p001", "L0-sauc-as04", "L0-ufoc"]`

**Rule** (UFO §2 table, AC-2):

| Leg | From | To | Duration |
|---|---|---|---|
| Arrival | horizontal distance 90 from the centre on bearing θ, at `hoverY + 10` | hover point `(centre, hoverY)` | 400 ticks (20 s) |
| Hover | hover point | hover point | 1200 ticks (60 s), set by `ufoc` |
| Departure | hover point | horizontal distance 90 on bearing θ + 180°, at `hoverY + 10` | 300 ticks (15 s) |

After that the saucer is removed in the same tick.

**Constraints.**
- The horizontal distance from the centre stays ≤ 90 on every tick, and so never exceeds the 100-block U8 limit (C-12′). The 100 is read as horizontal (`as04`).
- θ is uniform in [0, 2π). The departure bearing is exactly opposite.
- The motion is continuous: the position step is ≤ 0.5 blocks per tick on every leg. The fastest step is at the middle of an eased leg, and stays under 0.5 blocks per tick for both legs.
- `hoverY` comes from `ufoc`: centre + 40, capped at ceiling − 4. `sauc` never recomputes it.
- The arrival and departure height is `min(hoverY + 10, ceiling − 4)`, so the hull never rises above the build limit and stays reachable by a charge in every phase (`L0-adr-ufht`, which resolves `sauc-cx01`).
- Nothing in the world changes the path: the saucer has no physics or collision, and it passes through terrain (UFO §7).




- **node**: L0-sauc-r002

### R-sauc-3 · Immune, unpushable, non-colliding (within the known engine traps) (L0-sauc-r003)

# R-sauc-3 · Immune, unpushable, non-colliding (within the known engine traps)

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["rule"]` · `relates_to: ["L0-sauc-ent1", "L0-sauc-ac02"]`

**Rule** (UFO §7, AC-16): nothing but an Orbital charge crossing the hull affects the saucer or the beam. Not damage, not knockback, not a push, not collision. The Cannon itself acts **only** through the script hull test (`r001`), never through entity damage.

**Required BP shape.** This is the same pattern as the shipped `orbital_charge.json` and the U-probe entities:
- `format_version` **1.26.0**. The 1.26.50 format drops `minecraft:pushable` and refuses the whole entity.
- `runtime_identifier: "minecraft:snowball"`. Without it, a custom entity pushes mobs.
- `collision_box` 0 × 0, so players cannot hit or target it and it does not block anything.
- `physics {has_gravity: false, has_collision: false}`.
- `pushable {is_pushable: false, is_pushable_by_piston: false}`.
- `knockback_resistance 1`.
- `damage_sensor {cause: "all", deals_damage: "no"}`.
- No `health` component and no `projectile` component.
- `is_spawnable false`. `is_summonable true` for tests only.

**Consequences.**
- Arrows, tridents, TNT and other explosions, lightning, lava, fire, and the `/damage` command change nothing.
- `/kill` and `/andrew:ufo stop` are removals, not damage. They fall outside AC-16 and are handled as an aborted event (`p001`).
- Charges are never stopped by the entity. They are stopped by the interceptor.




- **node**: L0-sauc-r003

### R-sauc-4 · One shoot-down per event: a harmless blast, the reward exactly once, and a broadcast naming the charge owner (L0-sauc-r004)

# R-sauc-4 · One shoot-down per event: a harmless blast, the reward exactly once, and a broadcast naming the charge owner

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["rule"]` · `relates_to: ["L0-sauc-p002", "L0-sauc-ad03", "L0-sauc-as03", "L0-ufoc"]`

**Rule** (UFO §8, AC-15; priority (1), C-7):
1. **First crossing wins.** Only the first charge to satisfy `r001` triggers the shoot-down. It is latched on `eventId`. Later crossings are absorbed but produce no second reward, broadcast or `reportShotDown`.
2. **The blast is harmless:**
   - no `createExplosion` (even `breaksBlocks: false` deals entity damage);
   - no block is changed;
   - no entity takes damage or knockback;
   - no fire.

   It is only particles plus the `random.explode` sound.
3. **The reward** is exactly `minecraft:diamond × 8` and `minecraft:totem_of_undying × 1`, as two item entities at the blast point. It is spawned once per `eventId`, never on a departure, a `stop` or a restart.
4. **The broadcast** goes to every online player: `andrew.ufo.shot_down` = RU "%s сбил НЛО!" / EN "%s shot down the UFO!". `%s` is the **owner of the absorbed charge** (`attack.ownerId`), not the closest player and not the event target.
5. **The schedule** is the next arrival at 15 min after the shot, set by `ufoc` from `reportShotDown`.




- **node**: L0-sauc-r004

### R-sauc-5 · The beam: translucent green, saucer underside to the ground, shown only during the magnet phase (L0-sauc-r005)

# R-sauc-5 · The beam: translucent green, saucer underside to the ground, shown only during the magnet phase

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["rule"]` · `relates_to: ["L0-sauc-ad01", "L0-sauc-ent1", "L0-sauc-ac05"]`

**Rule** (UFO §7, DoD):
- **Visibility.**
  - The beam is visible if and only if `ufoc`'s phase is `magnet`.
  - It turns on in the magnet-on tick.
  - It turns off in the release tick, or in the shoot-down tick.
  - It is never visible during arrival, departure or the fall.
- **Look.**
  - A cone, wide end at the bottom, apex at the underside of the saucer.
  - The bottom radius is ≈ 5 blocks, a tunable judged on the iPad. It is not tied to the 50-block magnet zone.
  - Green with alpha ≈ 0.35–0.5. Terrain and pulled items are visible through it.
  - It is rendered without back-face culling and does not cast a shadow.
- **Length.** `hoverY − centre.y` (normally 40) is sent to the client as an int actor property `andrew:beam_len`. The geometry bone scales by it. The beam ends at the centre block. It does not follow terrain under the cone.
- **Visible whole.** `visible_bounds` covers the disc and the full beam length, so the client does not cull the beam when the disc is off screen. The beam is not damageable and not collidable: it is part of the saucer entity (`ad01`), so `r003` covers it.




- **node**: L0-sauc-r005

### R-sauc-6 · Sounds (L0-sauc-r006)

# R-sauc-6 · Sounds

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["rule"]` · `relates_to: ["L0-sauc-r005", "L0-sauc-p002", "L0-sauc-as02"]`

**Rule** (UFO §7: vanilla `beacon.*` is allowed):

| Moment | Sound | Where |
|---|---|---|
| Magnet on | `beacon.activate` | saucer position |
| Every 40 ticks during the magnet (first at +40) | `beacon.ambient` | saucer position |
| Magnet off (release or shoot-down while the magnet is on) | `beacon.deactivate` | saucer position |
| Shoot-down blast | `random.explode` | blast point |

- The sounds are played with `dimension.playSound(id, pos, {volume: 4})`. Bedrock attenuates over about 16 × volume blocks, so 4 gives a ~64-block range and covers a player on the ground 40 below, inside the 50-block zone (`as02`).
- All calls go through one `playUfoSound()` wrapper so GameTests can count them (`ac05`).
- There is no arrival or departure sound; the spec asks for none.
- The hum stops on the release tick. No sound plays after the saucer is removed.




- **node**: L0-sauc-r006

### R-scyt-001 — Candidate filter (players and living mobs) (L0-scyt-r001)

# R-scyt-001 — Candidate filter (players and living mobs)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-scyt-p001", "L0-scyt-ad02", "L0-scyt-ad04", "L0-scyt-as01", "Q-022"]`

Source: spec §3 as amended by `decision-scythe-targets-mobs` (2026-09-25). Code: `gatherCandidates`, `eligibleCandidates`, `hasLineOfSight`.

**Rule:** an entity E is a candidate for owner O only if **all** of these hold:
1. E is a player from `world.getAllPlayers()` with `isValid`, **or** an entity returned by `O.dimension.getEntities({ location: O.location, maxDistance: 20 })` that is valid and has a `minecraft:health` component. The health component is what excludes arrows, dropped items, xp orbs and similar entities.
2. E ≠ O.
3. E is in O's dimension, and `dist3D(E.location, O.location) ≤ 20`. The bound is inclusive and measured feet to feet.
4. If E is a player, `isHiddenFromTargeting(E)` is false. Mobs are never hidden.
5. E is **visible**: there is line of sight from O's eyes to E's eyes (`L0-scyt-ad02`).

**Not a filter (as shipped):** game mode (Creative and Spectator players are **not** skipped, see `L0-scyt-as01`), vanilla Invisibility, sneaking, teams, name tags, the `pvp` gamerule (Q-022), and whether a mob is hostile or passive. Armour stands have health, so they qualify as mob-tier candidates. That is unverified.




- **node**: L0-scyt-r001

### R-scyt-002 — Player tier first, then nearest, then the owner's gaze within ε 0.5 (L0-scyt-r002)

# R-scyt-002 — Player tier first, then nearest, then the owner's gaze within ε 0.5

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-scyt-p001", "L0-scyt-ad04", "L0-scyt-gl04", "L0-scyt-gl07"]`

Source: spec §3 and §8 tests 2/4, `decision-scythe-targets-mobs`. Code: `pickTarget`, `TIE_EPSILON = 0.5`.

**Order:**
1. **Tier:** every player candidate ranks ahead of every mob candidate, however near the mob is. A mob can win only when no player is **visible**.
2. **Distance:** within a tier, the smallest 3D distance from the owner's feet wins.
3. **Tie window:** it is anchored on the nearest **visible** candidate of the winning tier. Candidates up to `nearest + 0.5` blocks count as tied. An occluded candidate neither wins nor widens the window.
4. **Gaze:** among the tied candidates, the one with the highest cosine between `owner.getViewDirection()` and (candidate feet − owner feet) wins.
5. **Exact gaze tie:** the first one in sort order wins, because a strict `>` is used. There is **no** id fallback.

**Laziness:** `isVisible` runs nearest first, and scanning stops once a candidate lies beyond the window or in the lower tier after a hit. Raycasts are the only costly step.

**Once only:** the target is fixed at activation, and projectiles never switch targets (§4).




- **node**: L0-scyt-r002

### R-scyt-003 — A miss costs nothing (L0-scyt-r003)

# R-scyt-003 — A miss costs nothing

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-scyt-p001", "L0-lgnd", "L0-scyt-gl06"]`

Source: spec §3 and §8 test 1, `decision-scythe-targets-mobs` (text change). GameTest: `andrew:scythe_no_target_no_cooldown`.

**Rule:** if `selectTarget` returns nothing (no visible player **and** no visible mob in range), then:
- the owner's action bar shows `{ translate: "andrew.scythe.no_target" }`: RU «Здесь нет цели», EN "There is no target here". The old "no player" wording is gone;
- no cooldown, no busy, no projectiles and no world change happen;
- an immediate second press searches again.

**Channel as shipped:** `player.onScreenDisplay.setActionBar` directly. There is no `hud.hold`, so the steady HUD may overwrite the message on its next pass. This is a cosmetic risk that has not been measured.




- **node**: L0-scyt-r003

### R-scyt-004 — Projectiles pass through every block and change none (L0-scyt-r004)

# R-scyt-004 — Projectiles pass through every block and change none

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-sprj", "L0-sprj-ac05", "ADR-023"]` · source: Scythe §4, §7, §8 test 5.

**Rule:**
- The volley has exactly **3** projectiles, no more and no fewer.
- Their motion ignores **all** blocks: obsidian, walls, doors, glass, bedrock and liquids included.
- Projectile code never calls `getBlock`, `setType`, `setPermutation`, `fillBlocks` or `/fill`/`/setblock`. It also never calls explosion APIs.
- A projectile inside a block still hits the target if it is within the hit radius. Visibility matters only at **target selection** (`L0-scyt-r001`), not in flight.

**Consequence:** a target that ducks behind a wall after the lock is still hit. That is intended by §4.




- **node**: L0-scyt-r004


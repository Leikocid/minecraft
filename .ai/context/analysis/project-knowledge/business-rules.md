---
title: Business Rules
type: project-knowledge
generated_at: "2026-09-26T08:34:28.634Z"
source_channel: rollout
node_id: rollout-business-rules
aliases: ["rollout-business-rules","business-rules","project-knowledge/business-rules"]
is_a: ["rollout","business-rules"]
relates_to: ["L0-airs-r001","L0-airs-r002","L0-airs-r003","L0-airs-r004","L0-airs-r005","L0-bast-r001","L0-bast-r002","L0-bast-r003","L0-bast-r004","L0-bast-r005","L0-bast-r006","L0-infr-r001","L0-infr-r002","L0-infr-r003","L0-infr-r004","L0-infr-r005","L0-infr-r006","L0-infr-r007","L0-loot-r001","L0-loot-r002","L0-loot-r003","L0-loot-r004","L0-loot-r005","L0-loot-r006","L0-loot-r007","L0-scyt-r004","L0-strf-r001","L0-strf-r002","L0-strf-r003","L0-strf-r004","L0-strf-r005","L0-strf-r006","L0-strf-r007","L0-strf-r008","L0-strf-r009","L0-strf-r010","L0-strf-r011","L0-strf-r012","L0-strf-r013","L0-wind-r001","L0-wind-r002","L0-wind-r003","L0-wind-r004","L0-wind-r005","L0-wind-r006","L0-wind-r007","L0-wind-r008","L0-wind-r009","L0-wind-r010","L0-wind-r011","L0-wind-r012","L0-wind-r013","L0-wrdn-rul1","L0-wrdn-rul2","L0-wrdn-rul3","L0-wrdn-rul4","L0-wrdn-rul5","L0-wrdn-rul6","L0-wrdn-rul7"]
priority: 530
---

# Business Rules

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

### Rule: one fixed Airship template — modern, undamaged, no assisted ground access (L0-airs-r001)

# Rule: one fixed Airship template — modern, undamaged, no assisted ground access

**Links:** `part_of: ["L0-airs"]` · `is_a: ["rule"]`

- Fixed size ≈15×7×10–12 (L×W×H, unrotated). Lower hull: elongated oval gondola, grey/light-grey concrete, intact glass windows, working lights. Upper hull: large oval balloon, fully decorative, grey/light-grey concrete — no interior volume that holds chests or a spawner (§5.1).
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

- Every placed Windmill instance — including the guaranteed spawn one — triggers exactly one call to `airs.tryLinked(parentInstance)` from its own `afterPlace` hook, guarded by `linkedTried` on the Windmill's `InstanceRecord` so it never runs twice for the same instance (`L0-strf-p003` step 7; §5.6).
- `airs` searches only `strf.searchRing(airsDef, windmillCentre, rMin=40, rMax=100)` — an annulus, not a point. Every candidate in the ring is run through the same validation and collision checks as independent generation (`L0-airs-r003`), plus one extra, `airs`-specific 2D exclusion: a candidate is rejected if its horizontal (X/Z) footprint intersects the parent Windmill's own footprint, regardless of vertical separation (`L0-strf-d004`; §5.6 "не должен висеть прямо над Мельницей/полями"). This exclusion is `airs`'s own filter, not part of `strf`'s generic 3D collision test.
- **No dedup, either direction** (`L0-strf-r002` item 6): a pre-existing independent Airship already inside [40,100] of the Windmill does **not** satisfy the linked attempt — `airs` still tries to place its own. Conversely, a successful linked Airship does not consume, or block, that chunk's own independent 2 % roll.
- **No widening, no forcing.** If no position anywhere in [40,100] validates, the linked Airship is simply not created for that Windmill instance. `airs` never expands the search past 100 blocks and never force-prepares a site — that asymmetry with `wind`'s guaranteed-spawn (which always succeeds by forcing terrain) is intentional (§5.6 "не расширять... и не форсировать размещение любой ценой").
- Two Windmills close together each run their own independent linked search; results are never merged or deduplicated between them (§5.6).
- Chunk-loading of far ring candidates is not guaranteed the way `wind`'s spawn search forces it via ticking areas — see the open contradiction `L0-airs-cx01`.




- **node**: L0-airs-r004

### Rule: the Airship has no one-time persistent mobs — the only spawned actor is the vanilla spawner (L0-airs-r005)

# Rule: the Airship has no one-time persistent mobs — the only spawned actor is the vanilla spawner

**Links:** `part_of: ["L0-airs"]` · `is_a: ["rule"]`

- `airs.def.guards` is absent/undefined. Unlike `wind` (10 field Zombie Villagers) and `bast` (7–10 Piglins + 2 Piglin Brutes), the Airship spawns nothing itself at init time (§5.3, §9; `L0-strf-r009`, `L0-strf-p004`). Its `InstanceRecord` skips the `looted → guarded` step and goes `placed → looted → done`.
- The only mob associated with an Airship instance is whatever the vanilla spawner produces at runtime; those entities are **not** tagged `andrew:guard:<instanceId>` and are not tracked by the registry (`L0-strf-r009` last bullet).
- Persistence is entirely `strf`'s: the registry is the sole source of truth for "already initialised" (`L0-strf-r008`); loot never refreshes and a broken spawner never restores (`L0-strf-r011`, §6, §9). `airs` adds no persistence logic of its own.




- **node**: L0-airs-r005

### Bast r001 concept rule (L0-bast-r001)

**Rule:** A Nether chunk becomes a Mini Bastion candidate with 5% probability, evaluated once per suitable chunk. A successful roll is discarded (not relocated) if: (a) the site is over a lava ocean, (b) the site lacks solid supporting ground for the template, or (c) the site physically intersects any other detected structure — custom (Windmill, Airship, Mini Warden City) or vanilla (including a genuine Bastion Remnant). Existing structures are never damaged or removed to accommodate a Mini Bastion candidate. All Nether biomes are eligible provided the physical site passes these checks.

**Rationale:** Keeps generation rare and predictable, and guarantees no other content is ever destroyed by Mini Bastion placement.

**Source:** §14.2, §15.




- **node**: L0-bast-r001

### Bast r002 concept rule (L0-bast-r002)

**Rule:** Each Mini Bastion instance uses one fixed template (no template variation) with an approximate 20×20 block footprint and 10-12 block height, containing 2-3 internal levels connected by clear stairs/short transitions — the layout must feel coherent, without excessive random deadly drops. The template is placed with a random rotation of 0°, 90°, 180° or 270°. Exterior materials must read immediately as a small Bastion Remnant (Blackstone, Polished Blackstone, Polished Blackstone Bricks and other vanilla bastion materials), with visible external gold accents for long-range recognizability; no separate artificial marker is used (contrast with Mini Warden City's sculk surface marker, `L0-wrdn`).

**Rationale:** Visual/gameplay parity with vanilla Bastion Remnants without a bespoke marker system.

**Source:** §14.1.




- **node**: L0-bast-r002

### Bast r003 concept rule (L0-bast-r003)

**Rule:** Exactly 10 chests are placed at fixed positions per instance: 3 in the central treasure room, 7 distributed through the rest of the structure (small rooms, niches, side areas, passages). The 3 treasure chests roll against the real vanilla Bastion Remnant *treasure* loot table; the other 7 roll against the real vanilla Bastion Remnant *regular* loot table. The shared custom weighted loot system used by Windmill/Airship (family §3) does **not** apply to Mini Bastion. Each chest's contents are generated exactly once and never refill after opening, destruction, chunk unload, or server restart.

**Rationale:** Mini Bastion deliberately reuses genuine vanilla loot behavior rather than the custom system, matching Mini Warden City's choice for Ancient City loot (see ADR-bast-02).

**Source:** §14.4.




- **node**: L0-bast-r003

### Bast r004 concept rule (L0-bast-r004)

**Rule:** The treasure room sits approximately at the center of the bastion's interior, below the main traversal levels, surrounded by/approached across ordinary vanilla lava with no special properties (bucketable, blockable, reacts normally with water). It must be reachable both by building/routing a safe path through the lava area and by descending or falling into it from the level above. It contains 2-4 randomly chosen Gold Blocks (ordinary blocks, minable normally) and exactly one of the two Piglin Brutes as its dedicated guard.

**Rationale:** The treasure room is the component's signature risk/reward space; two access methods keep it playable without special-casing lava.

**Source:** §14.3.




- **node**: L0-bast-r004

### Bast r005 concept rule (L0-bast-r005)

**Rule:** On first initialization of a given Mini Bastion instance, spawn — exactly once — 7-10 regular Piglins and exactly 2 Piglin Brutes; Hoglins are never spawned as part of this roster. One Brute guards the treasure room (R-bast-004); the other occupies a second fixed position elsewhere in the template. All of these initial mobs are persistent until death: they do not despawn from distance, chunk unload, or server restart, and after any of them dies they are never replaced and no minimum headcount is maintained. No mob spawners are used for this garrison — it exists solely as the one-time initial set.

**Rationale:** The garrison is a fixed, exhaustible challenge, not a renewable one; matches the "one-time persistent" pattern the family addendum uses for Windmill's field Zombie Villagers too.

**Source:** §14.5, §15.




- **node**: L0-bast-r005

### Bast r006 concept rule (L0-bast-r006)

**Rule:** After generation, every ordinary block, the lava, the chests and the Gold Blocks are normal mutable world state, minable/placeable under standard vanilla rules for those block types. Nothing that is destroyed, looted, or altered by a player — including killed guards — is ever restored, regardless of chunk unload/reload or server restart. Initializing (or re-initializing on load) a given instance must be idempotent: it must never create a second set of chests, Gold Blocks, or mobs for the same bastion.

**Rationale:** Matches the family-wide no-regeneration and idempotent-init invariants shared by all four structures.

**Source:** §14.6, §15.




- **node**: L0-bast-r006

### Rule: version targets live in one place, and drift is fixed by retargeting, never by loosening the API channel (L0-infr-r001)

# Rule: version targets live in one place, and drift is fixed by retargeting, never by loosening the API channel

**Links:** `part_of: ["L0-infr"]` · `is_a: ["rule"]`

`scripts/targets.mjs` is the sole source for three constants: `MIN_ENGINE_VERSION = [1,26,50]`, `SERVER_API_VERSION = '2.10.0'`, `BDS_VERSION = '1.26.51.1'`. Every manifest, `docker/bds/compose.yaml`'s `VERSION`, and the README must agree with it; nothing else may hardcode these as literals [C-2, C-3]. `validate.mjs` and `bds-gametest.mjs` both import from `targets.mjs` directly rather than duplicating the values. `assertComposePinsVersion()` (run at the top of both `bds:check` and `bds:up`) fails the run immediately if `compose.yaml`'s `VERSION` env drifts from `BDS_VERSION`.

**On a version/dependency error** from the game or BDS (`Unsupported version`, `Missing dependency: @minecraft/server …`, `Pack format version mismatch`): read the error text, update the one matching constant in `targets.mjs`, then `npm ci && npm run build` and re-check. **Never** enable a `-beta`/`-preview`/`-rc` module or an experiments toggle to make the error disappear — that hides a real incompatibility instead of fixing it [C-3; README §7].

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

**Rule:** The custom weighted table (`L0-loot-p001`) applies only to Windmill (25 chests) and Airship (10 chests). Mini Warden City (10 chests) and Mini Bastion (10 chests) use only their respective vanilla loot tables (`L0-loot-p002`) — never the custom table, and the custom table's constraints (Golden Apple cap, no curses, 80/20 split) never apply to vanilla-table chests. Floor/room location never changes loot quality on either path.

**Rationale:** spec §3.3 last bullet ("Одна и та же таблица... во всех 25 сундуках Мельницы и всех 10 сундуках Дирижабля"), §13.6 ("Общая пользовательская таблица лута Мельницы/Дирижабля к Mini Warden City НЕ применяется"), §15 shared addendum ("Mini Warden City и Mini Bastion используют только соответствующие ванильные loot tables").

**Scope:** boundary rule for the whole component; this is the rule a sibling body component would violate if it tried to reuse the wrong mechanism.




- **node**: L0-loot-r007

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

### Rule: every random choice in generation is a pure function of the world salt and the candidate key (L0-strf-r001)

# Rule: every random choice in generation is a pure function of the world salt and the candidate key

**Links:** `part_of: ["L0-strf"]` · `is_a: ["rule"]`

- The chunk roll, rotation, Airship clearance, Warden City depth, and chest-fill seed all derive from `hash32(salt, dim, cx, cz, defId, purpose)`. Examples of `purpose`: `"roll"`, `"rot"`, `"clr"`, `"y"`. Per-instance values derive from `(salt, instanceId, purpose)`.
- `salt` is written once per world (`andrew:st:salt`) and never changes (C-6, C-7).
- `Math.random()` is forbidden in generation paths except for creating the salt. Guard spawn jitter may use it, because it has no effect on idempotency.
- The hash is a fixed, documented function (e.g. `xmur3`/`mulberry32` over a UTF-8 key string). It is unit-tested for uniformity: 100 k keys, χ² p > 0.01 at 100 buckets. The tests assert its output for three golden keys so a refactor cannot silently change existing worlds.

**Rationale.** Re-evaluating a chunk after a crash, a lost bit or a restart gives the same outcome, so duplicates are structurally impossible (§6, §11 "не создают копии структур"). Rates are measurable because rolls are independent and uniform (tests 23, 32, 41, 51).




- **node**: L0-strf-r001

### Rule: one roll per (chunk, structure), no relocation, and a fixed priority order within a chunk (L0-strf-r002)

# Rule: one roll per (chunk, structure), no relocation, and a fixed priority order within a chunk

**Links:** `part_of: ["L0-strf"]` · `is_a: ["rule"]`

1. Each chunk of the matching dimension gets exactly one roll per `StructureDef`, with chances from one config table: Windmill 0.01, Airship 0.02, Warden City 0.05, Bastion 0.05 (§4.6, §5.5, §13.2, §14.2; `L0-xq2`).
2. A successful roll with an invalid site is **cancelled**. It is not moved to a neighbouring chunk or retried later with a different origin. *Exception:* `pending` (footprint not loaded) is a deferral, not a relocation. The same origin and rotation are retried.
3. **At most one instance of a given structure per candidate chunk** (§4.6, §5.5). This follows from (1).
4. **Order within a chunk (Overworld):** Windmill → Airship → Warden City. Later candidates see earlier ones in the registry and are cancelled if their AABBs overlap (`L0-strf-r006`). Different structures on the same chunk are allowed when they do not overlap (e.g. an underground Warden City beneath a surface Windmill).
5. **Relocating searches** are only these, exposed as `strf` API calls:
   - the guaranteed spawn Windmill (`wind`, §4.7);
   - the Windmill-linked Airship (`airs`, §5.6, hard ring 40–100).
   Both use the same validation and collision rules. They differ only in how origins are generated.
6. A linked Airship does not count as the chunk's independent Airship, and it does not consume that chunk's roll (§5.6).




- **node**: L0-strf-r002

### Rule: dimension lock and build-height bounds (L0-strf-r003)

# Rule: dimension lock and build-height bounds

**Links:** `part_of: ["L0-strf"]` · `is_a: ["rule"]`

- Every `StructureDef.dimension` is exactly one of `minecraft:overworld` and `minecraft:nether`. The Windmill, Airship and Warden City use the Overworld, and the Bastion uses the Nether (§2, C-14). The End never matches. The discovery worker filters defs by the player's `dimension.id` before rolling.
- Vertical bounds come from `dimension.heightRange` at runtime and are never hard-coded. For reference: Overworld min −64, max 320 (exclusive), so the top buildable Y is 319. Nether min 0, max 128, with a bedrock roof at about 123–127.
- A candidate whose rotated AABB leaves `[heightRange.min + 1, heightRange.max − 1]` is invalid. The +1 keeps the bottom bedrock layer untouched. This covers the Airship world-ceiling rejection (§5.4, test 31) and the Warden City depth floor.
- The Nether additionally forbids any AABB cell at Y ≥ 122, so the bedrock roof is never replaced. Bastion height of 10–12 plus a floor ≥ 32 fits.




- **node**: L0-strf-r003

### Rule: rotation is chosen once, and one transform maps every template-local point (L0-strf-r004)

# Rule: rotation is chosen once, and one transform maps every template-local point

**Links:** `part_of: ["L0-strf"]` · `is_a: ["rule"]`

- `rot ∈ {0,1,2,3}` maps to `StructureRotation.None/Rotate90/Rotate180/Rotate270`. It is seeded per candidate (`L0-strf-r001`), stored in the `InstanceRecord`, and never recomputed (§2, §15; tests 25, 43, 53).
- The rotated size is `(W, D)` for 0/180 and `(D, W)` for 90/270. `origin` is always the **min corner of the rotated AABB** (see `L0-strf-as06` for the probe).
- Exactly one function, `rotateLocal(p: Vec3, size: Vec3, rot) → Vec3`, converts template-local points to offsets inside the rotated AABB. Template-local points include chest slots, spawner cells, guard spawn points, the marker centre, the treasure room and the Airship "not above the Windmill" exclusion. Body components must call it and never compute their own transforms.
- Unit tests: for each rotation, `rotateLocal` is a bijection on the box, and 4× Rotate90 equals the identity. A BDS test places the probe template in all 4 rotations and asserts that every declared chest point holds a `minecraft:chest` (probe item 2).
- Rotation is the only variation. No mirroring and no alternative templates (§2 "один фиксированный шаблон").




- **node**: L0-strf-r004

### Rule: footprint-validity profiles (the whole footprint, never only the centre) (L0-strf-r005)

# Rule: footprint-validity profiles (the whole footprint, never only the centre)

**Links:** `part_of: ["L0-strf"]` · `is_a: ["rule"]`

Validation always samples the **whole rotated footprint** (§5.4 "проверять не только центральную точку"). Thresholds are per-def constants in one table:

| Profile | Used by | Condition to be valid |
|---|---|---|
| `dryLand` | Windmill, Airship, Warden City (surface) | liquid surface samples ≤ `maxLiquidShare` (Windmill 5 %, Airship 10 % (`L0-strf-as02`), Warden City 0 % at the centre and the 8-point ring); no sample on ice-over-water in an ocean/river biome |
| `flat` | Windmill (normal gen) | `max(surfaceY) − min(surfaceY) ≤ 3` over the 35×35 plot; leaves/logs count as obstacles, so the surface uses the first non-leaf, non-log solid block (`L0-xasm4` §4) |
| `altitude` | Airship | `maxSurfaceY` includes trees and leaves (§5.4 "рельеф/деревья"); `bottomY = maxSurfaceY + c`, `c` seeded in [40,70]; if `bottomY+H−1 > top`, retry with `c = 40`; still too high → reject |
| `depth` | Warden City | seeded top Y in [−45, −35]; the whole AABB is above `min+1`; the centre column above is `dryLand` |
| `netherFloor` | Bastion | see `L0-strf-r013` |

- Normal generation **never terraforms** (§4.6). Only `wind`'s spawn path may prepare terrain.
- "Open water" includes rivers, oceans, lakes and swamp water at the surface. The Windmill's own water ditches in its template are irrelevant because validation runs before placement.
- Reject reasons are enumerated (`liquid`, `uneven`, `ceiling`, `floor`, `lavaOcean`, `collision:<kind>`, `unloaded`) and counted (`L0-strf-p002`).




- **node**: L0-strf-r005

### Rule: collision cancels the candidate. Existing structures and spawners are never damaged. (L0-strf-r006)

# Rule: collision cancels the candidate. Existing structures and spawners are never damaged.

**Links:** `part_of: ["L0-strf"]` · `is_a: ["rule"]`

A candidate is cancelled if its rotated **3D** AABB, expanded by a 2-block margin (`L0-strf-d004`), intersects any of the following (§2, §6, §13.2, §14.2, §15):
1. **Custom structures.** The AABB of any `InstanceRecord` in any state, including `planned` and `failed`. The check reads the shards covering the AABB plus 1 region margin.
2. **Protected spawners.** Any `minecraft:mob_spawner` or `minecraft:trial_spawner` block, vanilla or ours (`L0-xasm3`).
3. **Vanilla structures (heuristic).** A sparse volume probe (step 4, step 2 near the surface layer) finds a signature block from `L0-xasm3`'s list: village/temple/mineshaft/stronghold/ancient city/bastion/fortress/trial chamber markers, plus `chest`, `barrel` and `bell`. A block counts only when it is not natural for the dimension and depth. For example, `deepslate_tiles` counts, `deepslate` does not.

- The whole check runs **before** reservation and again right before `place` (`L0-strf-p003`).
- Normal candidates are cancelled. The spawn Windmill and the linked Airship try their next origin (`L0-strf-r002` §5).
- **Known limitation, for the deviation report:** structures made only of natural-looking blocks (e.g. ruined portals partly, igloos' surface part, pillager outposts' logs) may be missed. Probing is sparse, so thin features can slip between samples. This is accepted per §7 "наиболее безопасная доступная эвристика".
- `strf` never calls `/locate` and never reads structure data. Stable APIs offer neither.




- **node**: L0-strf-r006

### Rule: loaded-footprint guarantee and revalidation of deferred candidates (L0-strf-r007)

# Rule: loaded-footprint guarantee and revalidation of deferred candidates

**Links:** `part_of: ["L0-strf"]` · `is_a: ["rule"]`

- No block read that decides validity and no block write (place, fill, chest, marker, gold) happens unless **every chunk** covering the rotated AABB plus the 2-block margin is loaded (C-12). The check uses `isChunkLoaded` where available, otherwise a `getBlock` probe per covered chunk (`L0-strf-as03`).
- If any covered chunk is not loaded, the candidate becomes `pending`. It is kept in memory only (it is not persisted) keyed by chunk, and re-queued when discovery next sees that chunk. The chunk's evaluated bit is **not** set while a candidate on it is pending. After a restart, the roll reproduces the pending candidate (`L0-strf-r001`).
- Once the world is reserved (`planned`), the record persists and the remaining steps resume on load (`L0-strf-p004`).
- **Revalidation.** A candidate that waited ≥ 1 job slice is fully revalidated before reserving. Between validation and reservation a player could build in the footprint, which the collision heuristic sees as planks/chests. Placement must never overwrite a player's build that it can detect.
- An instance whose chunks unload during init keeps its state and resumes later. Partial chest filling is safe (`L0-strf-p004`).




- **node**: L0-strf-r007

### Rule: the registry is the only source of truth for \ (L0-strf-r008)

# Rule: the registry is the only source of truth for "this structure exists / is initialised"

**Links:** `part_of: ["L0-strf"]` · `is_a: ["rule"]`

1. Every instance has a durable record in world dynamic properties (§6 "устойчивый признак инициализации"). It is written **before** the first world mutation (`planned`) and advanced after each init step.
2. Each init step runs only while the record is in that step's predecessor state. Restarts and chunk reloads can therefore never produce a second set of chests, loot, spawners, guards, markers or gold blocks (§11, tests 22, 50, 58).
3. The "initial guards spawned" state (`guarded`) is set once and **never reset**, whatever happens to the guards (§6).
4. The chest container itself is the loot state after `looted` (§6). `strf` keeps no copy of loot.
5. Records are never deleted, even when a player levels the structure. A missing structure is a permanent world change (§2, §6, §9), and the record keeps blocking new candidates on that spot. That spot keeps what the player built.
6. Registry writes are synchronous within the job step (`world.setDynamicProperty`). No two jobs run, so there are no concurrent writers inside one pack. Across packs, see `L0-strf-cx01`.




- **node**: L0-strf-r008

### Rule: one-time persistent mobs (\ (L0-strf-r009)

# Rule: one-time persistent mobs ("guards")

**Links:** `part_of: ["L0-strf"]` · `is_a: ["rule"]`

- Guards are spawned **once** per instance during the `looted → guarded` step. They are the Windmill's exactly 10 field Zombie Villagers and the Bastion's 7–10 Piglins (count seeded) plus exactly 2 Piglin Brutes (§4.5, §14.5).
- Each guard is a **vanilla** entity type (`minecraft:zombie_villager_v2`, `minecraft:piglin`, `minecraft:piglin_brute`) so that vanilla behaviour stays intact: curing, conversion, AI (`L0-adr-strs`).
- On spawn, each guard gets:
  - tag `andrew:guard:<instanceId>`;
  - a non-empty `nameTag` (localised structure-guard name, or a zero-width name if the probe shows invisible names are not required), which prevents despawn;
  - per-def extras. The Windmill adds permanent, particle-less fire resistance for sun immunity, via `runCommand("effect @s fire_resistance infinite 0 true")` (`L0-strf-as04`).
- **No respawn, no top-up, no tracking loop.** Deaths are not observed (§4.5, §9, §14.5).
- Guards may wander away freely (§4.5). `strf` never teleports them back.
- A cured Zombie Villager becomes a new `minecraft:villager`. `strf` never re-applies guard properties to it (§9). If the name carries over, it is cleared in an `entitySpawn` handler only when the probe shows it carries over *and* the spec requires "ordinary". Default: leave it. Deviation noted.
- Nether piglins must not zombify: they are in the Nether, so vanilla already guarantees that. No action.
- Spawner-produced mobs are **not** guards and get no tags (§4.5 last bullet).




- **node**: L0-strf-r009

### Rule: spawners are vanilla `mob_spawner` blocks from the template, with no script behaviour (L0-strf-r010)

# Rule: spawners are vanilla `mob_spawner` blocks from the template, with no script behaviour

**Links:** `part_of: ["L0-strf"]` · `is_a: ["rule"]`

- Each spawner (Windmill ×3: Zombie Villager, Zombie, Vindicator; Airship ×1: Vindicator) is a `minecraft:mob_spawner` block entity baked into the `.mcstructure` with its `EntityIdentifier` (`L0-adr-tmpl`).
- Everything else is **vanilla, unmodified** (§2, §4.3, §5.3):
  - infinite;
  - activates when a player is within the vanilla range;
  - light suppression per the engine rule;
  - breakable, with no block drop and vanilla XP.
- The iron axe on the Vindicator: vanilla Bedrock Vindicators spawn with an iron axe (`L0-xasm4` §1). No equipment script.
- Template authors (bodies) must keep light near each spawner at or below the engine threshold. `strf`'s template test asserts that no light-emitting block lies within 4 blocks of a spawner cell.
- A broken spawner is never restored (§9, test 22). No registry field tracks spawners.
- If probe item 1 fails (the entity id is lost on `place`), switch to the fallback in `L0-strf-d002` and record it in the deviation report. Bodies do not change.




- **node**: L0-strf-r010

### Rule: placed structures are ordinary world. Nothing is protected, nothing is restored. (L0-strf-r011)

# Rule: placed structures are ordinary world. Nothing is protected, nothing is restored.

**Links:** `part_of: ["L0-strf"]` · `is_a: ["rule"]`

- After `place`, `strf` never subscribes to block-break, container or explosion events for structure blocks, and never cancels them (§2, C-13).
- No code path writes blocks into a `done` instance's AABB again. The only re-placement is the `planned` resume (`L0-strf-p003`), which by definition happens before init.
- A broken chest drops its contents by vanilla rules (§2). A looted chest stays looted after a restart (§9, test 22).
- Guards killed stay dead (§9, test 58). Converted, cured villagers are ordinary (§9).
- No chat announcements when a structure appears (§8). Debug log only.




- **node**: L0-strf-r011

### Rule: every stable-API approximation is written in the deviation report (L0-strf-r012)

# Rule: every stable-API approximation is written in the deviation report

**Links:** `part_of: ["L0-strf"]` · `is_a: ["rule"]`

- File: `docs/structures/deviations.md`, checked in and owned by `strf`. Body components append their own entries in the same format (`L0-strf-e004`).
- An entry is **mandatory** whenever an implementation departs from a spec sentence because of a stable-API limit (preamble, §7, §11 DoD, §15, C-3).
- Entries known at analysis time, which must exist before the structures stage closes:
  1. Generation on first player discovery, not during terrain generation (pop-in, trees inside the footprint removed, pre-install chunks eligible) (`L0-adr-strc`).
  2. The vanilla-structure collision heuristic is incomplete (`L0-strf-r006`).
  3. Guard persistence comes from the name tag. Sun immunity comes from fire resistance, which may show fire visuals (per probe).
  4. Any failed probe item and its fallback (`L0-strf-p006`).
  5. `wrdn`: shrieker "natural" status. `loot`: vanilla-table invocation path.
- The stage's DoD check (`infr` gate) fails if a probe item is marked FAIL without a corresponding deviation entry.




- **node**: L0-strf-r012

### Rule: the Nether floor probe (a lava ocean is never a floor) (L0-strf-r013)

# Rule: the Nether floor probe (a lava ocean is never a floor)

**Links:** `part_of: ["L0-strf"]` · `is_a: ["rule"]`

- `getTopmostBlock` is **not** used in the Nether, because it returns the bedrock roof. For each sample column, scan **downward from Y = 110** to Y = 32 and find the first `air → solid` transition, where solid means non-liquid, not `bedrock`, and has a collision shape. That Y is the column's floor.
- A column is a **lava-ocean column** if the first non-air block below the scan start is `lava` at Y ≤ 32 (the Nether lava sea is at 31). One such column in the inner 60 % of the footprint rejects the candidate (§14.2, test 52).
- The candidate floor is the **median** floor Y. It is valid if ≥ 80 % of samples have a floor within ±3 of the median (`L0-xasm4` §3). The template sits on that Y. Netherrack or air inside the AABB is replaced by the template.
- The AABB must not reach Y ≥ 122 (`L0-strf-r003`).
- Every Nether biome is eligible (§14.2). Biome is not checked.




- **node**: L0-strf-r013

### Rule: one fixed Windmill template; only rotation varies (L0-wind-r001)

# Rule: one fixed Windmill template; only rotation varies

**Links:** `part_of: ["L0-wind"]` · `is_a: ["rule"]` · `relates_to: [L0-wind-e001, L0-adr-tmpl, L0-strf-r004, L0-strf-r011]`

**Source:** §2 bullets 2–3, §4.1, §4.4 ("процедурных вариантов поля нет"), §15.

1. There is exactly one Windmill template: building, rotor, plot, fields, paths, ditches, fence and decay are all baked in. No procedural fields, no variant buildings, no random decay at placement time.
2. The only per-instance variation is the seeded rotation 0/90/180/270, applied to the whole plot (`L0-strf-r004`).
3. Identity that must hold in every rotation: ~15×15 base, ~30 high; stone/cobble lower, wood upper, wooden roof; 4 fixed blades and one ordinary wooden door on the **same front face**; 3 full floors; one continuous interior staircase F1 → F3.
4. The normal route (door → F1 → stairs → F2 → F3 → every chest) needs no block breaking (§4.1). Alternative entry by breaking walls stays possible — nothing is protected (`L0-strf-r011`).
5. Allowed "ageing": fixed variants of stone/wood (mossy, cracked, stripped) inside the template, never removing route blocks (§4.2 last bullet).




- **node**: L0-wind-r001

### Rule: decay (vines, cobwebs) never blocks the door, the stairs or any chest (L0-wind-r002)

# Rule: decay (vines, cobwebs) never blocks the door, the stairs or any chest

**Links:** `part_of: ["L0-wind"]` · `is_a: ["rule"]` · `relates_to: [L0-wind-r001, L0-wind-e001, L0-wind-ac10]`

**Source:** §4.2, §4.4 bullet 4, test 21.

- Vines on part of the exterior walls and inside. Cobwebs in corners, under ceilings, near beams, **most visible on floor 3**. Fields near the building: a few cobwebs/vines.
- **Route cells** = a 1-wide, 2-high walkable path from outside the door through each floor and the stairs to the front face of each of the 25 chests. No cobweb, vine, or solid block may occupy a route cell, and each chest's lid cell (the block above the chest) must be air.
- Checked at build time: the template unit test runs a BFS over the NBT (cobweb = blocked, vine = passable but disallowed on route cells) from the outside door cell, and asserts all 25 chest-access cells and the top stair landing are reachable.
- Fields: cobwebs never on path cells between the fence gaps and the door.




- **node**: L0-wind-r002

### Rule: 25 chests (5/8/12), 3 floor spawners, and dark spawner zones (L0-wind-r003)

# Rule: 25 chests (5/8/12), 3 floor spawners, and dark spawner zones

**Links:** `part_of: ["L0-wind"]` · `is_a: ["rule"]` · `relates_to: [L0-strf-r010, L0-loot, L0-wind-e001, L0-wind-as06, L0-wind-as07]`

**Source:** §4.3, §2 spawner bullets, §3.3 last bullet, tests 16–18.

| Floor | Chests | Spawner mob | Intent |
|---|---|---|---|
| 1 | 5 | Zombie Villager (`zombie_villager_v2`) | entrance; free path to stairs |
| 2 | 8 | Zombie | middle floor |
| 3 | 12 | Vindicator **with an iron axe** | open storage/attic, full combat zone |

- All 25 chest positions and all 3 spawner positions are fixed in the template. Exactly 25 / 3 — no more, none elsewhere (single chests, not double, so counts are unambiguous).
- Every chest uses the one shared table and the 5–12 attempt algorithm (`L0-loot`). Floor never changes quality.
- Spawners are vanilla `mob_spawner` block entities from the template: infinite, proximity-activated, breakable, no block drop, vanilla XP, no script logic (`L0-strf-r010`).
- The Vindicator's iron axe comes from vanilla Vindicator equipment (`L0-wind-as06`). If the probe shows otherwise, it is a documented deviation, not script re-equipping of every Vindicator.
- **Lighting:** decorative and weak. Lanterns allowed per floor, but every spawnable cell within the spawner's range stays at block light ≤ `Lmax` (`L0-wind-as07`); checked by the template test from light-emitting block positions.




- **node**: L0-wind-r003

### Rule: exactly 10 field Zombie Villagers, once, persistent until death, sun-immune (L0-wind-r004)

# Rule: exactly 10 field Zombie Villagers, once, persistent until death, sun-immune

**Links:** `part_of: ["L0-wind"]` · `is_a: ["rule"]` · `relates_to: [L0-strf-r009, L0-strf-p004, L0-wind-e003, L0-wind-as08, L0-wind-as09]`

**Source:** §4.5, §6 bullet 2, §9 edge case 8, test 19.

Windmill-specific values on top of the generic guard rule (`L0-strf-r009`):
1. **Count:** exactly 10 per Windmill instance, spawn Windmill included; one per fixed `guardPoint` around the wheat fields.
2. **Once:** only during `looted → guarded`. The persisted state past `guarded` is the "initial guards spawned" flag; deaths never reset it.
3. **Persistent:** no despawn from distance, chunk unload or restart (name tag).
4. **Sun-immune:** permanent `fire_resistance` (no particles). They must not ignite or take fire damage in daylight.
5. **Free:** they wander and may leave through fence gaps; nothing leashes or returns them. The fence must not trap them (≥ 3 gaps).
6. **No top-up:** killing k of them leaves 10 − k forever, across restarts.
7. **Independent from the F1 spawner:** spawner Zombie Villagers are never counted, tagged or protected.
8. **Difficulty:** if the world is Peaceful when the step runs, the step is deferred, not skipped (`L0-wind-as08`).




- **node**: L0-wind-r004

### Rule: a cured field Zombie Villager becomes an ordinary Villager (L0-wind-r005)

# Rule: a cured field Zombie Villager becomes an ordinary Villager

**Links:** `part_of: ["L0-wind"]` · `is_a: ["rule"]` · `relates_to: [L0-wind-e003, L0-adr-strs, L0-strf-r009]`

**Source:** §4.5 bullet 6, §9 edge case 9, test 19.

- Curing uses the vanilla route only (Weakness + golden apple → conversion). The add-on adds no cure logic and blocks none.
- The result is a vanilla `minecraft:villager`. It has no `andrew:guard:*` tag and no `fire_resistance` from structure logic; it may despawn/die like any villager (villagers do not burn anyway).
- No script ever turns it back into a Zombie Villager or re-applies guard properties. If a zombie later infects it again, that is vanilla behaviour and the new Zombie Villager is ordinary (burns in sun, no tag).
- A carried-over name tag, if the probe shows one, is acceptable; clearing it is optional and recorded as a deviation (`L0-strf-r009`).




- **node**: L0-wind-r005

### Rule: normal generation — 1 %, dry flat land only, cancel instead of fix (L0-wind-r006)

# Rule: normal generation — 1 %, dry flat land only, cancel instead of fix

**Links:** `part_of: ["L0-wind"]` · `is_a: ["rule"]` · `relates_to: [L0-strf-r002, L0-strf-r005, L0-strf-r006, L0-wind-p001]`

**Source:** §4.6, §2 last bullet, §9 edge cases 2 and 4, test 23.

- Chance 1 % per suitable Overworld land chunk. Ocean / fully-water chunks are not suitable.
- After a successful roll, the whole rotated ~35×35 plot must be naturally flat enough (`flat`, Δ ≤ 3) and dry (`dryLand`, liquid ≤ 5 %).
- Invalid → the candidate is **cancelled**. It is never moved to another chunk and the terrain is never levelled, cut or filled by script (forced prep is exclusive to the spawn Windmill, `L0-wind-r008`).
- Overlap with a registry instance, a detected vanilla structure or any spawner → cancelled; nothing is damaged (`L0-strf-r006`).
- At most one Windmill per candidate chunk.




- **node**: L0-wind-r006

### Rule: spawn Windmill search order — 5×5 chunks, then nearest ≤ 500 blocks, then forced prep (L0-wind-r007)

# Rule: spawn Windmill search order — 5×5 chunks, then nearest ≤ 500 blocks, then forced prep

**Links:** `part_of: ["L0-wind"]` · `is_a: ["rule"]` · `relates_to: [L0-wind-p002, L0-wind-p003, L0-wind-as01, L0-wind-as02, L0-wind-cx01]`

**Source:** §4.7 items 6–9, §9 edge case 1, §12 bullet 2, test 14.

1. **Mandatory.** Exactly one spawn Windmill per new world, 100 % (the old 50 % is cancelled, §4.7.6).
2. **Stage 1:** a naturally valid site (normal validity rules) inside the 5×5-chunk square centred on the world-spawn chunk (`L0-wind-as01`). Among valid sites, the one nearest to spawn.
3. **Stage 2:** only if stage 1 has none. Search outward and take the **nearest** naturally valid site, never farther than 500 blocks from world spawn (`L0-wind-as02`).
4. **Stage 3:** only if stages 1–2 have none. Take the best **dry-land** position within 500 blocks and force-prepare it (`L0-wind-p003`).
5. A stage is never skipped: a forced-prep site is never chosen while a natural site exists within 500 blocks, even a farther one.
6. Collision rules are identical to normal generation. Unlike a normal candidate, a colliding spawn candidate is not "cancelled" — the search moves on to the next position (§6 last bullet).
7. No dry position at all → undefined by spec (`L0-wind-cx01`).




- **node**: L0-wind-r007

### Rule: forced preparation touches natural blocks only, and aborts before touching a structure or spawner (L0-wind-r008)

# Rule: forced preparation touches natural blocks only, and aborts before touching a structure or spawner

**Links:** `part_of: ["L0-wind"]` · `is_a: ["rule"]` · `relates_to: [L0-wind-p003, L0-strf-r006, L0-strf-r005, L0-wind-as10]`

**Source:** §4.7 item 10, §6 last bullet, §9 edge case 4, C-12.

- Only the spawn Windmill (stage 3) may prepare terrain. Normal Windmills and every other structure never do.
- **May replace / remove:** natural terrain and vegetation — dirt family, grass, sand, gravel, clay, stone family (stone, granite, diorite, andesite, deepslate, tuff, calcite), ores, snow/ice, logs, leaves, plants, flowers, mushrooms, vines, water, lava, and air.
- **Must never replace:** any block of a detected structure (collision signature), any `mob_spawner` / `trial_spawner`, and — as the safe reading of "natural" — any block not on the whitelist above (planks, cobblestone, glass, chests, beds, rails, crafted blocks…). Such a block anywhere in the plot + blend band + fill volume **rejects the whole position before any write**; the search takes the next candidate.
- The pre-check covers the exact volume the plan will write, including the blend band (`L0-wind-r009`) and the fill (`L0-wind-r010`), so edge smoothing cannot cut into a neighbouring structure.
- Liquids at the plot edge are sealed with natural blocks so no flow enters the plot.




- **node**: L0-wind-r008

### Rule: level the ~35×35 plot and blend its edges — no square platform with vertical walls (L0-wind-r009)

# Rule: level the ~35×35 plot and blend its edges — no square platform with vertical walls

**Links:** `part_of: ["L0-wind"]` · `is_a: ["rule"]` · `relates_to: [L0-wind-p003, L0-wind-e004, L0-wind-as03]`

**Source:** §4.7 item 11, §9 edge case 2, §12 bullet 2.

- The 35×35 plot is levelled to one target Y (the median natural surface).
- Around it, a **blend band** of width `B` (`L0-wind-as03`) interpolates from the target Y to the untouched natural surface.
- After prep, for every pair of horizontally adjacent columns in plot + band: `|Δy| ≤ 1`, except where the natural terrain outside the band already had larger steps.
- Band surfaces reuse the local surface block family (grass on grass, sand on sand), so the seam is not a visible colour ring.
- If Δ between target Y and natural terrain exceeds what `B` can absorb at slope 1, the candidate's score is penalised; the search prefers another site. If it is still chosen, the band grows (up to `Bmax`) rather than leaving a wall.




- **node**: L0-wind-r009

### Rule: fill only shallow voids directly under the plot; never fill a deep cave or ravine (L0-wind-r010)

# Rule: fill only shallow voids directly under the plot; never fill a deep cave or ravine

**Links:** `part_of: ["L0-wind"]` · `is_a: ["rule"]` · `relates_to: [L0-wind-p003, L0-wind-e004, L0-wind-as04]`

**Source:** §4.7 item 12, §9 edge case 3, §12 bullet 2.

- Fill is allowed only for air/liquid cells that are within `D` blocks below the target surface (`L0-wind-as04`) **and** under a cell where a template block or field block would otherwise have no support.
- A cave or ravine whose open volume extends deeper than `D` is left open below depth `D`: the fill makes a `D`-thick natural cap over it, not a plug down to the floor.
- Fill material: dirt under grass/farmland, stone below 3 blocks.
- The template's own foundation layer counts as support; the fill only closes gaps under it.
- A test world with a cave under the chosen site must still contain open cave volume below the cap after prep.




- **node**: L0-wind-r010

### Rule: the spawn search runs once per world and never repeats after a restart (L0-wind-r011)

# Rule: the spawn search runs once per world and never repeats after a restart

**Links:** `part_of: ["L0-wind"]` · `is_a: ["rule"]` · `relates_to: [L0-wind-e002, L0-strf-r008, L0-wind-p002]`

**Source:** §4.7 item 13, §7 bullet 3, §11 DoD 2, C-6, C-7.

- The search state and outcome live in `andrew:st:spawnWindmill` (`L0-wind-e002`).
- A non-terminal status resumes from its cursor; it never restarts from stage 1 in a way that could pick a second site (the chosen origin is persisted before placement; the registry id `windmill:S` is unique).
- A terminal status (`done`, `failed`) is never re-run: not after restarts, not if the Windmill is destroyed by players, not if world spawn moves.
- Existing-world install: the record is absent, so the search runs once, with the same rules (`L0-wind-as10`).




- **node**: L0-wind-r011

### Rule: every Windmill triggers exactly one linked-Airship attempt (L0-wind-r012)

# Rule: every Windmill triggers exactly one linked-Airship attempt

**Links:** `part_of: ["L0-wind"]` · `is_a: ["rule"]` · `relates_to: [L0-airs, L0-strf-r002, L0-wind-p004, L0-wind-cx02]`

**Source:** §5.6, §7 bullet 4, test 33.

- Every Windmill instance — normal and spawn — requests one linked Airship from `airs` in its `afterInit` hook, after chests and guards.
- **Once:** the attempt is recorded in `InstanceRecord.x.linkedTried` with its outcome. It is never repeated, whether it placed an Airship or found no valid site.
- **Not satisfied by others:** an independent 2 % Airship already within 100 blocks does not count; two nearby Windmills each request their own; linked Airships are not merged or deduplicated.
- `wind` passes only the parent (id, centre, plot AABB). Ring 40–100 blocks from the Windmill centre, "not over the Windmill/fields", validity, altitude, and "no widening beyond 100" belong to `airs`.
- The linked attempt does not consume any chunk's independent Airship roll (`L0-strf-r002` §6).




- **node**: L0-wind-r012

### Rule: the spawn search completes before normal discovery may place anything near spawn (L0-wind-r013)

# Rule: the spawn search completes before normal discovery may place anything near spawn

**Links:** `part_of: ["L0-wind"]` · `is_a: ["rule"]` · `relates_to: [L0-strf-p001, L0-wind-p002, L0-wind-ad01]`

**Source:** derived from §4.7 (guarantee, nearest site) + §2/§6 (no overlaps, existing structures win).

- While `andrew:st:spawnWindmill.status` is non-terminal, the `strf` worker leaves Overworld chunks within 548 blocks of spawn (500 + plot half-diagonal) un-evaluated (not rolled, evaluated bit not set). They are processed normally once the status is terminal.
- Reason: otherwise a 5 % Warden City or 2 % Airship rolled in the first seconds could occupy the best spawn site and push the guaranteed Windmill farther or into forced prep.
- Once placed, the spawn Windmill is a registry instance; later normal candidates that overlap it are cancelled.
- Gate is in-memory + derived from the persisted status, so it survives restarts.




- **node**: L0-wind-r013

### Wrdn rul1 concept rule (L0-wrdn-rul1)

**Rule — Generation eligibility & candidate resolution**

- Dimension: Overworld only.
- Candidate chance: 5% per suitable chunk.
- If the 5% roll succeeds but the site is unsuitable, the candidate is **cancelled outright** — it is never relocated to a neighboring chunk.
- The structure never generates where the surface point directly above it is ocean, river, or another large body of water; that surface point must be land.
- The structure's top sits at a random Y within **−35…−45**, chosen independently per instance (not tied to the candidate roll).
- A candidate is cancelled if it physically intersects any already-detected vanilla or custom structure, including a real Ancient City. Existing structures are never damaged to make room for Mini Warden City.

Rationale: identical discovery contract to the other three structures (Windmill, Airship, Mini Bastion) so the shared per-chunk candidate mechanism (§15) can be reused; "cancel without relocation" keeps candidate resolution O(1) per chunk instead of a search.




- **node**: L0-wrdn-rul1

### Wrdn rul2 concept rule (L0-wrdn-rul2)

**Rule — Fixed template, orientation & atmosphere**

- One fixed design only; footprint ≈30×30 blocks, height ≈10–15 blocks. The outline may be irregular within that fixed template.
- Random rotation of 0°/90°/180°/270° applied at generation (same convention as all four structures, §15).
- Visual palette must clearly read as Ancient City: deepslate architecture, Sculk, Sculk Veins, Sculk Sensors, Sculk Shriekers, and suitable vanilla decorative elements — this is a compact original build in that style, not a shrunken block-for-block copy of the real structure.
- The structure is almost entirely dark. Only a small, fixed number of Soul Lanterns/Soul Torches are allowed, placed mainly near passages and the central zone. Lighting must never be enough to undercut the dark/oppressive atmosphere.

Rationale: keeps the build recognizably "Ancient-City-flavored" while remaining a bespoke, size-bounded template that fits the shared rotation/placement pipeline.




- **node**: L0-wrdn-rul2

### Wrdn rul3 concept rule (L0-wrdn-rul3)

**Rule — Surface sculk marker alignment**

- An irregular ~5×5 patch of Sculk/Sculk Vein is generated directly above the city's center, on the actual world surface.
- The marker is a locator only: it must never form a ready-made mineshaft, ladder, or vertical tunnel.
- The city's interior geometry and the marker's placement must be co-designed (and must rotate together with the template) so that a player who starts digging straight down from the marker's center is **guaranteed** to break into the structure.
- The marker may only be placed on valid land, and it must never be used as justification to destroy another generated structure that happens to be nearby.

Rationale: gives players a reliable, lightly-telegraphed way to find the buried city without literally handing them a tunnel — mirrors how real Ancient Cities are locatable via generated terrain cues.




- **node**: L0-wrdn-rul3

### Wrdn rul4 concept rule (L0-wrdn-rul4)

**Rule — Central hall & monument**

- A visually distinct central hall exists, echoing the core of a real Ancient City.
- It contains a purely decorative Reinforced Deepslate monument/frame, ≈5 blocks wide × 6–7 blocks tall.
- The monument has **no** functionality: it never activates, is not a portal, and never teleports the player.
- Exactly 3 of the structure's 10 chests are located in the central zone.
- One of the two natural Sculk Shriekers is positioned near the central hall/monument; the other is elsewhere (see `L0-wrdn-rul5`).

Rationale: gives the structure a recognizable "payoff" landmark without introducing any new mechanic (no custom portal/teleport logic to build or test).




- **node**: L0-wrdn-rul4

### Wrdn rul5 concept rule (L0-wrdn-rul5)

**Rule — Sculk Shriekers & Warden behavior**

- Exactly 2 Sculk Shriekers exist, at fixed positions: one near the central hall/monument, one in a far part of the city.
- Both must behave exactly like naturally-generated vanilla Sculk Shriekers and participate in the ordinary warning/Warden-summon mechanic, as closely as stable Bedrock APIs allow.
- **No Warden is pre-created** and none is a permanent guardian of the structure. A Warden can only appear through the normal Shrieker mechanic (i.e., a player triggering enough warnings near an active Shrieker).
- Sculk Sensors, Sculk Veins, and other suitable sculk elements are placed throughout the structure in the fixed template. Sensors may appear noticeably more often than the 2 Shriekers.

Rationale: the Warden threat must feel earned via normal vanilla mechanics rather than being a scripted ambush, and must not require any custom mob-AI or spawner code.




- **node**: L0-wrdn-rul5

### Wrdn rul6 concept rule (L0-wrdn-rul6)

**Rule — Chests & loot**

- Exactly 10 chests at fixed positions: 3 in the central zone + 7 distributed across ruins, niches, side rooms and branches, such that a player must explore nearly the entire city to find them all.
- All 10 chests use the **real vanilla Ancient City loot table**, unmodified — same categories, quantities and rarities, including the possibility of Enchanted Golden Apple and Swift Sneak.
- The shared custom weighted loot system used by Windmill/Airship (spec §3) does **NOT** apply to Mini Warden City (§15, explicit exclusion).
- Each chest's contents are generated exactly once and never refill — not after opening, not after chunk unload, not after a server restart.

Rationale (§15): Windmill/Airship are original builds that need an original loot system; Mini Warden City is explicitly meant to feel like the real Ancient City, so it reuses that loot table verbatim instead of the add-on's own weighted categories.




- **node**: L0-wrdn-rul6

### Wrdn rul7 concept rule (L0-wrdn-rul7)

**Rule — Persistence & idempotency**

- Once generated, every block of Mini Warden City is an ordinary world block, changeable by the player under the normal vanilla rules for that block type.
- Destroyed or altered parts of the structure never regenerate.
- Initialization must be idempotent: reloading the chunk/world must never create a second set of chests, Shriekers, Sensors, or surface marker for the same city instance.

Rationale: matches the shared four-structure persistence contract (§15 — none of the four regenerate loot/blocks/one-time mobs after restart) and the project-wide single-durable-registry expectation for generated content.




- **node**: L0-wrdn-rul7


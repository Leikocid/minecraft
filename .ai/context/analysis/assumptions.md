---
title: Assumptions
type: analysis
generated_at: "2026-09-26T08:34:28.650Z"
source_channel: rollout
node_id: rollout-assumptions
aliases: ["rollout-assumptions","assumptions"]
is_a: ["rollout","assumptions"]
relates_to: ["L0-airs-as01","L0-airs-as02","L0-bast-as01","L0-bast-as02","L0-bast-as03","L0-infr-as01","L0-infr-as02","L0-infr-as03","L0-infr-as04","L0-infr-as05","L0-loot-asm1","L0-loot-asm2","L0-loot-asm3","L0-scyt-as03","L0-strf-as01","L0-strf-as02","L0-strf-as03","L0-strf-as04","L0-strf-as05","L0-strf-as06","L0-wind-as01","L0-wind-as02","L0-wind-as03","L0-wind-as04","L0-wind-as05","L0-wind-as06","L0-wind-as07","L0-wind-as08","L0-wind-as09","L0-wind-as10","L0-wind-as11","L0-wind-as12","L0-wrdn-as01","L0-wrdn-as02","L0-xasm5"]
priority: 530
---

# Assumptions (CAN_ASSUME)

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

### Assumption (CAN_ASSUME) — the Airship's two doors sit on the short ends of the long axis (L0-airs-as01)

# Assumption (CAN_ASSUME) — the Airship's two doors sit on the short ends of the long axis

**Gap.** §5.2 says only "две обычные двери на противоположных сторонах" — opposite sides, without saying which axis (the 15-block long sides or the 7-block short ends).

**Assumption.** Doors sit on the two short ends (the 7-block-wide faces), i.e. at the bow and stern of the elongated-oval gondola, consistent with "вытянутый овальный объём" (an elongated oval reads lengthwise, so entry naturally sits at the ends, and this keeps both doors clear of the 4 rooms/corridor's long side walls where chest and lamp geometry is denser).

**Impact if wrong.** Purely a template-geometry choice for `infr`'s builder (`L0-adr-tmpl`). It does not change chest count, chest positions relative to rooms, the spawner position, or any generation/collision/altitude rule. If the client meant the long sides, only the door local points (and the `rotateLocal` inputs derived from them) need to move; no other artifact in this deep-dive depends on the axis chosen.






### Assumption (CAN_ASSUME) — the 40–100 ring is sampled at several seeded angles/radii, not a single point (L0-airs-as02)

# Assumption (CAN_ASSUME) — the 40–100 ring is sampled at several seeded angles/radii, not a single point

**Gap.** §5.6 fixes the ring's inner and outer radius (40, 100) but never says how many candidate positions are tried inside it, or in what order, before giving up.

**Assumption.** `strf.searchRing` samples a deterministic, seeded sequence of points across the annulus — e.g. a fixed number of angles (8–16) crossed with a small number of radii between 40 and 100 — and validates them in that fixed order, stopping at the first `valid` result (mirrors the discovery roll's determinism, `L0-strf-r001`). This gives every Windmill instance a real chance at a linked Airship without an unbounded or non-deterministic search.

**Impact if wrong.** Only the practical *success rate* and *distribution* of linked Airships around Windmills changes (denser or sparser sampling), not any pass/fail rule in this deep-dive. Test 33 (linked attempt happens regardless of a nearby independent Airship) passes under any reasonable sampling density, since it only checks that the attempt is *made*, not how many candidates were probed. If the client wants an exhaustive scan of the annulus instead, `airs.tryLinked` and `L0-airs-e002` are the only call sites that would need to change.






### Bast as01 concept assumption (L0-bast-as01)

**ASM-bast-01 — "Suitable chunk" for the 5% Nether roll** `CAN_ASSUME`

The spec's "подходящий Nether-чанк" (suitable Nether chunk) is not formally defined beyond "not a lava ocean, needs solid support." Assume: a chunk is suitable when its surface/support area can host the ~20×20 footprint on solid, non-lava-ocean terrain without requiring artificial leveling — unlike the Windmill spawn-area rule, which explicitly allows site preparation; Mini Bastion has no such fallback.

**Impact if wrong:** If suitability is defined too loosely, bastions could generate partially clipped into terrain or floating over voids. If too strict, the effective generation rate drops well below the nominal 5%, which would fail AC-bast-01's statistical test.

**Source:** §14.2 (silent on the exact suitability algorithm).






### Bast as02 concept assumption (L0-bast-as02)

**ASM-bast-02 — Loot tables are invoked as real vanilla references, not reimplemented** `CAN_ASSUME`

Assume "real vanilla Bastion Remnant treasure/regular loot table" means calling the actual vanilla loot table identifiers/behavior via the Script API (e.g. a `LootTable` reference or fill-container-with-loot pathway) rather than hand-authoring a lookalike table.

**Impact if wrong:** A hand-authored approximation could silently drift from vanilla drop rates/categories (e.g. missing rare items), breaking the "genuine vanilla loot" intent of §14.4 without being caught by casual testing.

**Source:** §14.4 (names the tables but not the implementation mechanism).






### Bast as03 concept assumption (L0-bast-as03)

**ASM-bast-03 — Idempotency is implemented via a stored per-instance flag** `CAN_ASSUME`

The spec requires idempotent initialization but does not name a mechanism. Assume each Mini Bastion instance persists an initialization marker (e.g. a dynamic property or block/entity tag scoped to that instance) that P-bast-002 checks before populating chests/gold/guards.

**Impact if wrong:** Without a reliable per-instance marker, chunk reloads could either duplicate chests/gold/guards (breaking AC-bast-05/06/07 and the persistence contract) or, if the marker logic is inverted, never populate the bastion at all.

**Source:** §14.6 (states the idempotency requirement, not the mechanism).






### Assumption: the GameTest harness is not one of Stage 0's five closing criteria (L0-infr-as01)

# Assumption: the GameTest harness is not one of Stage 0's five closing criteria

**Links:** `part_of: ["L0-infr"]` · `is_a: ["assumption"]` · `relates_to: ["L0-infr-ac06"]`

**Assumed**: `npm run bds:gametest` is an additional verification lane layered on top of Stage 0, not a hard gate for Stage 0 itself. The original `stage-0-infrastructure.md` (2026-09-20) lists exactly 5 closing criteria — build, JSON validation, BDS-in-Docker load, iPad checks, first git commit — and does not mention GameTest or SimulatedPlayer at all. The GameTest harness (`scripts/bds-gametest.mjs`, `decision-q-012`) was introduced later (2026-09-21) as a lane for Stage 1 (Miner's Pickaxe behavior) and Stage 2 (legendary-weapon multiplayer proof).

**Impact if wrong**: if GameTest is actually meant to gate Stage 0's "done" status, then Stage 0 is not closed by `build` + `validate` + `bds:check` alone, and AC06 (`L0-infr-ac06`) would need to move from "additional lane" to "Stage-0 blocking criterion" in the rollups.






### Assumption: verification runs locally, not in hosted CI (L0-infr-as02)

# Assumption: verification runs locally, not in hosted CI

**Links:** `part_of: ["L0-infr"]` · `is_a: ["assumption"]`

**Assumed**: no CI/CD pipeline automates `build`/`bds:check`/`bds:gametest` on push; these commands are run manually by the developer, or by the ai-kit autopilot task loop, on the Mac mini itself. No `.github/workflows` or equivalent was found in the repo listing reviewed for this deep-dive, and the `bds` channel's design assumes local, macOS-specific facts that a typical hosted runner wouldn't have: Docker Desktop already running (`assertDockerRunning` just checks, never installs, Docker), `en0`/`en1` LAN interfaces for `detectLanIp()`, and Apple Silicon + Rosetta for the image's `linux/amd64` platform pin.

**Impact if wrong**: if a hosted CI runner is later introduced, `bds:up`'s LAN-IP detection and the iPad-facing address it prints become meaningless there (no iPad can reach a CI runner's network), and `assertDockerRunning`'s guidance ("start Docker Desktop") would need a CI-specific branch.






### Assumption (CAN_ASSUME) — statistical chunk-roll check sample size and tolerance are infra's to pick (L0-infr-as03)

# Assumption (CAN_ASSUME) — statistical chunk-roll check sample size and tolerance are infra's to pick

**Links:** `part_of: ["L0-infr"]` · `is_a: ["assumption"]` · `relates_to: ["L0-infr-p006", "L0-infr-r006", "L0-xq2"]`

**Gap**: no raw source specifies how many synthetic chunk samples the statistical check should draw, or what deviation from the configured rate (1 %/2 %/5 %) counts as a pass. `L0-xq2` even leaves the rate constants themselves open to a pending client answer.

**Assumed**: infra picks a sample size and tolerance band per structure at implementation time (e.g. large enough that a binomial confidence interval around the configured rate is narrow relative to the gap between adjacent structures' rates — 1 % vs 2 % vs 5 %), driven directly through `strf`'s own roll function rather than a reimplementation (`L0-infr-r006`).

**Impact if wrong**: too small a sample/tight a tolerance → the check flakes on a correct implementation and blocks autopilot merges on noise; too loose → it never catches a broken roll (wrong constant, biased hash). If `L0-xq2`'s answer changes the rate constants, this check's expected values move with them — it must read the constants from `strf`'s config table, never hardcode them.






### Assumption (CAN_ASSUME) — \ (L0-infr-as04)

# Assumption (CAN_ASSUME) — "restart" for the idempotency check means a same-volume server restart, not `bds:down`/`bds:up`

**Links:** `part_of: ["L0-infr"]` · `is_a: ["assumption"]` · `relates_to: ["L0-infr-p007", "L0-adr-strs"]`

**Gap**: no ADR specifies how the restart/idempotency check restarts BDS. The existing `bds:check`/`bds:up` flow re-stages the data directory fresh on every run (`L0-infr-p002`), which would erase the very world state the idempotency check needs to survive a restart.

**Assumed**: the check restarts the *server process* while keeping the same `data/` volume/world (e.g. `docker compose restart`, or stopping and restarting the container without re-staging) — distinct from `bds:down` + `bds:up`, which intentionally resets to a clean world.

**Impact if wrong**: if the intended check is actually "reinstall the add-on into a fresh world and confirm first-init still runs exactly once" rather than "survive a mid-lifetime restart," the check needs `bds:up`'s re-stage semantics instead, and both scenarios (fresh-install idempotency vs. restart idempotency) may be needed, not just one.






### Assumption (CAN_ASSUME) — structure template source files live under `src/structures/templates/` (L0-infr-as05)

# Assumption (CAN_ASSUME) — structure template source files live under `src/structures/templates/`

**Links:** `part_of: ["L0-infr"]` · `is_a: ["assumption"]` · `relates_to: ["L0-adr-tmpl", "L0-infr-e005", "L0-infr-p005"]`

**Gap**: `L0-adr-tmpl` says the four templates are "layered block palettes or builder functions in TS/JSON" but does not fix a directory. Stage 0's fixed layout rule (`L0-infr-r003`) predates structures entirely.

**Assumed**: sources live under `src/structures/templates/` (one module per structure), following the existing per-feature convention of `src/legendary/`, `src/websword/`, etc., read by `scripts/build-structures.mjs` at build time.

**Impact if wrong**: purely a path/naming detail — `L0-infr-r003`'s fixed-layout table would need one more row, and `build-structures.mjs`'s import paths would move; no behavioral consequence.






### Loot asm1 concept assumption (L0-loot-asm1)

**Assumption (CAN_ASSUME):** The spec says Golden Apple succeeds "at most once per chest" but doesn't say what happens when the weighted roll lands on Golden Apple again after it has already succeeded once. This deep-dive assumes either behavior is acceptable: (a) drop Golden Apple from the pool and renormalize remaining weights for that attempt, or (b) leave the pool unchanged and treat a repeat Golden Apple roll as a no-op/wasted attempt. Recommendation: (a), since it avoids attempts silently producing nothing, which could otherwise skew statistical tests that expect ~N items per chest.

**Impact if wrong:** if a statistical AC (`L0-loot-ac01`/`L0-loot-ac06`) is later written expecting a specific one of the two behaviors (e.g. counting non-empty attempts), the wrong choice could fail that test even though both are spec-compliant. Low blast radius — single-function fix.






### Loot asm2 concept assumption (L0-loot-asm2)

**Assumption (CAN_ASSUME):** `L0-loot-p002` assumes the stable mechanism for applying a vanilla loot table to a chest is `Dimension.runCommand("loot insert <pos> loot <tableId> ...")` (or an equivalent `Entity`/`Dimension` command call), since the stable `@minecraft/server` Script API (pinned 2.10.0 per `constraints.md`) has no direct "fill container from loot table" method. This is exactly the open probe question the `strf` component owes per the L0 decomposition plan v2 reduce section ("is `/loot insert` with vanilla chest tables available through `runCommand`").

**Impact if wrong:** if the probe finds `/loot insert` unavailable or behaves differently on 1.26.51.1, `L0-loot-p002`'s only step needs a different stable-API mechanism — this would not change `L0-loot-r006`/`r007`/the entities, only the process's step 2. Medium impact, contained to one process artifact.






### Loot asm3 concept assumption (L0-loot-asm3)

**Assumption (CAN_ASSUME):** "Compatible vanilla enchantments" (`L0-loot-r005`) is assumed to mean whatever the stable `@minecraft/server` enchantment API itself considers valid for that item (e.g. `ItemEnchantableComponent`/`EnchantmentTypes` rejecting an incompatible pairing), rather than this add-on hand-maintaining its own per-item compatibility matrix. Curses are filtered out explicitly by category before rolling, since the API itself won't refuse a curse as "incompatible" (curses are compatible with anything item-wise, just excluded by this spec).

**Impact if wrong:** if the stable API doesn't expose a compatibility check (only an apply-or-throw), the implementation needs a hand-maintained compatibility table instead — a larger but localized change to `L0-loot-p001` step 2c.






### ASM-scyt-03 — Netherite-sword parity is `minecraft:damage: 8` `CAN_ASSUME` (L0-scyt-as03)

# ASM-scyt-03 — Netherite-sword parity is `minecraft:damage: 8` `CAN_ASSUME`

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["assumption"]` · `relates_to: ["L0-scyt-r009", "L0-scyt-ac15"]`

**Assumed:** the shipped Web Sword uses `minecraft:damage: 7` to match a Diamond Sword (Web Sword §7 was accepted in Stage 2). Vanilla Netherite is one point above Diamond, so the Scythe uses `8`.

**Basis:** `packs/behavior/items/web_sword.json` (read 2026-09-24), plus the vanilla diamond → netherite step of +1.

**Impact if wrong:** a one-number change in the item JSON. AC-scyt-15's BDS comparison against a real netherite sword catches it.






### Assumption (CAN_ASSUME) — Where the candidate footprint sits relative to its chunk (L0-strf-as01)

# Assumption (CAN_ASSUME) — Where the candidate footprint sits relative to its chunk

**Gap.** The spec gives a chance "per chunk", but the Windmill (35×35), Warden City (30×30) and Bastion (20×20) are larger than a chunk. It never says where the footprint lies.

**Assumption.** The **centre** of the rotated footprint is at the centre of the rolled chunk (`cx*16+8`, `cz*16+8`), with no jitter. The origin is `centre − floor(size'/2)`. The footprint therefore spills into neighbouring chunks symmetrically. Two adjacent positive rolls for large structures always collide, and the later one in discovery order is cancelled.

**Impact if wrong.** It lowers the effective density of large structures at 5 % (see `L0-xq2`). Structures are aligned to a visible chunk grid. Adding seeded jitter (±4) later is a one-line change, and existing worlds are unaffected because placed records store the origin.






### Assumption (CAN_ASSUME) — What counts as a \ (L0-strf-as02)

# Assumption (CAN_ASSUME) — What counts as a "significant part" of the footprint over water

**Gap.** §5.4: "Если значимая часть footprint находится над открытой водой, позиция непригодна". No number is given.

**Assumption.** For the Airship, more than 10 % of the footprint's surface samples being liquid makes the site invalid. The Windmill uses 5 % (`L0-xasm4` §4), because it sits on the ground and its fields need dry soil. Warden City: 0 % at the centre and the 8-point ring (`L0-xasm4` §5). All three are constants in the def table.

**Impact if wrong.** At 10 %, an Airship may hover over a small pond or a stream edge. If the client means "any water", set it to 0. Airship density along rivers drops slightly. Test 31 still passes either way because it uses open ocean or river.






### Assumption (CAN_ASSUME) — How loaded chunks are detected, and the discovery radius (L0-strf-as03)

# Assumption (CAN_ASSUME) — How loaded chunks are detected, and the discovery radius

**Gap.** C-12 requires that nothing is written into unloaded chunks. It is unverified whether `Dimension.isChunkLoaded` exists in `@minecraft/server` 2.10.0 stable, and what `getBlock` does out of range.

**Assumption.** One of the following holds: `isChunkLoaded(location)` is present, **or** `getBlock` returns `undefined` or throws `LocationInUnloadedChunkError` for unloaded chunks. `strf` wraps both behind `isLoaded(dim, cx, cz)`. The discovery radius `R_DISCOVER = 4` chunks, which is inside BDS's default simulation/ticking distance, so footprints around a player are normally loaded. Candidates that reach beyond it go `pending`.

**Impact if wrong.** If neither method is reliable, placement could throw mid-job and leave a `planned` record, which is safe but noisy. The fallback is placing only candidates whose AABB lies entirely within 3 chunks of some player. Probe item 9 settles it.






### Assumption (CAN_ASSUME) — Guard persistence and sun immunity with stable tools (L0-strf-as04)

# Assumption (CAN_ASSUME) — Guard persistence and sun immunity with stable tools

**Gap.** `L0-adr-strs` relies on a name tag to stop despawning and on infinite `fire_resistance` for sun immunity. The script `addEffect` duration is bounded (not infinite), and whether a *script-set* `nameTag` blocks despawn the same way a name-tag item does is unverified on BDS 1.26.51.

**Assumption.**
1. A script-set non-empty `nameTag` makes the mob persistent, as an item-applied name does.
2. `runCommand("effect @s fire_resistance infinite 0 true")` is stable, applies an infinite hidden effect, and survives restart. Fire resistance prevents sun damage; the mob may still show the burning animation, and that visual is a deviation.
3. Curing produces a new `minecraft:villager` without the effect.

**Impact if wrong.** (1) Guards vanish and test 19 fails. Fallback: re-apply persistence via a component group defined in a behavior-pack *entity event* on our own identifier, which the spec forbids (vanilla curing), or accept and document. (2) Guards burn at noon. Fallback: a helmet in the head slot via `EntityEquippableComponent`, if stable for mobs, which vanilla sun logic respects. Probe items 5–6.






### Assumption (CAN_ASSUME) — Dynamic-property budget (L0-strf-as05)

# Assumption (CAN_ASSUME) — Dynamic-property budget

**Gap.** World dynamic properties have per-key and total size limits that the spec and code do not record for 2.10.0.

**Assumption.** One string property holds at least 32 000 characters. The total world dynamic-property storage is large enough for ~1 000 region shards of ≤ 10 KB, which covers a 1 000 × 1 000-chunk explored area per dimension. The registry only grows with explored area, not with time.

**Impact if wrong.** If the per-key limit is much smaller (e.g. 4 KB), shards split more (overflow keys, `L0-strf-e002`). If the total is capped, very large worlds stop generating new structures once the cap is near. The fail-safe is to stop generating rather than lose records, and to log it. Probe item 8 measures both limits.






### Assumption (CAN_ASSUME) — `structureManager.place` rotation keeps the given location as the min corner (L0-strf-as06)

# Assumption (CAN_ASSUME) — `structureManager.place` rotation keeps the given location as the min corner

**Gap.** Whether Bedrock rotates a placed structure *within* its bounding box, with `location` staying the min corner of the rotated box, or around the origin block, is not documented in the KV.

**Assumption.** Rotation happens inside the bounding box. The placed blocks occupy `[loc, loc + rotatedSize − 1]`, as `/structure load … 90_degrees` does. `rotateLocal` is written for that convention.

**Impact if wrong.** Every chest, guard and marker point would be offset for 90/180/270. `rotateLocal` gets a per-rotation offset correction taken from probe item 2 and AC-strf-02. Bodies are unaffected because they only call `rotateLocal`.






### Assumption — \ (L0-wind-as01)

# Assumption — "within 5×5 chunks" means the plot centre lies in the 5×5-chunk square around the spawn chunk

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-r007, L0-wind-p002, L0-wind-ac01]`

- The square is the spawn chunk ±2 chunks (80×80 blocks). A 35×35 plot whose centre is inside it counts, even if its edge reaches into ring 3.
- Rationale: requiring the whole plot inside would leave only ~45×45 possible centres and make stage 1 fail more often for no gameplay benefit.
- **Impact if wrong:** low. If the client means "whole plot inside", stage 1 candidate generation shrinks; test 14's area check tightens. One constant.






### Assumption — \ (L0-wind-as02)

# Assumption — "≤ 500 blocks" and "nearest" use horizontal Euclidean distance from world spawn (x,z) to the plot centre

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-r007, L0-wind-p002]`

- `d = hypot(cx − sx, cz − sz)`, Y ignored. World spawn = `world.getDefaultSpawnLocation()` x/z at first start (its Y may be a sentinel on a fresh world; it is not used).
- **Impact if wrong:** low. Chebyshev (square) distance would allow corners up to ~707 blocks; switching is one function.






### Assumption — blend band B = 6 blocks (grows to Bmax = 12), slope ≤ 1 block per block (L0-wind-as03)

# Assumption — blend band B = 6 blocks (grows to Bmax = 12), slope ≤ 1 block per block

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-r009, L0-wind-e004, L0-wind-p003]`

- The spec only says "плавно соединять края … избегая грубой квадратной платформы с вертикальными стенами". Numbers are ours.
- B = 6 absorbs a 6-block height difference at slope 1. If larger, B grows up to 12; beyond that the candidate score is penalised so the search prefers gentler sites.
- **Impact if wrong:** visual only (iPad review, C-9). Wider band = more terrain changed around the Windmill; narrower = steeper banks. Tunable constants.






### Assumption — \ (L0-wind-as04)

# Assumption — "shallow void" depth D = 4 blocks below the target surface

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-r010, L0-wind-e004]`

- Voids within 4 blocks under the levelled surface, and only under cells that need support, are filled. Anything deeper stays open under a 4-block natural cap.
- 4 blocks is enough to hold the template foundation and farmland/water ditches; the spec forbids filling deep caves "целиком".
- **Impact if wrong:** low–medium. Smaller D risks thin caps over caves (players may fall through when digging); larger D starts to look like plugging caves. One constant; iPad review.






### Assumption — \ (L0-wind-as05)

# Assumption — "best available dry land position" = lowest earthwork score, ties broken by distance to spawn

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-p002, L0-wind-e004, L0-wind-r007]`

- Eligible: liquid surface share ≤ 5 % *before* prep (dry land), no collision, all blocks in the prep volume on the natural whitelist, within 500 blocks.
- `score = cutVolume + fillVolume + 50·max(0, Δ − 2B) + 0.1·distance`. Lowest wins.
- The spec does not define "лучшая"; it does say the forced site must be dry land, and prefer nearer sites in stages 1–2.
- **Impact if wrong:** medium-low. The Windmill may appear farther from spawn than a client expects, or on a site that needs more earthwork. Weights are tunable.






### Assumption — a spawner-produced Vindicator carries an iron axe by vanilla default (L0-wind-as06)

# Assumption — a spawner-produced Vindicator carries an iron axe by vanilla default

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-r003, L0-strf-r010]`

- Bedrock's vanilla Vindicator spawns holding an iron axe. A `mob_spawner` with `EntityIdentifier = minecraft:vindicator` should therefore satisfy §4.3/test 17 with no script.
- **Verify** in the `strf` probe: spawn 20 from the template spawner, assert all hold `minecraft:iron_axe` in the main hand.
- **Impact if wrong:** medium. Fallback: an `entitySpawn` handler equips an iron axe on Vindicators within 8 blocks of a registered Windmill/Airship spawner position (event-driven, no scan); recorded as a deviation. Shared with `airs`.






### Assumption — spawner zones stay at block light ≤ 7 (Lmax) (L0-wind-as07)

# Assumption — spawner zones stay at block light ≤ 7 (Lmax)

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-r003, L0-wind-ac06]`

- The exact Bedrock light threshold for monster spawners is not in the spec ("достаточно тёмными"). We keep every cell within 4 blocks horizontally / 1 vertically of each spawner at block light ≤ 7 by placing lanterns only on the far side of each floor (lantern light 15 falls off 1 per block → ≥ 8 blocks away).
- Sky light: the attic has a solid roof; windows avoid spawner line.
- **Impact if wrong:** medium. If Bedrock spawners require light 0, spawners stop working in the lit parts of floors → reposition lanterns in the template (no code change). Probe measures spawn rate with lanterns in place.






### Assumption — on Peaceful, the guard step is deferred until the difficulty is not Peaceful (L0-wind-as08)

# Assumption — on Peaceful, the guard step is deferred until the difficulty is not Peaceful

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-r004, L0-strf-p004]`

- Bedrock removes hostile mobs on Peaceful; spawning 10 Zombie Villagers then would kill the one-time guards instantly and mark them "spawned".
- Rule: if `world.getDifficulty() === Peaceful` at `looted → guarded`, the instance stays `looted` and retries on the next discovery visit. The linked Airship waits too.
- Guards that already exist when a player switches to Peaceful are removed by vanilla and never restored (spec: no top-up).
- **Impact if wrong:** low. The spec is silent; a client may prefer "spawn anyway". The iPad world default is Normal.






### Assumption — field guards are adults, and zombie villagers do not convert to drowned in the ditches (L0-wind-as09)

# Assumption — field guards are adults, and zombie villagers do not convert to drowned in the ditches

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-e003, L0-wind-r004]`

- Guards are spawned as adults (via the entity's adult spawn event if the probe finds one; otherwise vanilla's baby chance is accepted and noted). The spec says only "Zombie Villagers".
- Vanilla Zombie Villagers do not convert to Drowned when submerged (only Zombies/Husks do), so guards walking into the water ditches stay guards. Probe confirms on 1.26.51.
- **Impact if wrong:** low. A baby guard is cosmetic; a drowned conversion would lose one guard's special status — acceptable, recorded.






### Assumption — installing into an existing world runs the spawn search once, with the natural-block whitelist protecting player builds (L0-wind-as10)

# Assumption — installing into an existing world runs the spawn search once, with the natural-block whitelist protecting player builds

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-r008, L0-wind-r011, L0-wind-p002]`

- §4.7 note: the primary scenario is a new world; for an existing world "при необходимости допускается аналогичная одноразовая инициализация". We read "допускается" as *do it*, same rules.
- Player builds are not "detected structures" in the spec's sense, but the whitelist (`L0-wind-r008`) rejects any site containing crafted blocks, so a base is never flattened.
- **Impact if wrong:** medium. If the client wants no spawn Windmill in existing worlds, a single guard (world age / existing registry) skips the search.






### Assumption — `/tickingarea` works from `runCommand` on BDS 1.26.51.1 with a 10-area / 100-chunk limit (L0-wind-as11)

# Assumption — `/tickingarea` works from `runCommand` on BDS 1.26.51.1 with a 10-area / 100-chunk limit

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-ad01, L0-strf-p006]`

- `dimension.runCommand("tickingarea add <from> <to> andrew_ws_n")` succeeds without an operator player, loads the chunks within a few seconds, and `tickingarea remove` releases them.
- **Verify** in the `strf` probe: add a 10×10 window 400 blocks from spawn, poll `getBlock` until defined, time it, remove.
- **Impact if wrong:** high for §4.7 "at start". Fallback in `L0-wind-ad01`: search as the first player explores, deviation recorded; test 14 then passes only after the player has been online near spawn.






### Assumption — a naturally valid Windmill sits at the plot's modal surface Y, and the template's foundation skirt absorbs Δ ≤ 3 (L0-wind-as12)

# Assumption — a naturally valid Windmill sits at the plot's modal surface Y, and the template's foundation skirt absorbs Δ ≤ 3

**Links:** `part_of: ["L0-wind"]` · `is_a: ["assumption"]` · `relates_to: [L0-wind-p001, L0-wind-e001, L0-strf-r005]`

- The template carries 3 layers of natural-looking subsoil under the plot, so on terrain varying by up to 3 blocks no field cell floats and no wall is buried more than 3 blocks. This is part of the fixed template, not script terraforming, so §4.6 "не выравнивать" holds.
- Terrain above the plot surface inside the footprint (hills ≤ 3, trees) is overwritten by the template's air layers — the same effect as every discovery-time placement (`L0-adr-strc` §6).
- **Impact if wrong:** low-medium. If the client reads any tree removal as "levelling", the `flat` profile must also reject trees in the plot, cutting the 1 % yield further.






### Wrdn as01 concept assumption (L0-wrdn-as01)

**ASM-wrdn-01 · "Naturally generated" describes required behavior, not the placement mechanism**

§13.1/§13.5 call the city and its 2 Shriekers "naturally generated" and require them to behave exactly like vanilla worldgen output. Stable Bedrock Script API has no hook to inject custom content into actual chunk generation (same gap already flagged for the shared framework in `L0-xcx4`). The Windmill/Airship sections of the same doc use an explicit chunk-candidate-roll-then-fill pattern, and Mini Warden City's own §13.2 wording ("5% на подходящий чанк... генерация отменяется") is worded identically to theirs.

**Assumption:** Mini Warden City is placed post-hoc via script (a fill/place pass after the chunk has generated), exactly like its three siblings. "Naturally generated" in the spec means the Shriekers must be functionally indistinguishable from vanilla ones at runtime (full `can_summon` warning/Warden-summon participation) — it is not a demand for true vanilla structure/jigsaw injection.

**Impact if wrong:** if literal worldgen-time injection were required, it is very likely infeasible with stable Bedrock APIs at all; the project's own "closest stable approximation, document the deviation" directive would then apply anyway, so the practical implementation converges on the same approach regardless. Low risk.






### Wrdn as02 concept assumption (L0-wrdn-as02)

**ASM-wrdn-02 · No mobs beyond the 2 Shriekers (and Warden via their mechanic) are placed**

§13 never mentions spawners or one-time guard mobs for Mini Warden City, unlike Windmill (3 vanilla-like spawners + 10 persistent Zombie Villagers) and Mini Bastion (7–10 Piglins + 2 Piglin Brutes, explicitly "спавнеры не требуются, охрана — одноразовый набор").

**Assumption:** Mini Warden City deliberately ships with zero placed/spawned mobs of its own — the only hostile presence is the vanilla Shrieker→Warden chain, and ordinary ambient mob spawning in its dark interior (if any occurs under vanilla rules) is not a concern the spec addresses and is not something the add-on suppresses or augments.

**Impact if wrong:** if a guard mob or spawner was intended but dropped from the doc, difficulty/balance testing (and the acceptance-test sampling in `L0-wrdn-ac07`) would miss it. Medium-low risk — worth a one-line confirmation if the client is asked about the structure's difficulty.






### ASM-L0-5 · The two families share one dynamic-property store, with disjoint key families and one budget (L0-xasm5)

# ASM-L0-5 · The two families share one dynamic-property store, with disjoint key families and one budget

**Links:** `is_a: ["assumption"]` · `relates_to: ["L0-lgnd", "L0-strf", "L0-wind", "L0-adr-strs", "L0-strf-as05"]` · **status:** CAN_ASSUME

**Assumption.**
1. **Key families are disjoint by construction.**

   | Family | Keys | Stored on |
   |---|---|---|
   | Weapons | `andrew:<prefix>_*` (`ws`, `sc`), `andrew:cd_*`, `andrew:busy_*`, `andrew:hidden_until` | players, plus world-level craft flags |
   | Structures | `andrew:st:*` (`salt`, `<dim>:<rx>:<rz>`, `spawnWindmill`) | world only |

   `st` is reserved. No `LegendaryDef.keyPrefix` may be `st`.
2. **One budget.** The probe item 8 result (`strf-p006`) is the budget for the whole pack. The weapons' world-level use is a few short keys and negligible. The region shards (`L0-adr-strs`) are sized against that result minus a fixed 4 KB headroom for weapons.
3. **Durable deadlines** in structure records, if any appear (for example a sweep start time), are epoch ms, following `L0-xasm1`.
4. **Only one pack** writes `andrew:st:*` in any world (`L0-adr-own`).

**If wrong.** If the probe shows the engine enforces a total per-pack limit near the shard design, the structure shards must shrink or compress, and the weapons stay unaffected. A prefix collision would corrupt state silently, so `infr`'s validate step adds a check that no `keyPrefix` equals `st`.







---
title: Architecture
type: project-knowledge
generated_at: "2026-09-26T08:34:28.646Z"
source_channel: rollout
node_id: rollout-architecture
aliases: ["rollout-architecture","architecture","project-knowledge/architecture"]
is_a: ["rollout","architecture"]
relates_to: ["L0-airs","L0-bast","L0-infr","L0-loot","L0-wind","L0-wrdn"]
priority: 530
---

# Architecture

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## Components

### Airship (`airs`) — Дирижабль (L0-airs)

# Airship (`airs`) — Дирижабль

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: [L0-strf, L0-loot, L0-wind, L0-infr, L0-adr-strc, L0-adr-tmpl]`

**Source:** Four Structures spec §1, §2, §3, §5.1–§5.6, §6, §7, §9, §10.2 (tests 24–33), §11, §12.
**Status:** analysis only. No structure code exists yet (`packs/behavior/structures/` absent at `302fba4`). Staged after the `strf` + `loot` probe (`L0-strf-p006`); its independent half can ship as soon as `strf`/`loot` land, its linked half additionally needs `wind`'s `afterPlace` hook wired.

## Responsibility
`airs` is a *body* component on top of the `strf` contract layer, at the same level as `wind`. It supplies the Airship's `StructureDef` and hooks, and owns the two Airship-only decisions `strf` explicitly delegates to it: the parameters of its own validity profile, and the ring policy + "not above the Windmill" exclusion for the linked search (`L0-strf-d004`, `L0-strf-r002` item 5). It must not restate generation, persistence or loot rules; it references `strf-*`/`loot-*` by id.

1. **Template** (`L0-airs-e001`, `-r001`). One fixed `.mcstructure` (`L0-adr-tmpl`): ~15×7×10–12, modern grey/light-grey concrete, glass windows, no decay (no vines/cobwebs/cracks). Lower hull = elongated oval gondola with 1 central corridor + 4 small rooms, 2 opposite doors, one ceiling lamp per room. Upper hull = fully decorative oval balloon, no chests/spawner inside it. No ground-access aid (no ladder/lift/waterfall/teleport to the ground). Only rotation varies (`L0-strf-r004`).
2. **Contents** (`-r002`). 10 fixed chests: 2 per room × 4 rooms + 2 in the corridor, filled once from the shared table (`L0-loot`, custom path only — no vanilla-table path for `airs`). Exactly 1 fixed vanilla spawner, iron-axe Vindicator, at the corridor centre (`L0-strf-r010`). No one-time persistent mobs of its own (`-r005`) — unlike `wind`, `airs` has no field guards.
3. **Independent generation** (`-r003`). 2 % per suitable Overworld chunk (`L0-strf-r002`), validated by `strf`'s `dryLand` profile at a 10 % liquid threshold (`L0-strf-as02`) plus its `altitude` profile (bottom ≥ maxSurfaceY + clearance, clearance seeded in [40,70] clamped to 40, reject on ceiling — `L0-strf-r005`, `-r003`, `-p002`). Cancel on invalid site or collision; never terraforms, never relocates, at most one per candidate chunk.
4. **Windmill-linked generation** (`-r004`, `-e002`, `-d001`). Every Windmill instance, spawn one included, calls `airs.tryLinked(parentInstance)` from its own `afterPlace` hook, exactly once (`L0-strf-p003` step 7). `airs` runs `strf.searchRing(airsDef, windmillCentre, 40, 100)`: same validation and collision rules as independent generation, plus an `airs`-specific 2D exclusion so the candidate never sits directly over the Windmill's own footprint (`L0-strf-d004`). No dedup either direction: a pre-existing independent Airship inside 100 blocks does not satisfy the linked attempt, and a linked Airship does not consume or block the chunk's own independent 2 % roll (`L0-strf-r002` item 6). If nothing in [40,100] validates, the linked Airship is simply not created — no widening past 100, no forced site prep (contrast with `wind`'s guaranteed spawn, which always forces a site).

## Inputs
- `strf` API: `registerDef`, `tryPlaceAt`, `searchRing(def, centre, rMin, rMax)`, the `dryLand`/`altitude` validity profiles, the collision detector, the instance registry, `runJob` budget.
- `wind`'s `afterPlace` hook call `airs.tryLinked(parentInstance)`, carrying the parent Windmill's centre and footprint AABB.
- Template `packs/behavior/structures/andrew/airship.mcstructure` (built by `infr`, `L0-adr-tmpl`).

## Outputs
- Placed Airships and their `InstanceRecord`s (`id = "airship"`; linked instances carry `parentInstance` for traceability only — `strf` still keys collision purely on AABB, not on the link).
- `loot.fillChest` ×10 per instance.
- Deviation-report rows (`L0-strf-r012`) for anything the probe finds affecting spawner/rotation/clearVolume placement of this template.
- Debug lines `[Scripting] [andrew] strf:airs …`.

## Not owned
Discovery queue, seeded rolls, rotation transform, generic collision heuristic, registry, tick budget, the numeric altitude/dryLand thresholds themselves (`strf`); loot table and fill algorithm (`loot`); when/how often the linked attempt is triggered (`wind` decides once, after its own init); NBT writer (`infr`).

## Key risks
- **"Run the linked check once" (§7) vs the loaded-footprint guarantee** (`L0-strf-r007`, C-12): a 40–100-block ring around a freshly placed Windmill may reach beyond loaded chunks, so some ring candidates return `pending`. See `L0-airs-cx01`.
- **Door placement on the two "opposite sides"** is not disambiguated by the spec (long axis vs short axis) — assumed long axis (`L0-airs-as01`).
- **Ring-candidate sampling pattern** inside [40,100] is not specified by the spec beyond the two radii — assumed (`L0-airs-as02`).
- Spawner light threshold and the iron-axe Vindicator are shared unknowns already tracked by `strf`'s probe (`L0-strf-p006` items 1, 6).







### Mini Bastion — Nether custom structure (20×20×10-12, lava treasure room, one-time Piglin garrison) (L0-bast)

# Mini Bastion — Nether custom structure (20×20×10-12, lava treasure room, one-time Piglin garrison)

**Responsibility:** Generate a compact, self-contained custom Nether structure that reads visually as a small Bastion Remnant, on a fixed ~20×20×10-12 template with 2-3 levels, a central lower lava treasure room, and a one-time-only garrison of Piglins/Piglin Brutes. Belongs to the "four custom structures" family defined in `docs/Four_Structures_Spec_RU_EN_copy.docx` §14 (normative) and §15/§16 (shared addendum), alongside sibling components Windmill (`L0-mill`), Airship (`L0-arsh`) and Mini Warden City (`L0-wrdn`).

**Inputs:**
- Per-chunk world-generation/load events in the Nether dimension (candidate roll happens once per "suitable" chunk).
- Physical placement context: local terrain/support at the candidate site, and the set of already-known generated structures (vanilla + custom) for overlap testing.
- Stable `@minecraft/server` Script API only — no Experiments (per §15 shared rule, inherited across all four structures).

**Outputs:**
- A placed structure instance: fixed template, footprint ~20×20, height ~10-12, 2-3 internal levels, random rotation 0/90/180/270.
- 10 fixed chests populated once (3 treasure + 7 regular), 2-4 random Gold Blocks in the treasure room.
- A persistent one-time garrison: 7-10 Piglins + exactly 2 Piglin Brutes.
- World-state edits (blocks, lava, mob spawns) that behave as ordinary mutable world state from that point on — no regeneration, ever.

**Scope boundary:** Mini Bastion is Nether-only and independent of the Overworld pair (Windmill/Airship). It shares only the family-wide invariants in §15 (random rotation, no-Experiments implementation preference, structure-overlap cancellation, universal persistence-after-restart) and does **not** use the Windmill/Airship custom weighted loot system (§3) — it consumes real vanilla Bastion Remnant loot tables instead, the same choice Mini Warden City makes for the vanilla Ancient City table. This component has no functional dependency on the Scythe of Calamity / legendary-weapons tree already present in this KV (`L0-scyt`, `L0-sprj`, `L0-sitm`) — that is a different feature area of the same add-on.

**Key characteristics (see child rules/entities for detail):**
- 5% candidate chance per suitable Nether chunk; no relocation on a failed site-suitability check.
- Rejects lava-ocean sites and sites lacking solid support.
- Rejects candidates that physically intersect any other detected structure, custom or vanilla (including a real Bastion Remnant) — existing structures are never damaged to make room.
- Central/lower treasure room surrounded by ordinary (non-special) lava, reachable either by building a safe path through the lava area or by descending/falling from the upper level.
- Guard roster is spawned exactly once per bastion instance, is fully persistent (no despawn by distance, chunk unload, or restart) until killed, and is never replenished.
- Initialization is idempotent: re-loading the chunk must not create a second set of chests, gold blocks, or mobs.

**Relates to:** `L0-mill` (Windmill), `L0-arsh` (Airship), `L0-wrdn` (Mini Warden City) — siblings in the same four-structure family; overlap-cancellation and the §15 shared addendum are the concrete coupling points. None of these sibling components exist yet in the KV as of this deep-dive.

**Sources:** `fourstructuresspecruencopy-part-9/10/11` (§14 Mini Bastion, §15 shared addendum, §16 English addendum).







### Component: Build & verification infrastructure (Stage 0 closed; v2 delta: structure-template pipeline) (L0-infr)

# Component: Build & verification infrastructure (Stage 0 closed; v2 delta: structure-template pipeline)

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-lgnd", "L0-strf", "L0-wind", "L0-airs", "L0-wrdn", "L0-bast", "L0-adr-tmpl", "L0-adr-strc", "L0-adr-strs"]`

## Responsibility
Turns the TypeScript source and the two static packs (`packs/behavior`, `packs/resource`) into a shippable `.mcaddon`, and proves — without a human, wherever the engine allows it — that the result actually loads and runs on real Bedrock: static (TS + JSON), a Bedrock Dedicated Server in Docker, a beta-only GameTest lane with SimulatedPlayer, and a LAN cycle that gets the same build onto the iPad for the checks only a human eye can make.

Stage 0's own 5 closing criteria are unchanged and already green [src: stage-0-infrastructure, C-11]. **v2 delta** (Four Structures spec, `L0-adr-tmpl`): infra also owns the toolchain that compiles the four structure templates into shippable `.mcstructure` files, packs them into the behavior pack, and extends the BDS/GameTest verification lanes to prove — structurally, statistically, and across a restart — that structure generation and its one-time init behave as `L0-strf`/`L0-wind`/`L0-airs`/`L0-wrdn`/`L0-bast` specify. Infra builds and runs these checks; it does **not** own the roll algorithm, placement heuristic, or instance registry themselves (owned by `L0-strf`, decided in `L0-adr-strc`/`L0-adr-strs`).

## Inputs
- `src/**/*.ts`, `packs/behavior/`, `packs/resource/`, `packs/gametest/`, `packs/selftest/`, `scripts/targets.mjs` — unchanged from Stage 0.
- **New**: structure template layout sources (per-structure TS/JSON builder definitions), consumed by `scripts/build-structures.mjs`; exact repo path not yet fixed by any ADR (`L0-infr-as05`).
- Operator-supplied facts: the iPad's installed Bedrock version.

## Outputs
- `dist/andrew.mcaddon`, `dist/bds-check.log`, `dist/bds-gametest.log`, exit codes — unchanged.
- **New**: `packs/behavior/structures/andrew/*.mcstructure` (generated, gitignored build output — `L0-infr-r007`), a structure round-trip unit-test result, a statistical chunk-roll PASS/FAIL verdict, a restart/idempotency PASS/FAIL verdict — all consumed the same automatic way as existing `bds` evidence [decision-verification-approach-automatic].

## Sub-systems (see child processes for detail)
1. **Build & package** (`npm run build`) — esbuild → **compile structure templates (new)** → validate → zip (`L0-infr-p001`).
2. **Structural validation** (`npm run validate`).
3. **BDS one-shot check** (`npm run bds:check`, `L0-infr-p002`).
4. **GameTest harness** (`npm run bds:gametest`) — the existing Miner's Pickaxe lane (`L0-infr-p003`) **and** the new worldgen/placement + statistical chunk-roll lane (`L0-infr-p006`).
5. **LAN dev server** (`npm run bds:up` / `bds:down` / `bds:logs`, `L0-infr-p004`).
6. **Version targeting** (`scripts/targets.mjs`).
7. **New — structure template pipeline** (`scripts/build-structures.mjs`, `L0-infr-p005`): repo sources → `.mcstructure` NBT, with a round-trip unit test and a BDS 4-rotation placement test.
8. **New — restart/idempotency check** (`L0-infr-p007`): proves a BDS restart never re-runs a structure's one-time init.

## Three verification channels (unchanged shape, wider `bds` content)
- **build** — `tsc --noEmit` + `npm run validate` + (new) the structure round-trip unit test.
- **bds** — `bds:check`, `bds:gametest` (Pickaxe lane), plus the new worldgen/placement, statistical chunk-roll, and restart/idempotency lanes.
- **ipad** — human-eyes-only; now also covers the four structures' visual identity (rendering, silhouette, texture) — a green `bds` structural-count proof never closes an `ipad` criterion [C-6/C-9].

## Known open issues
- CTR-4 (open, target `L0-infr`) — version-target wording drift in old raw specs; unchanged, not re-filed.
- Structure template **source layout** is not fixed by any ADR yet (`L0-infr-as05`).
- Statistical-check sample size/tolerance and the exact restart mechanism for the idempotency check are infra's own defaults, not spec'd (`L0-infr-as03`, `L0-infr-as04`).

## Boundary
Owns (v2 addition): the structure-template compiler and its round-trip test; packing `structures/` into the behavior pack (already covered by the existing whole-directory zip); the BDS/GameTest lanes that measure structure placement correctness, statistical chunk-roll rate, and restart/idempotency.
Does not own (v2 addition): the chunk-discovery loop, the roll formula/`worldSalt`, the collision heuristic, the instance registry, or loot filling — those belong to `L0-strf`/`L0-loot`; infra only exercises and measures them.
Everything else unchanged from Stage 0 (see prior boundary: build tooling, packaging, JSON/manifest validation, the Docker BDS harness, iPad delivery mechanics, version-target single source of truth; does not own weapon gameplay logic).







### Loot system — custom weighted table + vanilla loot-table application (L0-loot)

# Loot system — custom weighted table + vanilla loot-table application

**Responsibility:** Fill every structure chest exactly once, at structure init time, with either (a) a custom weighted-random item table (Windmill, Airship) or (b) an unmodified vanilla Bedrock loot table (Mini Warden City, Mini Bastion). Owns: the 13-category weight table and its selection algorithm, equipment material/slot/enchantment rolling, and the vanilla-table dispatch for the two mini structures. Does not own: chest placement, structure templates, discovery/roll/collision (that's `strf`), or which structure gets which chest count (`wind`/`airs`/`wrdn`/`bast`).

**Inputs:** a call from the post-place init hook (`L0-adr-strc` step 5) per chest, carrying: chest block location, which structure type placed it (Windmill/Airship → custom path; Warden City/Bastion → vanilla path + table id).

**Outputs:** container contents written exactly once; frozen thereafter — nothing later re-invokes this component for the same chest (enforced by strf's instance registry, `L0-adr-strs`, not by loot itself).

**Two independent mechanisms, one scope boundary (`L0-loot-r007`):**
1. Custom weighted table (`L0-loot-p001`) — Windmill (25 chests) and Airship (10 chests) only. 5–12 attempts per chest; each attempt picks at most one of 13 categories by relative weight; category resolves to items per `L0-loot-e001`.
2. Vanilla loot-table application (`L0-loot-p002`) — Mini Warden City (10 chests, `chests/ancient_city`) and Mini Bastion (10 chests: 3× `chests/bastion_treasure`, 7× `chests/bastion_other`) only. Delegates entirely to the vanilla loot table; no custom weighting, no golden-apple cap, no curse filter — those constraints are specific to path 1.

**Cross-references:** `strf` (`L0-strf`, not yet deep-dived at the time of this run) owns the post-place hook that calls this component and the persistence registry that guarantees "once." `wind`/`airs`/`wrdn`/`bast` own chest *placement* (counts, positions) but reference this component for chest *contents*. Both mechanisms reuse the shared structure rules in spec §2/§6/§7/§15 (persistence, idempotent init, no restoration after player destruction) only for "fill once" (`L0-loot-r006`); everything else in those sections belongs to `strf`.

**Key numbers:** 13 weighted categories; 5–12 attempts/chest; Golden Apple ≤1 success/chest, qty 1–3, never enchanted via the custom table; equipment 80/20 iron/diamond material split with random slot; enchants on the custom table are compatible, non-curse, up to vanilla max level.

**Open dependency:** the exact stable-API mechanism for invoking a vanilla loot table against a chest (`L0-loot-p002`) is one of the probe questions owed by `strf` (L0 decomposition plan v2, reduce section) and is not yet confirmed — see `L0-loot-asm2`.







### Windmill (`wind`) — Мельница (L0-wind)

# Windmill (`wind`) — Мельница

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: [L0-strf, L0-loot, L0-airs, L0-infr, L0-adr-strc, L0-adr-strs, L0-adr-tmpl]`

**Source:** Four Structures spec §1, §2, §4.1–§4.7, §5.6, §6, §7, §9, §10.1 (tests 14–23, 33), §11, §12, §15.
**Status:** analysis only. No structure code exists yet (`src/` has no `structures/`; `packs/behavior/structures/` is absent at `302fba4`). Staged after Stage 3, after the `strf` + `loot` probe (`L0-strf-p006`).

## Responsibility
`wind` is a *body* component on top of the `strf` contract layer. It supplies the Windmill's `StructureDef` and hooks, and it owns the two Windmill-only behaviours that `strf` explicitly delegates to it: the guaranteed spawn-area search with forced site preparation, and the trigger for the linked Airship. It must not restate generation, persistence or loot rules; it references `strf-*` / `loot-*` by id.

1. **Template** (`L0-wind-e001`, `-r001`, `-r002`). One fixed `.mcstructure` (`L0-adr-tmpl`): ~15×15×30 stone-lower / wood-upper abandoned mill, fixed 4-blade rotor and a wooden door on the front, 3 full floors joined by one continuous stair, fixed ~35×35 plot of mostly mature wheat, water ditches, dirt paths, trampled patches, a damaged wooden fence with gaps, vines and cobwebs that never block the main route. Only rotation varies (`L0-strf-r004`).
2. **Contents** (`-r003`). 25 fixed chests (floor 1: 5, floor 2: 8, floor 3: 12) filled once from the shared table (`L0-loot`). 3 fixed vanilla spawners: floor 1 Zombie Villager, floor 2 Zombie, floor 3 Vindicator with an iron axe (`L0-strf-r010`). Weak decorative light that keeps spawner zones dark.
3. **Field guards** (`-r004`, `-r005`, `-e003`). Exactly 10 vanilla Zombie Villagers spawned once per instance, persistent until death, sun-immune, free to wander, curable into an ordinary Villager (`L0-strf-r009`, `L0-adr-strs`).
4. **Normal generation** (`-p001`, `-r006`). 1 % per suitable Overworld dry-land chunk via `strf` discovery; `dryLand` + `flat` profiles; cancel on invalid site or collision; never terraform, never relocate.
5. **Guaranteed spawn Windmill** (`-p002`, `-p003`, `-r007`…`-r011`, `-r013`, `-e002`, `-e004`). Exactly one per world, 100 %: 5×5 chunks around the spawn chunk → nearest valid site ≤ 500 blocks → best dry site with forced preparation (natural blocks only, level ~35×35, smooth edges, fill only shallow voids). Runs once per world; the result is persisted in `andrew:st:spawnWindmill`.
6. **Linked-Airship trigger** (`-r012`). Every Windmill instance, spawn one included, asks `airs` for exactly one linked attempt (40–100 blocks) after its own init. `wind` owns *when* and *once*; `airs` owns the ring search and validity.

## Inputs
- `strf` API: `registerDef`, discovery callbacks, `tryPlaceAt(def, origin, rot, opts)`, `searchRing`, validity profiles, collision detector, instance registry, `runJob` budget.
- `world.getDefaultSpawnLocation()` (x/z) at first world load; world dynamic property `andrew:st:spawnWindmill`.
- Template `packs/behavior/structures/andrew/windmill.mcstructure` (built by `infr` from repo sources, C-8).

## Outputs
- Placed Windmills and their `InstanceRecord`s (`d = "windmill"`; spawn one has id `windmill:S`).
- `loot.fillChest` ×25 per instance; 10 guard entities per instance.
- One `airs.tryLinked(parentInstance)` call per instance, recorded as `x.linkedTried`.
- Deviation-report rows (`L0-strf-r012`) for: discovery-time generation, forced-prep heuristics, ticking-area use, guard sun immunity via effect, anything the probe finds.
- Debug lines `[Scripting] [andrew] strf:wind …`.

## Not owned
Discovery queue, seeded rolls, rotation transform, collision heuristic, registry, tick budget (`strf`); loot table and fill algorithm (`loot`); linked ring search and Airship validity (`airs`); NBT writer (`infr`).

## Key risks
- **Spawn search needs far chunks loaded** before any player exists (C-12). Resolved by temporary ticking areas (`L0-wind-ad01`); unverified on BDS 1.26.51.1.
- **No dry land within 500 blocks** is undefined in the spec (`L0-wind-cx01`).
- **"Check the linked Airship once"** vs loaded-footprint deferral (`L0-wind-cx02`).
- Forced preparation in an existing world could touch player builds; mitigated by a natural-block whitelist (`L0-wind-r008`).
- Spawner light threshold, vanilla Vindicator axe, and guard behaviour under Peaceful are assumptions to confirm in the probe (`L0-wind-as06`…`as08`).







### Wrdn concept component (L0-wrdn)

## Mini Warden City

**Source:** `Four_Structures_Spec_RU_EN_copy.docx` §13 (normative addendum, overrides earlier drafts on conflict) + §15 (four-structure shared addendum).

### Responsibility
A fixed-template, script-placed Overworld structure that reads as a compact vanilla Ancient City (deepslate, Sculk, Sculk Sensors/Veins/Shriekers), not a shrunken block-for-block copy of the real one. It is one of four opportunistic world-content generators (Windmill, Airship, Mini Warden City, Mini Bastion) sharing the same chunk-candidate discovery mechanism, but it is the only one of the four that is almost entirely vanilla-mechanical once placed: no custom guards, no custom spawners, no custom loot system — it leans on real Sculk Shrieker/Warden mechanics and the real Ancient City loot table.

### Identity, size, theme
- Fixed single design, footprint ≈30×30, height ≈10–15 blocks, irregular outline permitted within the template.
- Random rotation 0°/90°/180°/270° per instance (same convention as the other three structures, §15).
- Almost entirely dark; only a small fixed count of Soul Lanterns/Torches near passages and the central zone — lighting must not break the oppressive mood.

### Generation
- Overworld only. 5% candidate chance per suitable chunk. A successful roll on an unsuitable site cancels outright — **no relocation** to a neighboring chunk (same rule as Windmill/Airship/Bastion).
- Never generates where the surface point above the structure is ocean/river/large water — the surface must be land.
- Structure top sits at a random Y in **−35…−45**, chosen per instance (so depth varies instance to instance, independent of the candidate roll).
- Cancels on physical intersection with any detected vanilla or custom structure (including a real Ancient City); existing structures are never damaged to make room.

### Surface marker
- An irregular ~5×5 Sculk/Sculk Vein patch is generated directly above the city's center, on the real surface.
- It is a locator only — not a pre-built shaft, ladder or tunnel.
- Template geometry (marker footprint vs. hall position) is co-designed so that a player digging straight down from the marker's center is guaranteed to break into the structure.
- The marker must sit on valid land and must never be used as an excuse to damage another generated structure.

### Central hall & monument
- A central hall visually echoes the real Ancient City's core.
- Holds a purely decorative Reinforced Deepslate monument/frame, ≈5 wide × 6–7 tall. It never activates, is not a portal, and never teleports the player.
- Exactly 3 of the 10 chests sit in the central zone; one of the two natural Shriekers sits near the hall/monument.

### Sculk & Warden
- Exactly 2 Sculk Shriekers, fixed positions, both meant to behave exactly like naturally-generated vanilla Shriekers (warning/Warden-summon mechanics), as closely as stable Bedrock allows. One is central, one is in a far part of the city.
- No Warden is pre-placed and none is a permanent guardian — it can only appear through the ordinary Shrieker mechanic.
- Sensors, Veins and other sculk dressing are placed throughout the fixed template; Sensors may noticeably outnumber the 2 Shriekers.

### Chests & loot
- Exactly 10 chests, fixed positions: 3 central + 7 spread through ruins/niches/side rooms/branches, requiring near-full exploration to find them all.
- All 10 use the **real vanilla Ancient City loot table**, unmodified — same categories/quantities/rarities, including Enchanted Golden Apple and Swift Sneak odds.
- The shared custom loot system (§3, used by Windmill/Airship) explicitly does **not** apply here (§15) — this is the sharpest divergence from its Overworld siblings.
- Each chest fills exactly once; never refills after opening, chunk unload, or restart.

### Persistence
- Post-generation blocks are ordinary, player-mutable world blocks under normal vanilla per-block rules.
- Destroyed/altered parts never regenerate.
- Initialization must be idempotent: a reload never creates a second set of chests, Shriekers, Sensors, or surface marker for the same instance.

### Relationship to siblings
- Shares the chunk-candidate-roll → suitability-check → fixed-template-fill → idempotent-registry mechanism with Windmill, Airship and Mini Bastion (§15). The cross-component contradiction `L0-xcx4` (whether a permanent throttled per-chunk discovery loop is compatible with C-5) and `L0-xcx5` (spec version/priority ambiguity) both apply to this component; neither is re-raised here — see relates_to.
- Diverges from Windmill/Airship on loot (vanilla table, not the shared weighted system) and diverges from all three siblings on guards (none — it relies on vanilla Shrieker/Warden instead of custom mobs/spawners).
- Closest sibling in shape is Mini Bastion (§14): same 5% chunk chance, same "cancel without relocation," same 10-chests-with-3-central split, same idempotent-persistence and cancel-on-intersection rules — but Bastion uses custom Piglin guards and two different vanilla loot tables (treasure + regular), while Mini Warden City uses one vanilla table and no custom mobs at all.

### Open items
- Two assumptions filed (`L0-wrdn-as01`, `as02`) on placement mechanism and absence of extra ambient mob spawning.
- Two architecture decisions filed (`L0-wrdn-ad01`, `ad02`) on loot-table sourcing and placement mechanism, both consistent with the project-wide "closest stable approximation" directive.
- No new contradiction filed for this component — the two that already target it (`L0-xcx4`, `L0-xcx5`) are cross-cutting and unresolved at the parent level; this deep-dive does not attempt to resolve them.








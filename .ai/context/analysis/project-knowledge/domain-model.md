---
title: Domain Model
type: project-knowledge
generated_at: "2026-09-26T08:34:28.644Z"
source_channel: rollout
node_id: rollout-domain-model
aliases: ["rollout-domain-model","domain-model","project-knowledge/domain-model"]
is_a: ["rollout","domain-model"]
relates_to: ["L0-airs","L0-airs-e001","L0-airs-e002","L0-bast","L0-bast-ent1","L0-bast-ent2","L0-bast-ent3","L0-infr","L0-infr-e001","L0-infr-e002","L0-infr-e003","L0-infr-e004","L0-infr-e005","L0-loot","L0-loot-e001","L0-loot-e002","L0-loot-e003","L0-loot-e004","L0-strf-e001","L0-strf-e002","L0-strf-e003","L0-strf-e004","L0-wind","L0-wind-e001","L0-wind-e002","L0-wind-e003","L0-wind-e004","L0-wrdn","L0-wrdn-ent1","L0-wrdn-ent2","L0-wrdn-ent3"]
priority: 530
---

# Domain Model

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## Entities

### Entity — the Airship's `StructureDef` values (L0-airs-e001)

# Entity — the Airship's `StructureDef` values

**Links:** `part_of: ["L0-airs"]` · `is_a: ["entity"]`

Concrete values `airs` registers into the shared contract (`L0-strf-e001`):

```ts
const airshipDef: StructureDef = {
  id: "airship",
  templateId: "andrew:airship",
  dimension: "minecraft:overworld",
  chance: 0.02,
  priority: 2,                          // after "windmill" (1), before "warden_city" (3) — L0-strf-r002 item 4
  size: { x: 15, y: 11, z: 7 },          // unrotated; height ~10-12, nominal 11
  validity: { profile: "dryLand", maxLiquidShare: 0.10 },  // L0-strf-as02
  verticalMode: "altitude",              // clearance solved by strf, L0-strf-r005/-r003
  clearVolume: true,                     // L0-strf-p003 step 2 - the Airship needs this for its whole volume
  chests: [ /* 8 room points (2 x 4 rooms) + 2 corridor points, template-local */ ],
  guards: undefined,                     // L0-airs-r005 - no one-time mobs
  afterPlace: undefined,                 // airs does not trigger anything after its own placement
  nameKey: "andrew.structure.airship",   // RU "Дирижабль" / EN "Airship", C-4
};
```

- `chests.length === 10` is asserted by `strf`'s template test (`L0-strf-e001`).
- The two door local points and the "not above Windmill" exclusion are not fields of this def — the doors are template geometry only (no script-visible contract), and the exclusion is applied inside `airs.tryLinked`, not in the def (`L0-airs-r004`, `L0-airs-e002`).
- Exact XYZ of the 10 chest points and the 1 spawner point live in the template builder source (`infr`, `L0-adr-tmpl`), not here; this entity fixes only their **count** and **grouping** (8 room + 2 corridor).





### Entity — `tryLinked` request and ring candidate (L0-airs-e002)

# Entity — `tryLinked` request and ring candidate

**Links:** `part_of: ["L0-airs"]` · `is_a: ["entity"]`

```ts
function tryLinked(parentInstance: InstanceRecord): void
// called exactly once by wind's afterPlace hook (L0-strf-p003 step 7)

interface LinkedSearchState {
  windmillInstanceId: string;
  centre: { x: number; z: number };      // parent Windmill's origin, template-local centre
  excludeAABB: AABB;                     // parent Windmill's own rotated 2D footprint (X/Z only)
  rMin: 40;
  rMax: 100;
}
```

- `tryLinked` calls `strf.searchRing(airshipDef, centre, 40, 100)`, which yields candidate `(x, z, rot)` triples inside the annulus (`L0-strf-r002` item 5; sampling pattern is an assumption, `L0-airs-as02`).
- Each candidate is validated exactly like an independent Airship (`L0-airs-r003`), then filtered by `excludeAABB`: any candidate whose 2D footprint intersects `excludeAABB` is skipped before the expensive footprint probe runs, as a cheap early-out (`L0-strf-d004`).
- The search stops at the first `valid` candidate and places it, or exhausts the ring and returns "not created" — there is no partial/deferred state persisted for a failed search (contrast `L0-strf-p003`'s `pending` for a single placement). See `L0-airs-cx01` for the tension this creates with the loaded-footprint guarantee.
- `parentInstance` is carried only for the deviation report / debug logging; `strf`'s registry and collision test key purely on the placed Airship's own AABB, with no link back to the Windmill (`L0-strf-r006`).





### MiniBastionStructure (L0-bast-ent1)

# MiniBastionStructure

The root record for one generated Mini Bastion instance.

**Attributes:**
- `instance_id` — unique per generated bastion.
- `dimension` — always Nether.
- `origin` — anchor coordinates of the placed template.
- `rotation` — one of 0°/90°/180°/270°, chosen randomly at placement.
- `footprint` — ~20×20 blocks (fixed by template).
- `height` — ~10-12 blocks (fixed by template).
- `level_count` — 2-3 (fixed by template).
- `initialized_flag` — bool; drives the idempotency guard in P-bast-002 (see ASM-bast-03).
- `chest_refs` — exactly 10 `BastionChest` records.
- `guard_refs` — 9-12 `BastionGuard` records (7-10 Piglins + exactly 2 Piglin Brutes).
- `treasure_room` — position/boundary of the central lower room, its surrounding-lava footprint, and its `gold_block_count` (2-4, random, set once).

**Source:** §14.1-14.5.





### BastionChest (L0-bast-ent2)

# BastionChest

One of the 10 fixed chest slots inside a `MiniBastionStructure`.

**Attributes:**
- `chest_id` — unique within the parent instance.
- `instance_id` — parent `MiniBastionStructure`.
- `position` — fixed by template.
- `kind` — `treasure` (3 per instance, central room) | `regular` (7 per instance, distributed).
- `loot_table` — the real vanilla Bastion Remnant loot table matching `kind` (treasure variant or regular variant) — not the shared Windmill/Airship custom weighted system.
- `filled_flag` — set once during P-bast-002; loot is never re-rolled or refilled afterward.
- `is_destroyed` — bool; once true, the chest is never restored.

**Source:** §14.4.





### BastionGuard (L0-bast-ent3)

# BastionGuard

One member of the one-time initial garrison of a `MiniBastionStructure`.

**Attributes:**
- `guard_id` — unique within the parent instance.
- `instance_id` — parent `MiniBastionStructure`.
- `mob_type` — `Piglin` (7-10 per instance) | `Piglin Brute` (exactly 2 per instance). Hoglins never appear here.
- `role` — meaningful mainly for Brutes: `treasure-guard` (exactly one Brute) | `roaming` (the other Brute, at a second fixed position; regular Piglins are ambient/roaming).
- `spawned_once_flag` — true after P-bast-002 runs; the roster is never topped up.
- `is_persistent` — always true: no despawn from distance, chunk unload, or server restart.
- `is_alive` — bool; once false, never respawned and no minimum headcount is maintained.

**Source:** §14.5.





### Entity: `.mcaddon` release archive (L0-infr-e001)

# Entity: `.mcaddon` release archive

**Links:** `part_of: ["L0-infr"]` · `is_a: ["entity"]` · `relates_to: ["L0-infr-e005"]`

**Attributes**
- `path`: `dist/andrew.mcaddon` (gitignored, rebuilt every `npm run build`)
- `contents`: exactly two top-level directories, `behavior` and `resource` (copied from `packs/behavior`, `packs/resource`); `selftest` and `gametest` are never present — asserted by `tests/selftest-pack.test.mjs`.
- **v2**: `behavior` now also contains a generated `structures/andrew/*.mcstructure` subtree (see `L0-infr-e005`) — this doesn't change the archive's top-level directory count or the existing packaging test, since it's already inside `packs/behavior` before zipping.
- `format`: a zip (`zip -r -X`, `.DS_Store` excluded) of the two pack directories.
- Each pack (`packs/behavior/manifest.json`, `packs/resource/manifest.json`) has a `header.uuid` (constant, PACK-01-owned, never regenerated) and a `header.version` triple that must equal `package.json`'s version.
- `min_engine_version` in each manifest must equal `targets.mjs`'s `MIN_ENGINE_VERSION`; the behavior pack's script module depends on `@minecraft/server` at `SERVER_API_VERSION`.

**Identity rule**: the iPad treats a pack with the same uuid **and** the same version as already-imported — a content change (including a template-only change) with no version bump can silently fail to update on-device.





### Entity: selftest pack (`packs/selftest`) (L0-infr-e002)

# Entity: selftest pack (`packs/selftest`)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["entity"]`

Dev-only behavior pack. Own manifest (own uuid, distinct from the release packs — `validateSelfTestPack` checks it doesn't duplicate them), own script entry, bundled by the same `build.mjs`/esbuild path as the release script (`bundleSelfTest()`) so what runs in the check is provably the same toolchain as production, not a hand-maintained duplicate.

Loaded only by `bds-check.mjs`, directly from the working tree — never packaged into `dist/andrew.mcaddon`. Its script, once the world loads, exercises in-engine assertions and prints `[selftest] PASS/FAIL <name>` per check and a terminal `[selftest] DONE passed=N failed=M` summary to the BDS log, which is the authoritative verdict source (counters win over individual lines, so log truncation can't turn a real FAIL into a read PASS).

Compiled with an `__SELFTEST_FIXTURE__` esbuild `--define` flag: `false` normally, `true` only for `--break-selftest` negative-test runs (a deliberately-failing fixture proves the check itself can fail).





### Entity: GameTest pack (`packs/gametest`) (L0-infr-e003)

# Entity: GameTest pack (`packs/gametest`)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["entity"]`

Dev-only behavior pack built against `@minecraft/server-gametest` `1.0.0-beta.1.26.51-stable` (devDependency, beta-only, no stable channel exists for this module). Requires the world-level "Beta APIs" experiment, which BDS exposes only through `level.dat` NBT — not through `server.properties` or an env var — so `bds-gametest.mjs` boots the server once to generate the world, patches the NBT flag directly, and reboots.

Registers a `SimulatedPlayer`-driven scenario against a generated `.mcstructure` test platform (built at run time by `writeStructure()`, not committed as a binary). Never zipped into `dist/andrew.mcaddon`; installed only into the dedicated `LEVEL_NAME=gametest` world (superflat, separate from the everyday `andrew` world).





### Entity: BDS Docker service (`docker/bds/compose.yaml`) (L0-infr-e004)

# Entity: BDS Docker service (`docker/bds/compose.yaml`)

**Links:** `part_of: ["L0-infr"]` · `is_a: ["entity"]`

**Image**: `itzg/minecraft-bedrock-server:latest`, `platform: linux/amd64` — BDS ships x86_64 only, so on Apple Silicon (Mac mini M4 Pro) it runs under Rosetta 2 [C-5].

**Key env vars** (overridable per invocation): `VERSION` (must equal `targets.mjs`'s `BDS_VERSION`, asserted at the top of every run), `LEVEL_NAME` (`andrew` default / `gametest` for the GameTest lane, via `BDS_LEVEL_NAME`), `LEVEL_TYPE` (`DEFAULT` / `FLAT` via `BDS_LEVEL_TYPE`), `GAMEMODE` (`creative` default / `survival` via `BDS_GAMEMODE` — the image reapplies `GAMEMODE` from env on every start via `set-property --bulk`, so writing "survival" straight into `server.properties` does not stick), `ONLINE_MODE: false` (LAN-only, no Xbox Live auth needed for the iPad to join), `CONTENT_LOG_FILE_ENABLED` / `CONTENT_LOG_CONSOLE_OUTPUT_ENABLED: true` (without these, `console.warn` from the add-on's script never reaches `docker logs`, and there is nothing for `bds:check` to assert on).

**Ports**: `19132/tcp+udp` (RakNet handshake+join — the iPad 1.26.51 client actually uses RakNet despite BDS's own log recommending NetherNet), `19140-19149/udp` (NetherNet gameplay, 1:1 published), `7551/udp` (NetherNet LAN discovery).

**Volume**: `./data:/data` (gitignored) — server binary, world, installed packs.





### Entity: Structure template source & compiled `.mcstructure` (L0-infr-e005)

# Entity: Structure template source & compiled `.mcstructure`

**Links:** `part_of: ["L0-infr"]` · `is_a: ["entity"]` · `relates_to: ["L0-adr-tmpl", "L0-infr-e001"]`

**Attributes**
- **Source** (repo, hand-authored): per-structure TS/JSON layout/builder definitions — block palette plus block-entity data (chest positions, `mob_spawner` + `EntityIdentifier`, shrieker `can_summon`, door half-state, wheat `growth`, rotated-stair states). Exact path not yet fixed by an ADR (`L0-infr-as05`).
- **Compiled output** (generated, gitignored, never hand-edited — `L0-infr-r007`): `packs/behavior/structures/andrew/*.mcstructure`, little-endian NBT, one file per structure (Windmill/Airship/Warden City/Bastion), fixed layout with random rotation only (0/90/180/270) applied at placement time, not baked into 4 separate files [`L0-adr-tmpl`].
- **Identity rule**: like `packs/behavior/scripts/`, this directory is build output produced by `scripts/build-structures.mjs` and is already inside the zip `L0-infr-p001` packages — no separate ship path.
- **Consumers**: `world.structureManager.place(templateId, dim, origin, {rotation})` at runtime (`L0-strf`, `L0-adr-strc`); the round-trip unit test (`L0-infr-p005`) and the BDS 4-rotation placement test (`L0-infr-p006`) at build/check time.





### Entity: LootCategory (L0-loot-e001)

# Entity: LootCategory

Represents one row of the custom weighted table (`L0-loot-r002`). Static configuration data, not persisted per-instance — the 13 rows are compiled into the add-on, not stored in world state.

**Attributes:**
- `id` — one of: sticks, logs, iron_ingot, copper_ingot, gold_ingot, diamond, golden_apple, armor_unenchanted, armor_enchanted, sword_unenchanted, sword_enchanted, axe_unenchanted, axe_enchanted (13 values)
- `weight` — positive integer, relative (not normalized to 100): 45 / 24 / 32 / 30 / 17 / 6 / 7 / 15 / 5 / 12 / 4 / 12 / 4 respectively
- `quantityRange` — [min, max] inclusive, or "1 item" for equipment categories
- `equipment` — boolean; true for the 6 armor/sword/axe categories
- `enchanted` — boolean; true for the 3 "Enchanted …" categories
- `maxSuccessesPerChest` — 1 for golden_apple, unbounded for all others

**Relationships:** consumed by `L0-loot-p001`; the enchanted-equipment rows also produce a `L0-loot-e003` (EquipmentRoll) describing their output shape.





### Entity: LootAttempt (L0-loot-e002)

# Entity: LootAttempt

One fill attempt within `L0-loot-p001`. Ephemeral — exists only during chest initialization; not stored as durable world state (only the *output* item stacks persist, inside the chest container).

**Attributes:**
- `chestRef` — the target chest block location
- `attemptIndex` — 1..N where N ∈ [5, 12]
- `category` — a `LootCategory.id`, or none if this attempt produced no output (see `L0-loot-asm1`)
- `resultStack` — the ItemStack placed into the chest, or none

**Relationships:** `part_of` one chest-fill run (`L0-loot-p001`); `category` refs `L0-loot-e001`.





### Entity: EquipmentRoll (L0-loot-e003)

# Entity: EquipmentRoll

The resolved output of an equipment-category attempt (armor/sword/axe, enchanted or not).

**Attributes:**
- `itemType` — helmet/chestplate/leggings/boots (armor only) or sword/axe
- `material` — iron (80%) or diamond (20%), rolled independently per attempt
- `armorSlot` — random slot, armor categories only; independent per attempt, duplicates allowed
- `enchantments[]` — empty for "Unenchanted…" categories; for "Enchanted…" categories, a set of compatible non-curse vanilla enchantments, each ≤ its vanilla max level (`L0-loot-r005`)

**Relationships:** produced by `L0-loot-p001` step 2c for equipment `LootCategory` rows; never appears on the vanilla path (`L0-loot-p002`).





### Entity: VanillaLootTableRef (L0-loot-e004)

# Entity: VanillaLootTableRef

Identifies which vanilla Bedrock loot table a `L0-loot-p002` chest draws from. Static per chest role.

**Attributes:**
- `tableId` — one of `chests/ancient_city`, `chests/bastion_treasure`, `chests/bastion_other`
- `structure` — wrdn (Mini Warden City) or bast (Mini Bastion)
- `chestRole` — for bast: treasure (3 chests, central) or other (7 chests, distributed); for wrdn: n/a, all 10 chests use the same table

**Relationships:** consumed by `L0-loot-p002`; chest count/position is owned by `L0-wrdn`/`L0-bast`, not this component.





### Entity — `StructureDef` (the contract a body component registers) (L0-strf-e001)

# Entity — `StructureDef` (the contract a body component registers)

**Links:** `part_of: ["L0-strf"]` · `is_a: ["entity"]`

```ts
interface StructureDef {
  id: "windmill" | "airship" | "warden_city" | "bastion";   // registry key, also part of the roll hash
  templateId: `andrew:${string}`;                           // .mcstructure id
  dimension: "minecraft:overworld" | "minecraft:nether";
  chance: number;                                           // per chunk, from the one config table
  priority: number;                                         // order within a chunk (L0-strf-r002)
  size: { x: number; y: number; z: number };               // unrotated template size
  validity: ValidityProfile;                                // dryLand | flat | altitude | depth | netherFloor + thresholds
  verticalMode: "surface" | "altitude" | "depth" | "netherFloor";
  clearVolume: boolean;                                     // pre-fill AABB with air before place
  chests: { local: Vec3; table: LootTableRef }[];           // custom | vanilla:<path>
  guards?: (ctx: InitCtx) => GuardSpec[];                   // one-time mobs
  afterPlace?: (ctx: PlaceCtx) => void;                     // e.g. enqueue linked Airship
  afterInit?: (ctx: InitCtx) => Generator<void>;            // marker, gold blocks — must be idempotent
  nameKey: string;                                          // RU/EN localisation key (C-4)
}
```

- The registry is populated once at `worldLoad` (script start) and is immutable afterwards.
- `chests.length` and guard counts are asserted by the template test against the spec counts: Windmill 25 (5/8/12), Airship 10, Warden City 10 (3 central), Bastion 10 (3 treasure).
- Local points are in **unrotated template space** and are converted only by `rotateLocal` (`L0-strf-r004`).





### Entity — `RegionShard` and `InstanceRecord` (the persistent registry) (L0-strf-e002)

# Entity — `RegionShard` and `InstanceRecord` (the persistent registry)

**Links:** `part_of: ["L0-strf"]` · `is_a: ["entity"]`

**Key.** `andrew:st:<dimShort>:<rx>:<rz>`, where `rx = floor(cx/32)`, `rz = floor(cz/32)` and `dimShort ∈ {o, n}`. Other keys: `andrew:st:salt` (string), `andrew:st:ver` (schema version, int), `andrew:st:spawnWindmill` (owned by `wind`).

**Value (JSON string, compact):**
```ts
interface RegionShard {
  v: 1;
  ev: string;               // base64 bitset, 1024 bits = evaluated chunks (row-major 32×32)
  i: InstanceRecord[];
}
interface InstanceRecord {
  id: string;               // `${def}:${dimShort}:${cx}:${cz}` or `${def}:L:${parentId}` / `${def}:S` for linked/spawn
  d: string;                // def id
  o: [number, number, number]; // origin (min corner, world coords)
  r: 0 | 1 | 2 | 3;         // rotation
  s: "p" | "P" | "l" | "g" | "d" | "f"; // planned, placed, looted, guarded, done, failed
  x?: Record<string, unknown>; // def extras: linkedTried, clearance, goldCount …
}
```
- A record lives in the shard of its **origin chunk**. Collision lookup reads every shard whose region intersects the AABB plus 1 chunk.
- Size estimate: a record is about 70 chars and the bitset about 172. A worst-case region (1024 chunks × Σ chance ≈ 13 % Overworld, before cancellations) holds ~130 records, about 9 KB. That stays under the per-key limit measured by the probe (`L0-strf-as05`). If a shard exceeds 80 % of the limit, split it into `:<rx>:<rz>:b` (overflow key).
- Schema migrations bump `andrew:st:ver`. Unknown future versions → generation is disabled (fail safe; no re-generation).
- An in-memory LRU cache of 64 shards. Writes are coalesced per job slice.





### Entity — `Candidate` (transient, never persisted) (L0-strf-e003)

# Entity — `Candidate` (transient, never persisted)

**Links:** `part_of: ["L0-strf"]` · `is_a: ["entity"]`

| Attribute | Meaning |
|---|---|
| `def` | `StructureDef` |
| `dim` | dimension id |
| `chunk` | `(cx, cz)` that rolled. `null` for relocating searches |
| `origin` | x/z min corner of the rotated AABB. y is filled in by the vertical solver |
| `rot` | 0–3, seeded |
| `aabb` | rotated AABB plus margin, used for loaded/collision checks |
| `source` | `roll` / `spawnSearch` / `linked` |
| `status` | `new` → `valid` / `rejected(reason)` / `pending` |

- A candidate becomes an `InstanceRecord` only after validation succeeds, at reservation.
- `pending` candidates are held in a per-chunk in-memory map and rebuilt from the roll after a restart (`L0-strf-r007`).





### Entity — `DeviationEntry` (one row of `docs/structures/deviations.md`) (L0-strf-e004)

# Entity — `DeviationEntry` (one row of `docs/structures/deviations.md`)

**Links:** `part_of: ["L0-strf"]` · `is_a: ["entity"]`

| Field | Example |
|---|---|
| `id` | `DEV-STRF-01` |
| `spec` | §7, §2 ("генерация при worldgen") |
| `exact rule` | quoted RU sentence + EN gist |
| `implemented as` | "Generated on first player discovery of the chunk" |
| `why` | "Stable API 2.10.0 has no chunk-generated event; jigsaw worldgen is experimental (C-2)" |
| `player-visible effect` | "Possible pop-in at the edge of view; trees in the footprint removed" |
| `evidence` | probe item / test id / commit |
| `owner` | strf / loot / wind / airs / wrdn / bast |
| `status` | active / resolved-by-engine-update |

The report opens with a summary table of all entries and is linked from the README (§11 "краткий технический отчёт").





### Entity — `WindmillDef` (the Windmill's `StructureDef` + template contract) (L0-wind-e001)

# Entity — `WindmillDef` (the Windmill's `StructureDef` + template contract)

**Links:** `part_of: ["L0-wind"]` · `is_a: ["entity"]` · `relates_to: [L0-strf-e001, L0-adr-tmpl, L0-wind-r001, L0-wind-r003, L0-wind-p004]`

| Field | Value | Source |
|---|---|---|
| `id` | `"windmill"` (registry `d`) | — |
| `nameKey` | `andrew.structure.windmill` → en `Windmill`, ru `Мельница` | §8, C-4 |
| `dimension` | `minecraft:overworld` only | §2, C-14 |
| `chance` | `0.01` | §4.6 |
| `priority` | 0 (first in Overworld chunk order) | `L0-strf-r002` |
| `template` | `andrew:windmill` → `structures/andrew/windmill.mcstructure` | `L0-adr-tmpl` |
| `size` | plot ≈ 35 × 35 (X×Z); building ≈ 15 × 15 base, ≈ 30 high; rotor on the front face, inside the plot | §4.1 |
| `profiles` | `dryLand(maxLiquidShare 0.05)`, `flat(maxDelta 3)` — normal gen only | `L0-strf-r005` |
| `chests` | 25 local points: floor 1 ×5, floor 2 ×8, floor 3 ×12; `table:"shared"` | §4.3 |
| `spawners` | 3 local points (template block entities): F1 `minecraft:zombie_villager_v2`, F2 `minecraft:zombie`, F3 `minecraft:vindicator` | §4.3 |
| `guardPoints` | 10 local points on field paths around the wheat | §4.5 |
| `door` | 1 wooden door, front face, same side as rotor | §4.1 |
| `hooks` | `spawnGuards`, `afterInit` (linked Airship) | `L0-wind-p004` |
| `spawnSearch` | `{ stage1Chunks: 5, maxRadius: 500, allowForcedPrep: true }` | §4.7 |

## Template layers (build-time sources, `infr`)
- **Building:** cobblestone/stone/mossy variants floors 0–1; planks/logs floors 2–3; wooden roof; continuous stair F1→F3; floor 3 = open storage/attic (combat zone).
- **Rotor:** 4 fixed blades (fences/planks/wool-free), non-moving.
- **Plot:** farmland + wheat (`growth` mostly 7), water ditches (hydrating farmland), coarse-dirt/path paths, trampled dirt patches, a few overgrown tufts, perimeter oak fence with ≥ 3 gaps and damaged sections.
- **Decay:** vines on exterior walls and inside; cobwebs in corners, under ceilings, near beams, densest on floor 3; never on the route cells (`L0-wind-r002`).
- **Light:** a few lanterns per floor, placed away from spawner cells (`L0-wind-r003`).

The unit test (`L0-adr-tmpl`) asserts counts, bounds and route reachability from the NBT file itself.





### Entity — `SpawnWindmillRecord` (`andrew:st:spawnWindmill`) (L0-wind-e002)

# Entity — `SpawnWindmillRecord` (`andrew:st:spawnWindmill`)

**Links:** `part_of: ["L0-wind"]` · `is_a: ["entity"]` · `relates_to: [L0-strf-e002, L0-wind-r011, L0-wind-p002, L0-wind-p003]`

A single world dynamic property, owned by `wind`, written through the `strf` store API (C-6). Compact JSON, well under 1 KB.

```ts
interface SpawnWindmillRecord {
  v: 1;
  status: "searching" | "preparing" | "placing" | "done" | "failed";
  spawn: [number, number];          // world spawn x,z captured at first start (never re-read)
  stage?: 1 | 2 | 3;                // 1 = 5×5 chunks, 2 = ring ≤500, 3 = forced prep
  cursor?: { ring: number; window: number };  // resume point while searching
  best?: { o: [number,number,number]; r: 0|1|2|3; score: number }; // best forced-prep candidate so far
  plan?: string;                    // hash of the SitePrepPlan being applied (status "preparing")
  origin?: [number, number, number];
  rot?: 0 | 1 | 2 | 3;
  prepared?: boolean;               // true if forced prep ran
  reason?: string;                  // for "failed": e.g. "noDryLand"
}
```

## Invariants
- Created once, on the first world load with the add-on. `done` and `failed` are terminal and never re-run, even if the Windmill is later destroyed (§4.7.13, §2).
- `spawn` is captured once. A later `/setworldspawn` does not move or add a Windmill.
- The placed instance lives in the regular registry with id `windmill:S`; this record only holds the search state and outcome. Registry is authoritative for "exists" (`L0-strf-r008`).
- A schema version bump never resets `status` (`L0-strf-e002` migration rule).





### Entity — Field Zombie Villager (Windmill guard) (L0-wind-e003)

# Entity — Field Zombie Villager (Windmill guard)

**Links:** `part_of: ["L0-wind"]` · `is_a: ["entity"]` · `relates_to: [L0-strf-r009, L0-adr-strs, L0-wind-r004, L0-wind-r005]`

A **vanilla** `minecraft:zombie_villager_v2` with markers applied by script once, at the `looted → guarded` step. Not a custom entity type (`L0-adr-strs` rejected alternative).

| Attribute | Value | Why |
|---|---|---|
| type | `minecraft:zombie_villager_v2` | vanilla curing/AI (§4.5) |
| count per Windmill | exactly 10, one per `guardPoint` | §4.5 |
| tag | `andrew:guard:<instanceId>` | idempotent deficit count (`L0-strf-p004`) |
| `nameTag` | localised guard name (or zero-width, per probe) | Bedrock does not despawn named mobs |
| effect | `fire_resistance`, infinite, amplifier 0, no particles | sun immunity (`L0-strf-as04`) |
| age | adult (spawn event if available) | `L0-wind-as09` |
| position | fixed template-local points on field paths, rotated with the instance | §4.5 "фиксированных/контролируемых позициях" |

## Lifecycle
`spawned (once)` → wanders freely, may leave via fence gaps → one of:
- **dies** → gone forever; no respawn, no top-up; the record stays `done`.
- **cured** (weakness + golden apple, vanilla) → engine replaces it with a new `minecraft:villager`; tag and effect do not carry over; no script re-applies them (`L0-wind-r005`).

## Not guards
Zombie Villagers from the floor-1 spawner: no tag, no name, no effect; they burn in sunlight and despawn like vanilla (§4.5 last bullet).





### Entity — `SitePrepPlan` (transient, reproducible) (L0-wind-e004)

# Entity — `SitePrepPlan` (transient, reproducible)

**Links:** `part_of: ["L0-wind"]` · `is_a: ["entity"]` · `relates_to: [L0-wind-p003, L0-wind-r008, L0-wind-r009, L0-wind-r010, L0-wind-as03, L0-wind-as04, L0-wind-as05]`

Computed in memory from the chosen origin/rotation and the current terrain. Only its hash is persisted (`L0-wind-e002.plan`); after a restart the plan is recomputed and must hash identically, otherwise (terrain changed meanwhile) it is re-validated from scratch.

```ts
interface SitePrepPlan {
  origin: Vec3; rot: 0|1|2|3;
  targetY: number;                 // median natural surface of the 35×35 plot
  plot: AABB2;                     // rotated 35×35
  band: number;                    // blend band width B (L0-wind-as03)
  columns: Array<{
    x: number; z: number;
    naturalY: number;              // first non-leaf/log solid
    surfaceBlock: string;          // reused for the new top layer
    cutTo?: number;                // clear blocks above this Y
    fillFrom?: number;             // fill air/liquid from here up to target (≤ D deep, L0-wind-as04)
    zone: "plot" | "band";
  }>;
  score: number;                   // cut + fill volume + penalties (L0-wind-as05)
}
```

## Invariants
- Every block the plan would change is on the natural whitelist (`L0-wind-r008`); the plan is rejected otherwise, before any write.
- In the band, `|y(col) − y(neighbour)| ≤ 1` after smoothing (`L0-wind-r009`).
- `fillFrom ≥ targetY − D` everywhere (`L0-wind-r010`).





### Wrdn ent1 concept entity (L0-wrdn-ent1)

## MiniWardenCityInstance

One per generated city. Written once at successful placement; read for idempotency checks on every subsequent chunk load.

**Attributes**
- `instanceId` — stable key derived from anchor chunk coordinates (dimension is always Overworld, so no dimension field needed).
- `anchorPosition` — world position of the template's placement anchor (pre-rotation origin).
- `rotation` — one of `0 | 90 | 180 | 270`, chosen once at generation.
- `topY` — integer in `[-45, -35]`, chosen once at generation, independent of the candidate roll.
- `footprintApprox` — fixed constant, ≈30×30×(10–15), documented for reference (not stored per instance; same for every city).
- `surfaceMarkerPosition` — surface coordinate of the ~5×5 sculk patch, derived from `anchorPosition` + `rotation`.
- `centralHallBounds` / `monumentBounds` — derived from the fixed template + rotation; used for the "digging down from marker hits the hall" guarantee (`L0-wrdn-rul3`).
- `state` — `candidate → placed | cancelled`. Cancelled instances are not persisted (no relocation, per `L0-wrdn-rul1`).
- `placedAtTick` / `placedAtTimestamp` — for persistence/idempotency auditing.

**Relates to:** `L0-wrdn-ent2` (chests), `L0-wrdn-ent3` (shriekers) — both keyed by `instanceId`.

**Invariant:** exactly one `MiniWardenCityInstance` per anchor chunk; a reload must find the existing record and skip re-placement (`L0-wrdn-rul7`).





### Wrdn ent2 concept entity (L0-wrdn-ent2)

## WrdnChest

Exactly 10 per `MiniWardenCityInstance` (`L0-wrdn-ent1`).

**Attributes**
- `chestId` — 1..10, fixed slot in the template.
- `zone` — `central` (exactly 3) or `outer` (exactly 7).
- `positionOffset` — position relative to the template anchor, rotated with the instance.
- `lootTableRef` — always the vanilla Ancient City loot table; never the shared Windmill/Airship weighted table (`L0-wrdn-rul6`).
- `filled` — boolean, set true on first open (or first script-driven fill, whichever the implementation uses); once true, contents never regenerate.
- `filledAtTimestamp` — for persistence auditing, mirrors `L0-wrdn-ent1.placedAtTimestamp` pattern.

**Invariant:** `zone=central` count is always exactly 3 and `zone=outer` count is always exactly 7, for every instance (`L0-wrdn-rul6`, raw AC 48).





### Wrdn ent3 concept entity (L0-wrdn-ent3)

## WrdnShrieker

Exactly 2 per `MiniWardenCityInstance` (`L0-wrdn-ent1`).

**Attributes**
- `slot` — `central` or `far`; fixed per template, rotated with the instance.
- `positionOffset` — position relative to the template anchor.
- Warden-summon state (warning level, cooldown, `can_summon`) is **not** duplicated here — it is left to vanilla Sculk Shrieker behavior/state so the mob behaves exactly like a naturally-generated one (`L0-wrdn-rul5`). This entity only tracks placement, not runtime AI state.

**Invariant:** never more than 2 per instance; no `WrdnShrieker` record ever transitions to or spawns a tracked Warden entity — Warden appearance is pure vanilla mechanic, out of this entity's lifecycle (`L0-wrdn-rul5`).





## Components (code-derived)

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






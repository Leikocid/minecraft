---
title: Domain Model
type: project-knowledge
generated_at: "2026-10-02T19:14:05.987Z"
source_channel: rollout
node_id: rollout-domain-model
aliases: ["rollout-domain-model","domain-model","project-knowledge/domain-model"]
is_a: ["rollout","domain-model"]
relates_to: ["L0-airs","L0-airs-e001","L0-airs-e002","L0-bast","L0-bast-ent1","L0-bast-ent2","L0-bast-ent3","L0-infr","L0-infr-e001","L0-infr-e002","L0-infr-e003","L0-infr-e004","L0-infr-e005","L0-lgnd","L0-lgnd-ent1","L0-lgnd-ent2","L0-lgnd-ent3","L0-lgnd-ent4","L0-loot","L0-loot-e001","L0-loot-e002","L0-loot-e003","L0-loot-e004","L0-magn","L0-magn-eelm","L0-magn-eirn","L0-orbc","L0-orbc-ent1","L0-orbc-ent2","L0-orbc-ent3","L0-pick","L0-pick-ent1","L0-pick-ent2","L0-pntr","L0-pntr-ent1","L0-pntr-ent2","L0-pntr-ent3","L0-ring","L0-ring-ent1","L0-ring-ent2","L0-ring-ent3","L0-sauc","L0-sauc-ent1","L0-sauc-ent2","L0-scyt","L0-scyt-ent1","L0-scyt-ent2","L0-scyt-ent3","L0-strf","L0-strf-e001","L0-strf-e002","L0-strf-e003","L0-strf-e004","L0-ufoc","L0-ufoc-ent1","L0-ufoc-ent2","L0-webs","L0-webs-ent1","L0-webs-ent2","L0-webs-ent3","L0-wind","L0-wind-e001","L0-wind-e002","L0-wind-e003","L0-wind-e004","L0-wrdn","L0-wrdn-ent1","L0-wrdn-ent2","L0-wrdn-ent3"]
priority: 580
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
  size: [75, 18, 13],                    // AIRSHIP_SIZE, templates/airship.ts:20; unrotated
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
LinkedAirships.start(parent: Instance): void
// called by the Placer's `linked` hook after `la=true`

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
- The search stops at the first `valid` candidate and places it, or exhausts the ring and returns "not created" — an unreadable ring persists `ls=pending` and is resumed. Only a fully read ring with no valid spot ends `none` (contrast `L0-strf-p003`'s `pending` for a single placement).
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
- init state = the state of the `L0-strf-e002` InstanceRecord (`L0-strf-r008`).
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
- registry `looted`; the container is the loot state (`L0-strf-r008` §4).
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
- registry `guarded`, never reset (`L0-strf-r009` §3).
- `is_persistent`, `is_alive` — governed by `L0-strf-r009`.

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





### LegendaryDef (static registry entry, `src/legendary/registry.ts`) (L0-lgnd-ent1)

---
is_a: ["entity"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p006", "L0-lgnd-r006", "L0-lgnd-ad07", "L0-lgnd-ad08", "L0-lgnd-ad09", "L0-adr-orbc", "L0-orbc"]
---
# LegendaryDef (static registry entry, `src/legendary/registry.ts`)

This replaces the pre-code shape (`registerLegendary`, `readyMode`, `ability` callback). Those were superseded by `ad07`: the registry is a `const` array, Ready is continuous for everyone, and each weapon subscribes itself.

| Field | Web Sword | Scythe | **Orbital Cannon (v3)** |
|---|---|---|---|
| `itemId` | `andrew:web_sword` | `andrew:scythe_of_calamity` | `andrew:orbital_cannon` |
| `keyPrefix` | `ws` (frozen) | `sc` (frozen) | `oc` |
| `abilityKey` | `web_sword` | `scythe_of_calamity` | `orbital_cannon`, one key shared by both modes (Orbital §6) |
| `nameKey` | `item.andrew:web_sword` | `item.andrew:scythe_of_calamity` | `item.andrew:orbital_cannon` |
| `cooldownTicks` | 600 | 600 | 600 |
| `craftGate` | true | true | true |
| `refund` | web ×4, diamond_sword ×1 | golden_apple ×2, obsidian ×2, diamond_hoe ×1 | `minecraft:tnt` ×4, `minecraft:fishing_rod` ×1 |
| `textPrefix` | `andrew.web_sword` | `andrew.scythe` | `andrew.orbital` |
| `command` | `andrew:websword` | `andrew:scythe` | `andrew:orbital` |
| **`activations`** (new) | `["use"]` | `["use"]` | `["use", "attack"]` |
| **`craftTokenId`** (new) | `andrew:web_sword_crafted` | `andrew:scythe_of_calamity_crafted` | `andrew:orbital_cannon_crafted` |

## Derived durable keys
- **World:** `andrew:<p>_crafted`, `andrew:<p>_crafted_by`, `andrew:<p>_owed` (a list, `ent4`), `andrew:<p>_gen:<id>` (`wpn2`, not yet built).
- **Player:** `andrew:<p>_pending`, `andrew:cd_<abilityKey>`, `andrew:busy_<abilityKey>`.
- **ItemStack:** `andrew:<p>_origin`, `_owner`, `_id`, `_owner_name`, `_gen`, `_holder`, `_holder_name` (`ent2`).

## Invariants
- `itemId`, `keyPrefix`, `abilityKey`, `command` and `craftTokenId` are each unique across the registry. A node test asserts this, because there is no runtime registration to throw.
- `keyPrefix` and `abilityKey` are frozen once a world has written them (`r006`). `oc` / `orbital_cannon` freeze with the first v3 world.
- `activations` is non-empty. `"attack"` is legal only for weapons whose module subscribes to an attack event (the Cannon, `L0-adr-orbc` §2).
- `refund` equals the recipe's ingredients. The recipe JSON is owned by the weapon's node, and a node test compares the two.
- The weapon calls `startCooldown` itself and only on a successful activation (`L0-adr-cast` §1). For the Cannon, that means in the same tick as its charges spawn (`L0-xasm10`).





### LegendaryInstanceMark (L0-lgnd-ent2)

---
is_a: ["entity"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ent4", "L0-lgnd-r005", "L0-lgnd-r006", "L0-lgnd-ad11", "L0-adr-hold", "L0-xcx11"]
---
# LegendaryInstanceMark

Dynamic properties on an `ItemStack` that distinguish one protected legendary from an ordinary copy (ADR-016, Q-006). As built, `Mark` is `{origin, owner, id, ownerName?}` in `rules.ts`. v3 adds `gen` (carried over from `wpn2`, unbuilt) and `holder`.

| Attribute | Key suffix | Type | Notes |
|---|---|---|---|
| `origin` | `_origin` | `"craft" \| "admin"` | `craft` is stamped only when a **craft token** is swapped (`r014`). `admin` is stamped by `/andrew:<cmd> give`. An unmarked stack is ordinary (`as11`). |
| `owner` | `_owner` | player id | The crafter or admin recipient. Informational, and the fallback return target. |
| `ownerName` | `_owner_name` | string? | `craft` only, for the broadcast. |
| `id` | `_id` | string | Instance id. Stable across re-issues. |
| `gen` | `_gen` | int ≥ 0 | Absent reads as 0 (0.3.0 and v2 stacks). |
| `holder` | `_holder` | player id? | **v3.** The last player whose inventory, hotbar or off hand held this stack. |
| `holderName` | `_holder_name` | string? | **v3.** Used in logs and in the owed entry, so an offline holder is readable. |

## Rules
- **Return target** = `holder ?? owner` (`ad11`). A container, hopper, allay or item entity never becomes the holder.
- **When holder is written:**
  - `holder` is rewritten when `playerInventoryItemChange` reports this marked stack in a player's container, and when `retain`/restore or a loss return hands the stack to a player.
  - The write is skipped when `holder` already equals that player. Writing a slot raises another change event, and the equality check stops the loop.
  - The Equippable off-hand slot raises no inventory event. The off hand is read at the points where it matters: death retention, and a swap back into the container.
- **Parsing:**
  - `parseMark` accepts v2 marks, which have no `gen`/`holder`, and v3 marks.
  - A `holder` that is present but not a string makes the mark **malformed** (undefined), the same as a bad `ownerName` today.
- Stamping clones the stack and never mutates the input (`markSword` semantics).
- A stale `gen` means the stack is not live: it cannot cast, is not retained, is not returned, and is deleted on its next player-inventory event (`r005`).





### AbilityState: cooldown record + busy flag (per player × abilityKey) (L0-lgnd-ent3)

---
is_a: ["entity"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r003", "L0-lgnd-r009", "L0-lgnd-ad05", "L0-sprj", "L0-stgt"]
---
# AbilityState: cooldown record + busy flag (per player × abilityKey)

## Cooldown deadline (durable)
- Player dynamic property `andrew:cd_<abilityKey>` holds the epoch **millisecond** at which the ability is ready again (`registry.ts` `cooldownKey`).
- **Clock:** `Date.now()`, as shipped. `world.getAbsoluteTime()` stops with `dodaylightcycle false` (measured on BDS 1.26.51.1: it stayed at 385 while `currentTick` ran 1445 → 1465). `system.currentTick` restarts at zero with the script engine. Both are forbidden for deadlines.
- A missing or non-number value reads as 0, i.e. ready. A leftover tick-based value also reads as long expired.
- The 0.3.x key `andrew:ws_cooldown_until` is not read. A sword cooling at the 0.3.x→0.4.0 upgrade reads ready (≤ 30 s lost once, accepted by `L0-adr-wpn2`, `cx07`).

## Busy flag (durable)
- A durable `andrew:busy_<abilityKey>` deadline (`ad07` §2, `cooldown.ts:61-71`), not an in-memory Set.
- Set by `setBusy(player, key, durationMs)` when a multi-tick ability starts (a Scythe volley). Cleared on resolution or once the deadline passes.
- Survives a restart (unlike the pre-`ad07` in-memory design).
- Also cleared on `playerLeave` for that player, as a safety net behind ASM-023.

## API (the only one; `L0-lgnd-r001`)
| Call | Semantics |
|---|---|
| `isReady(p, k)` | `remaining(p, k) == 0`. Never mutates (`cooldown.ts:39-41`). |
| `isBusy(p, k)` | busy-deadline membership. |
| `setBusy(p, k, durationMs)` | the only busy writer. |
| `start(p, k)` | deadline = now + `def.cooldownMs`. Does not check readiness. Callers: the ability owner only. |
| `remaining(p, k)` | ms left, clamped ≥ 0. The HUD shows whole seconds rounded up. |

Compatibility exports keep their shipped names and behaviour: `isReady(player, abilityKey = "web_sword")`, `startCooldown`, `remainingTicks`, `DEFAULT_ABILITY_KEY` (`L0-lgnd-ad06`).





### LegendaryLedger: pending (death), generation, owed (loss) (L0-lgnd-ent4)

---
is_a: ["entity"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p002", "L0-lgnd-p003", "L0-lgnd-r005", "L0-lgnd-r008", "L0-lgnd-ad11", "L0-lgnd-cx11", "L0-adr-wpn2"]
---
# LegendaryLedger: pending (death), generation, owed (loss)

Durable state that makes retention and return idempotent.

| Record | Scope / key | Value | As built (2026-09-29) | v3 target |
|---|---|---|---|---|
| Pending on death | player `andrew:<p>_pending` | one serialized mark | same | **One mark per weapon** (`wpn2` cx10 ruling b). Unchanged format. |
| Generation | world `andrew:<p>_gen:<id>` | int, absent = 0 | **missing** | Written only by loss return (`p003`) |
| Owed returns | world `andrew:<p>_owed` | map `ownerId → mark` | map | Map `holderId → [ {mark, reason, holderName} ]`. The key is the **return target** (`holder ?? owner`). A 0.3/v2 single-mark value is read as a one-element list. |

## Semantics
- Pending and owed entries are **tokens**. A grant happens only while a token exists. The token is removed in the same turn as the `addItem`. If the target already carries that `(id, gen)`, the token is dropped without a grant (`carriesInstance`).
- A `gen` bump and its owed append or online grant happen in one synchronous turn.
- Nothing lowers `gen`. `reset` touches neither `gen` nor the owed list.
- A move made by `protectLegendariesIn` (`p008`) is **not** a loss. It writes no ledger entry and bumps no `gen`, because the original stack is moved, not copied.
- No locations are recorded. It is not a census (C-4).
- Size is bounded by lost instances (`as06`). With three weapons, that is three owed keys.





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
- `chestRole` — for bast: treasure (3 chests, central) or other (7 chests, distributed); for wrdn: n/a, all 40 chests use the same table

**Relationships:** consumed by `L0-loot-p002`; chest count/position is owned by `L0-wrdn`/`L0-bast`, not this component.





### Magnet element and held player (transient, never persisted — C-23) (L0-magn-eelm)

# Magnet element and held player (transient, never persisted — C-23)

## Element (non-player)
| Attribute | Meaning |
|---|---|
| `entity` | The moved entity: an item, mob, minecart or armour stand. Block and container sources are already materialised as item entities. |
| `cls` | 1 ground item · 2 container stack · 3 mob/minecart · 4 built block · 5 ore · `X` exempt drop |
| `origin` | Where it was picked from. Used for nearest-first ordering and for logs. |
| `slot` | The index of its ring position (angle = 2π·slot/n, plus a slow rotation). |
| `arrived` | True once it has reached its slot; before that it moves at the flight speed (`L0-magn-asfl`). |

- The set is fixed at magnet-on: at most 10 counted elements, plus any number of `X` elements.
- An element whose entity becomes invalid (picked up, killed, despawned) is dropped from the set. Its slot is **not** refilled from new candidates.

## Held player (not counted)
| Attribute | Meaning |
|---|---|
| `player` | A Player in the zone and not in Creative or Spectator. |
| `pulling` | Recomputed every tick: is iron in the main or off hand? |

- There is no stored state beyond the event: when a player leaves the zone or stops holding iron, they are simply not pulled that tick.

## Magnet session
`{eventId, centre, hoverY, zone, elements[], startedTick}` exists only from magnet-on to release. On a restart nothing is rebuilt (`L0-adr-ufom`).





### Iron classification (UFO §4) (L0-magn-eirn)

# Iron classification (UFO §4)

Built once at module load from `ItemTypes.getAll()` / `BlockTypes.getAll()`, filtered by explicit id patterns (`L0-xasm15`). A GameTest asserts that every expected id resolves on 1.26.51; a missing id fails the build.

## IRON_ITEMS (ground items, container stacks, player hands)
- **Materials:** iron_ingot, iron_nugget, raw_iron, iron_block, raw_iron_block, iron_ore, deepslate_iron_ore.
- **Tools and weapons:** iron_sword, iron_pickaxe, iron_axe, iron_shovel, iron_hoe.
- **Armour:** iron_helmet, iron_chestplate, iron_leggings, iron_boots, iron_horse_armor.
- **Containers:** bucket and every `*_bucket` (water, lava, milk, powder_snow, every fish and axolotl/tadpole bucket).
- **Gear:** shears, flint_and_steel, compass, shield, crossbow.
- **Minecarts:** minecart, chest_minecart, hopper_minecart, tnt_minecart, command_block_minecart.
- **Rails:** rail, golden_rail, detector_rail, activator_rail.
- **Building items:** iron_door, iron_trapdoor, iron_bars, anvil, chipped_anvil, damaged_anvil, cauldron, hopper, heavy_weighted_pressure_plate, the iron chain id (`chain` or `iron_chain` on 1.26.51), lantern, soul_lantern.
- **Not included:** copper chains or lanterns, or any other non-iron variant.

## IRON_BLOCKS (built, priority class 4)
- iron_block, raw_iron_block, iron_bars, iron_door, iron_trapdoor;
- the four rails;
- anvil, chipped_anvil, damaged_anvil;
- cauldron (any fill or liquid; the block id is the same);
- heavy_weighted_pressure_plate, the iron chain, lantern, soul_lantern.
- **The hopper is deliberately absent** (`L0-magn-adhp`).

## IRON_ORE (class 5)
iron_ore, deepslate_iron_ore.

## CONTAINER_BLOCKS (class 2 source, not pulled themselves)
- chest, trapped_chest, barrel, hopper;
- furnace, blast_furnace, smoker;
- dispenser, dropper, brewing_stand;
- every placed shulker box id (undyed plus 16 colours).
- The crafter is excluded: it has no inventory in the API (U5).

## IRON_ENTITIES (class 3)
- `minecraft:iron_golem`, and every minecart entity type.
- Any mob or `armor_stand` wearing iron_helmet, iron_chestplate, iron_leggings or iron_boots, read through hasitem (`L0-magn-adar`).
- Ignored: iron in a mob's hand, and a horse's iron_horse_armor in its body slot. Not in the spec's slot list; an assumption, `L0-magn-asbd`.

## Scan types
The `getBlocks` `includeTypes` list is IRON_BLOCKS ∪ IRON_ORE ∪ CONTAINER_BLOCKS, about 40 ids. U7 measured 22 ids at 9 ms, so this list must be re-measured (`L0-magn-atps`).





### Entity · Orbital Cannon item (`andrew:orbital_cannon`) (L0-orbc-ent1)

# Entity · Orbital Cannon item (`andrew:orbital_cannon`)

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["entity"]` · `relates_to: ["L0-orbc-r001", "L0-orbc-r002", "L0-xcx13", "L0-adr-orbc"]`

## Item JSON (`packs/behavior/items/orbital_cannon.json`)
| Field | Value | Why |
|---|---|---|
| `identifier` | `andrew:orbital_cannon` | A custom item, because fishing is hard-wired into `minecraft:fishing_rod` (`xcx13`) |
| `menu_category.category` | `equipment` | Spec §4 |
| `menu_category.group` | none (`as07`) | There is no rod group to join |
| `display_name` | `item.andrew:orbital_cannon.name` | Lang |
| `icon` | `fishing_rod` (the vanilla atlas entry, **no custom texture**) | §2 |
| `hand_equipped` | true | Held rod-like (`xcx13`, iPad check) |
| `max_stack_size` | 1 | Legendary |
| `allow_off_hand` | true | The HUD shows the Cannon in either hand. See `L0-lgnd-cx08`. |
| `durability` | **absent** | Infinite durability |
| `enchantable` | **absent** | Neither the table nor the anvil accepts it |
| `damage` | **absent** (`as08`) | Empty-hand punch |
| `digger`, tool tags, `use_modifiers`, `shooter`, `throwable` | absent | No fishing, no mining speed, no use animation |

## `LegendaryDef` (in `src/legendary/registry.ts`, `L0-adr-orbc` §1)
- `itemId: andrew:orbital_cannon`, `keyPrefix: "oc"`, `abilityKey: "orbital_cannon"`.
- `nameKey: item.andrew:orbital_cannon`.
- `cooldownTicks: 600`, `craftGate: true`.
- `refund [[minecraft:tnt,4],[minecraft:fishing_rod,1]]`.
- `textPrefix: andrew.orbital`, `command: andrew:orbital`.

## Persistent keys (derived, owned by `lgnd`)
- Item: `andrew:oc_origin|owner|id|owner_name`.
- World: `andrew:oc_crafted|crafted_by`.
- Player: `andrew:oc_pending`, `andrew:cd_orbital_cannon`.





### Entity · Attack (with its Target Lock) (L0-orbc-ent2)

# Entity · Attack (with its Target Lock)

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["entity"]` · `relates_to: ["L0-orbc-ent3", "L0-orbc-p001", "L0-orbc-ad03"]`

The attack is an in-memory record made by one successful activation (`p001`). It is **never persisted** (`ad03`, §11).

| Attribute | Type | Notes |
|---|---|---|
| `attackId` | string | Unique per server session, e.g. `oc-<tick>-<seq>`. It is also the tag on every charge. |
| `mode` | `"lmb" \| "rmb"` | Which effect `onDetonate` routes to |
| `ownerId` | string | `Player.id` at activation. It is kept even when the owner dies, leaves or changes dimension (`r010`). |
| `dimensionId` | string | Fixed at activation. Charges never leave it. |
| `target` | `{x,y,z}` int | **Target lock**: the hit block's location and the face it was hit on. It is frozen at activation and never re-read from the player. |
| `face` | `Direction` | Recorded for diagnostics only. The column/ring centre is the block's (x, z), whichever face was hit. |
| `spawnY` | int | From `r007` |
| `charges` | `Charge[]` | LMB: 1. RMB: ~160 from `ring`'s layout (`xasm8`). |
| `createdTick` | int | For the safety timeout (`p002`) |

**Invariants**
- The attack is created in the same tick as the cooldown write and the charge spawn.
- It is removed when `charges` is empty, whether each charge detonated, fell into the Void, was lost or timed out.
- There is no path from the attack back to the cooldown. Removing an attack never refunds.





### Entity · Orbital Charge (`andrew:orbital_charge`) (L0-orbc-ent3)

# Entity · Orbital Charge (`andrew:orbital_charge`)

**Links:** `part_of: ["L0-orbc"]` · `is_a: ["entity"]` · `relates_to: ["L0-adr-ochg", "L0-orbc-ad02", "L0-orbc-r008", "L0-orbc-p002"]`

## Pack definition
**Behavior pack** (`entities/orbital_charge.json`):
- `is_summonable: true`, `is_spawnable: false`, no spawn egg.
- `minecraft:collision_box` 0×0 (entities pass through).
- `minecraft:physics` with `has_gravity: false, has_collision: false`.
- `minecraft:pushable {is_pushable:false, is_pushable_by_piston:false}`, `knockback_resistance 1`.
- `minecraft:damage_sensor` that ignores all damage, so blasts cannot destroy it.
- No `minecraft:persistent`. It is not a mob, so it never naturally despawns (see memory "nameTag ≠ despawn protection"). Cleanup is scripted (`p003`).

**Resource pack** (`entity/orbital_charge.entity.json`):
- The vanilla TNT block geometry and texture.
- Scale through a property `andrew:scale` (int enum `0=rmb 1.0`, `1=lmb 1.2`), read in the render controller.
- The RP is needed only for this visual (§12, "RP only if needed").

## Script state (in memory, per charge)
| Attribute | Notes |
|---|---|
| `entity` | An `Entity` ref. `isValid` is false after an unload → lost (`r011`). |
| `attackId` | Also set as the entity tag `andrew:oc_attack:<id>`, plus the static tag `andrew:oc_charge` |
| `x, z` | Block-column centre (+0.5). Constant. |
| `y` | The current feet Y. It decreases by `FALL_SPEED` each tick (`as02`). |
| `slot` | Index within the attack (RMB ring position) |

**Lifecycle:** spawned → falling → one of: detonated | voided | lost | timed-out → removed. It never re-enters "falling".





### Entity: MinersPickaxeItem (L0-pick-ent1)

# Entity: MinersPickaxeItem

**Identifier:** `andrew:miners_pickaxe` (namespace `andrew:`, per project-wide naming rule).

**Attributes** (from `packs/behavior/items/miners_pickaxe.json`):
- `format_version`: 1.21.0
- `menu_category`: category `equipment`, group `itemGroup.name.pickaxe`
- `minecraft:display_name`: `item.andrew:miners_pickaxe.name` (localized RU/EN, see `packs/resource/texts/{en_US,ru_RU}.lang`)
- `minecraft:icon`: `andrew_miners_pickaxe`
- `minecraft:max_stack_size`: 1
- `minecraft:hand_equipped`: true
- `minecraft:enchantable`: `{ slot: "pickaxe", value: 10 }`
- `minecraft:digger`: `{ use_efficiency: true, destroy_speeds: [{ block: { tags: "query.any_tag('minecraft:is_pickaxe_item_destructible')" }, speed: 8 }] }`
- `minecraft:damage`: 4
- `minecraft:tags`: `["minecraft:is_pickaxe", "minecraft:is_tool"]`
- **No** `minecraft:durability` component (deliberate, see `L0-pick-r002`).

**Relationships:** produced by the recipe in `L0-pick-r005`; consumed as the trigger condition for the auto-smelt override in `L0-pick-r003`/`L0-pick-ent2`; its digger speed is governed by `L0-pick-r001`.





### Entity: SmeltedDropAllowList (L0-pick-ent2)

# Entity: SmeltedDropAllowList

**Type:** `Map<string, string>` (block type id → smelted item id), defined in `src/autosmelt.ts` as `SMELTED_DROPS`.

**Cardinality:** exactly 7 entries (full table in `L0-pick-r003`). Immutable at runtime — no code path adds or removes entries; changing the allow-list means editing and rebuilding the source.

**Access pattern:** `smeltedDropFor(blockTypeId): SmeltedDrop | undefined`, a pure function (no engine access) — `undefined` means "not on the allow-list," which is the signal the event handler uses to no-op and fall through to vanilla (`L0-pick-r004`). `SmeltedDrop` is `{ itemId: string; count: number }`, and `count` is hardcoded to `1` at every call site (`L0-pick-asm1`).

**Why a `Map` and not an object literal:** avoids prototype-chain lookups (`"constructor"`, `"toString"`) accidentally resolving to a truthy value for an attacker- or bug-supplied block id string.





### ColumnPlan (transient, in memory only) (L0-pntr-ent1)

# ColumnPlan (transient, in memory only)

| Attribute | Type | Meaning |
|---|---|---|
| `attackId` | string | Comes from `orbc`. It is unique per activation and seeds the PRNG. |
| `dimensionId` | string | `minecraft:overworld` / `nether` / `the_end`. |
| `cx`, `cz` | int | The column centre, which is the detonation cell's x/z. |
| `top` | int | The detonation cell's y (inclusive). |
| `bottom` | int | `heightRange.min` at planning time (inclusive). |
| `bandHeight` | int | 4, the number of layers that share one mask. |
| `masks` | `Uint8Array[]` | One 49-bit (7×7) mask per band, indexed by `(top − y) / bandHeight`. |
| `ownerId` | string | For logging only. The effect never uses it to pick damage targets. |

**Derived values.** `height = top − bottom + 1`. The number of cells is the sum of the mask popcounts per layer, about 25·height (Overworld worst case ≈ 9,600; typical surface ≈ 3,500; Nether ≤ 3,200).

**Lifecycle.** It is created in P-pntr-1 and discarded when both jobs end. It is never persisted: after a restart the column is not resumed.





### PenetratorJob (transient) (L0-pntr-ent2)

# PenetratorJob (transient)

There are two `system.runJob` generators per attack: **removal** and **wave**.

| Attribute | Meaning |
|---|---|
| `attackId` | The key. It is also used in log lines and gametest hooks. |
| `cursorY`, `cursorCell` | The removal job's progress, from top to bottom. |
| `waveTick` | 0…19 for the particle job. |
| `startedTick` | The `system.currentTick` at detonation. |
| `report` | `{scanned, removed, kept, keptProtectFailed, skippedUnloaded, containersCleared, legendariesProtected, ticksUsed}` |

**Invariants.**
- At most 2 jobs per attack, and both end on their own.
- Neither job spawns entities or writes dynamic properties.
- After the removal job ends, `report.ticksUsed` is compared with the budget in `L0-pntr-cons` and a warning is logged if it is exceeded. This is what the bds ACs read.





### CellClass (penetrator block classifier) (L0-pntr-ent3)

# CellClass (penetrator block classifier)

`classify(block) → "skip" | "keep" | "removeContainer" | "removeWaterlogged" | "remove"`

| Class | Condition | Action |
|---|---|---|
| `skip` | `block.isAir` | none |
| `keep` | liquid type id, or `typeId ∈ PENETRATOR_KEEP` (the `xasm6` list) | none, and the column continues |
| `removeContainer` | `block.getComponent("minecraft:inventory")` present | protect legendaries → `clearAll` → `setType(air)` |
| `removeWaterlogged` | `block.isWaterlogged` | `setType("minecraft:water")` |
| `remove` | anything else | `setType("minecraft:air")` |

The checks run in this order. A waterlogged container, such as a waterlogged chest, takes the container path first and then becomes water.

**Ownership.** `PENETRATOR_KEEP` is an exported `ReadonlySet<string>` in `src/orbital/penetrator-keep.ts`. A unit test pins its contents. Its header comment documents the C-16 deviation: stable 2.10.0 has no block-hardness or "unbreakable" query, so a list is the only option.





### Entity · Ring Layout (L0-ring-ent1)

# Entity · Ring Layout

**Links:** `part_of: ["L0-ring"]` · `is_a: ["entity"]` · `relates_to: ["L0-ring-p001", "L0-ring-r001", "L0-xasm8", "L0-orbc-ent2"]`

A pure value, computed once per RMB attack from the locked target by `layout(target)`. It is not persisted. `orbc` copies it into `Attack.charges` (`L0-orbc-ent2`).

| Attribute | Type | Notes |
|---|---|---|
| `centre` | `{x,z}` int | The target block's column. The hit face is ignored. |
| `rings` | `[{d, r, cells}]` | d ∈ {1,5,10,15,20}, r = d/2. `cells` is a list of `{dx,dz}` offsets. |
| `columns` | `{x,z}[]` | The union of all ring cells + centre, de-duplicated, in ring order then angle order. `slot` = index. |
| `count` | int | ≈ 141–161 (see `L0-ring-as06`). Hard cap `RING_MAX_CHARGES = 200`. |

**Invariants**
- d = 1 → exactly `{0,0}`.
- Each ring for d ≥ 5 is 8-connected and closed: every cell has exactly 2 ring neighbours in its 8-neighbourhood (no gaps, no spurs).
- |√(dx²+dz²) − r| ≤ 0.75 for every cell.
- No two columns coincide.
- The offsets are a constant table: the layout is identical for every target, and can be precomputed at module load.





### Entity · Queued Blast (L0-ring-ent2)

# Entity · Queued Blast

**Links:** `part_of: ["L0-ring"]` · `is_a: ["entity"]` · `relates_to: ["L0-ring-p002", "L0-ring-p003", "L0-ring-ad02", "L0-orbc-r014"]`

An in-memory record created by each `onDetonate(…, "rmb")` call and consumed by the detonation queue (`p003`). It is never persisted: a restart drops it, as it drops in-flight charges (§11, `L0-orbc-p003`).

| Attribute | Type | Notes |
|---|---|---|
| `attackId` | string | From `orbc`. Used only for the report and logs. |
| `dimensionId` | string | From the `dim` argument |
| `point` | `{x,y,z}` int | The contact cell (`L0-orbc-r014`) |
| `centre` | Vector3 | From `L0-ring-r010` |
| `underwater` | bool | Evaluated at blast time, not enqueue time (`L0-ring-r007`) |
| `ownerId` | string | The explosion `source` is resolved at blast time (`L0-ring-r004`) |
| `enqueuedTick` | int | For the queue-age metric and the RG-2 check |

**Invariants**
- Each blast is consumed exactly once: it either explodes or is dropped because its cell is now unloaded (C-12, counted as lost).
- The queue is FIFO across all attacks and players, so a later attack never starves an earlier one.
- A blast never touches the owner's cooldown.





### Entity · Drop-Suppression Window (L0-ring-ent3)

# Entity · Drop-Suppression Window

**Links:** `part_of: ["L0-ring"]` · `is_a: ["entity"]` · `relates_to: ["L0-ring-ad01", "L0-ring-r006", "L0-xasm7", "L0-ring-p002"]`

A transient, synchronous scope around the batch of explosions in one queue step (`p003`). It exists only inside one JS call stack and never spans a tick.

| Attribute | Type | Notes |
|---|---|---|
| `prevTileDrops` | bool | `world.gameRules.doTileDrops`, read on entry. Restored exactly, so an admin's `false` stays `false`. |
| `containerCells` | `{dim, pos, items: Map<typeId, count>}[]` | A snapshot of non-legendary container contents in the batch AABBs, taken after protection and before the explosions. Used only by the container fallback (`L0-ring-as02`). |
| `preItemIds` | `Set<string>` | The ids of item entities within 1 block of each `containerCells` pos. Fallback only. |

**Invariants**
- The window is entered and left in a `try/finally` inside the same synchronous call. Neither a `system.run` nor an `await` sits between the set and the restore. The world is therefore never saved with the toggled value (C-15 rank 1).
- A window never opens without at least one explosion inside it, so an empty queue causes no gamerule writes.
- The window changes only `doTileDrops`. It never touches `doMobLoot`, `doEntityDrops` or `keepInventory`.





### Entity · `andrew:ufo_saucer` (BP + RP) (L0-sauc-ent1)

# Entity · `andrew:ufo_saucer` (BP + RP)

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["entity"]` · `relates_to: ["L0-sauc-r003", "L0-sauc-r005", "L0-sauc-ad01", "L0-adr-ufom"]`

## BP (`packs/behavior/entities/ufo_saucer.json`)
| Attribute | Value |
|---|---|
| identifier | `andrew:ufo_saucer` |
| runtime_identifier | `minecraft:snowball` |
| format_version | `1.26.0` |
| family | `andrew_ufo`, `inanimate`. `andrew_ufo` is the family used by restart cleanup (`L0-adr-ufom` §4), plus the script tag `andrew:ufo`. |
| components | see `r003`: a 0×0 box, no gravity or collision, not pushable, knockback resistance 1, `damage_sensor all → no` |
| properties | `andrew:beam` bool (default false, `client_sync: true`); `andrew:beam_len` int [0, 64] (default 40, `client_sync: true`) |
| dynamic property | `andrew:ufo_event` = eventId (diagnostics, plus a cleanup double-check) |

## RP (`packs/resource/entity/ufo_saucer.entity.json` + geo/texture/animation/render controller)
- **Geometry `geometry.andrew.ufo_saucer`.** All units are pixels, 16 to a block.
  - `disc`: about 12 blocks across, built as stacked rings, 1.5 blocks thick at the rim (a lens profile).
  - `dome`: about 5 blocks across, ≈ 1.5 high, glass-textured.
  - `rim_lights`: 12–16 small cubes on the rim.
  - `beam`: a stepped cone of cubes, pivoted at the underside, its length scaled by `andrew:beam_len`.
  - The hull band `[y, y + 3]` contains the disc and dome (`as01`).
  - `visible_bounds_width` ≥ 14, `visible_bounds_height` ≥ 70, and an offset so the bounds span y − 64 … y + 4.
- **Materials.**
  - Opaque `entity` for the disc.
  - `entity_alphablend` for the dome and the beam (bone-pattern materials in the render controller).
  - Emissive for the rim lights (an emissive texture or `entity_emissive`).
- **Animations.**
  - `spin`: a looping Y-rotation of the `disc`/`dome`/`rim_lights` bones, ≈ 1 turn per 4 s, client-only.
  - `lights`: an optional blinking via UV or alpha.
  - The beam bone's visibility is `q.property('andrew:beam')`.
- **Texture.** Grey metal, a darker rim band, light-cyan glass, and a green beam at partial alpha.
- **Lang.** `entity.andrew:ufo_saucer.name` = НЛО / UFO, used only by `/summon` and diagnostics.

## Lifetime
- Spawned by `p001` and removed by `p001`/`p002`, by `/andrew:ufo stop`, or by `worldLoad` cleanup.
- Never saved across a restart in a meaningful way (C-23).
- At most one exists in the world (UFO AC-3, enforced by `ufoc`).





### Entity · SaucerState (in memory, `src/ufo/saucer.ts`) (L0-sauc-ent2)

# Entity · SaucerState (in memory, `src/ufo/saucer.ts`)

**Links:** `part_of: ["L0-sauc"]` · `is_a: ["entity"]` · `relates_to: ["L0-sauc-p001", "L0-sauc-p002", "L0-ufoc"]`

Nothing in it is persisted (C-23). It is rebuilt only by a new event.

| Attribute | Type | Notes |
|---|---|---|
| `eventId` | string | From `ufoc`. Key of the shoot-down latch. |
| `entity` | `Entity` | `andrew:ufo_saucer`. `isValid` is checked each tick. |
| `centre` | Vector3 | The block under the target at arrival start (`ufoc`). |
| `hoverY` | number | From `ufoc`. |
| `bearing` | radians | θ. The departure bearing is θ + π. |
| `leg` | `"arrival" \| "hover" \| "departure" \| "downed"` | The motion leg. The hover leg covers both magnet and release. |
| `legStartTick` | number | Taken from `ufoc`'s interval tick. |
| `pos` | Vector3 | The position last teleported to. It is what `saucerPosition()` returns and what the hull test uses. |
| `beamOn` | bool | Mirrors the actor property. |
| `nextHumTick` | number | |
| `downed` | bool | The latch. |
| `shooterId` / `shooterName` | string | Set at the latch. |
| `fallVy` / `fallStartTick` | number | `p002` step 5. |
| `unregister` | `() => void` | The interceptor handle (`p003`). |

**Invariants.**
- At most one `SaucerState` exists.
- `downed` implies that `shooterId` is set.
- If `entity` is invalid and not `downed`, the event aborts (`p001`).
- `pos` is horizontally ≤ 90 from `centre`.





### ScytheOfCalamity (item plus `LegendaryDef`, as shipped) (L0-scyt-ent1)

# ScytheOfCalamity (item plus `LegendaryDef`, as shipped)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["entity"]` · `relates_to: ["L0-lgnd", "L0-sitm", "L0-scyt-r009", "L0-scyt-cx03"]`

## Static (behavior pack JSON)
| Attribute | Value |
|---|---|
| identifier | `andrew:scythe_of_calamity` |
| display name | `item.andrew:scythe_of_calamity.name`: «Коса бедствия» / "Scythe of Calamity" |
| menu_category | `equipment`, group **`itemGroup.name.hoe`** |
| icon | `andrew_scythe_of_calamity` |
| max_stack_size / hand_equipped | 1 / true |
| allow_off_hand | **absent** (`L0-scyt-cx03`) |
| damage | 8 (measured equal to netherite) |
| enchantable | slot `sword`, value 10 |
| durability | none, so infinite |
| tags / digger | `minecraft:is_tool`, `minecraft:is_hoe`; digger speed 8 on `is_hoe_item_destructible` |

## `SCYTHE_OF_CALAMITY` (`src/legendary/registry.ts`)
| Field | Value |
|---|---|
| keyPrefix | `sc`, giving `andrew:sc_{origin,owner,id,owner_name,crafted,crafted_by,pending}` and `andrew:sc_owed` |
| abilityKey | **`scythe_of_calamity`**, giving the cooldown property `andrew:cd_scythe_of_calamity` |
| cooldownTicks | 600 (30 s, stored as an epoch-ms deadline) |
| craftGate / refund | true / 2 golden apples, 2 obsidian, 1 diamond hoe |
| textPrefix | `andrew.scythe` → `.no_target`, `.first_craft`, `.craft_blocked`, `.returned`, `.admin_given`, `.reset` |
| command | `andrew:scythe` (admin give and reset) |

## Per-player state
- Cooldown deadline `andrew:cd_scythe_of_calamity` (epoch ms).
- Busy deadline (`busyKey`, epoch ms). It is set to launch + 11 s (220 ticks) as a crash bound and cleared at every volley end. It is a **dynamic property**, not memory-only.
- `andrew:hidden_until` (read when the player is a target; written by `/andrew:hide` or a future Shadow Blade).





### Volley (in-memory flight record) — replaces the proposed TargetLock (L0-scyt-ent2)

# Volley (in-memory flight record) — replaces the proposed TargetLock

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["entity"]` · `relates_to: ["L0-scyt-p002", "L0-sprj"]`

There is no separate TargetLock record. `selectTarget` returns an `Entity` (a player **or** a mob), and `launchVolley(owner, target)` builds this record. It is stored in `active: Map<ownerId, Volley>` (`src/scythe/volley.ts`) and never persisted.

| Attribute | Type | Notes |
|---|---|---|
| owner / ownerId | Player / string | The owner handle is kept, and `isValid` is checked before use |
| target | Entity | Player or mob. `label()` logs the nameTag or typeId |
| dimensionId | string | The owner's dimension at launch. The target must stay in it |
| launchPoint | Vector3 | A copy of `owner.location`, frozen. It is the leash centre |
| age | ticks | Since launch. Past 200 → `timeout` |
| fired / flying | number / `{position}`[] | Projectile *i* spawns at tick `10·i` from `launchOrigin` (the owner's current feet + 1.2, or launchPoint + 1.2 if the owner is gone) |
| hits | number | Drives the cooldown verdict |
| runId | number | Its own `system.runInterval(…, 1)`, one per volley |
| observer | `{onHit, onEnd}` | The wrapper arms the cooldown on hit 1. GameTests hook in here |

**Invariants:**
- at most one volley per owner (`launchVolley` returns false otherwise);
- `projectiles ≤ 3`;
- the aim point is `target.location + (0, 1.0, 0)`, re-read every tick.





### ScytheActivationOutcome — press outcomes and volley `EndReason` (as shipped) (L0-scyt-ent3)

# ScytheActivationOutcome — press outcomes and volley `EndReason` (as shipped)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["entity"]` · `relates_to: ["L0-scyt-p001", "L0-scyt-p002", "L0-scyt-r007"]`

**Press level** (`targeting.ts`):
| Outcome | When | Cooldown | Visible |
|---|---|---|---|
| ignored | Same player already handled this tick, or not a Scythe stack | – | nothing |
| not dispatched | `resolveActivation` did not pick the Scythe (cooldown, busy, hand priority) | unchanged | HUD |
| `NO_TARGET` | `selectTarget` returned nothing | **none** | «Здесь нет цели» |
| `LAUNCHED` | A target was found → `launchVolley` | see below | log line |

**Volley `EndReason`** (`volley-rules.ts`). The verdict is always `hits > 0 ? full : none`:
| Reason | Trigger |
|---|---|
| `spent` | All 3 fired and none are still flying |
| `out_of_radius` | Horizontal distance > 20 from launchPoint |
| `timeout` | age > 200 ticks |
| `target_invalid` | The target is invalid, in another dimension, or at hp ≤ 0 (includes a kill by the Scythe) |
| `error` | A tick threw. `volleyTickErrors()` counts these |

**No `OWNER_INVALID`:** if the owner dies or leaves, the volley flies on from the launch point. The cooldown is written only if the owner is still valid at hit 1 or at the end.





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
- `chests.length` and guard counts are asserted by the template test against the spec counts: Windmill 25 (5/8/12), Airship 10, Warden City 40 (12 central), Bastion 10 (3 treasure).
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





### E-ufoc-1 · UFO durable schedule state (world dynamic properties) (L0-ufoc-ent1)

# E-ufoc-1 · UFO durable schedule state (world dynamic properties)

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["entity"]` · `relates_to: ["L0-adr-ufom", "L0-ufoc-ad03", "L0-ufoc-cx01", "L0-ufoc-r001"]`

This is the only UFO state that survives a restart (C-23, `L0-adr-ufom` §2).

| Property | Type | Values | Meaning |
|---|---|---|---|
| `andrew:ufo_next_ms` | number | absent | No first join seen yet (`L0-xasm14`). The next `initialSpawn` writes now + U(10, 20) min. |
| | | `> 0` | Epoch ms (`Date.now()`) of the next arrival. A value in the past means "due"; the event waits for an Overworld player. |
| | | `0` | The **in-flight marker** (`ad03`): an event is live. It is written at arrival start and replaced with now + 15 min when the event ends. |
| `andrew:ufo_enabled` | boolean | absent or `true` | The event runs. The default is on (UFO §9). |
| | | `false` | No automatic arrival. Written by `/andrew:ufo disable`. |

**Invariants**
- `next_ms` is written only by `ufoc`, in `schedule.ts`.
- Every event end path (pause, downed, stop, abort, restart) writes `next_ms = now() + PAUSE_MS`, where `PAUSE_MS` = 900 000 (`r001`).
- Neither property holds anything about a phase, the centre or the target. That information lives in `ent2`, in memory only.
- Writes go through the `DynamicPropertyStore` already used by `strf` in `src/main.ts`.





### E-ufoc-2 · Live event session (in memory only) (L0-ufoc-ent2)

# E-ufoc-2 · Live event session (in memory only)

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["entity"]` · `relates_to: ["L0-adr-ufpc", "L0-sauc-ent2", "L0-xasm17", "L0-ufoc-p002"]`

There is at most one session at a time (UFO §2). It exists from arrival start to the end of the event, and it is never persisted (C-23).

| Field | Type | Notes |
|---|---|---|
| `eventId` | string | `${now()}-${random}`. It is unique per script load, so after a restart no entity's `andrew:ufo_event` can match (`L0-xasm17`). |
| `phase` | `arrival` \| `magnet` \| `departure` \| `downed` | `release` is instant and `pause` means no session, so neither is ever stored. |
| `phaseTick` | int | Ticks elapsed in the current phase. It is advanced only by the UFO interval. |
| `centre` | `{x, y, z}` int | The block under the target's feet at arrival start, frozen (`r002`). |
| `hoverY` | number | `r003`. It is computed once and passed in every `onPhase`. |
| `targetId` | string | Informational only. The event goes on if the target leaves or dies (UFO §10). |
| `source` | `schedule` \| `command` | Whether the event was started by the schedule or by `/andrew:ufo come`. |
| `offLatch` | `undefined` \| `shot` \| `stop` \| `abort` | Set by `requestMagnetOff(reason)`. Consumed at the start of the next interval tick (`adr-ufpc`). The first reason wins. |
| `magnetOn` | boolean | Set when the magnet phase starts and cleared by the release. Step 1 of `p002` releases the magnet on this flag, not on `phase`, because a shoot-down moves `phase` to `downed` before the latch is consumed (*reduce v5*, `L0-adr-ufsd`). |
| `downedHandled` | boolean | Makes `reportShotDown` idempotent per `eventId`. |

The phase durations come from the environment seam's table (`ad01`): `{arrival: 400, magnet: 1200, departure: 300, downed: 60}` in ticks, and `PAUSE_MS: 900000`.





### WebSwordItem (L0-webs-ent1)

---
is_a: ["entity"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-r001", "L0-lgnd-ent1"]
---
# WebSwordItem

The Web Sword's own item definition — the per-weapon payload registered into `L0-lgnd`'s shared `LegendaryDef` registry (`L0-lgnd-ent1`), not a separate identity system.

**Attributes.**
- `id`: `andrew:web_sword`
- `baseDamage`: mirrors the current BDS build's vanilla `diamond_sword` melee damage (read at build/implementation time, not hard-coded from an assumed value)
- `durability`: none — infinite, item never breaks
- `enchantable.slot`: `sword`
- `menuCategory`: equipment / sword group; visible in Creative "All" and Creative Search; `/give`-able
- `recipe`: shaped, 4× `minecraft:web` + 1× `minecraft:diamond_sword` (any durability/enchantment) around empty corners → 1× `andrew:web_sword`; the sword ingredient's durability/enchantments are consumed, not transferred

**Relationship to the framework.** The craft-gate (one-per-world), the instance mark (`L0-lgnd-ent2`) and death retention that make a *specific crafted copy* legendary are all `L0-lgnd`'s. `WebSwordItem` here is only the static item-type definition (`web_sword.json` + `recipe.json`), shared by every copy (crafted, admin-given, or creative).





### TargetResolution (L0-webs-ent2)

---
is_a: ["entity"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-r002", "L0-webs-p001"]
---
# TargetResolution

The transient result of resolving a cast's aim into a single center cell. Not persisted — computed fresh per cast.

**Attributes.**
- `hitType`: `block` | `entity` | `none`
- `hitReachBlocks` (≤5) / `hitReachEntities` (≤3): the reach limits actually applied
- `hitFace` (when `hitType = block`): the struck block face, used to derive the adjacent air cell
- `hitEntityId` (when `hitType = entity`): the struck entity; wins ties over a simultaneously-hittable block
- `centerCell`: the resolved `{x,y,z}` used as the 3×3×3 cube's center (only present when `hitType ≠ none`)

**Invariant.** When `hitType = none`, no `centerCell` exists and no cube is ever built (`L0-webs-r002`).





### TrapCube (L0-webs-ent3)

---
is_a: ["entity"]
part_of: ["L0-webs"]
relates_to: ["L0-webs-r003", "L0-webs-r004", "L0-webs-p001"]
---
# TrapCube

The 27-candidate-cell volume evaluated for one cast. Transient — exists only for the duration of the placement step.

**Attributes.**
- `center`: from `TargetResolution.centerCell`
- `cells[27]`: each cell's `{position, status}`, where `status` ∈ `filled` (newly placed Cobweb) | `already-satisfied` (was already Cobweb) | `skipped-protected` (inventory/block-entity/indestructible-special, `L0-webs-r004`) | `skipped-entity` (living entity present) | `skipped-unloaded` (cell outside the loaded/accessible area)
- `successCount`: count of cells with status `filled` or `already-satisfied`
- `outcome`: `success` (`successCount ≥ 1`) | `no-room` (`successCount = 0`, `L0-webs-r005`)





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





### Entity — `SpawnWindmillRecord` (`andrew:st:spawn`) (L0-wind-e002)

# Entity — `SpawnWindmillRecord` (`andrew:st:spawn`)

**Links:** `part_of: ["L0-wind"]` · `is_a: ["entity"]` · `relates_to: [L0-strf-e002, L0-wind-r011, L0-wind-p002, L0-wind-p003]`

A single world dynamic property, owned by `wind`, written through the `strf` store API (C-6). Compact JSON, well under 1 KB.

```ts
interface SpawnWindmillRecord {
  v: 1;
  status: "searching" | "preparing" | "done" | "failed" | "skipped";
  spawn: [number, number];          // world spawn x,z captured at first start (never re-read)
  stage?: 1 | 2 | 3;                // 1 = 5×5 chunks, 2 = ring ≤500, 3 = forced prep
  cursor?: { ring: number; window: number };  // resume point while searching
  best?: { o: [number,number,number]; r: 0|1|2|3; score: number }; // best forced-prep candidate so far
  plan?: string;                    // hash of the SitePrepPlan being applied (status "preparing")
  origin?: [number, number, number];
  rot?: 0 | 1 | 2 | 3;
  prepared?: boolean;               // true if forced prep ran
  reason?: string;                  // "no-dry-land", "interrupted: …", "error: …", "placement …"
}
```

## Invariants
- Created once, on the first world load with the add-on. `done` and `failed` are terminal and never re-run, even if the Windmill is later destroyed (§4.7.13, §2).
- `spawn` is captured once. A later `/setworldspawn` does not move or add a Windmill.
- The placed instance lives in the regular registry with id `windmill:spawn`; this record only holds the search state and outcome. Registry is authoritative for "exists" (`L0-strf-r008`).
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

One per generated city. Written once at successful placement; the instance is an `L0-strf-e002` InstanceRecord, and idempotency is `L0-strf-r008`.

**Attributes**
- `instanceId` — stable key derived from anchor chunk coordinates (dimension is always Overworld, so no dimension field needed).
- `anchorPosition` — world position of the template's placement anchor (pre-rotation origin).
- `rotation` — one of `0 | 90 | 180 | 270`, chosen once at generation.
- `topY` — integer in `[-45, -35]`, chosen once at generation, independent of the candidate roll.
- `footprintApprox` — fixed constant, `[63, 20, 63]` (`WARDEN_CITY_SIZE`), documented for reference (not stored per instance; same for every city).
- `surfaceMarkerPosition` — surface coordinate of the ~5×5 sculk patch, derived from `anchorPosition` + `rotation`.
- `centralHallBounds` / `monumentBounds` — derived from the fixed template + rotation; used for the "digging down from marker hits the hall" guarantee (`L0-wrdn-rul3`).
- `state` — `L0-strf-e002` states; the candidate is `L0-strf-e003` and is never persisted (no relocation, per `L0-wrdn-rul1`).
- `placedAtTick` / `placedAtTimestamp` — for persistence/idempotency auditing.

**Relates to:** `L0-wrdn-ent2` (chests), `L0-wrdn-ent3` (shriekers) — both keyed by `instanceId`.

**Invariant:** exactly one `MiniWardenCityInstance` per anchor chunk; a reload must find the existing record and skip re-placement (`L0-strf-r008`, `L0-strf-r002` §3).





### Wrdn ent2 concept entity (L0-wrdn-ent2)

## WrdnChest

Exactly 40 per `MiniWardenCityInstance` (`L0-wrdn-ent1`).

**Attributes**
- `chestId` — 1..40, fixed slot in the template.
- `zone` — `central` (exactly 12) or `outer` (exactly 28).
- `positionOffset` — position relative to the template anchor, rotated with the instance.
- `lootTableRef` — always the vanilla Ancient City loot table; never the shared Windmill/Airship weighted table (`L0-wrdn-rul6`).
- fill state = registry `looted`; the container itself is the loot state (`L0-strf-r008` §4).

**Invariant:** `zone=central` count is always exactly 12 and `zone=outer` count is always exactly 28, for every instance (`L0-wrdn-rul6`, raw AC 48).





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
**Status:** shipped in v1.2.0 (af024e4) — `src/structures/bodies/airship.ts`, template `src/structures/templates/airship.ts` → `andrew:airship`.

## Responsibility
`airs` is a *body* component on top of the `strf` contract layer, at the same level as `wind`. It supplies the Airship's `StructureDef` and hooks, and owns the two Airship-only decisions `strf` explicitly delegates to it: the parameters of its own validity profile, and the ring policy + "not above the Windmill" exclusion for the linked search (`L0-strf-d004`, `L0-strf-r002` item 5). It must not restate generation, persistence or loot rules; it references `strf-*`/`loot-*` by id.

1. **Template** (`L0-airs-e001`, `-r001`). One fixed `.mcstructure` (`L0-adr-tmpl`): 75×18×13 (`AIRSHIP_SIZE`; envelope 73×13×13, gondola 13×7×4; spec §5.1's ≈15×7×10–12 superseded by the operator 2026-09-27, AIRS-SCALE-01-AA), modern grey/light-grey concrete, glass windows, no decay (no vines/cobwebs/cracks). Lower hull = elongated oval gondola with 1 central corridor + 4 small rooms, 2 opposite doors, one ceiling lamp per room. Upper hull = fully decorative oval balloon, no chests/spawner inside it. No ground-access aid (no ladder/lift/waterfall/teleport to the ground). Only rotation varies (`L0-strf-r004`).
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
- **"Run the linked check once" (§7) vs the loaded-footprint guarantee** (`L0-strf-r007`, C-12): Resolved: ring loaded through temporary ticking areas; `pending` only when loading fails (decision-l0-airs-cx01, b619e55).
- **Door placement on the two "opposite sides"** is not disambiguated by the spec (long axis vs short axis) — assumed long axis (`L0-airs-as01`).
- **Ring-candidate sampling pattern** inside [40,100] is not specified by the spec beyond the two radii — assumed (`L0-airs-as02`).
- Spawner light threshold and the iron-axe Vindicator are shared unknowns already tracked by `strf`'s probe (`L0-strf-p006` items 1, 6).





### Mini Bastion — Nether custom structure (20×20×10-12, lava treasure room, one-time Piglin garrison) (L0-bast)

# Mini Bastion — Nether custom structure (20×20×10-12, lava treasure room, one-time Piglin garrison)

**Responsibility:** Generate a compact, self-contained custom Nether structure that reads visually as a small Bastion Remnant, on a fixed ~20×20×10-12 template with 2-3 levels, a central lower lava treasure room, and a one-time-only garrison of Piglins/Piglin Brutes. Belongs to the "four custom structures" family defined in `docs/Four_Structures_Spec_RU_EN_copy.docx` §14 (normative) and §15/§16 (shared addendum), alongside sibling components Windmill (`L0-wind`), Airship (`L0-airs`) and Mini Warden City (`L0-wrdn`).

**Inputs:**
- Nether chunks that the player-position discovery pass `L0-strf-p001` puts in the queue (`L0-adr-strc`: the stable API has no chunk-generated event).
- Physical placement context: local terrain/support at the candidate site, and the set of already-known generated structures (vanilla + custom) for overlap testing.
- Stable `@minecraft/server` Script API only — no Experiments (per §15 shared rule, inherited across all four structures).

**Outputs:**
- A placed structure instance: fixed template, footprint ~20×20, height ~10-12, 2-3 internal levels, random rotation 0/90/180/270.
- 10 fixed chests populated once (3 treasure + 7 regular), 2-4 random Gold Blocks in the treasure room.
- A persistent one-time garrison: 7-10 Piglins + exactly 2 Piglin Brutes.
- World-state edits (blocks, lava, mob spawns) that behave as ordinary mutable world state from that point on — no regeneration, ever.

**Scope boundary:** Mini Bastion is Nether-only and independent of the Overworld pair (Windmill/Airship). It shares only the family-wide invariants in §15 (random rotation, no-Experiments implementation preference, structure-overlap cancellation, universal persistence-after-restart) and does **not** use the Windmill/Airship custom weighted loot system (§3) — it consumes real vanilla Bastion Remnant loot tables instead, the same choice Mini Warden City makes for the vanilla Ancient City table. This component has no functional dependency on the Scythe of Calamity / legendary-weapons tree already present in this KV (`L0-scyt`, `L0-sprj`, `L0-sitm`) — that is a different feature area of the same add-on.

**Key characteristics (see child rules/entities for detail):**
- 5% candidate chance per suitable Nether chunk; no relocation on a failed site-suitability check (`L0-strf-r002`).
- Rejects lava-ocean sites and sites lacking solid support (profile `netherFloor`, `L0-xasm4` §3).
- Rejects candidates that physically intersect any other detected structure, custom or vanilla (including a real Bastion Remnant) — existing structures are never damaged to make room (`L0-strf-r006`).
- Central/lower treasure room surrounded by ordinary (non-special) lava, reachable either by building a safe path through the lava area or by descending/falling from the upper level.
- Guard roster is spawned exactly once per bastion instance, is fully persistent (no despawn by distance, chunk unload, or restart) until killed, and is never replenished (`L0-strf-r009`).
- Initialization is idempotent: re-loading the chunk must not create a second set of chests, gold blocks, or mobs (`L0-strf-r008`).

**Relates to:** `L0-wind` (Windmill), `L0-airs` (Airship), `L0-wrdn` (Mini Warden City) — siblings in the same four-structure family; overlap-cancellation and the §15 shared addendum are the concrete coupling points. All four ship in v1.2.0.

Probe dependencies (`L0-strf-p006`): 1, 2, 4, 5 (+8, 9 through `strf`); PASS (5 partial), `docs/structures/probe-results.md:13-17`.

**Sources:** `fourstructuresspecruencopy-part-9/10/11` (§14 Mini Bastion, §15 shared addendum, §16 English addendum).





### Component: Build & verification infrastructure (Stage 0 closed; v2 delta: structure-template pipeline) (L0-infr)

# Component: Build & verification infrastructure (Stage 0 closed; v2 delta: structure-template pipeline)

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-lgnd", "L0-strf", "L0-wind", "L0-airs", "L0-wrdn", "L0-bast", "L0-adr-tmpl", "L0-adr-strc", "L0-adr-strs"]`

## Responsibility
Turns the TypeScript source and the two static packs (`packs/behavior`, `packs/resource`) into a shippable `.mcaddon`, and proves — without a human, wherever the engine allows it — that the result actually loads and runs on real Bedrock: static (TS + JSON), a Bedrock Dedicated Server in Docker, a beta-only GameTest lane with SimulatedPlayer, and a LAN cycle that gets the same build onto the iPad for the checks only a human eye can make.

Stage 0's own 5 closing criteria are unchanged and already green [src: stage-0-infrastructure, C-11]. **v2 delta** (Four Structures spec, `L0-adr-tmpl`): infra also owns the toolchain that compiles the four structure templates into shippable `.mcstructure` files, packs them into the behavior pack, and extends the BDS/GameTest verification lanes to prove — structurally, statistically, and across a restart — that structure generation and its one-time init behave as `L0-strf`/`L0-wind`/`L0-airs`/`L0-wrdn`/`L0-bast` specify. Infra builds and runs these checks; it does **not** own the roll algorithm, placement heuristic, or instance registry themselves (owned by `L0-strf`, decided in `L0-adr-strc`/`L0-adr-strs`).

## Inputs
- `src/**/*.ts`, `packs/behavior/`, `packs/resource/`, `packs/gametest/`, `packs/selftest/`, `scripts/targets.mjs` — unchanged from Stage 0.
- **New**: structure template layout sources (per-structure TS/JSON builder definitions): `src/structures/templates/*.ts`, read by `scripts/build-structures.mjs` (`templatesDir`, :22).
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
- CTR-4 — closed 2026-09-24 by `decision-resolve-cool-ctr4`.
- Statistical-check sample size/tolerance and the exact restart mechanism for the idempotency check are infra's own defaults, not spec'd (`L0-infr-as03`, `L0-infr-as04`).

## Boundary
Owns (v2 addition): the structure-template compiler and its round-trip test; packing `structures/` into the behavior pack (already covered by the existing whole-directory zip); the BDS/GameTest lanes that measure structure placement correctness, statistical chunk-roll rate, and restart/idempotency.
Does not own (v2 addition): the chunk-discovery loop, the roll formula/`worldSalt`, the collision heuristic, the instance registry, or loot filling — those belong to `L0-strf`/`L0-loot`; infra only exercises and measures them.
Everything else unchanged from Stage 0 (see prior boundary: build tooling, packaging, JSON/manifest validation, the Docker BDS harness, iPad delivery mechanics, version-target single source of truth; does not own weapon gameplay logic).





### Legendary weapon framework (`src/legendary/`) — v4: as-built v1.4.x + the UFO delta (L0-lgnd)

---
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0-orbc", "L0-webs", "L0-scyt", "L0-pntr", "L0-ring", "L0-magn", "L0-stgt", "L0-adr-hold", "L0-xcx9", "L0-xcx10", "L0-xcx11"]
governs_files: ["src/legendary/", "src/websword/trap.ts", "src/scythe/targeting.ts", "src/orbital/activation.ts", "src/main.ts", "src/gametest/main.ts"]
see_also: ["ufomagnetspecv1ruen-part-2", "ufomagnetspecv1ruen-part-4", "orbitalcannonspecv1ruen-part-1", "scytheofcalamityspecv1ruen-part-1", "webswordspecv1ruen-part-1"]
---
# Legendary weapon framework (`src/legendary/`) — v4: as-built v1.4.x + the UFO delta

**Responsibility.** Every general legendary rule is implemented once, for the Web Sword, the Scythe of Calamity and the Orbital Cannon:
- craft gate
- marks and generation
- death retention
- loss return
- protection from script-caused destruction
- hand priority
- cooldown and busy
- HUD
- `hidden_until`

v4 adds one consumer, the UFO Magnet (`magn`), which must never pull a legendary (UFO §4, AC 13).

## Current state (verified in code, 2026-10-02) — see `ad12`
**Shipped:**
- gen guard
- owed list
- pending list (every marked copy)
- off-hand read, with `allow_off_hand` on all three items
- craft tokens (L0-xcx9 closed)
- third def
- `protectLegendariesIn`
- `isLegendaryItemEntity`
- `fire_resistant` (fire and lava are now *prevented*)
- the v1.4.2 departure tracking ("a legendary cannot be lost in the tick it is dropped")

L0-xcx10 is closed: the remaining deviation is C-16's "return" for cactus, TNT, despawn and the Void.

**Not built:**
- **`holder`.** The return target is still `mark.owner` (`recovery.ts:440`, `:748`), so **L0-xcx11 stays open** (`cx09`, `cx11`).
- **`resolveActivation(player, mode)`.** The Cannon gates LMB to the main hand and latches same-tick activations in `orbital/activation.ts`.

The v3 "not started" statements are retired.

## v4 UFO delta
| # | Change | Artifacts |
|---|---|---|
| 1 | Publish `isLegendaryStack(stack)`: type-based over `itemId` and `craftTokenId`, any mark state | `ad13`, `gl14` |
| 2 | Magnet exclusion: no legendary stack, and no entity holder (chest/hopper minecart, armour stand) carrying one, is selected | `r016`, `as15`, `ac21` |
| 3 | A magnet pull of a hopper block protects first; the `magn` choice is open | `r016` §4, `cx13` |
| 4 | Death retention on a magnet-fall death is confirmed cause-agnostic (`entityDie` path B) | `ac22`, `as16` |
| 5 | `hidden_until` restated as epoch ms under C-21 (closes `cx03`) | `r010` |

**About `HOLDER_TYPES` and teleported holders.** `HOLDER_TYPES` is a list of block types. Recovery never watches a stack inside an entity, so a magnet that teleports a minecart or armour stand cannot break any watch. The risk is the opposite one: the magnet carrying a legendary off. `r016` closes that by exclusion, and a later destruction of such an entity spills into watched item entities (`as15`).

## Published contracts (v4)
- `LEGENDARIES`, `defForStack`, `defForToken`, and `isLegendaryStack` (new).
- `isReady`, `startCooldown`, `setBusy`, `clearBusy`, `isBusy`.
- `resolveActivation(player)`, `heldLegendaries(player)`.
- `protectLegendariesIn(dim, box, {avoid, reason}) → {moved, handedBack}`, which throws on unloaded or unreadable volumes.
- `isLegendaryItemEntity(entity)`.
- `isHiddenFromTargeting`, `hideFromTargeting`, `HIDDEN_UNTIL_KEY`.

## Does NOT own
- What abilities do (`webs`, `scyt`, `orbc`, `pntr`, `ring`).
- The magnet's selection, physics and release (`magn`). `lgnd` only states the exclusion contract.
- Item and recipe JSON.

## Next task (one `lgnd` task, for UFO)
1. Add `isLegendaryStack`, with a unit test.
2. Add the `ufo:legendary_*` GameTests for `ac21` and `ac22`, built with `magn`.
3. Separately, and blocked on the client (`L0-adr-hold`): `holder`.

## Risk
- Nested shulker and bundle contents stay invisible (`cx12`).
- A hopper minecart that collects a ground legendary triggers a return and leaves a stale copy (`as15`, `cx02` a).





### Loot system — custom weighted table + vanilla loot-table application (L0-loot)

# Loot system — custom weighted table + vanilla loot-table application

**Responsibility:** Fill every structure chest exactly once, at structure init time, with either (a) a custom weighted-random item table (Windmill, Airship) or (b) an unmodified vanilla Bedrock loot table (Mini Warden City, Mini Bastion). Owns: the 13-category weight table and its selection algorithm, equipment material/slot/enchantment rolling, and the vanilla-table dispatch for the two mini structures. Does not own: chest placement, structure templates, discovery/roll/collision (that's `strf`), or which structure gets which chest count (`wind`/`airs`/`wrdn`/`bast`).

**Inputs:** a call from the post-place init hook (`L0-adr-strc` step 5) per chest, carrying: chest block location, which structure type placed it (Windmill/Airship → custom path; Warden City/Bastion → vanilla path + table id).

**Outputs:** container contents written exactly once; frozen thereafter — nothing later re-invokes this component for the same chest (enforced by strf's instance registry, `L0-adr-strs`, not by loot itself).

**Two independent mechanisms, one scope boundary (`L0-loot-r007`):**
1. Custom weighted table (`L0-loot-p001`) — Windmill (25 chests) and Airship (10 chests) only. 5–12 attempts per chest; each attempt picks at most one of 13 categories by relative weight; category resolves to items per `L0-loot-e001`.
2. Vanilla loot-table application (`L0-loot-p002`) — Mini Warden City (40 chests, `chests/ancient_city`) and Mini Bastion (10 chests: 3× `chests/bastion_treasure`, 7× `chests/bastion_other`) only. Delegates entirely to the vanilla loot table; no custom weighting, no golden-apple cap, no curse filter — those constraints are specific to path 1.

**Cross-references:** `strf` (`L0-strf`) owns the post-place hook that calls this component and the persistence registry that guarantees "once." `wind`/`airs`/`wrdn`/`bast` own chest *placement* (counts, positions) but reference this component for chest *contents*. Both mechanisms reuse the shared structure rules in spec §2/§6/§7/§15 (persistence, idempotent init, no restoration after player destruction) only for "fill once" (`L0-loot-r006`); everything else in those sections belongs to `strf`.

**Key numbers:** 13 weighted categories; 5–12 attempts/chest; Golden Apple ≤1 success/chest, qty 1–3, never enchanted via the custom table; equipment 80/20 iron/diamond material split with random slot; enchants on the custom table are compatible, non-curse, up to vanilla max level.

**Confirmed:** the stable-API mechanism for invoking a vanilla loot table against a chest (`L0-loot-p002`) is `/loot insert` via `dimension.runCommand`, confirmed by strf-p006 Q4 re-measured PASS (`docs/structures/probe-results.md:16`); `src/structures/loot.ts` uses it — see `L0-loot-asm2`.





### L0-magn · UFO magnet effect (L0-magn)

# L0-magn · UFO magnet effect

**Status.** Not implemented. This is step 4 of the Stage 6 order, after `lgnd` v4, `ufoc` and `sauc`. It can be built against a stub `ufoc` that implements `L0-adr-ufpc`. Probes U1–U11 are on branch `probe/ufo-magnet` (`src/gametest/probe-ufo.ts`, BDS 1.26.51.1).

## Responsibility
For 60 s, everything made of iron in the magnet zone is pulled under the hovering saucer and held there. When the magnet goes off, everything is released at once. The work splits into:
- classifying iron;
- one zone scan;
- selecting at most 10 non-player elements;
- turning blocks and container stacks into items;
- moving players and elements each tick;
- releasing them.

## Inputs (the phase contract, `L0-adr-ufpc`)
- `onPhase("magnet", {centre, hoverY, saucerPos, eventId})` starts the magnet: scan, select, extract.
- `magnetStep(tick)` is called by the `ufoc` interval after `saucerStep` in the same tick. `saucerPosition()` is read only inside it, so it is already this tick's position.
- `onPhase("release")` triggers the simultaneous release. A shoot-down (`sauc`), `/andrew:ufo stop` and an abort go through `requestMagnetOff(reason)`, which latches: the release runs at the start of the next interval tick (`L0-magn-prel`).
- `lgnd`: `isLegendaryStack(stack)` is the "never pulled" predicate (`L0-lgnd-ad13`). Until `lgnd` v4 ships, the interim is `defForStack || defForToken` (`L0-magn-rleg`). Holder watching and death retention stay with `lgnd` (`lgnd-r*`); they are not restated here.

## Outputs / world effects
- Iron item entities, extracted stacks, mobs, minecarts and block items move through teleports to ring slots (r 5, 3 blocks below the saucer).
- Players are pulled through `applyKnockback` to a point 6 blocks below the saucer.
- Selected blocks become air, plus exactly one item each. Dependants resting on them pop as in vanilla (`L0-adr-ufnd`).
- On release, everything falls with vanilla physics and vanilla fall damage.

## Zone
- A cylinder of r 50 around the centre, from centre − 20 up to `hoverY`.
- Only loaded chunks count (C-12′).

## Artifacts
- **Processes:** `L0-magn-pscn` (magnet-on scan and selection), `-pext` (extraction and block → item), `-phld` (per-tick hold), `-prel` (release).
- **Entities:** `-eirn` (iron classification lists), `-eelm` (magnet element).
- **Rules:** `-rlim` (limit and priority), `-rexm` (12-block drop exemption), `-rply` (player pull), `-rcnt` (containers), `-rblk` (blocks/door/ore), `-rrng` (ring away from players), `-rrel` (release and fall), `-rleg` (legendary exclusion), `-rdup` (no-dup ordering).
- **ADRs:** `-adhp` (settles `L0-xcx18`), `-adar` (armour through tag selectors), `-adsc` (scan over loaded chunks), `-adex` (drop exemption through `entitySpawn`).
- **Contradiction:** `-cxdp` (AC-10 "nothing else drops" vs vanilla pops of dependants; resolved by `L0-adr-ufnd`).
- **Assumptions:** `-aslh` (legendary holders skipped), `-asfl` (flight speed), `-asrg` (ring margin), `-asit` (block → item), `-asbd` (horse armour, hand iron).
- **Glossary:** `-gelm`, `-gzon`, `-gring`, `-gexm`, `-gcls`, `-gtag`, `-glat`.
- **ACs:**
  - `bds` channel: UFO 4–14 → `-a04` … `-a14`, plus `-atps` (cost measured).
  - `ipad` channel: `-aipd`, one manual criterion for the smooth lift, the visible cloud and the visible fall. It is never closed by a GameTest and is reopened after every epic merge (`L0-xcx19`).

## Boundaries
- No saucer and no beam rendering (`sauc`).
- No schedule (`ufoc`).
- No change to `orbc`.
- All code lives in `src/ufo/magnet*.ts`, driven by the single UFO interval through `magnetStep` (`L0-adr-ufom`, C-5d). It creates no timers of its own. The one event subscription it holds is the drop exemption's `entitySpawn` listener, during the magnet only.





### L0-orbc · Orbital Cannon core (L0-orbc)

# L0-orbc · Orbital Cannon core

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-lgnd", "L0-pntr", "L0-ring", "L0-adr-orbc", "L0-adr-ochg", "L0-xcx8", "L0-xcx13", "L0-xq5"]`

**State (2026-09-29):** not implemented. There is no `src/orbital/` and no `andrew:orbital_cannon` item. The framework that it plugs into is shipped: `src/legendary/{registry,hands,cooldown,hud,craftgate,retention,recovery}.ts`. **Task creation is blocked by `L0-xq5`/`L0-xcx8`**, the LMB reach question.

## Responsibility
The weapon shell shared by both attacks. It covers:
- the item, recipe and lang;
- the input and the target;
- the gate that decides whether an activation succeeds;
- the shared cooldown and the HUD entry;
- the **charge**: spawn, fall, contact, Void and lifecycle.

It owns no block or entity effect. Detonation is handed to `pntr` (LMB) or `ring` (RMB) through the charge contract (`L0-orbc-r014`).

## Not owned (referenced by id, not restated)
Owned by `lgnd`:
- the craft gate and the single Survival craft (ACs 1–2, `L0-xcx9`);
- retention on death, loss/Void return of the *item* and the last holder (`L0-xcx10`/`xcx11`, `L0-adr-hold`);
- cooldown storage (`cooldown.ts`, `cooldownKey`);
- hand resolution (`hands.ts`).

Owned by `pntr`/`ring`: the column and ring effects, drops and legendary protection in the blast.

## Inputs
- `world.afterEvents.itemUse`, `itemUseOn`/`playerInteractWithBlock` (RMB).
- `world.afterEvents.entityHitBlock` with a player damager, and `beforeEvents.playerBreakBlock` cancel (LMB). See `L0-adr-orbc` and the amendment `L0-orbc-ad01`.
- `Player.getBlockFromViewDirection({maxDistance: 10})`, `Dimension.heightRange`, `entityLoad`, and world startup.

## Outputs
- A cooldown write (`andrew:cd_orbital_cannon`, 600 ticks) through `lgnd` `startCooldown`.
- `andrew:orbital_charge` entities, moved by one bounded job per attack.
- `onDetonate(dimension, point, ownerId, mode)` calls to `pntr`/`ring`.
- An Action Bar segment through the shared `hud.ts`.

## Artifacts
- **Entities:** `ent1` item, `ent2` attack/target lock, `ent3` charge.
- **Processes:** `p001` activation, `p002` flight and detonation, `p003` lifecycle and cleanup.
- **Rules:** `r001`–`r014`.
- **ACs:** Orbital AC-3/4/5/6/16/18/19 plus item, HUD, input and dedup ACs. Each is split into `bds` or `ipad` (C-9).
- **ADRs:** `ad01` target source, `ad02` charge motion, `ad03` in-memory attacks with orphan sweep.
- **Assumptions:** `as01`–`as08`.
- **Contradictions:** `cx01` HUD wording, `cx02` touch aim point, `cx03` Nether roof clamp.

## Stage-5 order
`lgnd` delta → `orbc` with a stub effect (`onDetonate` logs, plays one sound) → `pntr` → `ring`. The stub lets AC-3/4/5/6/16/18/19 go green on BDS before any block is removed.

## Constraints honoured
- C-2: stable API 2.10.0 only.
- C-5a′: no permanent tick loop; the job ends with its last charge.
- C-7′: no duplication.
- C-15: priority order.
- C-16: limitation notes go in `src/orbital/` comments.
- C-17: cooldown.
- C-19: no leftovers.
- C-20: two-player tests.





### Miner's Pickaxe probe (Stage 1: item, recipe, dig speed, enchantability, auto-smelt) (L0-pick)

# Miner's Pickaxe probe (Stage 1: item, recipe, dig speed, enchantability, auto-smelt)

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-infr"]`

**Responsibility:** One custom item, `andrew:miners_pickaxe`, that serves as the compatibility probe for the whole add-on stack (Behavior Pack + Resource Pack + stable `@minecraft/server` Script API) before Stage 2's PvP add-on is built. It proves a custom tool item can be crafted, enchanted, and given non-vanilla dig/drop behavior on the operator's actual installed Bedrock version, with nothing else in scope. [src: minerspickaxetestspec]

**Inputs:**
- Crafting-table recipe consuming 3× Iron Ingot, 2× Raw Gold, 2× Stick (see `L0-pick-r005`, `L0-pick-ent1`).
- `world.beforeEvents.playerBreakBlock` on any block, filtered to when the pickaxe is the held tool (`src/autosmelt.ts`).

**Outputs:**
- One `andrew:miners_pickaxe` item, visible in Creative (Equipment → pickaxe group) and via `/give`, RU+EN localized name.
- Diamond-pickaxe-speed breaking of any `is_pickaxe_item_destructible` block (`L0-pick-r001`).
- Pickaxe-slot enchantability without a durability component — infinite use by omission (`L0-pick-r002`).
- Auto-smelt: 7 ore/debris block ids drop their smelted product directly instead of the raw material (`L0-pick-r003`).

**Deliberately out of scope for Stage 1** (per raw spec, confirmed unchanged by the implementation): durability, Fortune multiplication of auto-smelt yield, Silk Touch override, exact parity with every diamond-pickaxe mining tag beyond the three representative tag families actually tested.

**Dependency:** gated behind Stage 0 (infrastructure) closing every criterion first — ai-kit rejects cross-epic dependencies, which is the enforcement mechanism, not a process rule anyone has to remember [src: concept-constraint C-11, `L0-infr`].

**Resolved issue inherited from raw sources (not re-filed here):** contradiction CTR-4 already covers this component — the raw spec's compatibility target (`@minecraft/server` 2.9.0 / `min_engine_version` 1.26.0) is superseded by `decision-tselevaya-versiya-bedrock-1-26-51-asm-001-q-001` (2.10.0 / [1,26,50]) and matches the live implementation. CTR-4 is closed by `decision-resolve-cool-ctr4`; the pin is enforced by `scripts/validate.mjs` against `scripts/targets.mjs`.

**Verification split** (inherited from parent, applies here): craft/digger/auto-smelt logic is proven on BDS in Docker; Creative placement, icon and RU/EN name rendering are proven only on iPad [src: concept-constraint C-6, C-9]. Both channels are green for Stage 1 — DEMO-S1, operator-accepted 2026-09-21 (see `decision-q-007-enchantable-without-durability-podtverzhde`).

**Evidence base for this deep-dive:** raw spec `minerspickaxetestspec` (`docs/Miners_Pickaxe_Test_Spec.docx`); live source `packs/behavior/items/miners_pickaxe.json`, `packs/behavior/recipes/miners_pickaxe.json`, `src/autosmelt.ts`; test coverage `src/gametest/main.ts` (`pickaxe_digs_at_diamond_speed`, `pickaxe_autosmelt`, `pickaxe_keeps_vanilla_drops`) and `src/selftest/main.ts` (`pickaxe-item-stack`, `pickaxe-enchantable`, `pickaxe-no-durability`).

**Children:** rules `L0-pick-r001`..`r005`; entities `L0-pick-ent1`, `ent2`; acceptance criteria `L0-pick-ac01`..`ac07`; glossary `L0-pick-gl01`..`gl05`; assumptions `L0-pick-asm1`..`asm3`; ADR `L0-pick-ad01`.





### LMB penetrator (`pntr`) (L0-pntr)

# LMB penetrator (`pntr`)

**Status.** Analysis only. `src/orbital/` does not exist yet (checked 2026-09-29). Stage 5 order: `lgnd` delta → `orbc` → **`pntr`** → `ring`.

## Responsibility
This component is the *effect* half of the Orbital Cannon's LMB mode (Orbital §9, §12; ACs 7–10). `orbc` owns input, the target lock, the cooldown, the charge entity, its fall and the detonation. `pntr` starts when `orbc` calls `onDetonate(dimension, point, ownerId, mode="lmb")` and owns everything after that:

1. **Plan** an irregular, roughly 5×5 vertical column. It runs from the detonation cell down to `dimension.heightRange.min` (`L0-pntr-r001`).
2. **Classify** each cell as *keep* (air, liquids, Survival-unbreakable; `L0-pntr-r002`) or *remove* (everything else, including Obsidian, Nether portal, containers and spawners; `L0-pntr-r003`). A kept cell never ends the column.
3. **Protect legendaries** in container cells before removal through `lgnd`'s `protectLegendariesIn` (`L0-pntr-r005`).
4. **Remove** the blocks with no drops (`L0-pntr-r004`), batched top-down in one bounded `system.runJob` job that looks instant (`L0-pntr-p002`, `L0-pntr-cons`).
5. **Present** the effect with exactly one loud explosion sound at detonation and a ~1 s top-down particle wave (`L0-pntr-p003`).
6. Deal **no direct damage** (`L0-pntr-r006`). Fall, lava and suffocation happen naturally.

## Inputs
- From `orbc`: `dimension`, the integer detonation `point` (the solid cell the charge touched, or the cell it spawned inside), `ownerId` and `attackId`. The attack id seeds the irregularity.
- From `lgnd`: `protectLegendariesIn(dimension, volume, {avoid})`, specified in `L0-lgnd-p008` under the shared contract `L0-adr-oprt`. `pntr` passes the column footprint over its full height, once per attack, before its first `setType`. Item frames in the column are handled by `lgnd` (`L0-adr-oprt` §3).
- Engine: `dimension.heightRange`, `Dimension.getBlock`, `Block.setType`, `Block.isWaterlogged`/`setWaterlogged`, `BlockInventoryComponent`, `Dimension.playSound`, `Dimension.spawnParticle`, `system.runJob` (all stable in 2.10.0).

## Outputs
- World mutation: column cells set to `minecraft:air` (or to water for waterlogged cells; `L0-pntr-as04`).
- Legendaries from column containers, re-dropped outside the column by `lgnd`.
- One sound event, a bounded particle job and an optional debug/gametest report `{attackId, cellsScanned, cellsRemoved, cellsKept, ticksUsed}`.
- No entities of its own. `pntr` spawns nothing that outlives the attack (C-19).

## Not owned here
- Cooldown, target lock, the charge's look and fall, the Void and unload rules: `orbc`.
- Loss return, the craft gate and the holder field: `lgnd`.
- The TNT-like explosion, damage and drop suppression: `ring`. `pntr` never calls `createExplosion` (`L0-adr-ochg` §4).

## Key decisions and open items
- `L0-pntr-ad01`: a per-cell scan plus `setType` in one top-down `runJob`, rather than `fillBlocks` or a synchronous loop.
- `L0-pntr-ad02`: a deterministic seeded mask with a 3×3 core that is always removed and ragged rims that change per band.
- `L0-pntr-ad03`: a particle wave as a separate 20-tick bounded job with capped emitters.
- `L0-pntr-cx01` (open): legendaries in **item frames** cannot be protected on stable 2.10.0.
- Assumptions `L0-pntr-as01`…`as08` cover things to probe on BDS, such as throughput, container spill, liquid flow and waterlogging.

## Sibling overlap
- `ring` shares the charge contract and the legendary protection call, but has opposite block rules: `ring` follows TNT resistance, while `pntr` ignores it.
- The `xasm6` keep list is `pntr`-only. `ring` needs no list because the engine explosion enforces resistance.
- Structure blocks (C-13) are ordinary, so LMB can core the Warden City monument (Reinforced Deepslate is removed under `xasm6`) and structure chests. Structure persistence rules allow this.





### RMB rings (`ring`) (L0-ring)

# RMB rings (`ring`)

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-orbc", "L0-pntr", "L0-lgnd", "L0-adr-ochg", "L0-xasm7", "L0-xasm8", "L0-xcx10"]`

**Status (2026-09-29).** Analysis only. `src/orbital/` does not exist, and nothing in `src/` calls `createExplosion` or writes `doTileDrops` (checked). Stage 5 order: `lgnd` delta → `orbc` → `pntr` → **`ring`**. The typings for stable `@minecraft/server` 2.10.0 expose `ExplosionOptions {allowUnderwater, breaksBlocks, causesFire, source}`. `world.gameRules.doTileDrops` is writable outside restricted execution.

## Responsibility
This component is the *effect* half of the Orbital Cannon's RMB mode (Orbital §10, §12, §15; ACs 11–15). It registers `registerEffect("rmb", …)` against the charge contract `L0-orbc-r014`, and owns:
1. **Layout.** `layout(target)` returns the charge columns for five continuous rings at d ≈ 1/5/10/15/20 (`L0-ring-r001`, `L0-ring-p001`, `L0-xasm8`). `orbc` spawns them all in one tick (`L0-ring-r002`).
2. **Detonation.** On `onDetonate(dim, point, ownerId, "rmb", attackId)`, the blast is queued. A global, bounded detonation queue drains it at ≤ `RING_MAX_BLASTS_PER_TICK` per tick (`L0-ring-p003`, `L0-ring-ad02`).
3. **Blast.** For each queued blast: protect legendaries, then one `dimension.createExplosion(centre, 4, …)`. The blast deals TNT damage, including to the owner (`L0-ring-r004`), and breaks blocks by TNT resistance (`L0-ring-r005`). It causes no fire. Underwater, it deals damage only (`L0-ring-r007`). All of this runs in `L0-ring-p002`.
4. **Drop suppression.** Broken blocks and destroyed containers leave no items (`L0-ring-r006`, `L0-xasm7`). Mob loot, XP and players' death drops stay vanilla. The mechanism is a scoped `doTileDrops` toggle (`L0-ring-ad01`). It departs from the snapshot-diff in `L0-adr-ochg` §3; see `L0-ring-cx01`.
5. **Independence and cleanup.** No blast moves, removes or triggers another charge (`L0-ring-r003`). After the attack, no ring-made entity or item is left (`L0-ring-r009`, C-19).

## Inputs
- From `orbc`: `target` for `layout`, then `dim`, `point`, `ownerId` and `attackId` per detonation (`L0-orbc-r014`). `point` is a solid contact cell in a loaded chunk.
- From `lgnd`: `protectLegendariesIn(dimension, volume, {avoid})` (`L0-lgnd-p008`) and `isLegendaryItemEntity`.
- Engine: `Dimension.createExplosion`, `world.gameRules.doTileDrops`, `Dimension.getBlock`, `Dimension.getBlocks`, `Dimension.getEntities`, `world.getEntity`, and `system.runInterval` (run only while its queue is non-empty).

## Outputs
- Column list (~140–160 `{x,z}`) per attack.
- Engine explosions. Each one plays its own sound and particles and applies damage and knockback.
- World mutation: blocks broken per TNT resistance, with no item drops.
- Legendaries in the blast AABB, moved to a safe spot by `lgnd`.
- An optional gametest report per attack: `{attackId, charges, blasts, maxBlastsInTick, ticksToDrain, itemsSuppressed, legendariesMoved}`.

## Not owned (referenced, not restated)
- Target lock, cooldown, spawn height, fall, Void/unload, orphans: `L0-orbc` (`p001`–`p003`, `r007`–`r011`).
- Retention, loss return, craft gate: `L0-lgnd`.
- The LMB column: `L0-pntr`. `ring` shares its charge contract and legendary call, but has the opposite block rule. `ring` follows TNT resistance through the engine, so it needs no keep list.

## Artifacts
- **Entities:** `ent1` Ring Layout, `ent2` Queued Blast, `ent3` Drop-Suppression Window.
- **Processes:** `p001` rasterise, `p002` one blast, `p003` detonation queue and load shaping.
- **Rules:** `r001`–`r010`.
- **Constraints:** `cons` (RG-1…RG-6).
- **ACs:** `ac11`–`ac15` (bds), `ai11`/`ai12`/`ai15` (ipad), `ac16` legendaries, `ac17` load, `ac18` cleanup and preserved loot.
- **ADRs:** `ad01` drop suppression, `ad02` queue cap, `ad03` underwater flags, `ad04` batched protection.
- **Assumptions:** `as01`–`as08`.
- **Glossary:** `gl01`–`gl05`.
- **Contradictions:** `cx01` (drop suppression in `L0-adr-ochg`), `cx02` (`lgnd` protection radius and safe-spot search).

## Constraints honoured
- C-2: stable API only.
- C-5a′: the queue loop exists only while blasts are queued.
- C-7′/C-15: a rank-1 failure keeps the gamerule restored and the item in the world.
- C-12: no write to unloaded chunks.
- C-16: deviations go in `src/orbital/ring.ts` comments.
- C-19: no leftovers.
- C-20: tests use two players.





### L0-sauc · Saucer and beam (the UFO actor and the shoot-down) (L0-sauc)

# L0-sauc · Saucer and beam (the UFO actor and the shoot-down)

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-ufoc", "L0-magn", "L0-orbc", "L0-ring", "L0-adr-ufoi", "L0-adr-ufom", "L0-adr-ufht", "L0-xcx15", "L0-xcx16"]`

**State (2026-10-02):** not implemented. There is no `src/ufo/` directory. The only prior art is the probe branch (`probe/ufo-magnet`, worktree `.work/9678e221`). It has the entities `andrew:ufo_probe` and `andrew:ufo_beam_probe`, which use the same component set as the shipped `andrew:orbital_charge`: `runtime_identifier minecraft:snowball`, a 0×0 collision box, no gravity or collision, not pushable, and `damage_sensor all → no`.

## Responsibility
The visible, physical half of the UFO Magnet event (UFO §2 table, §7, §8):
- **Look:** a BP + RP entity `andrew:ufo_saucer`. It has a metal disc about 12 blocks across, a glass dome and emissive rim lights, and it spins slowly. A translucent green **beam** cone runs from the underside to the ground and shows only during the magnet phase (`ad01`).
- **Body:** no push, no collision, and immune to all damage (`r003`). It is moved only by script.
- **Path:** it comes in from 90 blocks out at `min(hoverY + 10, ceiling − 4)` and reaches the hover point in 20 s. It leaves 90 blocks the opposite way in 15 s, then it is removed. It stays ≤ 100 blocks horizontally from the centre (U8, `r002`, `p001`, `L0-adr-ufht`).
- **Sound:** magnet-on, a hum every 2 s, and magnet-off (`r006`).
- **Shoot-down:** an interceptor on the shipped Orbital charge flight (`L0-adr-ufoi`), tested against a hull cylinder r 6 × h 3 in any phase. The steps (`p002`):
  1. the charge is absorbed;
  2. `ufoc.requestMagnetOff("shot")`;
  3. a 3 s smoking fall;
  4. a harmless blast (visual and sound only);
  5. 8 diamonds + 1 totem of undying;
  6. a localized broadcast naming the charge owner.

## Orbital baseline (v1.4.4)
- These figures come from `src/orbital/` (v1.4.4), not from the v3 nodes (`L0-xcx16`):
  - spawn = target + 60, capped at `heightRange.max − 1`;
  - fall speed 1 block per tick;
  - aim ≤ 25 blocks;
  - RMB refuses a target nearer than 7 blocks (`RING_MIN_RANGE`).
- RMB rings have radii 0.5 / 3.5 / 7 / 10.5 / 14 and powers 4 / 4 / 2 / 1 / 1.
- The interceptor is per charge. Against the r 6 hull, an RMB salvo aimed under the axis loses its centre and ring-3.5 columns, and the outer rings detonate normally (`as06`). The shooter's 7-block minimum shapes the `ac03` setup only.

## Inputs
- From `ufoc`: `onPhase(phase, {centre, hoverY, saucerPos, eventId})` for arrival, magnet, release, departure and pause, plus `requestMagnetOff(reason)`. `sauc` uses no interval of its own. `ufoc`'s shared interval calls `saucerStep(tick)` once per active tick (C-5d).
- From `orbc` (the seam added by this task): `registerInterceptor((attack, charge, from, to, tick) => boolean)`.

## Outputs
- `saucerPosition()`, which `magn` reads every tick for its hold targets.
- `reportShotDown({eventId, ownerId, ownerName})` to `ufoc`, which starts the 15 min pause from the shot (UFO §2, §8).
- Item entities for the reward, and the `andrew.ufo.shot_down` broadcast.

## Owns
- `packs/behavior/entities/ufo_saucer.json`, `packs/resource/entity/ufo_saucer.entity.json`, the geometry, texture, animation and render controller.
- `src/ufo/saucer.ts` (path, beam and sound) and `src/ufo/shootdown.ts`.
- The interceptor change in `src/orbital/flight.ts`. Today `Outcome` is `detonated | voided | lost | timeout`; the change adds `"intercepted"`.
- The lang key `andrew.ufo.shot_down`, in RU and EN.

## Does NOT own
- The schedule, target, centre, `hoverY`, phase timing, commands, the arrival message and restart cleanup (`ufoc`, `L0-adr-ufom`). Cleanup finds the saucer by its `andrew_ufo` family or tag.
- What gets pulled and released (`magn`).
- Charge spawn, fall, targeting and effects (`orbc`/`pntr`/`ring`).

## Artifacts
- Processes: `p001` flight, `p002` shoot-down, `p003` interceptor seam.
- Rules: `r001` hull, `r002` path, `r003` immunity, `r004` harmless blast + reward, `r005` beam, `r006` sound.
- Entities: `ent1` saucer entity, `ent2` saucer runtime state.
- ADRs: `ad01` beam as a bone, `ad02` teleport-driven motion, `ad03` scripted blast.
- Assumptions: `as01`–`as06`. Contradiction: `cx01` (resolved by `L0-adr-ufht`).
- ACs: `ac01`–`ac06`. Glossary: `gl01`–`gl05`.

## NFRs (component-local)
- The saucer step is one teleport, one property write when the beam toggles, and the sounds. It sits inside the `L0-xasm16` budget (≤ 2 ms mean per active tick, together with `magn`).
- With no saucer registered, the interceptor adds one empty-set check per charge step.
- **Gate:** the task merges only after the full Orbital GameTest suite (flight, penetrator, ring) is green and unchanged on the task branch (`L0-adr-ufoi`, `ac04`), plus the whole suite (full-suite rule).

## Sequencing
This comes after `ufoc` with its stub saucer. Order:
1. the `orbc` seam with its own regression gate;
2. the entity and path;
3. the shoot-down.

`magn` can then integrate against `saucerPosition()`.





### Scythe of Calamity (`andrew:scythe_of_calamity`) — shipped Stage 3, targets mobs too (L0-scyt)

# Scythe of Calamity (`andrew:scythe_of_calamity`) — shipped Stage 3, targets mobs too

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-lgnd", "L0-sprj", "L0-sitm", "L0-infr", "L0-webs"]`

src: `src/scythe/*.ts`, `src/legendary/{registry,hidden}.ts`, `packs/behavior/{items,recipes}/scythe_of_calamity.json` @ 302fba4 · spec: `docs/Scythe_of_Calamity_Spec_v1_RU_EN.docx` · decisions: `decision-scythe-*` (7).

**Status (checked 2026-09-26):** shipped. Stage 3 merged at `da09c10` (build 0.4.0). Mob targeting was added in `4b74f2f` (0.4.1), and visible hits in `302fba4` (0.4.2). There are 13 `andrew:scythe_*` GameTests, and all are green on BDS 1.26.51.1. `npm test` passes 285/285.

## Responsibility
This is the second legendary weapon. On Use, it locks the **nearest visible target** within 20 blocks. **Players outrank every mob**, and a mob is chosen only when no visible player qualifies (`L0-scyt-ad04`, operator decision 2026-09-25, which reverses spec §3). It then fires **3 virtual homing projectiles** that pass through blocks. Each hit deals **exactly 3 HP** and launches the target about 10 blocks up. The volley ends early when the target leaves a **20-block horizontal** radius around the frozen launch point. A volley with ≥1 hit costs the full 30 s cooldown, and a volley with 0 hits costs nothing.

## Code map
| File | Role |
|---|---|
| `src/scythe/targeting-rules.ts` | Pure: `eligibleCandidates`, `pickTarget` (player tier, ε 0.5, gaze), `rayCells`, `isHiddenAt` |
| `src/scythe/targeting.ts` | Engine: `gatherCandidates`, `hasLineOfSight`, `selectTarget`, the itemUse and playerInteractWithBlock trigger with per-tick de-dup |
| `src/scythe/volley-rules.ts` | Pure tuning and verdicts: 3 projectiles, 10-tick stagger, 0.8 b/t, hit radius 1.0, 200-tick timeout, horizontal leash |
| `src/scythe/volley.ts` | Engine: one `runInterval` per volley, `strike` (damage event plus exact correction, `L0-scyt-ad06`), the `end` cooldown verdict |
| `src/legendary/registry.ts` | `SCYTHE_OF_CALAMITY` def: prefix `sc`, abilityKey `scythe_of_calamity`, 600-tick cooldown, craft gate and refund |
| `src/legendary/hidden.ts` | `isHiddenFromTargeting` (`andrew:hidden_until`), `/andrew:hide` test command |

## Inputs
- Use (`itemUse`, and `playerInteractWithBlock` with `isFirstEvent`), de-duplicated per player per tick, then `resolveActivation` (hand priority, cooldown, busy).
- All players, plus the entities with a health component within 20 blocks of the owner (`L0-scyt-ad01`).
- `andrew:hidden_until` on players.

## Outputs
- A miss: action bar `andrew.scythe.no_target` («Здесь нет цели» / "There is no target here"). No cooldown and no busy.
- A hit: `launchVolley(owner, target: Entity)`, which sets busy. The first hit arms the cooldown, and the end re-arms it when hits ≥ 1.
- Effects only on the locked target: `applyDamage` plus a health correction, and `applyKnockback(0,0,1.35)`.
- **Never** block writes or projectile entities.

## Rules
`r001` candidates (players and mobs) · `r002` player tier → nearest → gaze · `r003` a miss is free · `r004` blocks untouched · `r005` exactly 3 HP, delivered visibly · `r006` launch 1.35, about 10 blocks · `r007` 20-block horizontal leash · `r008` only the locked target · `r009` item and recipe (shipped JSON).

## Dependencies
`L0-lgnd` (registry, cooldown/busy, hands, craft gate, retention). It is shipped, and the Scythe is its second def. `L0-infr` (BDS GameTest, channel `bds`; iPad look, channel `ipad`). The `L0-sitm` and `L0-sprj` children describe the pre-implementation design and are **stale** against the code (`L0-scyt-cx04`).

## Open issues
- `L0-scyt-cx03`: the shipped item JSON is a hoe (tags, digger, group) and has no `allow_off_hand`, which breaks `L0-sitm-adr2` and the off-hand half of AC-16.
- `L0-scyt-cx04`: the `L0-sprj` and prior contract text (players only, 3D leash, event-driven invalidation) do not match the code.
- `L0-scyt-cx05`: the tuning in `L0-adr-scyt` (0.5 b/t, 5-tick stagger) is not what shipped (0.8 b/t, 10 ticks).
- `L0-scyt-cx01`: graph hygiene, still open.
- CTR-014: Shadow Blade does not exist. The hidden seam is verified through `/andrew:hide` and the GameTest `scythe_skips_hidden`.
- Operational note: GameTests share the container with the LAN server. A connected real player outranks a test cow and fails the Scythe tests (see `302fba4`, and memory "BDS runs vs LAN server").

## Constraints honoured
C-2 (stable API only), C-4 (`andrew:` ids, RU/EN), C-5 (targeting only on press; the interval lives only while a volley does), C-7 (no entities, so no orphans), C-10.





### Structure framework (`strf`) (L0-strf)

# Structure framework (`strf`)

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: [L0-loot, L0-wind, L0-airs, L0-wrdn, L0-bast, L0-infr]`

## Responsibility
`strf` is the contract layer for all four structures (Four Structures spec §2, §6, §7, §11, §15). It works the way `lgnd` does for weapons. It owns everything that is the same across structures. The four body components (`wind`, `airs`, `wrdn`, `bast`) supply only a `StructureDef` and optional hooks, and they must not restate these rules:

1. **Registry.** `StructureDef` per structure: id, template, dimension, chance, footprint, validator profile, fixed points, and init hooks (`L0-strf-e001`).
2. **Discovery and roll.** One throttled pass maps player positions to newly seen chunks. A deterministic seeded roll decides per (dim, chunk, structure). Candidates are never relocated (`L0-strf-p001`, `-r001`, `-r002`).
3. **Rotation.** A seeded choice of 0/90/180/270. One transform function is used for the AABB and for every template-local point (`-r004`).
4. **Footprint validity.** Parameterised profiles: dry land, open-water share, lava ocean, flatness, world ceiling, Nether floor, plus an altitude solver for the Airship (`L0-strf-p002`, `-r005`, `-r013`).
5. **Collision.** Cancels on an overlap with registry instances, spawners, or a vanilla-structure signature heuristic (`-r006`).
6. **Loaded-footprint guarantee.** Never writes into unloaded chunks. Revalidates immediately before placing (`-r007`).
7. **Placement.** `world.structureManager.place(templateId, dim, origin, {rotation})` from `.mcstructure` templates built by `infr` (`L0-adr-tmpl`) (`L0-strf-p003`).
8. **Persistent instance registry and idempotent first-init.** A state machine `planned → placed → looted → guarded → done` stored in region-sharded world dynamic properties (`L0-strf-e002`, `-p004`, `-r008`).
9. **One-time persistent mobs.** Spawned by script, tagged and named, with no respawn and no top-up (`-r009`).
10. **Spawner semantics.** Vanilla `mob_spawner` block entities come from the template. No script-side spawner logic unless the probe fails (`-r010`, `L0-strf-d002`).
11. **Deviation report.** A checked-in list of every stable-API approximation (§11 DoD) (`-r012`, `L0-strf-e004`).
12. **Tick budget.** All heavy work runs in `system.runJob` generators with per-tick caps (`L0-strf-p005`). This closes `L0-xcx4`.
13. **Probe plan.** A Stage-1-style spike on BDS 1.26.51.1 that must pass before body components start (`L0-strf-p006`).

## Inputs
- Player positions and dimensions, once per ≥20 ticks.
- `StructureDef[]` registered by body components at startup.
- Templates under `packs/behavior/structures/andrew/*.mcstructure` (from `infr`).
- World dynamic properties: `andrew:st:salt`, `andrew:st:<dim>:<rx>:<rz>`, and `andrew:st:spawn`, the last owned by `wind` but stored through the `strf` store API.

## Outputs
- Placed structures and `InstanceRecord`s.
- Calls to `L0-loot` (`fillChest(instanceId, chestIndex, tableRef)`) and to body hooks (`afterPlace`, `spawnGuards`).
- An exported API for `wind`/`airs`: `tryPlaceAt(def, origin, rot, opts)` and `searchRing(def, centre, rMin, rMax)`. These are the only permitted relocating placements: the spawn Windmill and the linked Airship.
- Debug log lines prefixed `[Scripting] [andrew] strf:` (compatible with `bds-check`'s WARN filter).

## Not owned
- Loot tables and fill algorithm (`loot`).
- Template geometry (bodies + `infr`).
- Spawn-area search policy and terraforming (`wind`), linked-Airship ring policy (`airs`), surface marker (`wrdn`), gold blocks (`bast`).

## Key dependencies and risks
- **Stable API only** (C-2). Nothing notifies scripts about generated chunks, and structures cannot be queried. That is why generation happens on discovery, not during worldgen (`L0-adr-strc`). The deviation report must record it.
- **Per-pack dynamic properties.** A second pack running `strf` has its own registry and would double-generate structures; so no test pack runs world-wide discovery, and the release pack enables nothing in a fresh world (`L0-adr-own`).
- The collision heuristic is incomplete by nature. That limitation goes in the deviation report.





### L0-ufoc · UFO event core (schedule, phases, commands, restart) (L0-ufoc)

# L0-ufoc · UFO event core (schedule, phases, commands, restart)

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-sauc", "L0-magn", "L0-adr-ufom", "L0-adr-ufpc", "L0-adr-ufht", "L0-xasm13", "L0-xasm14", "L0-xasm17", "L0-xcx17", "L0-xcx20"]`

**State (2026-10-02):** not implemented. There is no `src/ufo/`. This run replaces the failed v4 node (`L0-xcx20`). It implements `L0-adr-ufom`, `L0-adr-ufpc` and `L0-adr-ufht` as given and does not re-derive them.

## Responsibility
`ufoc` is the event's only clock and only state machine (UFO §2, §9, §10, §12):
- **Schedule** (`r001`, `p001`). The next arrival is stored as epoch ms in `andrew:ufo_next_ms` (C-21). The first arrival comes a random 10–20 min after the first join (`L0-xasm14`). After every departure, shoot-down, `stop` or restart, the next one is set 15 min out. When an arrival falls due, the event waits for an Overworld player.
- **Enable flag** `andrew:ufo_enabled` (default on, `r006`).
- **Target and centre** (`r002`). The target is a random valid Overworld player. The centre is the block under their feet when the arrival starts, and it is frozen from then on.
- **Hover height** (`r003`): `hoverY = min(centre.y + 40, ceiling − 4)`, where `ceiling = overworld.heightRange.max` (`L0-adr-ufht`).
- **Phase machine** (`p002`, `r004`): arrival 400 ticks → magnet 1200 → release (instant) → departure 300 → pause; or `downed` after a shot. Every phase change is published as `onPhase(...)` to `sauc` and `magn`. Requests to switch the magnet off are latched (`adr-ufpc`).
- **One shared interval** (C-5d, `ad02`). It ticks every game tick but does only a clock check once per 100 ticks while no event is live. With a saucer, the order within a tick is latch → phase → `saucerStep` → `magnetStep`.
- **Restart cleanup** (C-23, `p003`, `L0-xasm17`). The sweep runs at `worldLoad` and again on `entityLoad`, keyed by event id. An event that was in flight is rescheduled for now + 15 min, detected through the in-flight marker (`ad03`, `cx01`).
- **Operator command** `/andrew:ufo come|stop|enable|disable` (`p004`).
- **Messages** (`r005`). The localized arrival notice `andrew.ufo.arrival` (RU/EN) goes to Overworld players within 150 blocks of the centre.
- **Environment seam** (`L0-xasm13`, `ad01`): `now()`, a phase-duration table and an online-Overworld-players provider, so GameTest can drive the logic.

## Inputs
- `world.afterEvents.playerSpawn` (initialSpawn) records the first join.
- `worldLoad` and `entityLoad` trigger cleanup.
- The custom command registry, at startup.
- From `sauc`: `reportShotDown({eventId, ownerId, ownerName})` and `requestMagnetOff("shot")`.
- From the command: `requestMagnetOff("stop")`.

## Outputs
- `onPhase(phase, {centre, hoverY, saucerPos, eventId})`, sent to `sauc` and `magn`.
- `saucerStep(tick)` and `magnetStep(tick)`, called from the one interval.
- Writes to the world dynamic properties `andrew:ufo_next_ms` and `andrew:ufo_enabled`.
- The arrival notice, and the command replies.

## Owns
- `src/ufo/index.ts` (`registerUfo()`, called from `src/main.ts`), `src/ufo/schedule.ts`, `src/ufo/phases.ts`, `src/ufo/env.ts` (the seam), `src/ufo/cleanup.ts` and `src/ufo/commands.ts`.
- The lang key `andrew.ufo.arrival` in `en_US.lang` and `ru_RU.lang`.
- GameTest scenarios for UFO ACs 1, 2 (timing), 3, 17 and 18, plus `bds-check` restart scenarios on the checks instance (19136).
- A stub saucer, so that `ufoc` can merge before `sauc` (Stage 6 step 2).

## Does NOT own
- The saucer entity, its path, beam, sound and shoot-down detection (`sauc`). `sauc` picks the bearing θ and spawns or removes the entity on `onPhase`.
- Iron selection, the hold and the release physics (`magn`).
- `orbc`'s interceptor seam.

## Artifacts
- **Entities:** `ent1` durable schedule state, `ent2` live event session.
- **Processes:** `p001` schedule and arrival trigger, `p002` per-tick phase machine, `p003` restart cleanup, `p004` operator command.
- **Rules:** `r001` timing, `r002` target and centre, `r003` hover height, `r004` single event / Overworld only / ordering, `r005` notice and localization, `r006` enable flag and command effects on the schedule.
- **ADRs:** `ad01` env seam, with tick-driven phases on an epoch schedule; `ad02` one period-1 interval with an idle divider; `ad03` the in-flight marker inside `next_ms`; `ad04` the command via `customCommandRegistry` at GameDirectors.
- **Assumptions:** `as01`–`as05`. **Contradiction:** `cx01`.
- **ACs:** `ac01`–`ac08`. **Glossary:** `g001`–`g006`.

## NFRs
- Idle cost: one counter increment per tick, plus one property read every 100 ticks.
- Active cost: the phase step is O(1). The total with `sauc` and `magn` stays within `L0-xasm16`.
- No `runJob` and no second interval (C-5d).
- **Gate:** the full suite is green on the task branch before the merge.





### Web Sword: Targeting & 3×3×3 Cobweb Trap (L0-webs)

---
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-lgnd-ad06", "L0-lgnd-cx04", "L0-lgnd-p004", "L0-lgnd-ent1", "L0-sprj"]
---

# Web Sword: Targeting & 3×3×3 Cobweb Trap

**Responsibility.** This component owns only what is unique to the Web Sword as a weapon: its item/recipe identity, and its active-ability body — resolving a melee-reach target and stamping a 3×3×3 (27-cell) cobweb trap around it, skipping protected and unloaded cells. It is the Web Sword's counterpart to `L0-sprj` (Scythe's homing-projectile body): both are per-weapon "cast" implementations plugged into the shared `L0-lgnd` legendary framework.

**Explicitly NOT owned here** (see `L0-lgnd` instead): one-per-world craft gate + refund + first-craft broadcast (`L0-lgnd-p001`), death retention (`L0-lgnd-p002`), Void/lava/despawn loss return (`L0-lgnd-p003`), main/off-hand dispatch (`L0-lgnd-p004`), cooldown timer + busy flag + Action Bar HUD (`L0-lgnd-p005`, `L0-lgnd-ent3`), instance marking/anti-dup (`L0-lgnd-ent2`), operator commands (`L0-lgnd-p007`), localization plumbing. Raw spec §§3,4,8,9,10,14 (one-per-world, death retention, cooldown UI, multiplayer determinism, localization, DoD) are all satisfied by the shared framework already deep-dived as `L0-lgnd`; a scope-overlap contradiction (`L0-webs-cx01`) documents this so the two aren't independently re-implemented or re-decided.

**Inputs.** A ready, dispatched cast from `L0-lgnd-p004` (`onCast(player)`), the player's current melee-interaction ray/reach, and world block/entity state around the resolved target.

**Outputs.** Up to 27 placed `minecraft:web` blocks; a filled-cell count; the ability wrapper starts the cooldown itself on `filled > 0` and returns `"cast"`/`"refused"` to `L0-lgnd` (`L0-webs-r005`, `L0-adr-cast`).

**Core flow** (detail in `L0-webs-p001`): resolve target cell (block-face-adjacent or entity-foot, entity wins ties, no hit ⇒ no target) → enumerate the 27-cell cube centered there → classify each cell (fillable / protected / unloaded / entity-occupied) → replace fillable cells with cobweb → report count.

**Item identity** (`L0-webs-ent1`, `L0-webs-r001`): Diamond-Sword-equivalent melee damage, infinite durability, `minecraft:enchantable` slot `sword`, shaped recipe (4× Cobweb + 1× Diamond Sword, any durability/enchantment, none carried over). This is currently documented only in the rollup decision `web-sword-item-values`; this component gives it a durable home.

**Why this scope now.** `L0-lgnd`'s migration (`ADR-021`, `L0-lgnd-ad06`) explicitly stopped short of the cast body: `L0-lgnd-cx04` notes the shipped `registerTrap()` (in `src/websword/trap.ts`, called from `src/gametest/main.ts`) "no longer subscribes to `itemUse` itself" under the new framework — i.e. `registerTrap`/the trap module is exactly this component's code counterpart, and it never received its own deep-dive. Decisions Q-011 (cube geometry), Q-013 (protected-block list) and Q-017 (zero-cells outcome) already resolved the hard questions operator-side; this deep-dive gives them rule/process/entity homes and adds the acceptance criteria, glossary and assumptions the rollups don't carry.

**NFRs.** Server-authoritative, deterministic across clients (spec §9); no permanent per-tick world scan (spec §11, project C-4/C-5) — target resolution and cube fill are one-shot, triggered only by a cast; never write into unloaded/inaccessible chunks (spec §6/§12).





### Windmill (`wind`) — Мельница (L0-wind)

# Windmill (`wind`) — Мельница

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: [L0-strf, L0-loot, L0-airs, L0-infr, L0-adr-strc, L0-adr-strs, L0-adr-tmpl]`

**Source:** Four Structures spec §1, §2, §4.1–§4.7, §5.6, §6, §7, §9, §10.1 (tests 14–23, 33), §11, §12, §15.
**Status:** Implemented: `src/structures/spawn-search.ts`, `bodies/windmill.ts`; shipped in v1.2.0.

## Responsibility
`wind` is a *body* component on top of the `strf` contract layer. It supplies the Windmill's `StructureDef` and hooks, and it owns the two Windmill-only behaviours that `strf` explicitly delegates to it: the guaranteed spawn-area search with forced site preparation, and the trigger for the linked Airship. It must not restate generation, persistence or loot rules; it references `strf-*` / `loot-*` by id.

1. **Template** (`L0-wind-e001`, `-r001`, `-r002`). One fixed `.mcstructure` (`L0-adr-tmpl`): ~15×15×30 stone-lower / wood-upper abandoned mill, fixed 4-blade rotor and a wooden door on the front, 3 full floors joined by one continuous stair, fixed ~35×35 plot of mostly mature wheat, water ditches, dirt paths, trampled patches, a damaged wooden fence with gaps, vines and cobwebs that never block the main route. Only rotation varies (`L0-strf-r004`).
2. **Contents** (`-r003`). 25 fixed chests (floor 1: 5, floor 2: 8, floor 3: 12) filled once from the shared table (`L0-loot`). 3 fixed vanilla spawners: floor 1 Zombie Villager, floor 2 Zombie, floor 3 Vindicator with an iron axe (`L0-strf-r010`). Weak decorative light that keeps spawner zones dark.
3. **Field guards** (`-r004`, `-r005`, `-e003`). Exactly 10 vanilla Zombie Villagers spawned once per instance, persistent until death, sun-immune, free to wander, curable into an ordinary Villager (`L0-strf-r009`, `L0-adr-strs`).
4. **Normal generation** (`-p001`, `-r006`). 1 % per suitable Overworld dry-land chunk via `strf` discovery; `dryLand` + `flat` profiles; cancel on invalid site or collision; never terraform, never relocate.
5. **Guaranteed spawn Windmill** (`-p002`, `-p003`, `-r007`…`-r011`, `-r013`, `-e002`, `-e004`). Exactly one per world, 100 %: 5×5 chunks around the spawn chunk → nearest valid site ≤ 500 blocks → best dry site with forced preparation (natural blocks only, level ~35×35, smooth edges, fill only shallow voids). Runs once per world; the result is persisted in `andrew:st:spawn`.
6. **Linked-Airship trigger** (`-r012`). Every Windmill instance, spawn one included, asks `airs` for exactly one linked attempt (40–100 blocks) after its own init. `wind` owns *when* and *once*; `airs` owns the ring search and validity.

## Inputs
- `strf` API: `registerDef`, discovery callbacks, `tryPlaceAt(def, origin, rot, opts)`, `searchRing`, validity profiles, collision detector, instance registry, `runJob` budget.
- `world.getDefaultSpawnLocation()` (x/z) at first world load; world dynamic property `andrew:st:spawn`.
- Template `packs/behavior/structures/andrew/windmill.mcstructure` (built by `infr` from repo sources, C-8).

## Outputs
- Placed Windmills and their `InstanceRecord`s (`d = "windmill"`; spawn one has id `windmill:spawn`).
- `loot.fillChest` ×25 per instance; 10 guard entities per instance.
- One `LinkedAirships.start(parent)` call per instance, recorded as `la` + `ls`.
- Deviation-report rows (`L0-strf-r012`) for: discovery-time generation, forced-prep heuristics, ticking-area use, guard sun immunity via effect, anything the probe finds.
- Debug lines `[Scripting] [andrew] strf:wind …`.

## Not owned
Discovery queue, seeded rolls, rotation transform, collision heuristic, registry, tick budget (`strf`); loot table and fill algorithm (`loot`); linked ring search and Airship validity (`airs`); NBT writer (`infr`).

## Key risks
- **Spawn search needs far chunks loaded** before any player exists (C-12). Resolved by temporary ticking areas (`L0-wind-ad01`); unverified on BDS 1.26.51.1.
- No dry land within 500 blocks: no spawn Windmill, `status "failed", reason "no-dry-land"`, logged (decision `L0-xq4`).
- **"Check the linked Airship once"**: resolved — the ring is loaded by temporary ticking areas (decision-l0-airs-cx01).
- Forced preparation in an existing world could touch player builds; mitigated by a natural-block whitelist (`L0-wind-r008`).
- Spawner light threshold and the vanilla Vindicator axe are assumptions to confirm in the probe (`L0-wind-as06`, `as07`). On Peaceful the guard step throws and waits in the queue: the instance stays `looted`, the one spawn search is not spent (runtime.ts:232-245, measured live, CNTR-WIND-CX01-AA).





### Wrdn concept component (L0-wrdn)

## Mini Warden City

**Source:** `Four_Structures_Spec_RU_EN_copy.docx` §13 (normative addendum, overrides earlier drafts on conflict; its footprint and contents are superseded by `decision-gorod-hranitelya-rastet-vchetvero-po-ploschadi-i`, as built `[63, 20, 63]`, 40 chests, 8 shriekers) + §15 (four-structure shared addendum).

### Responsibility
A fixed-template, script-placed Overworld structure that reads as a compact vanilla Ancient City (deepslate, Sculk, Sculk Sensors/Veins/Shriekers), not a shrunken block-for-block copy of the real one. It is one of four opportunistic world-content generators (Windmill, Airship, Mini Warden City, Mini Bastion) sharing the same chunk-candidate discovery mechanism, but it is the only one of the four that is almost entirely vanilla-mechanical once placed: no custom guards, no custom spawners, no custom loot system — it leans on real Sculk Shrieker/Warden mechanics and the real Ancient City loot table.

### Identity, size, theme
- Fixed single design, footprint 63×63, height 20 (`WARDEN_CITY_SIZE` `[63, 20, 63]`; §13.1's ≈30×30×10–15 is superseded by decision), irregular outline permitted within the template.
- Random rotation 0°/90°/180°/270° per instance (same convention as the other three structures, §15).
- Almost entirely dark; only a small fixed count of Soul Lanterns/Torches near passages and the central zone — lighting must not break the oppressive mood.

### Generation
- Governed by `L0-strf-r001`, `L0-strf-r002` (with `pending` §2), `L0-strf-p001`, `L0-strf-p002` (`dryLand` + `depth`), `L0-strf-r006`. Body: Overworld, 0.05, top Y ∈ [−45, −35].

### Surface marker
- An irregular ~5×5 Sculk/Sculk Vein patch is generated directly above the city's center, on the real surface.
- It is a locator only — not a pre-built shaft, ladder or tunnel.
- Template geometry (marker footprint vs. hall position) is co-designed so that a player digging straight down from the marker's center is guaranteed to break into the structure.
- The marker must sit on valid land and must never be used as an excuse to damage another generated structure.

### Central hall & monument
- A central hall visually echoes the real Ancient City's core.
- Holds a purely decorative Reinforced Deepslate monument/frame, ≈5 wide × 6–7 tall. It never activates, is not a portal, and never teleports the player.
- Exactly 12 of the 40 chests sit in the central zone; 2 of the 8 Shriekers sit near the hall/monument.

### Sculk & Warden
- Exactly 8 Sculk Shriekers, fixed positions, all meant to behave exactly like naturally-generated vanilla Shriekers (warning/Warden-summon mechanics), as closely as stable Bedrock allows. 2 are central, 6 are in far parts of the city.
- No Warden is pre-placed and none is a permanent guardian — it can only appear through the ordinary Shrieker mechanic.
- Sensors, Veins and other sculk dressing are placed throughout the fixed template; Sensors may noticeably outnumber the 8 Shriekers.

### Chests & loot
- Exactly 40 chests, fixed positions: 12 central + 28 spread through ruins/niches/side rooms/branches, requiring near-full exploration to find them all.
- All 40 use the **real vanilla Ancient City loot table**, unmodified — same categories/quantities/rarities, including Enchanted Golden Apple and Swift Sneak odds.
- The shared custom loot system (§3, used by Windmill/Airship) explicitly does **not** apply here (§15) — this is the sharpest divergence from its Overworld siblings.
- `L0-loot-r006`, `L0-loot-r007`.

### Persistence
- `L0-strf-r008`, `L0-strf-p004`, `L0-adr-strs`.

### Relationship to siblings
- Shares the chunk-candidate-roll → suitability-check → fixed-template-fill → idempotent-registry mechanism with Windmill, Airship and Mini Bastion (§15). `L0-xcx4` is resolved (`L0-strf-p005`, `L0-adr-spwn`); `L0-xcx5` (spec version/priority ambiguity) applies to this component and is not re-raised here — see relates_to.
- Diverges from Windmill/Airship on loot (vanilla table, not the shared weighted system) and diverges from all three siblings on guards (none — it relies on vanilla Shrieker/Warden instead of custom mobs/spawners).
- Closest sibling in shape is Mini Bastion (§14): same 5% chunk chance, same "cancel without relocation," same 10-chests-with-3-central split (Warden City itself now ships 40 chests, 12 central), same idempotent-persistence and cancel-on-intersection rules — but Bastion uses custom Piglin guards and two different vanilla loot tables (treasure + regular), while Mini Warden City uses one vanilla table and no custom mobs at all.

### Open items
- Two assumptions filed (`L0-wrdn-as01`, `as02`) on placement mechanism and absence of extra ambient mob spawning.
- Two architecture decisions filed (`L0-wrdn-ad01`, `ad02`) on loot-table sourcing; `ad02` is superseded by `L0-adr-strc`, consistent with the project-wide "closest stable approximation" directive.
- No new contradiction filed for this component — `L0-xcx5` is open; `L0-xcx6` targets this component (`L0-adr-body`).
- Probe dependencies (`L0-strf-p006`): 1, 2, 3, 4 (+8, 9 through `strf`); all PASS, `docs/structures/probe-results.md:13-16`.






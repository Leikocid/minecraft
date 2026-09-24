---
title: Domain Model
type: project-knowledge
generated_at: "2026-09-24T19:42:02.847Z"
source_channel: rollout
node_id: rollout-domain-model
aliases: ["rollout-domain-model","domain-model","project-knowledge/domain-model"]
is_a: ["rollout","domain-model"]
relates_to: ["L0-infr","L0-infr-e001","L0-infr-e002","L0-infr-e003","L0-infr-e004","L0-lgnd","L0-lgnd-ent1","L0-lgnd-ent2","L0-lgnd-ent3","L0-lgnd-ent4","L0-pick","L0-pick-ent1","L0-pick-ent2","L0-scyt","L0-scyt-ent1","L0-scyt-ent2","L0-scyt-ent3","L0-webs","L0-webs-ent1","L0-webs-ent2","L0-webs-ent3"]
priority: 520
---

# Domain Model

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## Entities

### Entity: `.mcaddon` release archive (L0-infr-e001)

# Entity: `.mcaddon` release archive

**Links:** `part_of: ["L0-infr"]` · `is_a: ["entity"]`

**Attributes**
- `path`: `dist/andrew.mcaddon` (gitignored, rebuilt every `npm run build`)
- `contents`: exactly two top-level directories, `behavior` and `resource` (copied from `packs/behavior`, `packs/resource`); `selftest` and `gametest` are never present — asserted by `tests/selftest-pack.test.mjs`.
- `format`: a zip (`zip -r -X`, `.DS_Store` excluded) of the two pack directories.
- Each pack (`packs/behavior/manifest.json`, `packs/resource/manifest.json`) has a `header.uuid` (constant, PACK-01-owned, never regenerated) and a `header.version` triple that must equal `package.json`'s version — kept in sync by `scripts/set-version.mjs` across `package.json`, `package-lock.json`, and every manifest header/module/dependency version.
- `min_engine_version` in each manifest must equal `targets.mjs`'s `MIN_ENGINE_VERSION`; the behavior pack's script module depends on `@minecraft/server` at `SERVER_API_VERSION`.

**Identity rule**: the iPad treats a pack with the same uuid **and** the same version as already-imported — a content change with no version bump can silently fail to update on-device.





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





### LegendaryDef (registry entry) (L0-lgnd-ent1)

---
is_a: ["entity"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p006", "L0-lgnd-r006", "L0-sitm", "L0-stgt"]
---
# LegendaryDef (registry entry)

One entry per legendary weapon. Registered at script load, before any event subscription fires. Immutable afterwards. Shape follows ADR-021 (`{ id, markPrefix, refundIngredients, announceKey, abilityKey, hud }`), made concrete.

| Attribute | Type | Web Sword | Scythe |
|---|---|---|---|
| `id` | item typeId | `andrew:web_sword` | `andrew:scythe_of_calamity` (ASM-021 at L0) |
| `markPrefix` | string, unique | `ws` (frozen, `L0-lgnd-r006`) | `sc` (`L0-lgnd-as02`) |
| `abilityKey` | string, unique | `web_sword` (= shipped `DEFAULT_ABILITY_KEY`) | `scythe_of_calamity` |
| `cooldownMs` | number | 30 000 (`COOLDOWN_TICKS` 600 × 50 ms) | 30 000 |
| `refundIngredients` | `[itemId, count][]` | `[web, 4]`, `[diamond_sword, 1]` (shipped `REFUND`) | `[golden_apple, 2]`, `[obsidian, 2]`, `[diamond_hoe, 1]` (recipe owned by `L0-sitm`) |
| `announceKey` | translate key | `andrew.web_sword.first_craft` | `andrew.scythe_of_calamity.first_craft` |
| `nameKey` | translate key | `item.andrew:web_sword` | `item.andrew:scythe_of_calamity` |
| `messageKeys` | blocked / returned / admin_given / reset / voided | `andrew.web_sword.*` (shipped + `voided`) | `andrew.scythe_of_calamity.*` (`L0-sitm`) |
| `hudKeys` | ready / cooldown / active | `andrew.web_sword.ready` / `.cooldown` (no `active`) | owned by `L0-sitm` |
| `readyMode` | `"once" \| "while-held"` | `once` (shipped) | `while-held` (Scythe §6) — see `L0-lgnd-cx01` |
| `ability` | `(player, hand) → "cast" \| "refused" \| "busy"` | trap entry in `trap.ts` | `L0-stgt` entry |

## Derived durable keys
Spelled only inside `src/legendary/state.ts`:
- **World:** `andrew:<p>_crafted`, `andrew:<p>_crafted_by`, `andrew:<p>_gen:<instanceId>`, `andrew:<p>_owed`.
- **Player:** `andrew:<p>_cooldown_until`, `andrew:<p>_pending`.
- **ItemStack:** `andrew:<p>_origin`, `_owner`, `_id`, `_owner_name`, `_gen`, `_holder`.

## Invariants
- `id`, `markPrefix` and `abilityKey` are each unique across the registry. A duplicate throws at load.
- Registration after the first event dispatch throws. A late weapon would miss its death/craft events.
- `ability` returns `"cast"` only when the weapon's own logic succeeded (ADR-017 generalised).
- The ability owner decides when to call `start()`. The Web Sword calls it at placement. The Scythe calls it at volley resolution with ≥ 1 hit (ASM-017, ADR-025).





### LegendaryInstanceMark (L0-lgnd-ent2)

---
is_a: ["entity"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-ent4", "L0-lgnd-r005", "L0-lgnd-r006"]
---
# LegendaryInstanceMark

Dynamic properties on an `ItemStack` that make one physical legendary distinguishable from an ordinary (Creative, vanilla `/give`) copy (ADR-016, Q-006). Generalised from `Mark` in `src/websword/rules.ts` / `state.ts`.

| Attribute | Key suffix | Type | Notes |
|---|---|---|---|
| `origin` | `_origin` | `"craft" \| "admin"` | Unchanged. An unmarked stack is an ordinary item and gets no protection. |
| `owner` | `_owner` | player id | Crafter or admin recipient. Informational. **Not** the return target. |
| `ownerName` | `_owner_name` | string? | `origin: craft` only. Used by the broadcast. |
| `id` | `_id` | string | Instance id, `<absTime>-<rand36>` (shipped `makeMark`). Stable across re-issues. |
| `gen` | `_gen` | integer ≥ 0 | **New.** Generation. Absent on 0.3.0 stacks, read as 0. |
| `holder` | `_holder` | player id | **New.** Last player whose inventory contained this stack. Absent means `owner`. |

## Rules
- *Live* iff `mark.gen == ledger.gen(prefix, id)` (`L0-lgnd-ent4`). Only live stacks cast (when marked), are retained or are returned (`L0-lgnd-r005`).
- Stamping always clones and then sets the properties (`markSword` semantics). The input stack is never mutated.
- `holder` is written only from `playerInventoryItemChange` for that stack, never by scanning (C-4).
- `parseMark` must accept 0.3.0 serialisations, which lack `gen` and `holder` (`L0-lgnd-r006`).





### AbilityState: cooldown record + busy flag (per player × abilityKey) (L0-lgnd-ent3)

---
is_a: ["entity"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-r003", "L0-lgnd-r009", "L0-lgnd-ad05", "L0-sprj", "L0-stgt"]
---
# AbilityState: cooldown record + busy flag (per player × abilityKey)

## Cooldown deadline (durable)
- Player dynamic property `andrew:<prefix>_cooldown_until` holds the epoch **millisecond** at which the ability is ready again.
- **Clock:** `Date.now()`, as shipped. `world.getAbsoluteTime()` stops with `dodaylightcycle false` (measured on BDS 1.26.51.1: it stayed at 385 while `currentTick` ran 1445 → 1465). `system.currentTick` restarts at zero with the script engine. Both are forbidden for deadlines.
- A missing or non-number value reads as 0, i.e. ready. A leftover tick-based value also reads as long expired.
- The Web Sword keeps `andrew:ws_cooldown_until`, so a sword cooling at upgrade time stays cooling.

## Busy flag (volatile)
- In-memory `Set<"playerId|abilityKey">` inside the cooldown module (ADR-025).
- Set by `setBusy(player, key, true)` when a multi-tick ability starts (a Scythe volley). Cleared by `setBusy(..., false)` on resolution.
- After a restart the set is empty, so busy = false. Volleys do not survive a restart (C-14).
- Also cleared on `playerLeave` for that player, as a safety net behind ASM-023.

## API (the only one; `L0-lgnd-r001`)
| Call | Semantics |
|---|---|
| `isReady(p, k)` | `!isBusy(p, k) && remaining(p, k) == 0`. Never mutates. |
| `isBusy(p, k)` | busy-set membership. |
| `setBusy(p, k, on)` | the only busy writer. |
| `start(p, k)` | deadline = now + `def.cooldownMs`. Does not check readiness. Callers: the ability owner only. |
| `remaining(p, k)` | ms left, clamped ≥ 0. The HUD shows whole seconds rounded up. |

Compatibility exports keep their shipped names and behaviour: `isReady(player, abilityKey = "web_sword")`, `startCooldown`, `remainingTicks`, `DEFAULT_ABILITY_KEY` (`L0-lgnd-ad06`).





### LegendaryLedger: pending (death), generation, owed (loss) (L0-lgnd-ent4)

---
is_a: ["entity"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd-p002", "L0-lgnd-p003", "L0-lgnd-r005", "L0-lgnd-r008"]
---
# LegendaryLedger: pending (death), generation, owed (loss)

Durable state that makes retention and return idempotent.

| Record | Scope / key | Value | Writer |
|---|---|---|---|
| Pending on death | player DP `andrew:<p>_pending` | JSON **array** of marks. 0.3.0 wrote a single mark object, which is read as `[mark]`. | `L0-lgnd-p002` |
| Generation | world DP `andrew:<p>_gen:<instanceId>` | integer; absent = 0 | `L0-lgnd-p003` only |
| Owed returns | world DP `andrew:<p>_owed` | JSON array of `{ playerId, mark, reason: "void" \| "destroyed" \| "despawn" }` | `L0-lgnd-p003` |

## Semantics
- Pending and owed entries are **tokens**. A grant happens only while a token exists. The token is removed in the same script turn that the stack enters the inventory. If the player already carries that `(id, gen)`, the token is removed without a grant. This is the shipped `carriesInstance` guard, applied per element.
- A generation bump and its owed enqueue happen in one synchronous turn (no `system.run`/`await` between them). A crash leaves both written or neither.
- Nothing ever lowers `gen`. `reset` does not touch `gen`, pending or owed.
- Not a census: no locations are recorded (C-4).
- Size is bounded by the number of instances ever lost (`L0-lgnd-as06`).





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





### ScytheOfCalamity (item plus legendary registration) (L0-scyt-ent1)

# ScytheOfCalamity (item plus legendary registration)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["entity"]` · `relates_to: ["L0-sitm", "L0-lgnd", "L0-scyt-r009", "L0-scyt-p004"]`

## Static (behaviour pack JSON, owned by `L0-sitm`)
| Attribute | Value |
|---|---|
| identifier | `andrew:scythe_of_calamity` |
| display name key | `item.andrew:scythe_of_calamity.name`: RU «Коса бедствия», EN "Scythe of Calamity" |
| menu_category | `equipment`, group `itemGroup.name.sword` (`L0-sitm-asm3`) |
| icon | `andrew_scythe_of_calamity` (RP texture) |
| max_stack_size | 1 |
| hand_equipped / allow_off_hand | true / true |
| damage | 8 (Netherite parity, `L0-scyt-as03`) |
| enchantable | slot `sword`, value 10 |
| durability | none (infinite) |
| digger / tool tags | none |

## Registration (`LegendaryDef` in `L0-lgnd`)
| Attribute | Value |
|---|---|
| abilityKey | `scythe`, storage prefix `sc` |
| cooldownMs | 30 000 |
| lang keys | `andrew.scythe_of_calamity.{ready,cooldown,no_target,announce}` |
| craft flag | the Scythe's own world dynamic property, independent of the Web Sword |
| ability | `L0-scyt-p001` |
| isBusy | `L0-sprj` volley map lookup |

## Per-player persistent state (through `L0-lgnd`)
- `sc_cooldown_until`: epoch ms from `Date.now()`. Never ticks (CTR-lgnd-03 lesson).
- Nothing else. Volleys and busy live in memory only.





### TargetLock (transient result of P-scyt-001) (L0-scyt-ent2)

# TargetLock (transient result of P-scyt-001)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["entity"]` · `relates_to: ["L0-scyt-p001", "L0-sprj"]`

This is the hand-off record from targeting to `L0-sprj.launchVolley`. It is created once per successful press and never persisted.

| Attribute | Type | Notes |
|---|---|---|
| ownerId | string | `Player.id`. It is an id, not a handle, so it survives handle invalidation checks. |
| targetId | string | The selected candidate's `Player.id`. |
| dimensionId | string | The owner's dimension at activation. The target must share it. |
| launchPoint | Vector3 | The owner's `location` at activation, frozen. It is the leash centre. |
| spawnPoint | Vector3 | `launchPoint + (0, 1.62, 0)`: eye height, where the projectiles appear. |
| distance | number | Distance from launch point to target at lock time, ≤ 20. Used for diagnostics and ACs. |
| tieBroken | boolean | True if `r002`'s view-angle tie-break decided the choice. Logged in GameTests. |

## Candidate (internal to P-scyt-001)
`{ player, distance, viewDot, visible, hidden }`. It is built for each player that `getPlayers` returns and is discarded after selection.

**Invariant:** `targetId ≠ ownerId`, and `distance ≤ 20`.





### ScytheActivationOutcome (enumeration, press-level view) (L0-scyt-ent3)

# ScytheActivationOutcome (enumeration, press-level view)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["entity"]` · `relates_to: ["L0-scyt-p001", "L0-sprj-r005", "L0-scyt-r003", "L0-scyt-r007"]`

This is every way one Use press of the Scythe can end. The `L0-sprj` volley outcomes are nested under `LAUNCHED`.

| Outcome | When | Cooldown | Player-visible |
|---|---|---|---|
| `NOT_DISPATCHED` | The dispatcher chose another ability, or the Scythe is on cooldown | unchanged | HUD shows the remaining time |
| `BUSY` | The owner's volley is still flying | unchanged | HUD shows "active" |
| `INELIGIBLE_OWNER` | The owner is dead, a spectator or in Creative | none | nothing |
| `NO_TARGET` | No candidate passed r001 | **none** | «Здесь нет игрока» |
| `LAUNCHED` → `COMPLETED` | All projectiles resolved, hits ≥ 1 | full 30 s | 1–3 hits |
| `LAUNCHED` → `EXPIRED` | All projectiles expired, 0 hits | none | nothing |
| `LAUNCHED` → `ESCAPED_BEFORE_HIT` | The target is past 20 blocks with 0 hits | **none**, ready at once | the projectiles vanish |
| `LAUNCHED` → `ESCAPED_AFTER_HIT` | The target is past 20 blocks with hits ≥ 1 | full 30 s | the projectiles vanish |
| `LAUNCHED` → `TARGET_INVALID` | The target died, left, changed dimension or changed mode | split on hits | the projectiles vanish |
| `LAUNCHED` → `OWNER_INVALID` | The owner died, left or changed dimension | split on hits, committed at the first hit | the projectiles vanish |





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





## Components (code-derived)

### Component: Build & verification infrastructure (Stage 0) (L0-infr)

# Component: Build & verification infrastructure (Stage 0)

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-lgnd"]`

## Responsibility
Turns the TypeScript source and the two static packs (`packs/behavior`, `packs/resource`) into a shippable `.mcaddon`, and proves — without a human, wherever the engine allows it — that the result actually loads and runs on real Bedrock: static (TS + JSON), a Bedrock Dedicated Server in Docker, an optional beta-only GameTest lane with SimulatedPlayer, and a LAN cycle that gets the same build onto the iPad for the checks only a human eye can make (rendering, icons, Creative placement, RU/EN names).

This is Stage 0 of the project: nothing in Stage 1 (Miner's Pickaxe) or Stage 2 (legendary weapons) starts until this component's own 5 closing criteria are green [src: stage-0-infrastructure, C-11].

## Inputs
- `src/**/*.ts` — behavior-pack script sources (single entry `src/main.ts`), plus dev-only sources under `src/selftest/`
- `packs/behavior/`, `packs/resource/` (static manifests, textures, lang files) — hand-authored, not generated
- `packs/gametest/`, `packs/selftest/` — dev-only packs, never shipped
- `scripts/targets.mjs` — the single source of truth for version targets
- Operator-supplied facts: the iPad's installed Bedrock version (read manually from Settings)

## Outputs
- `dist/andrew.mcaddon` — the release archive (behavior + resource only)
- `dist/bds-check.log`, `dist/bds-gametest.log` — saved server logs, the evidence artifacts `/verify` attaches to run-check
- Process exit code 0/1 from every `npm run bds:*` / `npm run validate` / `npm run build` command — this is what ai-kit's autopilot reads to close build/bds-typed acceptance criteria without an operator [src: decision-verification-approach-automatic]
- A running LAN server (`npm run bds:up`) and a printed `ip:19132` address for the iPad

## Sub-systems (see child processes for detail)
1. **Build & package** (`npm run build`) — esbuild → validate → zip
2. **Structural validation** (`npm run validate`, also called from build) — manifests + every JSON under `packs/**`
3. **BDS one-shot check** (`npm run bds:check`) — creative world, in-engine selftest pack, log-verdict
4. **GameTest harness** (`npm run bds:gametest`) — beta-only, SimulatedPlayer, separate world
5. **LAN dev server** (`npm run bds:up` / `bds:down` / `bds:logs`) — Survival+cheats, iPad joins over the network
6. **Version targeting** (`scripts/targets.mjs`, `scripts/set-version.mjs`) — one file, two scripts, keeps every manifest, `compose.yaml` and `package.json` in agreement

## Three verification channels
- **build** — `tsc --noEmit` + `npm run validate`: proves the TS compiles against `@minecraft/server` 2.10.0 types and every JSON is structurally valid. Mac only, no Docker.
- **bds** — `npm run bds:check` (creative, one-shot, self-terminating) and `npm run bds:gametest` (beta, SimulatedPlayer): proves the packs actually load on the real engine, the script executes, and — for GameTest — that specific gameplay behaves as specified, all from a log or exit code alone.
- **ipad** — human-eyes-only: rendering, icons, Creative inventory placement, RU/EN names. A green `bds` run never closes an `ipad` criterion [C-6]; these criteria are typed `manual` and don't block merge/autopilot [decision-verification-approach-automatic].

## Known open issue
CTR-4 (open, target `L0-infr`): the raw specs (`minerspickaxetestspec`, `stage-0-infrastructure`) still quote `@minecraft/server` 2.9.0 / engine 1.26.0 — superseded by `decision-tselevaya-versiya-bedrock-1-26-51-asm-001-q-001` and the code (`scripts/targets.mjs`: 2.10.0 / [1,26,50] / BDS 1.26.51.1). No code fix needed; the raw docs just haven't been annotated. Not re-filed here.

## Boundary
Owns: build tooling, packaging, JSON/manifest validation, the Docker BDS harness (both the one-shot check and the GameTest lane), the iPad delivery mechanics (import + LAN), and the version-target single source of truth.
Does not own: the gameplay logic that BDS/GameTest exercise (Miner's Pickaxe, Web Sword, Scythe, the `lgnd` legendary-weapon framework) — those are separate components that *consume* this one's verification channels.





### Legendary weapon framework (craft gate + refund, announcement, death retention/anti-dup, void return, cooldown + Action Bar, hand priority, localization) (L0-lgnd)

---
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0-sitm", "L0-stgt", "L0-sprj", "L0-sqat"]
governs_files: ["src/legendary/", "src/websword/", "src/main.ts", "src/gametest/main.ts"]
see_also: ["webswordspecv1ruen-part-1", "webswordspecv1ruen-part-2", "scytheofcalamityspecv1ruen-part-1", "scytheofcalamityspecv1ruen-part-2"]
---
# Legendary weapon framework (craft gate + refund, announcement, death retention/anti-dup, void return, cooldown + Action Bar, hand priority, localization)

**Responsibility.** Implement each "general rule for legendary weapons" (*общие правила легендарных оружий*: Scythe §1, §6; Web Sword §3, §4, §8, §9, §10) exactly once, in a new `src/legendary/`. The shipped Web Sword (0.3.0, `src/websword/*`) becomes the first registered `LegendaryDef`, and the Scythe of Calamity the second. No weapon module keeps a private copy of an anti-dup invariant (C-7).

## Current state (verified in code, 2026-09-24)
`src/legendary/` does not exist yet. Everything is hard-wired to the Web Sword:
| File | Concern | Web-Sword-only detail |
|---|---|---|
| `state.ts` | key names, mark, world flag, pending, cooldown deadline | `andrew:ws_*`; `ws_pending` holds a single mark |
| `craftgate.ts` | after-the-fact gate, refund, broadcast | `REFUND = web×4 + diamond_sword×1` |
| `retention.ts` | death retention (inventory path + drop sweep), restore on spawn | `findMarkedSword` returns the first sword only; off hand not scanned |
| `cooldown.ts` | `isReady/startCooldown/remainingTicks`, 10-tick HUD | `_abilityKey` ignored (one slot per player); main hand only |
| `commands.ts` | `/andrew:websword <give\|reset> [target]` | command name, item id |
| `rules.ts` | pure `craftDecision`, `cooldownRemaining`, mark (de)serialisation | `COOLDOWN_TICKS` |

## Owns
- Registry `registerLegendary(def)` — `L0-lgnd-ent1`, `L0-lgnd-p006`.
- Instance mark with `gen` + `holder` — `L0-lgnd-ent2`.
- Per-weapon one-per-world craft gate, refund, broadcast, Creative/admin exemption — `L0-lgnd-p001`, `L0-lgnd-r002`.
- Death retention for every legendary carried, both hands — `L0-lgnd-p002`, `L0-lgnd-r008`.
- Loss (Void/ordinary destruction) return to the last holder — `L0-lgnd-p003`, `L0-lgnd-r005`, `L0-lgnd-r011`.
- Cooldown per (player, abilityKey) + in-memory busy — `L0-lgnd-ent3`, `L0-lgnd-r003`, `L0-lgnd-r009`.
- Hand-priority Use dispatch — `L0-lgnd-p004`, `L0-lgnd-r004`.
- The only Action Bar HUD for legendaries — `L0-lgnd-p005`, `L0-lgnd-r007`.
- Operator commands — `L0-lgnd-p007`.
- Read-only `isHiddenFromTargeting(player)` — `L0-lgnd-r010`.
- Localization plumbing: every player-facing string is a rawtext `translate` key; the RU/EN strings themselves are owned by `L0-sitm` (C-4).

## Published contracts (change only by ADR)
- `LegendaryDef` shape (`L0-lgnd-ent1`).
- `cooldown.isReady / isBusy / setBusy / start / remaining (player, abilityKey)`.
- `isHiddenFromTargeting(player): boolean`.
- Ability handler `(player, hand) → "cast" | "refused" | "busy"`; the framework never infers success.

## Inputs / outputs
**In:** stable `@minecraft/server` 2.10.0 events (C-2): `playerInventoryItemChange`, `entityDie`, `playerSpawn`, `playerLeave`, `itemUse`, `playerInteractWithBlock`, `entitySpawn`, `beforeEvents.entityRemove`, `system.beforeEvents.startup`. Weapon modules supply defs and ability handlers; `L0-sprj` calls `setBusy`/`start` on volley resolution.
**Out:** durable world/player/item dynamic properties per weapon prefix (`L0-lgnd-ad01`); a chat broadcast on first craft; private blocked/returned/voided/admin messages; Action Bar rawtext for holders only.

## Does NOT own
What an ability does (cobweb cube in `trap.ts`/`cube.ts`; target search `L0-stgt`; volley `L0-sprj`), item JSON, recipes and lang strings (`L0-sitm`; the Web Sword JSON gains only `minecraft:allow_off_hand`), Shadow Blade itself.

## Key decisions
`L0-lgnd-ad01` frozen per-weapon prefixes · `ad02` loss recovery by generation · `ad03` transient loss watcher · `ad04` fall-through dispatch on "not ready" only · `ad05` busy is memory-only · `ad06` compatibility shims for shipped paths and command.

## Open items
- Parent-level: CTR-1 (`cool-ctr1`, Void return for Web Sword; running on `L0-lgnd-as01`), CTR-3 (`cool-ctr3`, off-hand priority; running on Q-019 default a). Not re-raised here.
- This dive: `L0-lgnd-cx01` (Ready display differs), `L0-lgnd-cx02` (non-player pickup leaves a stale melee-capable copy), `L0-lgnd-cx06` (loss watcher vs the letter of C-5).
- Withdrawn after checking: cx04 (no test asserts the `ws_pending` format, so "tests unchanged" and the array change do not collide), cx05 (`/andrew:websword` stays as an alias, so README remains correct). cx03 became assumption `L0-lgnd-as09`.

## Constraint-number crosswalk
Artifacts `L0-lgnd-*` written before this revision cite an older C-numbering. Read them as: old C-1 → **C-2** (stable API); old C-4 "no global scans" → **C-5**; old C-9 "translate keys" → **C-4**; old C-13 "bounded tick work" → **C-5** (second sentence); old C-6, C-7 unchanged. Old C-10 (shipped tests stay green), C-14 (volleys do not survive restart) and C-17 (one implementation per rule) have no entry in the current `concept-constraint`; they are carried as `L0-lgnd-ac11`, `L0-lgnd-r009` and `L0-lgnd-r001` respectively.

## Risk
Highest regression risk of the Stage-2 Scythe work: it rewrites code under a shipped weapon. Web Sword unit tests, the `andrew:websword_*` GameTests and the pickaxe suites must stay green (`L0-lgnd-ac11`).





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

**Known open issue inherited from raw sources (not re-filed here):** contradiction CTR-4 already covers this component — the raw spec's compatibility target (`@minecraft/server` 2.9.0 / `min_engine_version` 1.26.0) is superseded by `decision-tselevaya-versiya-bedrock-1-26-51-asm-001-q-001` (2.10.0 / [1,26,50]) and matches the live implementation. CTR-4 targets `L0-infr` and stays open only so nobody retargets back to 2.9.0 from the stale raw doc; no new filing needed from this component.

**Verification split** (inherited from parent, applies here): craft/digger/auto-smelt logic is proven on BDS in Docker; Creative placement, icon and RU/EN name rendering are proven only on iPad [src: concept-constraint C-6, C-9]. Both channels are green for Stage 1 — DEMO-S1, operator-accepted 2026-09-21 (see `decision-q-007-enchantable-without-durability-podtverzhde`).

**Evidence base for this deep-dive:** raw spec `minerspickaxetestspec` (`docs/Miners_Pickaxe_Test_Spec.docx`); live source `packs/behavior/items/miners_pickaxe.json`, `packs/behavior/recipes/miners_pickaxe.json`, `src/autosmelt.ts`; test coverage `src/gametest/main.ts` (`pickaxe_digs_at_diamond_speed`, `pickaxe_autosmelt`, `pickaxe_keeps_vanilla_drops`) and `src/selftest/main.ts` (`pickaxe-item-stack`, `pickaxe-enchantable`, `pickaxe-no-durability`).

**Children:** rules `L0-pick-r001`..`r005`; entities `L0-pick-ent1`, `ent2`; acceptance criteria `L0-pick-ac01`..`ac07`; glossary `L0-pick-gl01`..`gl05`; assumptions `L0-pick-asm1`..`asm3`; ADR `L0-pick-ad01`.





### Scythe of Calamity (`andrew:scythe_of_calamity`) (L0-scyt)

# Scythe of Calamity (`andrew:scythe_of_calamity`)

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-lgnd", "L0-sprj", "L0-sitm", "L0-infr", "L0-webs"]` · sources: `scytheofcalamityspecv1ruen-part-1`, `scytheofcalamityspecv1ruen-part-2` (docs/Scythe_of_Calamity_Spec_v1_RU_EN.docx).

**Status:** no code yet. Checked 2026-09-24: `src/` has only `websword/`, `autosmelt.ts` and the test harnesses, and nothing in `packs/` mentions the Scythe. This deep-dive seeds Stage-2 planning.

## Responsibility
This is the second legendary weapon. It is a PvP ability: on Use, the Scythe locks the **nearest visible player** within 20 blocks and fires **3 homing projectiles** that pass through blocks. Each hit deals **exactly 3 HP true damage** and launches the target about **10 blocks** up. The attack ends early if the target leaves a **20-block leash** centred on the launch point. The cooldown outcome depends on whether any hit landed. All temporary state is cleaned up.

## Sub-scopes (the live KV holds partial children under other prefixes)
| Sub-scope | Owner node | What it holds |
|---|---|---|
| Item JSON, recipe, melee, enchant slot, RP assets | `L0-sitm` (ADRs `sitm-adr1/2`, `sitm-asm3`) | slot = sword, no digger or tool tags |
| Activation + target acquisition | **this node** (`L0-scyt-p001`, `r001`–`r003`). The earlier `L0-stgt`/`L0-sctg` have no live artifacts. | candidate filter, tie-break, no-target path |
| Volley flight, hits, true damage, launch, leash, outcome FSM, tick loop | `L0-sprj` (`r005`–`r008`, `ad01`–`ad03`, `ac05`–`ac14`) | this node restates only the contract (`r004`–`r008`) |
| Craft gate, announcement, retention, Void return, cooldown store, HUD, hand priority | `L0-lgnd` | the Scythe registers a `LegendaryDef` |

## Inputs
- `world.afterEvents.itemUse` where `itemStack.typeId === "andrew:scythe_of_calamity"` and the source is a `Player` (`L0-scyt-ad03`). The event goes through the `L0-lgnd` dispatcher, which applies hand priority, busy and cooldown.
- The owner's location, view direction and dimension. The players in that dimension within 20 blocks (`L0-scyt-ad01`).
- The `isHiddenByShadowBlade(player)` predicate. It is a stub that returns `false` until Shadow Blade exists (ASM-024, CTR-014).

## Outputs
- Either a localized no-target message (`andrew.scythe_of_calamity.no_target`) with no cooldown and no busy state,
- or one **Volley** handed to `L0-sprj` (`launchVolley(owner, target, launchPoint)`), which returns exactly one outcome and possibly one `cooldown.start(owner, "scythe")` through `L0-lgnd`.
- Effects on the target only: health minus 3 per hit, and upward knockback.
- **Never**: block writes, engine projectile entities, or damage to mobs or other players.

## Key rules (this node)
`r001` candidate filter · `r002` nearest plus view-angle tie-break · `r003` no target means no cost · `r004` blocks untouched · `r005` exact 3 HP true damage · `r006` launch about 10 blocks, fall damage kept · `r007` leash centred on the launch point · `r008` only the locked target can be hit · `r009` item stats and recipe.

## Dependencies and ordering
1. `L0-lgnd` must first be generalised from `src/websword/*` into a registry. That includes per-weapon cooldown keys (CTR-013), the steady HUD in both hands (CTR-017) and busy (ASM-017). The Scythe cannot ship on the current Web-Sword-only store.
2. `L0-infr`: GameTest and BDS on 1.26.51.1 cover the ACs in channel `bds`. The icon, names and particle look are covered on channel `ipad` (C-9).
3. C-11: Stage 2 Web Sword is closed (commit `f22896a`), so Scythe work may start.

## Open issues affecting this component
- CTR-014 / Q-020: AC-3 (Shadow Blade) cannot be verified end to end.
- `cool-ctr2`: the enchant slot. Resolved in design by `L0-sitm-adr1` (sword).
- CTR-015: the hoe base versus the Use trigger. Resolved in design by `L0-sitm-adr2` (no hoe tag).
- `L0-sprj-cx01/cx02`: when the cooldown is committed, and the lethal branch of true damage.
- `L0-scyt-cx01`: missing component nodes and targeting nodes in the graph.
- `L0-scyt-cx02`: the tuning numbers for projectile speed and lifetime disagree.
- Q-022: does the `pvp` gamerule affect candidates? The default is no.

## Constraints honoured
C-2 (stable 2.10.0 only), C-4 (`andrew:` ids, RU and EN), C-5 (targeting only at activation, and a tick loop only while volleys exist), C-7 (no orphans), C-10 (no world mutation in before-events).





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






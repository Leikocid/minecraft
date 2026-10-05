---
title: Domain Model
type: project-knowledge
generated_at: "2026-10-05T17:12:56.140Z"
source_channel: rollout
node_id: rollout-domain-model
aliases: ["rollout-domain-model","domain-model","project-knowledge/domain-model"]
is_a: ["rollout","domain-model"]
relates_to: ["L0-lgnd","L0-lgnd-ent1","L0-lgnd-ent2","L0-lgnd-ent3","L0-lgnd-ent4","L0-sclk","L0-sclk-ent1","L0-sclk-ent2","L0-sclk-ent3","L0-sclk-ent4"]
priority: 610
---

# Domain Model

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## Entities

### LegendaryDef (static registry entry, `src/legendary/registry.ts`), v7 (L0-lgnd-ent1)

# LegendaryDef (static registry entry, `src/legendary/registry.ts`), v7

Related: L0-lgnd-ad07, L0-lgnd-ad14, L0-lgnd-ad15, L0-lgnd-ad16, L0-lgnd-cx15.

`LEGENDARIES` is a `const` array (`ad07` §1). Adding a weapon means appending an entry. Two variants (`ad15`):

## Common fields (every def)
| Field | Meaning | Unique across defs |
|---|---|---|
| `itemId` | the weapon's item type id | yes |
| `keyPrefix` | namespace of `keysFor(def)`: `andrew:<p>_origin|owner|id|owner_name|crafted|crafted_by|pending|gen|owed`, and `andrew:<p>_gen:<id>`. Frozen once a world ships (`r006`) | **yes** (`cx15`) |
| `nameKey` | item name translation key without `.name` | — |
| `craftGate` | whether the token gate applies | — |
| `craftTokenId` | what the recipe outputs (`ad08`) | yes |
| `refund` | items a blocked craft hands back | — |
| `textPrefix` | prefix of `first_craft`, `craft_blocked`, `returned`, `admin_given`, `reset` | yes |
| `command` | `<command> give [player]` / `reset` | yes |

## Active def only (`ActiveLegendaryDef`)
| Field | Meaning |
|---|---|
| `abilityKey` | timers `andrew:cd_<key>`, `andrew:busy_<key>`; unique across active defs |
| `cooldownTicks` | read by `startCooldown` |
| `hudKeys?` | the weapon's own HUD lang keys; absent = `andrew.legendary.ready|cooldown` |

## Passive def (`PassiveLegendaryDef`)
No `abilityKey`, `cooldownTicks` or `hudKeys`. `hasAbility(def)` is false.

## Registered (v7 target)
| # | Const | itemId | prefix | ability | Variant |
|---|---|---|---|---|---|
| 1 | `WEB_SWORD` | `andrew:web_sword` | `ws` | `web_sword`, 600 | active |
| 2 | `SCYTHE_OF_CALAMITY` | `andrew:scythe_of_calamity` | `sc` | `scythe_of_calamity`, 600 | active |
| 3 | `ORBITAL_CANNON` | `andrew:orbital_cannon` | `oc` | `orbital_cannon`, 600, own `hudKeys` | active |
| 4 | `DRAGON_KATANA` | `andrew:dragon_katana` | `dk` | `dragon_katana`, 600, own `hudKeys` | active |
| 5 | `SCULK_CROSSBOW` | `andrew:sculk_crossbow` | `sk` (proposed, `as18`) | — | passive |

## Invariants
- The uniqueness test covers `itemId`, `keyPrefix`, `craftTokenId`, `textPrefix`, `command` over all defs, and `abilityKey` over active defs.
- `LEGENDARY_TYPE_IDS` = every `itemId` and `craftTokenId`. Identity is **by type**; a def whose `itemId` is a vanilla id (`minecraft:*`) is forbidden while identity is type-based (`ad16` §Fallback).





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





### E-sclk-1 · Item `andrew:sculk_crossbow` (option A, `adr-scbs`) (L0-sclk-ent1)

# E-sclk-1 · Item `andrew:sculk_crossbow` (option A, `adr-scbs`)

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["entity"]` · `relates_to: ["L0-adr-scbs", "L0-sclk-r005", "L0-sclk-r008", "L0-lgnd"]`

File: `packs/behavior/items/sculk_crossbow.json`. It mirrors `dragon_katana.json`: format 1.21.90.

| Attribute | Value |
|---|---|
| `identifier` | `andrew:sculk_crossbow` |
| `menu_category` | `{category: "equipment", group: "minecraft:itemGroup.name.crossbow"}`: Creative "Снаряжение/Equipment", the search and `/give` |
| `display_name` | `item.andrew:sculk_crossbow.name` |
| `icon` | `andrew_sculk_crossbow` (an RP texture in a crossbow silhouette with sculk teal) |
| `max_stack_size` | 1 |
| `minecraft:shooter` | `ammunition: [{item: "minecraft:arrow", use_offhand: true, search_inventory: true, use_in_creative: true}]`, `charge_on_draw: true`, `max_draw_duration` = 1.25 s (a probe-tuned value) |
| `minecraft:use_modifiers` | `use_duration` ≥ the draw time, `movement_modifier` 0.35 (like a crossbow) |
| `minecraft:enchantable` | `slot: "crossbow"`, value 1 (the vanilla crossbow's enchantability) |
| `minecraft:fire_resistant` | true (the item entity's fire immunity is `lgnd`'s, but this is the cheap first line) |
| `minecraft:durability` | **absent** (r008) |
| `allow_off_hand` | false (a shooter fires from the main hand only) |

**Identity.** Legendary by type id (`isLegendaryStack`, `registry.ts`). It carries the `lgnd` mark (`keyPrefix "sk"`, `L0-adr-sckp`; `sc` is the Scythe's) from the token swap. Creative and `/give` copies are unmarked test copies (`lgnd`).

**Token.** `andrew:sculk_crossbow_crafted` (`menu_category none`, the same name and icon).

**Option B fallback.** The item is a vanilla `minecraft:crossbow` with a dynamic-property mark. This entity is replaced, and `lgnd` re-opens.





### E-sclk-2 · Entity `andrew:sculk_bolt` (L0-sclk-ent2)

# E-sclk-2 · Entity `andrew:sculk_bolt`

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["entity"]` · `relates_to: ["L0-adr-scdm", "L0-sclk-as01", "L0-sclk-p002", "L0-sclk-p003"]`

The BP is `packs/behavior/entities/sculk_bolt.json`, format 1.26.0 like `orbital_charge.json`. It must not use `minecraft:pushable`, which was dropped in 1.26.50 and makes the engine refuse the whole entity.

| Component | Value |
|---|---|
| `runtime_identifier` | `minecraft:snowball`. Without it the entity pushes mobs (engine fact) |
| `is_spawnable` / `is_summonable` | false / true (tests summon it) |
| `minecraft:projectile` | `on_hit: {remove_on_hit: {}}` is **absent**: the script removes the bolt after resolving it. `power` 0, `gravity` and `inertia` from the probe (`as01`), `uncertainty_base` 0, `anchor` 1, `offset` [0,0,0], no `impact_damage` (zero damage) |
| `minecraft:collision_box` | 0.25 × 0.25 |
| `minecraft:physics` | {} |
| `minecraft:damage_sensor` | all causes → `deals_damage: no` |
| despawn | none in JSON; the script's lifetime cap (100 ticks) rules |

**RP.** `packs/resource/entity/sculk_bolt.entity.json`: a small teal arrow-like quad, or invisible with the trail carrying the look (ad02, iPad check).

**Runtime facts it inherits.**
- Snowball-runtime entities persist and reload through `entityLoad`; a reloaded bolt has no record and is removed (C-23).
- The entity ray stops at blocks. Bolt hits come from the projectile component, not from rays.





### E-sclk-3 · `BoltRecord` (in memory, never persisted) (L0-sclk-ent3)

# E-sclk-3 · `BoltRecord` (in memory, never persisted)

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["entity"]` · `relates_to: ["L0-sclk-r001", "L0-sclk-ad03", "L0-sclk-p003"]`

The store is `Map<string, BoltRecord>` in `src/sculk/bolts.ts`, keyed by `bolt.id`.

| Field | Type | Meaning |
|---|---|---|
| `bolt` | Entity | the `andrew:sculk_bolt` |
| `ownerId` | string | the shooter's entity id; the Entity is re-resolved at hit time for `damagingEntity` |
| `ownerName` | string | for logs and the death message fallback |
| `dimensionId` | string | |
| `seed` | uint32 | a per-bolt RNG seed for the crater and the patch, logged so a GameTest can replay it |
| `bornTick` | number | `system.currentTick` at the spawn |
| `lastPos` | Vector3 | the start of the next trail segment |
| `volleyId` | string | the same for the 3 Multishot bolts (logs only; it never merges outcomes) |

**Lifecycle.** Created in p002. Deleted exactly once: by p004 or p005 (claimed before acting) or by p003 (expired, invalid or unloaded). On a world reload the map starts empty (C-23).





### E-sclk-4 · Carve plan and carve queue (L0-sclk-ent4)

# E-sclk-4 · Carve plan and carve queue

**Links:** `part_of: ["L0-sclk"]` · `is_a: ["entity"]` · `relates_to: ["L0-sclk-r003", "L0-sclk-r004", "L0-sclk-ad04", "L0-adr-sctr"]`

**`CarvePlan`** (pure, `src/sculk/crater-plan.ts`, node-tested with no `@minecraft/server`):

| Field | Meaning |
|---|---|
| `kind` | `"crater"` (block hit) or `"patch"` (entity hit) |
| `origin` | the impact cell or the feet column |
| `face` | the hit face (`Up`/`Down`/`North`/…); `Up` for a patch |
| `seed` | from `BoltRecord.seed` |
| `air` | `Vector3[]`, ≤ 75 cells inside 5×5×3 (empty for a patch) |
| `sculk` | `Vector3[]`, ≤ 25 candidate cells inside 5×5 |
| `box` | the union AABB, for the `protectLegendariesIn` call and the clip |

The planner sees only a `BlockProbe` callback (`isSolidFull`, `isAirLike`, `isKeep`, `isLiquid`). The runtime builds it from `Block` and `TERRAIN_KEEP`, and tests use a fixture grid.

**`CarveJob`** (runtime, `src/sculk/carve.ts`): `{plan, dimension, cursor}` in a FIFO. The shared interval drains up to `CARVE_BUDGET_PER_TICK` = 300 `setType` calls per tick. Before each write, a cell in an unloaded chunk is skipped.





## Components (code-derived)

### Legendary weapon framework (`src/legendary/`), v7: as built at 1.6.1, plus the passive def and the Sculk Crossbow delta (L0-lgnd)

# Legendary weapon framework (`src/legendary/`), v7: as built at 1.6.1, plus the passive def and the Sculk Crossbow delta

Related: L0-sclk, L0-katn, L0-magn, L0-orbc, L0-webs, L0-scyt, L0-xcx11, L0-xcx24, L0-adr-scbs, L0-adr-hold, L0-xasm26, L0-lgnd-ad15, L0-lgnd-ad16, L0-lgnd-ad17, L0-lgnd-cx15, L0-lgnd-cx16, L0-lgnd-r016, L0-lgnd-r018.

**Responsibility.** Every general legendary rule is implemented once, for every def in `LEGENDARIES`: the token craft gate and first-craft broadcast, marks and generation, death retention, loss return and the owed list, `protectLegendariesIn`, hand priority (`resolveActivation`), cooldown and busy, the HUD, `hidden_until`, and the type predicates `isLegendaryStack` / `isLegendaryWeaponStack`.

## As built at 1.6.1 (read from code 2026-10-05)
- **Four defs** (`registry.ts`): Web Sword `ws`, Scythe `sc`, Orbital Cannon `oc`, Dragon Katana `dk` (shipped 1.5.0, `KATA-LGND-01-AA`). The Katana needed no framework code (`ad14` held).
- **Every def has an ability.** `abilityKey` and `cooldownTicks` are required fields (`registry.ts:12-15`). The HUD draws a line for every held def (`hud.ts:37-56`), and `resolveActivation` lets any held, ready def claim a Use (`hands.ts:35-42`).
- **Legendary weapons are magnetic** (operator tuning, 1.6.0, `de0fc68`). The magnet uses `isLegendaryWeaponStack` (weapons, never tokens): ground, container slots, late drops, a player holding one (`magnet-hold.ts:117-136`), and a mob or armour stand holding one (`magnet-select.ts:179`, `:320`). The UFO AC 13 "never pulled" rule is retired. See `r016` and `ac21`.
- **Armour stand in the Void** is closed in code (`decision-resolve-l0-lgnd-cx14`: stand watcher plus two return guards, `recovery.ts:326`, `:433`).
- **Return target is still `mark.owner`.** `lost()` targets `w.mark.owner` (`recovery.ts:490`), and the protect hand-back and owed entry use it too (`:877-879`). `decision-resolve-l0-xcx11` (2026-09-29) chose the last holder and named `LGND-GEN-01-AA`. That task is archived, but the mark has no holder field (`state.ts`). See `cx16`.

## v7 delta
| # | Change | Artifacts |
|---|---|---|
| 1 | Passive def: a def may have no ability. Then it has no timer key, no Use claim and no HUD line. Defs #1–#4 keep byte-identical keys and behaviour | `ad15`, `ent1`, `r018`, `ac26` (closes `L0-xcx24`) |
| 2 | Def #5 `SCULK_CROSSBOW`: `andrew:sculk_crossbow`, token `andrew:sculk_crossbow_crafted`, refund 2 echo shard + 2 deepslate + 1 crossbow, command `andrew:crossbow`, passive | `ad16`, `as18`, `ac25` |
| 3 | **Key prefix: not `sc`.** `sc` is the Scythe's; reuse would share the craft flag, marks, pending and owed. Proposed `sk` | `cx15`, `as18` |
| 4 | No per-weapon code in retention, recovery, the Void paths, `protectLegendariesIn`, commands or the magnet: each iterates `LEGENDARIES` or calls `defForStack`/`defForToken` | `ad16`, `ac27` |
| 5 | Return target for T19/T20/Void: `mark.owner` until the holder task ships, as for the Katana. Tests call one `returnTarget(mark)` helper so the holder task changes one function | `ad17`, `ac27`, `cx16` |
| 6 | Magnet: the crossbow is pulled like the other four. Not a spec breach (the crossbow spec does not list the magnet as a hazard) | `r016`, `ac21` |

**Fallback, stated as larger.** If the `sclk` probe rejects a custom shooter and `L0-adr-scbs` falls back to the vanilla `minecraft:crossbow` (option B), identity can no longer be by type. `isLegendaryStack`, `isLegendaryWeaponStack`, `defForStack`, `heldLegendaries`, the magnet's `hasitem` holder tags (which cannot read dynamic properties), the craft gate (the recipe *input* is the same type), retention and the GameTests all become mark-aware. That is a framework rewrite of identity, not a def. It needs its own L0 decision and is **not** planned by this pass (`ad16` §Fallback).

## Published contracts
- `LEGENDARIES`, `defForStack`, `defForToken`, `defForAbility` (active defs only), `isLegendaryStack`, `isLegendaryWeaponStack`, **`hasAbility(def)`** (new).
- `isReady`, `startCooldown`, `setBusy`, `clearBusy`, `isBusy`.
- `heldLegendaries(player)` (still returns passive defs; retention-neutral), `resolveActivation(player)` (active defs only).
- `protectLegendariesIn(dim, box, {avoid, reason}) → {moved, handedBack}`; `sclk`'s crater calls it before carving (`L0-xcx25`).
- `isLegendaryItemEntity`, `isHiddenFromTargeting`, `hideFromTargeting`.

## Does NOT own
The crossbow item JSON, token, recipe, lang, bolt pipeline, damage, crater, durability (custom base) and Piercing exclusion (`sclk`). The magnet's selection (`magn`).

## Next tasks
1. **LGND-PASSIVE** (before `sclk` item): `ad15` type split, `hasAbility`, HUD/resolver skips, registry test. Gate: the existing legendary GameTests and `npm test` pass with no assertion edits (`ac26`).
2. **Def #5** lands with the `sclk` item task: the entry, the uniqueness and key asserts, the crossbow instances of the framework GameTests (`ac25`, `ac27`).
3. **LGND-HOLD** (separate, unblocked by the decision): the holder field per `ad11`; `ac18` plus the holder clauses of `ac08`, `ac09`, `ac24`, `ac27`.





### Sculk Crossbow (`andrew:sculk_crossbow`): component v1 (L0-sclk)

# Sculk Crossbow (`andrew:sculk_crossbow`): component v1

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-lgnd", "L0-orbc", "L0-pntr", "L0-magn", "L0-scyt", "L0-katn", "L0-adr-scbs", "L0-adr-scdm", "L0-adr-sctr", "L0-xcx22", "L0-xcx23", "L0-xcx24", "L0-xcx25", "L0-xasm23", "L0-xasm24", "L0-xasm25", "L0-xasm26", "L0-xasm27", "L0-xq7"]`

Source: `docs/Sculk_Crossbow_Spec_v1_RU_EN.docx` (raw `sculkcrossbowspecv1ruen-part-1..4`, priority 610). Legendary def #5. It is the first legendary with **no active ability, no cooldown and no HUD line** (`L0-xcx24`).

## Responsibility
A passive ranged legendary. Every projectile its holder fires is replaced at spawn by one `andrew:sculk_bolt`. The bolt flies physically, with a Warden-style Sonic Boom trail, and resolves exactly once (C-26):
- **entity hit:** fixed `SONIC_BOOM_DAMAGE` = 10 HP through armour, the shield and the invulnerability window (C-28), plus a sculk patch under the target, with no crater;
- **block hit:** an irregular crater ≤ 5×5×3 plus a ring of plain sculk ≤ 5×5, with no entity damage (C-27);
- **expiry:** after 100 ticks, on leaving loaded chunks, or in the Void, nothing happens.

## What `sclk` owns, and what it does not
| Owned here | Delegated (cited, not restated) |
|---|---|
| the item def JSON, icon, RP texture, RU/EN item and tooltip lang | craft gate, first-craft broadcast, token swap and refund → `lgnd` (R-lgnd-001: one implementation) |
| the recipe JSON (echo shard / deepslate / crossbow → token) | death retention, hazard protection, Void return, Creative/`/give` copies → `lgnd` (T19, T20; `xasm26`) |
| the bolt entity (BP + RP), the shot→bolt swap, the flight, the trail | the no-ability def shape → `lgnd` v7 (`xcx24`) |
| hit resolution, damage, patch, crater, carve queue | `protectLegendariesIn` → `lgnd` (`recovery.ts`) |
| enforcing that Piercing is stripped | magnetism → `magn` (def-driven, `xasm26`) |
| moving the deny list from `penetrator-keep.ts` to `src/terrain/keep.ts` (`xcx25`) | the Orbital carve itself → `orbc`/`pntr` (unchanged) |
| the probe and the outcomes of the three ADRs | |

## Inputs
- `world.afterEvents.entitySpawn` (or `projectileShoot`, per the probe) for arrow-type projectiles whose owner holds `andrew:sculk_crossbow`.
- `projectileHitEntity` and `projectileHitBlock`, filtered to `andrew:sculk_bolt`.
- The shared interval (one `runInterval`, never `runJob`) for trail emission, lifetime and the carve queue.
- `playerInventoryItemChange` and held-item changes, used to strip Piercing.

## Outputs
- Health changes on the struck entity only, via `applyDamage` + `setCurrentValue`, with kill credit to the owner.
- Block edits: air for the crater and `minecraft:sculk` for the patch. These are ordinary world changes, synced and saved.
- `minecraft:sonic_explosion` particles (or an RP look-alike, `L0-sclk-ad02`) along each bolt's path.
- `[andrew] sculk:` log lines, which GameTests and the probe read as witnesses.

## Stage-7 order (from the plan)
1. Probe on checks (19136): `L0-sclk-p001`. It gates `adr-scbs`/`adr-scdm`. A failed gate supersedes the ADR before any build task.
2. `lgnd` v7 (no-ability def, def #5).
3. Item, token, recipe, RP.
4. Bolt pipeline and damage.
5. Crater and sculk, together with the deny-list extraction (Orbital scenarios as its gate).

## Child artifacts
- **Processes:** p001 probe · p002 shot→bolt · p003 flight/trail/expiry · p004 entity hit · p005 block hit/carve · p006 craft wiring.
- **Rules:** r001–r010.
- **Entities:** ent1 item · ent2 bolt entity · ent3 bolt record · ent4 carve plan.
- **ACs:** ac01–ac20 = T01–T20 (T01–T03, T19 and T20 as crossbow call sites of `lgnd`), ac21 probe, ac22 Orbital regression, ac23–ac27 iPad.
- **Decisions:** ad01–ad04 · **Assumptions:** as01–as05 · **Contradictions:** cx01–cx02 · **Glossary:** gl01–gl06 · **Constraints:** cons.

## Seams the reduce re-checks
- Orbital protection stays green after the deny-list move.
- The magnet's GameTests include def #5.
- A Katana ray stops on sculk (a full solid block).
- Crater vs a structure `protect` box: check, do not assume (`xasm25` says structures get no protection).






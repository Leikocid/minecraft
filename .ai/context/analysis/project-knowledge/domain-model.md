---
title: Domain Model
type: project-knowledge
generated_at: "2026-09-29T19:09:13.623Z"
source_channel: rollout
node_id: rollout-domain-model
aliases: ["rollout-domain-model","domain-model","project-knowledge/domain-model"]
is_a: ["rollout","domain-model"]
relates_to: ["L0-lgnd","L0-lgnd-ent1","L0-lgnd-ent2","L0-lgnd-ent3","L0-lgnd-ent4","L0-orbc","L0-orbc-ent1","L0-orbc-ent2","L0-orbc-ent3","L0-pntr","L0-pntr-ent1","L0-pntr-ent2","L0-pntr-ent3","L0-ring","L0-ring-ent1","L0-ring-ent2","L0-ring-ent3"]
priority: 540
---

# Domain Model

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## Entities

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





## Components (code-derived)

### Legendary weapon framework (shipped `src/legendary/`) — v3 delta (L0-lgnd)

---
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0-orbc", "L0-webs", "L0-scyt", "L0-pntr", "L0-ring", "L0-adr-orbc", "L0-adr-hold", "L0-adr-wpn2", "L0-adr-ochg", "L0-xcx9", "L0-xcx10", "L0-xcx11", "L0-xq3"]
governs_files: ["src/legendary/", "src/websword/trap.ts", "src/scythe/targeting.ts", "src/scythe/volley.ts", "src/orbital/", "src/main.ts", "src/gametest/main.ts"]
see_also: ["webswordspecv1ruen-part-1", "scytheofcalamityspecv1ruen-part-1", "orbitalcannonspecv1ruen-part-1", "orbitalcannonspecv1ruen-part-2", "orbitalcannonspecv1ruen-part-3"]
---
# Legendary weapon framework (shipped `src/legendary/`) — v3 delta

**Responsibility.** Every general legendary rule is implemented once, in `src/legendary/`, for three weapons: the Web Sword, the Scythe of Calamity and (v3) the Orbital Cannon. The general rules are Scythe §1 and §6, Web Sword §3, §4 and §8–§10, and Orbital §4, §5 and §7.

## Current state (verified in code, 2026-09-29)
The as-built shape in `L0-lgnd-ad07` still holds. No `src/legendary/` commit has landed since `120bdd5`. The **v2 backlog from `L0-adr-wpn2` has not shipped** (`L0-lgnd-cx11`):
- There is no `gen` on the mark or in the ledger.
- `_owed` is still a map `ownerId → one mark` (`recovery.ts:253`).
- `retention.ts` does not read the `Offhand` slot.
- No item JSON declares `minecraft:allow_off_hand`.
- `grep -rn orbital src/` finds nothing, so the Cannon is not started.

## v3 delta (this pass)
| # | Change | Artifacts |
|---|---|---|
| 1 | Add `ORBITAL_CANNON` to the static `LEGENDARIES`: `oc` / `orbital_cannon`, 600 ticks, refund 4 TNT + 1 Fishing Rod, `andrew:orbital` | `ent1`, `ac17`, `L0-adr-orbc` |
| 2 | Activation **mode**: `resolveActivation(player, mode)` with `"use" \| "attack"` and a per-def `activations`. Attack reads the main hand only. | `ad09`, `r015`, `p009`, `ac16` |
| 3 | Craft provenance: a recipe outputs a hidden **craft token** item. Plain `andrew:<weapon>` stacks (vanilla `/give`, Creative) never claim or refund (`xcx9`). | `ad08`, `r014`, `p001`, `ac15` |
| 4 | Loss return goes to the **last holder** (`holder` in the mark), with `owed` as a list keyed by holder (`xcx11`, answers `xq3`, realises `L0-adr-hold`) | `ad11`, `ent2`, `ent4`, `p003`, `ac08`, `ac18` |
| 5 | "Not destroyed" policy in three tiers: *prevent* (script-caused) → *spill* (vanilla container break) → *return* (fire, lava, cactus, TNT, Void). There is also a container-destruction rule (`xcx10`). | `ad10`, `r012`, `r013`, `ac09`, `ac20` |
| 6 | `protectLegendariesIn(dimension, volume)`, published for `pntr`/`ring` to call before they remove blocks or detonate | `p008`, `ac19` |
| 7 | The unshipped `wpn2` backlog (`gen`, owed list, off-hand read) is a **prerequisite** of 4 and 5 | `cx11` |

## Owns (unchanged, plus v3)
Everything it owned before, plus:
- the activation-mode resolver;
- craft tokens (the gate's half: the token → marked swap);
- the holder field;
- the destruction policy;
- `protectLegendariesIn`.

## Published contracts (v3)
- `LegendaryDef` gains `activations: ReadonlyArray<"use"|"attack">` (default `["use"]`) and `craftTokenId?: string`.
- `resolveActivation(player, mode = "use")`.
- `protectLegendariesIn(dimension, volume, opts?) → {moved, returned}`.
- `isLegendaryItemEntity(entity)`, which `ring` uses for drop suppression (`L0-adr-ochg` §3).
- `cooldown.*` and `isHiddenFromTargeting` are unchanged. The HUD gains a per-weapon key lookup: `andrew.<prefix>.ready/cooldown` if defined, else the shared `andrew.legendary.*` keys (which render `%s: Ready` / `%s: %s s`). The Cannon uses its own keys to render "Orbital Cannon — Ready" / "— 27s" (Orbital §7; `L0-adr-oded`).

## Does NOT own
- What an ability does: `trap.ts`, the Scythe volley, and the Cannon's charges and effects (`L0-orbc`, `L0-pntr`, `L0-ring`).
- The LMB target raycast and the Creative break cancel (`L0-orbc`).
- Item, entity and recipe JSON, including the token items' JSON (`webs`, `scyt`, `orbc`). `lgnd` only states the contract those files must meet (`r014`).

## Sequencing
One `lgnd` v3 task, in this order:
1. the `wpn2` backlog;
2. `holder`;
3. the tokens;
4. activation mode + the Cannon def;
5. `protectLegendariesIn`.

The `orbc` core tasks depend on items 4–5. They are also blocked on `L0-xq5` (LMB reach).

## Risk
- The token recipe change touches the shipped Web Sword and Scythe recipes. GameTests that simulate a craft by inserting an unmarked `andrew:web_sword` must insert the token instead. This is harness wiring, not an assertion (`L0-adr-lgnd` cx04 reading). `ac11` still gates it.
- A legendary nested inside a shulker box or bundle is invisible to every protection (`cx12`).





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






---
title: Domain Model
type: project-knowledge
generated_at: "2026-10-08T18:47:14.749Z"
source_channel: rollout
node_id: rollout-domain-model
aliases: ["rollout-domain-model","domain-model","project-knowledge/domain-model"]
is_a: ["rollout","domain-model"]
relates_to: ["L0-katn","L0-katn-ent1","L0-katn-ent2","L0-lgnd","L0-lgnd-ent1","L0-lgnd-ent2","L0-lgnd-ent3","L0-lgnd-ent4","L0-magn","L0-magn-eelm","L0-magn-eirn","L0-sauc","L0-sauc-ent1","L0-sauc-ent2","L0-sclk","L0-sclk-ent1","L0-sclk-ent2","L0-sclk-ent3","L0-sclk-ent4","L0-strm","L0-strm-edef","L0-strm-ercp","L0-ufoc","L0-ufoc-ent1","L0-ufoc-ent2"]
priority: 620
---

# Domain Model

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## Entities

### E-katn-1: The Dragon Katana item (L0-katn-ent1)

---
title: "E-katn-1: The Dragon Katana item and its LegendaryDef"
is_a: ["entity"]
part_of: ["L0-katn"]
relates_to: ["L0-lgnd", "L0-lgnd-ent1", "L0-webs-ent1", "L0-katn-r001", "L0-xasm22"]
see_also: ["dragonkatanaspecv1ruen-part-1"]
---
# E-katn-1: The Dragon Katana item

**Item JSON** (`packs/behavior/items/dragon_katana.json`). It is a copy of `web_sword.json` with these changes:

| Field | Value |
|---|---|
| `identifier` | `andrew:dragon_katana` |
| `menu_category` | `equipment`, group `minecraft:itemGroup.name.sword` |
| `display_name` | `item.andrew:dragon_katana.name`: EN "Dragon Katana", RU "Катана дракона" |
| `icon` | `andrew_dragon_katana` (new RP texture) |
| `max_stack_size` | 1 |
| `hand_equipped` | true |
| `allow_off_hand` | true (needed for the off-hand slot, even for scripts) |
| `fire_resistant` | true |
| `enchantable` | slot `sword`, value 10 |
| `damage` | 7, the same value that makes the Web Sword match a Diamond Sword |
| `digger` | `is_sword_item_destructible`, speed 15 (no digger-tag trap) |
| `tags` | `minecraft:is_sword`, `minecraft:is_tool` |
| durability | **none**: no `minecraft:durability` component (T15) |

**Craft token.** `andrew:dragon_katana_crafted`: the recipe output that the framework swaps for a marked Katana (`L0-lgnd-p001`). `menu_category: none`. (Engine fact: `hasitem` on it is a syntax error; tests check it via the inventory.)

**LegendaryDef #4.** The final values are fixed by `L0-lgnd-ad14` (reconciled at reduce v6); they are repeated here only for reading:
```
itemId: "andrew:dragon_katana", keyPrefix: "dk", abilityKey: "dragon_katana",
nameKey: "item.andrew:dragon_katana", cooldownTicks: 600, craftGate: true,
craftTokenId: "andrew:dragon_katana_crafted",
refund: [["minecraft:golden_apple",2],["minecraft:ender_pearl",2],["minecraft:diamond_sword",1]],
textPrefix: "andrew.katana", command: "andrew:katana",
hudKeys: { ready: "andrew.katana.hud_ready", cooldown: "andrew.katana.hud_cooldown" }
```
`keyPrefix "dk"` must not collide with `ws`, `sc` or `oc`. Once a world holds it, it is frozen (a changed key orphans crafted instances).

**Lifecycle.** craft or `/give` → marked instance (owner, id, gen) → held, dropped, contained, traded freely → death, Void and hazard handling by `lgnd`. The Katana carries no state of its own: the cooldown lives on the player (`andrew:cd_dragon_katana`), and the fall flag lives in memory (`L0-katn-ent2`).





### E-katn-2: FallFlag and TeleportPlan (L0-katn-ent2)

---
title: "E-katn-2: FallFlag and TeleportPlan (in-memory, per activation)"
is_a: ["entity"]
part_of: ["L0-katn"]
relates_to: ["L0-katn-p001", "L0-katn-p002", "L0-adr-ktfl", "L0-xasm20"]
---
# E-katn-2: FallFlag and TeleportPlan

**FallFlag**: one per player at most, in a module `Map<playerId, FallFlag>`. It is never persisted.

| Attribute | Type | Meaning |
|---|---|---|
| `until` | epoch ms | `Date.now() + 10_000` at arm time (C-21, `L0-xasm20`) |
| `dimId` | string | dimension of B; a mismatch consumes the flag |

States: *absent* → armed (successful teleport) → absent (consumed by landing, liquid, climb, glide, death, dimension change, logout or expiry; or protected landing done). Re-arming replaces it.

**TeleportPlan**: the pure result of the trace and search. It is built in `src/katana/plan.ts` with no engine imports, so node tests can cover it with a fake block reader.

| Attribute | Type | Meaning |
|---|---|---|
| `origin` | Vector3 | A, feet location at use |
| `head` | Vector3 | H, head location at use |
| `dir` | Vector3 | unit view direction at use |
| `endpoint` | Vector3 | E, hit point pulled back 0.3, or `H + maxDistance·dir` |
| `hitFace` | Direction \| undefined | face of the stopping block |
| `stoppedBy` | `"block" \| "unreadable" \| "range"` | why the trace ended |
| `feet` | Vector3 \| undefined | chosen cell centre (B); undefined → refused |

Invariant: if `feet` is set, then `|feet + (0,1.62,0) − head| ≤ 20` and `feet` lies on the owner's side of the hit-face plane (`L0-katn-r004`).





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
- hopper, only when empty; one with anything in it is a container (`L0-magn-adhp`).

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
| `minecraft:shooter` | `ammunition: [{item: "minecraft:arrow", use_offhand: true, search_inventory: true, use_in_creative: true}]`, `charge_on_draw: true`, `max_draw_duration` = 1.25 s, or 0.5 s under the scripted Quick-Charge scheme (`as05`) |
| — load-bearing | `charge_on_draw: true` is what makes the item hold a loaded state; without it, and without `scale_power`, a bare tap fires a full-power bolt. `max_draw_duration` **is** the native fire-rate gate (`cx02`) |
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





### Storm Blade (L0-strm-edef)

---
title: "Storm Blade def #6 and item"
is_a: ["entity"]
part_of: ["L0-strm"]
relates_to: ["L0-xasm32", "L0-adr-sckp", "L0-lgnd", "L0-scyt"]
governs_files: ["src/legendary/registry.ts", "packs/behavior/items/storm_blade.json", "packs/behavior/items/storm_blade_crafted.json"]
---
# Storm Blade

## Def #6 (`registry.ts`, an active def)
| Field | Value |
|---|---|
| itemId | `andrew:storm_blade` |
| keyPrefix | `sb` (unique among `ws sc oc dk sk`, per adr-sckp) |
| abilityKey | `storm_blade` |
| nameKey | `item.andrew:storm_blade` |
| cooldownTicks | 600 |
| craftTokenId | `andrew:storm_blade_crafted` |

## Item JSON (modelled on `scythe_of_calamity.json`)
- `minecraft:max_stack_size` 1, `hand_equipped` true, `allow_off_hand` true, `fire_resistant` true.
- `minecraft:damage`: **N from probe P6** (expected 7, the Bedrock diamond sword). It is never a hard-coded "spec" number.
- `minecraft:enchantable { slot: "sword", value: 10 }`, the diamond sword's enchantability.
- **No `minecraft:durability`**, so it is unbreakable, as on the Scythe.
- Tags `minecraft:is_sword` and `minecraft:is_tool`. Cobweb digger speed is optional; it is not required by the spec.
- `minecraft:icon` `andrew_storm_blade`. The RP texture is in `item_texture.json`.
- `menu_category { category: "equipment" }`, so it shows in Creative "Equipment".
- The token `storm_blade_crafted` has `menu_category none`, as the other tokens do.

## Lang
- RU: `item.andrew:storm_blade.name=Клинок бури`; EN: `Storm Blade`.
- HUD ready: «Клинок бури — Готово» / "Storm Blade — Ready".
- The broadcast uses the shared `lgnd` key with the localised name.

## Recipe (`recipes/storm_blade.json`)
`" L " / "WSW" / " L "`. L = `minecraft:lightning_rod`, W = `minecraft:wind_charge`, S = `minecraft:diamond_sword` → `andrew:storm_blade_crafted`. It unlocks on the lightning rod.
- Refund on a blocked craft: 2 rods, 2 wind charges, 1 diamond sword (the crossbow pattern).
- A diamond sword key matches any damage or enchant state. This is accepted: the input is consumed.

## State
There is no item-level state beyond the `lgnd` stamps (gen id, last holder). The cooldown is per-player under the `sb` prefix.





### Vanilla recipes (adr-sbvr A) (L0-strm-ercp)

---
title: "Vanilla output recipes: elytra and totem_of_undying"
is_a: ["entity"]
part_of: ["L0-strm"]
relates_to: ["L0-adr-sbvr", "L0-lgnd", "L0-magn"]
governs_files: ["packs/behavior/recipes/elytra.json", "packs/behavior/recipes/totem_of_undying.json"]
---
# Vanilla recipes (adr-sbvr A)

| File | identifier | pattern | key | result | unlock |
|---|---|---|---|---|---|
| `elytra.json` | `andrew:elytra` | `"F F" / "FCF" / "F F"` | F = `minecraft:feather`, C = `minecraft:diamond_chestplate` | `minecraft:elytra` ×1 | feather |
| `totem_of_undying.json` | `andrew:totem_of_undying` | `"GGG" / "GEG" / "GGG"` | G = `minecraft:gold_ingot`, E = `minecraft:emerald` | `minecraft:totem_of_undying` ×1 | gold_ingot |

- `format_version` "1.21.0", `tags: ["crafting_table"]`, like the pack's other recipes.
- **No script observes them.** No token, no gate, no dynamic property, no lore (C-31). The magnet, protection and retention treat both outputs as ordinary items.
- **Every input is consumed.** An enchanted or damaged chestplate is accepted as an input, and its enchantments are lost.
- **Collision.** Neither pattern overlaps a vanilla or pack recipe. The pack's only other 3×3 ring-with-centre shapes are legendary, with different keys.





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
- Writes go through `worldStore` (`src/ufo/env.ts:86`). `DynamicPropertyStore` is used only in `src/main.ts:85` for structures.





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





## Components (code-derived)

### Dragon Katana (`andrew:dragon_katana`) (L0-katn)

---
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-lgnd-p001", "L0-lgnd-p002", "L0-lgnd-p003", "L0-lgnd-p004", "L0-lgnd-p005", "L0-lgnd-p008", "L0-webs", "L0-scyt", "L0-magn", "L0-adr-ktob", "L0-adr-ktfl", "L0-xasm18", "L0-xasm19", "L0-xasm20", "L0-xasm21", "L0-xasm22", "L0-xcx21"]
see_also: ["dragonkatanaspecv1ruen-part-1", "dragonkatanaspecv1ruen-part-2", "dragonkatanaspecv1ruen-part-3"]
governs_files: ["src/katana/", "packs/behavior/items/dragon_katana.json", "packs/behavior/recipes/dragon_katana*.json", "packs/resource/texts/*.lang"]
---
# Dragon Katana (`andrew:dragon_katana`)

**Responsibility.** This component owns what is unique to the fourth legendary weapon:
- the item and recipe identity (`L0-katn-ent1`, `L0-katn-r001`);
- the teleport ability body: trace → safe cell → teleport → cooldown (`L0-katn-p001`, rules `r002`–`r005`);
- the one-shot fall flag (`L0-katn-p002`, `L0-katn-ent2`, `r006`);
- the cherry-petal trail (`L0-katn-r007`);
- the Katana HUD strings (`L0-katn-r008`);
- the GameTests for T04–T15 and the Katana call sites of T01–T03 and T16–T18.

It is the Katana's counterpart to `L0-webs` (trap body) and `L0-sprj`/`L0-scyt` (volley body). All four plug into `L0-lgnd`.

**Not owned here (cite `lgnd`, do not restate).**
- One Survival craft per world, the persistent flag, refund, Creative and `/give` copies, first-craft broadcast: `L0-lgnd-p001`.
- Death retention, and a contained item left alone: `L0-lgnd-p002`.
- Void, offline and owed return: `L0-lgnd-p003`.
- Orbital blast and ring protection: `L0-lgnd-p008`.
- Hand priority (main hand first, then a ready off hand): `L0-lgnd-p004`, through the shipped `resolveActivation` (`src/legendary/hands.ts:35`).
- The cooldown clock (`startCooldown`, epoch ms, `src/legendary/cooldown.ts:47`) and the shared HUD pass: `L0-lgnd-p005`.
- The T17 reading under C-16: `L0-xcx21`, `L0-xasm22`.

**What `katn` adds to the framework.** Def #4 in `LEGENDARIES` with `hudKeys` set: the def field already exists and the Orbital Cannon uses it. Nothing else. If a probe shows a framework hook is needed, that is an L0 contradiction, not a local patch (plan §"lgnd answers first").

**Inputs.**
- `world.afterEvents.itemUse`, plus `playerInteractWithBlock` for the same press, de-duplicated as in `src/websword/trap.ts`.
- The server-side `player.getHeadLocation()` and `getViewDirection()`.
- Block state along the segment.

**Outputs.**
- One `player.teleport(B, { keepVelocity: false, rotation kept })` in the same dimension.
- `startCooldown(player, "dragon_katana")`.
- An in-memory fall flag.
- A bounded burst of pink petal particles A→B.
- No block edits, no damage and no entities.

**Core flow** (`L0-katn-p001`): resolve → trace (`L0-adr-ktob`, refined by `L0-katn-ad01`) → endpoint (`L0-xasm18`, `L0-katn-as01`) → safe-cell search (`L0-xasm19`, `L0-katn-r004`) → teleport → cooldown → fall flag → trail. Any refusal leaves no state: no teleport, no cooldown, no message.

**Constraints honoured.**
- C-24: server-authoritative, ≤ 20, unreadable = solid, no block edits.
- C-25: the fall flag is one-shot, bounded and not persisted.
- C-5e: a one-shot trail; the watcher costs nothing while no flag is set.
- C-21: epoch-ms clocks.
- C-16: closest stable behaviour, deviations documented.

**Open items.**
- `L0-katn-cx01`: resolved at reduce v6 by amending `L0-adr-ktob` §3 (fits ≠ safe).
- `L0-katn-as01` … `as04`: endpoint geometry, aim source on iPad, hazards, the fall look-ahead.

**Probe first** (before any build task): (1) a self-teleport mid-fall resets fall distance (`L0-adr-ktfl`); (2) the ray flags: liquids skipped, cobweb/grass/carpet passable, slabs and fences hit; (3) `getBlockFromRay` behaviour at an unloaded chunk; (4) `minecraft:cherry_leaves_particle` via `spawnParticle` renders on iPad.

**Channels.** `bds`: T01–T18 as GameTests (`L0-katn-ac01` … `ac08`). `ipad`: trail, HUD, icon, Creative placement, aim feel (`L0-katn-ac09`).





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
- From `orbc` (`src/orbital/flight.ts:117`): `registerInterceptor((attack, charge, from, to, tick) => boolean)`.

## Outputs
- `saucerPosition()`, which `magn` reads every tick for its hold targets.
- `reportShotDown({eventId, ownerId, ownerName})` to `ufoc`, which starts the 15 min pause from the shot (UFO §2, §8).
- Item entities for the reward, and the `andrew.ufo.shot_down` broadcast.

## Owns
- `packs/behavior/entities/ufo_saucer.json`, `packs/resource/entity/ufo_saucer.entity.json`, the geometry, texture, animation and render controller.
- `src/ufo/saucer.ts` (path, beam and sound) and `src/ufo/shootdown.ts`.
- The interceptor change in `src/orbital/flight.ts`. `Outcome` includes `"intercepted"` (`src/orbital/flight.ts:40`).
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





### Sculk Crossbow (`andrew:sculk_crossbow`): component v1 (L0-sclk)

# Sculk Crossbow (`andrew:sculk_crossbow`): component v1

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-lgnd", "L0-orbc", "L0-pntr", "L0-magn", "L0-scyt", "L0-katn", "L0-adr-scbs", "L0-adr-scdm", "L0-adr-sctr", "L0-xcx22", "L0-xcx23", "L0-xcx24", "L0-xcx25", "L0-xasm23", "L0-xasm24", "L0-xasm25", "L0-xasm26", "L0-xasm27", "L0-xq7"]`

Source: `docs/Sculk_Crossbow_Spec_v1_RU_EN.docx` (raw `sculkcrossbowspecv1ruen-part-1..4`, priority 610). Legendary def #5. It is the first legendary with **no active ability, no cooldown and no HUD line** (`L0-xcx24`).

## Responsibility
A passive ranged legendary. Every projectile its holder fires is replaced at spawn by one `andrew:sculk_bolt`. The bolt flies physically, with a Warden-style Sonic Boom trail, and resolves exactly once (C-26):
- **entity hit:** fixed `SONIC_BOOM_DAMAGE` = 10 HP, absorption first, through armour, the shield and the invulnerability window (C-28), plus a sculk patch under the target, with no crater;
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





### strm · Storm Blade + two vanilla recipes (L0-strm)

---
title: "strm · Storm Blade (`andrew:storm_blade`) + Elytra/Totem recipes"
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-katn", "L0-sclk", "L0-scyt", "L0-magn", "L0-adr-sbdm", "L0-adr-sblt", "L0-adr-sbvr", "L0-xcx26", "L0-xcx27", "L0-xq8", "L0-xasm29", "L0-xasm30", "L0-xasm31", "L0-xasm32"]
see_also: ["stormbladeelytratotemspecruen-part-1", "stormbladeelytratotemspecruen-part-2"]
governs_files: ["src/storm/", "src/legendary/registry.ts", "src/main.ts", "src/katana/plan.ts", "packs/behavior/items/storm_blade*.json", "packs/behavior/recipes/storm_blade.json", "packs/behavior/recipes/elytra.json", "packs/behavior/recipes/totem_of_undying.json"]
---
# strm · Storm Blade + two vanilla recipes

**Source:** "Storm Blade + Elytra + Totem of Undying v1" (§01–§07). Code base 1.8.0.

## Responsibility
1. **Legendary def #6**, the Storm Blade. It is a diamond-sword-class melee weapon with:
   - an **active** Use ability: a straight trace of ≤ 10 blocks that deals 10 HP pre-armour to the first living entity, with three visual strikes;
   - a **passive** melee proc: 30 % for +6 HP pre-armour and one visual strike.
2. **Two unlimited vanilla recipes**: 6 feathers + diamond chestplate → `minecraft:elytra`, and 8 gold ingots + emerald → `minecraft:totem_of_undying` (`L0-adr-sbvr`, C-31).

## What strm owns vs cites
| Area | Owner | Note |
|---|---|---|
| Craft-once gate, token swap, refund, broadcast, Creative/`/give` copies | `lgnd` (cited) | def-driven; strm only adds def #6 |
| Retention on death, chest stays, hazards, Void → last holder (incl. offline) | `lgnd` (cited) | `lgnd` scenarios gain def #6 |
| Hand priority (`resolveActivation`), HUD line, cooldown storage | `lgnd` (cited) | HUD text via lang keys |
| Magnet pick-up | `magn` (cited) | legendary scenarios include def #6 |
| Ray stepping, `TRACE_FLAGS` | `katn` | **imported** from `src/katana/plan.ts` (`L0-strm-adtr`) |
| Hurt-window technique | `sclk` | **mirrored**, not shared: armour damage ≠ true damage |
| Damage helper `src/storm/damage.ts` | strm | `L0-adr-sbdm`, C-29 |
| Trace, visuals, cooldown spend, passive roll | strm | `L0-adr-sblt`, C-30, C-32 |
| `elytra.json`, `totem_of_undying.json` | strm | no script and no gate |

## Inputs
- `itemUse` → `resolveActivation(player)` → `{ def: storm_blade, slot }`.
- `entityHitEntity` (+ the same tick's `entityHurt` for L) with the blade in the main hand.
- Dimension block/entity rays; an injectable `Rng` (`() => number`).

## Outputs
- `applyDamage` on exactly one target per event, with cause `entityAttack` and the wielder as `damagingEntity`.
- Particles and sound only: no entity is spawned, and there is no `lightning_bolt`.
- The cooldown is written through the def's cooldown key, on the active path only.

## Sub-artifacts
- Processes: `L0-strm-pact` (active), `L0-strm-ppas` (passive), `L0-strm-pprb` (probe).
- Rules: `L0-strm-rdmg` (damage), `L0-strm-rcd` (validity/cooldown), `L0-strm-rvis` (visuals).
- Entities: `L0-strm-edef` (def + item), `L0-strm-ercp` (the three recipes).
- ACs: `L0-strm-acr` (craft/legendary), `L0-strm-acd` (damage), `L0-strm-act` (trace/cooldown), `L0-strm-acv` (visuals/vanilla), `L0-strm-aci` (iPad).
- Decision `L0-strm-adtr`, assumption `L0-strm-asm1`, contradiction `L0-strm-cxkb`.

## Framework boundary (xasm32)
The only framework edits allowed are the def #6 entry in `registry.ts` and the subscriptions in `main.ts`. Exporting the Katana's private `trace` is a `katn` edit, not a framework edit (`L0-strm-adtr`). Any other change to `src/legendary/*` means a new L0 contradiction before the build.

## Build order (from the L0 plan)
1. Probe.
2. Vanilla recipes.
3. Def, item, token, recipe, RP and lang.
4. Damage helper with the hurt-window proof.
5. Active trace, visuals, cooldown and HUD.
6. Passive.





### L0-ufoc · UFO event core (schedule, phases, commands, restart) (L0-ufoc)

# L0-ufoc · UFO event core (schedule, phases, commands, restart)

**Links:** `part_of: ["L0"]` · `is_a: ["component"]` · `relates_to: ["L0-sauc", "L0-magn", "L0-adr-ufom", "L0-adr-ufpc", "L0-adr-ufht", "L0-xasm13", "L0-xasm14", "L0-xasm17", "L0-xcx17", "L0-xcx20"]`

**Shipped: UFOC-CORE-01-AA (aef4d54, merge 4f479af), `src/ufo/`.** It implements `L0-adr-ufom`, `L0-adr-ufpc` and `L0-adr-ufht` as given and does not re-derive them.

## Responsibility
`ufoc` is the event's only clock and only state machine (UFO §2, §9, §10, §12):
- **Schedule** (`r001`, `p001`). The next arrival is stored as epoch ms in `andrew:ufo_next_ms` (C-21). The first arrival comes a random 10–20 min after the first join (`L0-xasm14`). After every departure, shoot-down, `stop` or restart, the next one is set 15 min out. When an arrival falls due, the event waits for an Overworld player.
- **Enable flag** `andrew:ufo_enabled` (default on, `r006`).
- **Target and centre** (`r002`). The target is a random valid Overworld player. The centre is the block under their feet when the arrival starts, and it is frozen from then on.
- **Hover height** (`r003`): `hoverY = min(centre.y + 40, ceiling − 15)`, where `ceiling = overworld.heightRange.max` (`L0-adr-ufht`).
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






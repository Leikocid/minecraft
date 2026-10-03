---
title: Domain Model
type: project-knowledge
generated_at: "2026-10-03T14:58:23.872Z"
source_channel: rollout
node_id: rollout-domain-model
aliases: ["rollout-domain-model","domain-model","project-knowledge/domain-model"]
is_a: ["rollout","domain-model"]
relates_to: ["L0-katn","L0-katn-ent1","L0-katn-ent2","L0-lgnd","L0-lgnd-ent1","L0-lgnd-ent2","L0-lgnd-ent3","L0-lgnd-ent4"]
priority: 600
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





### Legendary weapon framework (`src/legendary/`), v6: as built in 1.4.4, plus the Dragon Katana delta (L0-lgnd)

---
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0-katn", "L0-orbc", "L0-webs", "L0-scyt", "L0-pntr", "L0-ring", "L0-magn", "L0-stgt", "L0-adr-hold", "L0-xcx11", "L0-xcx21", "L0-xasm22", "L0-lgnd-ad12", "L0-lgnd-ad14", "L0-lgnd-r017", "L0-lgnd-cx14"]
governs_files: ["src/legendary/", "src/websword/trap.ts", "src/scythe/targeting.ts", "src/orbital/activation.ts", "src/main.ts", "src/gametest/main.ts", "tests/legendary-registry.test.mjs"]
see_also: ["dragonkatanaspecv1ruen-part-1", "dragonkatanaspecv1ruen-part-2", "dragonkatanaspecv1ruen-part-3", "ufomagnetspecv1ruen-part-4", "orbitalcannonspecv1ruen-part-1"]
---
# Legendary weapon framework (`src/legendary/`), v6: as built in 1.4.4, plus the Dragon Katana delta

**Responsibility.** Every general legendary rule is implemented once, for every def in `LEGENDARIES`:
- the craft gate with tokens, and the first-craft broadcast
- marks and generation
- death retention
- loss return and the owed list
- protection from script-caused destruction (`protectLegendariesIn`)
- hand priority (`resolveActivation`)
- cooldown and busy
- HUD
- `hidden_until`
- the type predicate `isLegendaryStack`

v6 adds the **fourth def, the Dragon Katana** (`katn`). It needs **no framework code**, only data (`ad14`).

## As built in 1.4.4 (verified in code, 2026-10-03), see `ad12`
**Shipped**
- gen guard, owed list, pending list, off hand, craft tokens, `fire_resistant`, `protectLegendariesIn`, `isLegendaryItemEntity`, departure tracking.
- `heldLegendaries(player)` and `resolveActivation(player)` (`hands.ts:18`, `:35`). The resolver is Use-priority only: main if ready and not busy, else off. It has **no `mode` argument**, and the Cannon's LMB latch stays in `orbital/activation.ts`. That remains the as-built answer to `ad09`.
- `isLegendaryStack` (`registry.ts`). It is type-based over every def's `itemId` and `craftTokenId`, and `magn` uses it.
- **Void holder return** (merge `0a9d2b5`). `recovery.ts:135` `VOID_HOLDER_TYPES` = chest and hopper minecart. `beforeEvents.entityRemove` below `heightRange.min` reads the minecart's container, and every live marked instance goes through `lost()` on the next tick.

**Still open**
1. **`holder`.** `lost()` targets `w.mark.owner` (`recovery.ts:477`), and the protect hand-back targets `mark.owner` (`:785-787`). Katana §3 ("последнему владельцу", to the last owner) is the fourth spec asking for the last holder. **`L0-xcx11` stays open**, and `ad11`/`ac18` are unbuilt.
2. **Armour stand in the Void.** Its hands cannot be read on 2.10.0, so a legendary it holds is lost when the stand falls (`README.md:71`, `probe_ufo_holder_void`). Filed as `cx14`. The magnet avoids it (`r016`). Nothing else in the add-on moves an armour stand.
3. Nested shulker and bundle contents (`cx12`). The hopper-minecart stale copy (`as15`, `cx02`).

## v6 Katana delta
| # | Change | Artifacts |
|---|---|---|
| 1 | Def #4 `DRAGON_KATANA`: `andrew:dragon_katana`, prefix `dk`, ability `dragon_katana`, 600 ticks, token `andrew:dragon_katana_crafted`, refund 2 golden apple + 2 ender pearl + 1 diamond sword, command `andrew:katana`, `hudKeys` for the em-dash string | `ad14`, `as17` |
| 2 | Uniqueness-flag key `andrew:dk_crafted` (with `andrew:dk_crafted_by`), derived by `keysFor` | `ad14`, `ac23` |
| 3 | The registry uniqueness test also covers `craftTokenId` and `textPrefix` (as `ac11` asked; today it checks 4 fields) | `ac23` |
| 4 | No per-weapon code needed in `isLegendaryStack`, retention, recovery, `protectLegendariesIn`, the craft gate, commands or the HUD: each iterates `LEGENDARIES` or calls `defForStack`/`defForToken` | `ad14` |
| 5 | T16–T18 for the Katana under C-16. Fire and lava are prevented; Orbital blast and rings are prevented through `protectLegendariesIn`; cactus, TNT and despawn are **returned**; the Void returns to `owner` until `xcx11` closes | `ac24`, `L0-xcx21`, `L0-xasm22` |
| 6 | A wielder teleport is not a loss event, and every Katana teleport stays in the player's own dimension | `r017`, `ac24` |

## Published contracts (unchanged)
- `LEGENDARIES`, `defForStack`, `defForToken`, `isLegendaryStack`.
- `isReady`, `startCooldown`, `setBusy`, `clearBusy`, `isBusy`.
- `heldLegendaries(player)`, `resolveActivation(player)`.
- `protectLegendariesIn(dim, box, {avoid, reason}) → {moved, handedBack}`.
- `isLegendaryItemEntity`.
- `isHiddenFromTargeting`, `hideFromTargeting`.

## Does NOT own
- The Katana's trace, safe cell, teleport, fall flag and trail (`katn`, `L0-adr-ktob`, `L0-adr-ktfl`).
- Item, token and recipe JSON, and the lang strings (`katn`).
- The magnet's selection (`magn`).

## Next task (one `lgnd` task, for the Katana; it lands with `katn` item 2)
1. Add `DRAGON_KATANA` to `LEGENDARIES`.
2. Extend the uniqueness test.
3. Add key-derivation asserts for `dk`.
4. Add the Katana instances of the framework GameTests (`ac23`, `ac24`).

`holder` is a separate task, still blocked on `L0-adr-hold`.






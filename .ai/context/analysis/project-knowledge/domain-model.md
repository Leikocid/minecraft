---
title: Domain Model
type: project-knowledge
generated_at: "2026-10-12T18:07:51.641Z"
source_channel: rollout
node_id: rollout-domain-model
aliases: ["rollout-domain-model","domain-model","project-knowledge/domain-model"]
is_a: ["rollout","domain-model"]
relates_to: ["L0-ench","L0-ench-ent1","L0-trdt","L0-trdt-ecus","L0-uwbw","L0-uwbw-earm","L0-uwbw-eitm","L0-uwbw-esfr"]
priority: 640
---

# Domain Model

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## Entities

### Entity · RollRequest / EnchantRoll / ProbeVerdict (L0-ench-ent1)

# Entity · RollRequest / EnchantRoll / ProbeVerdict

**is_a:** entity · **part_of:** L0-ench · **relates_to:** L0-ench-roll, L0-ench-prob

## RollRequest (the input to `rollEnchantments`)
| Field | Type | Notes |
|---|---|---|
| itemId | string | A vanilla or `andrew:` id; looked up in `ELIGIBILITY`. |
| tier | 1 \| 2 \| 3 | The table tier / cost class. It caps levels (`r005`, `xasm39`). |
| rng | () => number | Uniform in [0, 1). Injected; `Math.random` in production. |

## EnchantRoll (the output)
| Field | Type | Notes |
|---|---|---|
| enchantments | `{id: string, level: number}[]` | The result. It holds no curse, no forbidden id and no conflicting pair. |
| eligible | boolean | False when the item has no eligible set. Not a generation. |
| rareStage | `'hit' \| 'miss' \| 'none'` | `none` means the item has no eligible rare enchantment, so it is excluded from the 20 % statistic. |
| trace | `TraceEntry[]` | Every draw: `{stage:'rare'\|'count'\|'pick'\|'level', id?, u, success?}`. For the level rule it holds all three level rolls. |

## Static data in `roll.ts`
- `ELIGIBILITY: Map<itemId, EnchantId[]>`, generated from 1.26.51.
- `MAX_LEVEL: Map<EnchantId, number>`.
- `TREASURE: Set<EnchantId>`. This is the formerly table-inaccessible set, finalised by the probe.
- `CURSES = {binding, vanishing}`.
- `CONFLICT_GROUPS: EnchantId[][]` (`r002`).
- `SPECIAL_LEVEL = {wind_burst, unbreaking}`.

## ProbeVerdict (a document section, not code)
| Field | Content |
|---|---|
| version | Bedrock 1.26.51, `@minecraft/server` 2.10.0 stable. |
| q1Observability | The signals table: present / absent / ambiguous, with evidence. |
| q2SimTable | yes/no, with the scenario name. |
| q3Reachable | For each slot, the treasure set already offered at the table; the Mace and Wind Burst; spear Lunge. |
| q4Signature | The source × signal matrix and its ambiguous rows. |
| options | The option table (a)/(b)/(c) with costs. |
| claim | The exact sentence used in the release notes / acceptance sheet. |





### Custody record (`andrew:tr.custody`) (L0-trdt-ecus)

# Custody record (`andrew:tr.custody`)

**Links.** is_a: entity. relates_to: L0-trdt-adcl, L0-trdt-pthr, L0-trdt-pfbk, L0-lgnd-ent1.

**Storage.**
- A world dynamic property holding a JSON map `throwId → record`.
- It is written only by `src/trident/custody.ts`.
- There are several entries at once only when Creative copies are thrown. At most one entry is marked, because the world has one live instance.

| Attribute | Type | Meaning |
|---|---|---|
| `throwId` | string | `${absoluteTime}-${random}`. The custody entity carries the same string as the entity dynamic property `andrew:tr.throw`. |
| `owner` / `ownerName` | string | The thrower's id and name. Delivery goes to `mark.holder` via lgnd, which is the thrower, stamped when the copy arrived in their slot. |
| `mark` | `Mark` or absent | `withLook(getMark(def, stack), stack)`, which includes the enchantments, name tag and lore. Absent = an unmarked Creative copy. |
| `state` | `flying` or `returning` | |
| `entityId` | string or absent | The current custody entity. Absent only inside the throw's sync block. |
| `dimension` | string | The dimension id of the entity. |
| `last` | Vector3 | The entity position, refreshed every 20 ticks (used to drop an unmarked copy). |
| `since` / `returnSince` | number | `world.getAbsoluteTime()` at the throw and at the start of the return. Absolute time survives a restart; `system.currentTick` does not. |

**In-memory companion:** `Map<throwId, ItemStack>`, the exact thrown stack used for a normal return. It is lost on restart, and a record without a clone always goes through the fallback delivery.

**Invariants.**
- A record exists if and only if the copy is in custody.
- It is deleted in the same sync block as the insert or the `deliverToLastHolder` call.
- A custody entity whose `andrew:tr.throw` has no record is stale and is removed on sight.
- A record whose mark is not live (`isLive` false) is deleted without delivery.





### E-uwbw-arm · The armed charge and the armed shot (L0-uwbw-earm)

# E-uwbw-arm · The armed charge and the armed shot

**Links.** relates_to: L0-xasm38, L0-xcx33, C-41, L0-uwbw-r001.

**The player's charge, `ub:armed`.** This is a per-player dynamic property. It persists through logout, restart and death, and it is independent of which bow is held.

| State | Condition | HUD |
|---|---|---|
| ready | not armed, no cooldown | `andrew.ub.ready` |
| armed | `ub:armed` = true | `andrew.ub.armed` |
| cooldown | cooldown timer > now | `andrew.ub.cooldown` (seconds left) |

Armed and cooldown are mutually exclusive: arming is refused during the cooldown.

**The arrow's mark, `ub:armedShot`.**
- **Set at the swap/tag** on the **first** arrow fired by a player whose `ub:armed` is true.
- **"First".** The player holds a `ub:pendingShot` id. While an armed arrow is in flight, later arrows are plain. If the armed arrow misses, the pending shot clears and the next arrow carries the mark again.
- **An arrow fired before arming is never marked.**
- **Multishot does not exist on a bow, and Infinity changes nothing.**

**Consumption.** `ub:armed` is cleared only by `L0-uwbw-r001`'s successful hit, in the same synchronous block that:
- starts the cooldown;
- plays the strike;
- starts Super Fire.





### E-uwbw-itm · The Underwater Bow item and def #8 (L0-uwbw-eitm)

# E-uwbw-itm · The Underwater Bow item and def #8

**Links.** relates_to: L0-lgnd, L0-xasm38, L0-sclk.

**Item `andrew:underwater_bow`** (BP `packs/behavior/items/underwater_bow.json`):
- `minecraft:shooter`: ammunition `minecraft:arrow` (plain, tipped and spectral; `use_offhand`, `search_inventory`), `max_draw_duration` as a vanilla bow (1.0 s), **no `charge_on_draw`** (that would make it a crossbow);
- `minecraft:use_modifiers` / `minecraft:use_animation` `bow`;
- `minecraft:enchantable` slot `bow`, value as the vanilla bow (1);
- **no `minecraft:durability`** (infinite durability), max stack 1;
- `minecraft:allow_off_hand`, only if probe row 9 passes;
- `minecraft:icon`, `minecraft:display_name` `item.andrew:underwater_bow.name`;
- a Creative menu entry (`equipment`, group `itemGroup.name.bow`).

**RP.** An icon plus 3 pull-stage textures, and an attachable with the vanilla bow's pull animation. Every Molang comparison is parenthesised. RU/EN lang for the name, the HUD (ready / armed / cooldown) and the craft messages.

**Token `andrew:underwater_bow_crafted`.** `menu_category: none` (so `hasitem` cannot see it). It is exchanged by `craftgate`.

**Def #8 (`ActiveLegendaryDef`).**
- `itemId` `andrew:underwater_bow`;
- `keyPrefix` `ub`, `abilityKey` `ub`;
- `cooldownTicks` 600;
- `craftGate` true, `craftTokenId` the token;
- `craftReturn` `[["minecraft:bucket", 2]]`;
- `refund`: 1 lightning rod, 1 bow, 2 water buckets, 1 sand, with **no** extra empty buckets (the trident's exchange rule);
- `hudKeys` `{ready, armed, cooldown}`;
- command `andrew:bow`.

**State keys.**
- **Player:** `ub:armed` (boolean, persistent) and the `ub` cooldown timer.
- **Arrow:** `ub:armedShot`, `ub:shooter` and `ub:flame` (the Flame seconds, copied from the bow at the swap).
- **Item:** the legendary mark (lgnd).





### E-uwbw-sfr · Super Fire status (L0-uwbw-esfr)

# E-uwbw-sfr · Super Fire status

**Links.** relates_to: L0-adr-ubfl, C-43, L0-uwbw-r002.

**Record (in memory, plus a world dynamic property for restart):**

| Field | Meaning |
|---|---|
| `targetId` | entity id |
| `untilTick` | start + 100 |
| `nextTick` | the next 1 HP burn tick (every 20 ticks) |
| `sourceId` | the shooter, for kill credit |

**Lifecycle.**
- **Start:** the armed hit's after-event sets `untilTick = now + 100`. A second armed hit **refreshes** `untilTick` and never stacks a second record.
- **Each tick** (the one shared `runInterval`; no `runJob`):
  - if the target is invalid or dead, drop the record;
  - when `now ≥ nextTick`: if the target has neither Fire Resistance nor a fire-immune type, deal 1 HP with cause `fireTick` through `applyScriptedDamage` (marked as scripted); then `nextTick += 20`;
  - out of water, re-apply `setOnFire(1)` for the flame visual;
  - in water, spawn flame/smoke particles at the body instead.
- **End:** at `untilTick`, the record is dropped. The scripted burn adds no damage after 5 s.

**Invariants.**
- 5 ticks of burn, 5 HP in total, in water or out, before armour (`fireTick` ignores armour as vanilla does).
- No fire block is ever placed.
- Ends early only on death or removal.
- A restart within the 5 s resumes from the stored `untilTick`; a record for an entity that is not loaded expires by tick.

**Overlap with vanilla fire.** The vanilla flame visual can also burn the target. Super Fire suppresses double damage within its window: a `fireTick` or `onFire` hurt before-event on a target with a live record that is **not** scripted is cancelled. The burn is therefore exactly the scripted 1 HP/s.





## Components (code-derived)

### L0-ench · The enchanting table (§4): feasibility first (L0-ench)

# L0-ench · The enchanting table (§4): feasibility first

**is_a:** component · **part_of:** L0 · **relates_to:** L0-adr-enrl, L0-xcx32, L0-xq11, L0-xasm39, L0-trdt, L0-sclk, L0-uwbw, L0-lgnd

**Source:** spec v2 §4 and §5 bullets 4–6 (`underwaterbowmacefireworksenchantingspecv2ruen-part-1/2/3`). **Constraints:** C-2, C-16, C-37, C-38, C-39, C-20⁶.

## Responsibility
The spec asks that the vanilla table offer every item-compatible vanilla enchantment, treasure ones included, with these rules:
- curses: never;
- the 20 % rare stage;
- the 70/40/20 level rule for Wind Burst and Unbreaking;
- vanilla maximum levels and conflicts.

Stable 2.10.0 has no table hook (`xcx32`). So this component owns three things, and only the first two are always built:
1. **The feasibility probe and its written verdict** (C-38). It runs on checks (19136), plus one iPad observation, and answers four questions:
   - Can anything observe the offers or the applied result?
   - Can a SimulatedPlayer operate a table?
   - Which treasure enchantments can 1.26.51 already reach at the table (the Mace and Wind Burst, spear Lunge)?
   - Can a table result be told apart from an anvil, command or loot result?

   The verdict feeds `L0-xq11` together with the option table from `L0-adr-enrl`.
2. **The pure roller `src/enchanting/roll.ts`.** It has no `@minecraft/server` import and takes an injectable RNG. It holds:
   - the eligibility table (vanilla data, minus curses, minus each def's forbidden list);
   - the conflict groups;
   - the rare stage;
   - the level rule.

   Its proof is statistical, through unit tests (C-39). Those are `in_process`, so they close only the unit criteria.
3. **The engine adapter, only if Andrey approves it in `xq11`.** It is (a) a post-hoc re-roll or (b) a custom station; (c) means no adapter. It is proven on `bds` where a SimulatedPlayer can reach it and on `ipad` otherwise. The C-37 scrubs (`src/legendary/enchant.ts`, `src/sculk/enchant.ts`) keep running after it.

## Inputs
- **Vanilla 1.26.51 enchantment data:** slot → enchantments, max levels, treasure flags and conflicts. It is checked against the engine's own `enchantable` answers on BDS.
- **Per-def forbidden lists:**
  - `FORBIDDEN_ENCHANTMENTS` in `src/legendary/enchant.ts:10` (trident: loyalty, riptide);
  - `PIERCING` for `SCULK_CROSSBOW` in `src/sculk/enchant.ts:7`.
- **A roll request:** `{itemId, tier 1|2|3, rng}`.
- **The answer to `xq11`.**

## Outputs
- A feasibility verdict document (the `src/enchanting/README.md` "Verdict" section), with evidence for each question.
- `rollEnchantments()` → an `EnchantRoll` with a trace (`L0-ench-ent1`).
- A unit suite: statistics, plus the conflict and curse fuzz.
- One of two endings:
  - an approved adapter with its deviation note;
  - no adapter, with a limitation report: §5 bullets 4–6 are marked "not deliverable on stable Bedrock" in the acceptance sheet and the release notes (C-38).

## Not in scope
- Anvils, books, villager trades and loot tables stay vanilla.
- Lunge stays unchanged if it is already offered.
- No Experiments, beta APIs or Molang UI overrides (C-2).
- The bow's own enchantability belongs to `uwbw` (`minecraft:enchantable` slot `bow`).

## Seams
| With | What |
|---|---|
| `trdt` / `lgnd` | `FORBIDDEN_ENCHANTMENTS` is read, never copied (`L0-ench-r003`). |
| `sclk` | Piercing is excluded for the Sculk Crossbow. Today it is a separate constant, so the roller reads both sources. |
| `uwbw` | Def #8 is a custom item with slot `bow`. It is eligible through the slot data, and nothing extra is needed. |

## Children
- **Processes:** `prob` (the probe), `roll` (the roller).
- **Rules:** `r001`–`r005`.
- **Entity:** `ent1`.
- **ACs:** `ac01`–`ac06`.
- **ADR:** `adr1`.
- **Assumption:** `asm1`.
- **Contradiction:** `cx01`.
- **Glossary:** `gl01`–`gl03`.

## Closing paths (from the plan)
- **(a)/(b) approved:** the hook is built and the preview deviation is documented.
- **(c) or no answer:** the roller stays dormant and tested, and the limitation is reported. `xcx32` closes on Andrey's answer.





### L0-trdt · The Above-Water Trident (`andrew:above_water_trident`), def #7 (L0-trdt)

# L0-trdt · The Above-Water Trident (`andrew:above_water_trident`), def #7

**Links.**
- is_a: component.
- relates_to: L0-lgnd, L0-strm, L0-katn, L0-magn, L0-sclk, L0-adr-twth, L0-adr-twlt, L0-adr-twrp, L0-xcx28, L0-xcx29, L0-xcx30, L0-xcx31.

## Responsibility
A one-per-world passive legendary (`PassiveLegendaryDef`, prefix `tr`, token `andrew:above_water_trident_crafted`, command `andrew:trident`, `xasm33`). It works like a vanilla trident, plus:
- every landed hit (melee or thrown) adds +2 HP before armour and shows one lightning visual;
- a sneak-release dash, Riptide-III-like, anywhere and with no cooldown, followed by a one-shot fall cancel;
- a swim boost to land-sprint speed while it is held;
- a scripted throw whose return is visible (10 b/s after a miss, a block hit or an entity hit) and that can never duplicate or lose the copy.

## Code ownership
- **`src/trident/`** (new): input, throw, custody, return, movement, scrub and damage glue.
- **`packs/behavior/items/above_water_trident.json`:** use-duration charge, no `throwable`, no durability, `minecraft:enchantable` slot `trident`, `allow_off_hand`, `minecraft:damage` = measured vanilla melee − 1.
- **`packs/behavior/entities/`:** two snowball-runtime entities.
  - `andrew:thrown_above_water_trident`: projectile, vanilla speed and gravity, no `remove_on_hit`.
  - `andrew:returning_above_water_trident`: no physics, no collision, teleport-steered.
- **`packs/behavior/recipes/`:** ` G / BTB / G ` → token.
- **`packs/resource/`:** icon (item icon house style), trident geometry for both entities, and RU/EN lang.

## lgnd touch points (settles `xcx30`, detail in `L0-trdt-adcl`)
1. **Registry entry:** `TRIDENT` in `registry.ts` and `LEGENDARIES`. This is the sanctioned def entry.
2. **The only new framework export:** `deliverToLastHolder(def, mark, how)` in `recovery.ts`. It is the existing private `lost()`, exported unchanged.
3. **Everything else needs no code change, only a GameTest:**
   - the departure watch (a throw release is not a DropItem swing);
   - `watch()` ignores entity types other than `minecraft:item`;
   - death retention (the slot is empty while the copy is in custody);
   - the magnet (it scans `minecraft:item` entities and holders found by `hasitem`; the custody entities have no inventory).
4. **Outside custody, separate:** the craftgate refund needs a bucket exchange (`L0-trdt-adrf`, `L0-trdt-cx01`).

## Inputs
- `itemStartUse` and `itemReleaseUse` with the charge, plus `isSneaking` at release.
- `beforeEvents.entityHurt`: the melee raise, the thrown raise and the fall cancel.
- `projectileHitEntity` and `projectileHitBlock` for the custody projectile.
- `entityLoad` and `entityRemove` for both custody types.
- `playerSpawn` and `playerLeave`.
- `playerInventoryItemChange`: the enchantment scrub.
- One shared `runInterval` for the swim boost, the steered return, caps and grant expiry.

## Outputs
- Damage through the shared helper (`L0-trdt-addm`).
- One `playStrikes` visual per hit.
- `applyKnockback` impulses.
- The custody record (a world dynamic property).
- Re-inserted stacks, `lgnd` deliveries, and lang messages.

## Children
- **Decisions:** adcl (custody and lgnd), addm (damage sharing), adrf (refund).
- **Entity:** ecus (custody record).
- **Processes:**
  - pthr: throw and return;
  - pfbk: custody fallbacks;
  - pmov: release, dash, fall and swim;
  - cons: the probe plan.
- **Rules:**
  - r001: one place, inserted once;
  - r002: +2 and strike per hit;
  - r003: enchantment scrub.
- **Acceptance criteria:** a01–a05 (`bds`), a06 (`ipad`).
- **Glossary terms:** g001–g003.
- **Assumptions:** as01.
- **Contradictions:** cx01, cx02.

## Merge gate
`trdt` scenarios, plus:
- the `lgnd` scenarios with def #7;
- the magnet legendary scenarios;
- the `strm` scenarios, because the helper is shared;
- the katana fall scenarios, if the fall fallback is used.





### L0-uwbw · The Underwater Bow (`andrew:underwater_bow`), def #8, plus the Mace and Firework Rocket recipes (L0-uwbw)

# L0-uwbw · The Underwater Bow (`andrew:underwater_bow`), def #8, plus the Mace and Firework Rocket recipes

**Links.** relates_to: L0-lgnd, L0-sclk, L0-strm, L0-trdt, L0-trdt-adrf, L0-ench, L0-adr-ubfl, L0-xasm38, L0-xasm39, L0-xcx33. Source: spec v2 §1–§3, §5 bullets 1–3 and 7 (`underwaterbowmacefireworksenchantingspecv2ruen-part-1/2`).

## Responsibility
1. **The bow.** It is a legendary Active weapon (def #8, prefix `ub`, token `andrew:underwater_bow_crafted`, `cooldownTicks` 600). It fires vanilla arrows that fly in water and lava as they do in air (C-42). A normal hit does vanilla bow damage plus 2 s of fire. An **armed** hit on a living entity deals exactly 14 HP before armour (C-29), plays one zero-damage strike visual (C-30′) and applies 5 s of **Super Fire** that water cannot put out (C-43). Only that hit starts the 30 s cooldown (C-41).
2. **Two additive vanilla recipes (C-40).**
   - ` I / Z ` (Iron Block over Breeze Rod) → 1 `minecraft:mace`.
   - ` P / S ` (Paper over String) → 3 `minecraft:firework_rocket`.
3. **The legendary rules through def #8.** These are cited from `lgnd`, not restated: once per world, Creative free, retention, the Void, recovery, persistence and the refund exchange.

## Not in scope
- **The enchanting table (§4) belongs to `L0-ench`.** The bow only declares `minecraft:enchantable` slot `bow`. Its compatible enchantments and conflicts come from vanilla data.

## Inputs
- **Player actions:** Use (draw and release), sneak + Use (arm), crafting-table and crafter crafts.
- **Engine events:**
  - `entitySpawn` (the arrow from this bow);
  - `projectileHitEntity` / `projectileHitBlock`;
  - `beforeEvents.entityHurt` and `afterEvents.entityHurt`;
  - `playerInventoryItemChange` (the token);
  - logout, restart and death.

## Outputs
- **The arrow** (swapped or tagged), with the `ub:armedShot` mark.
- **Damage:**
  - the vanilla hit;
  - the exact-14 rewrite, or a lethal follow-through by `applyDamage`;
  - scripted `fireTick` ticks marked in `scripted-damage.ts`.
- **Fire:** `setOnFire` for the normal hit, and the Super Fire status.
- **Visual:** one `playStrikes` per hit key.
- **Player state:** the `ub:armed` dynamic property, the cooldown timer and the HUD line (ready / armed / Ns).
- **Crafting:** 2 empty buckets back on every bow craft, the craft flag, and vanilla Maces and rockets.

## Structure (planned files)
- `packs/behavior/items/underwater_bow.json` and `underwater_bow_crafted.json`;
- `packs/behavior/recipes/underwater_bow.json`, `mace_iron.json` and `firework_rocket_paper.json`;
- `packs/behavior/entities/underwater_arrow.json` (only if the swap wins the probe, `L0-uwbw-adfl`);
- `src/underwater/{index,arrow,arm,hit,superfire}.ts`;
- RP: textures for the icon and the pull stages, `attachables`, and RU/EN lang;
- GameTests under `src/gametest/underwater*.ts`.

## Order (stage 11)
1. The probe (`L0-uwbw-pprb`) on checks (19136), as its own criterion set.
2. The recipes.
3. The def, item, token, bucket recipe, RP and lang.
4. Flight.
5. Normal fire.
6. Armed charge, 14 HP, strike, Super Fire, cooldown and HUD.

Version 1.11.0.

## `lgnd` touch points (for reduce)
- **The HUD.** `hudKeys` widens from `{ready, cooldown}` to an optional `armed` (`src/legendary/registry.ts:45`).
- **The cooldown start.** It is deferred from activation to the hit, through a def flag such as `cooldownOn: "hit"`. Otherwise the bow calls `startCooldown` (`src/legendary/cooldown.ts:47`) itself and does not claim Use through `resolveActivation`.
- **The magnet.** The `magn` legendary scenarios add def #8.

These stay within def fields plus one HUD key. Reduce can record them as an ADR without a `lgnd` re-run.

## Open items
- `L0-uwbw-cx01`: `raiseHit` cannot produce exactly 14.
- `L0-uwbw-as01`: what a swapped arrow costs.
- `xcx33`: the arming gesture (has a default).
- `xasm39`: rocket flight duration.






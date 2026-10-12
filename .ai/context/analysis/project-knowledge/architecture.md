---
title: Architecture
type: project-knowledge
generated_at: "2026-10-12T18:21:49.809Z"
source_channel: rollout
node_id: rollout-architecture
aliases: ["rollout-architecture","architecture","project-knowledge/architecture"]
is_a: ["rollout","architecture"]
relates_to: ["L0-adr-hldb","L0-adr-lgwd","L0-adr-prbd","L0-adr-prcn","L0-adr-prta","L0-adr-sbdm","L0-adr-sblt","L0-adr-sbvr","L0-adr-scbs","L0-adr-scdm","L0-adr-scfc","L0-adr-sckp","L0-adr-scpi","L0-adr-sctr","L0-adr-trlg","L0-ench","L0-pear","L0-trdt","L0-uwbw"]
priority: 650
---

# Architecture

> Автогенерация из Knowledge Vault. Ручное редактирование — установи `status: manual` в frontmatter.

## Components

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







### Pearl Rod («Перовый сокровятель») — component (L0-pear)

# Pearl Rod («Перовый сокровятель») — component

**Is a:** component. **Part of:** L0. **Relates to:** L0-adr-prbd, L0-xasm41, L0-xasm42, L0-xasm43, L0-xasm44, L0-xcx34, L0-xq12, L0-lgnd (craftgate swap only), L0-strc (ticking areas), L0-uwbw (recipe collisions, fixed-cell patterns), L0-ench (fishing-rod eligibility).
**Sources:** spec v3 §6–§8 (`underwaterbowfinalspecv3ruen-part-3` … `part-5`); constraints C-16, C-40, C-44, C-45, C-46.

## Responsibility
A **non-legendary** utility item (C-46). It looks and fishes like a vanilla fishing rod. When its bobber lands in a pressure plate it is bound to that plate. The binder's next use teleports them to a safe spot at or beside the plate, once, and only after the destination has been checked (C-44).

## Shape (per `L0-adr-prbd`)
- **Item:** a marked vanilla `minecraft:fishing_rod` (entity `L0-pear-ent1`). It is crafted as `andrew:pearl_rod_token` and swapped after the craft (process `L0-pear-pr01`).
- **Binding:** item-borne dynamic properties (`L0-pear-ent1`), detected by polling the hook in the shared interval (process `L0-pear-pr02`, `xasm41`).
- **Validity:** owner id + owner life epoch (C-45) + plate typeId + plate generation (`L0-pear-ent2`, rule `L0-pear-ru03`).
- **Bound use:** cancel first, then preload, validate, find a safe spot, teleport and read back (process `L0-pear-pr03`, rules `L0-pear-ru01` and `L0-pear-ru02`).

## Inputs
- Player events: `itemUse` (before and after), `entitySpawn` of `minecraft:fishing_hook`, `playerInventoryItemChange` (token swap), `entityDie` (epoch), and `playerBreakBlock` / `playerPlaceBlock` / `blockExplode` / `pistonActivate` (plate generation).
- The world: block reads at the hook cell and at the destination; `isChunkLoaded`; ticking areas from the world-wide budget (`L0-pear-ad01`, adopted at L0 as `L0-adr-prta`).

## Outputs
- Rod dynamic properties and lore; the player property `andrew:life_epoch`; world properties for plate generations.
- A teleport (with `dimension`) and an actionbar or chat message for every outcome.

## Seams
- `src/legendary/craftgate.ts`: a token-swap helper is extracted from it. There is no gate, refund, world flag or retention, and `lgnd` scenarios stay green.
- **Ticking areas:** **world-wide cap of 10**, already drawn on by `spawn-search` (`andrew_find_`, pool 5) and `search-ring` (`andrew_ring_<d>`, 4 per dimension). See `L0-pear-cx01` and `L0-pear-ad01`.
- **Shared `runInterval`:** no `runJob`, and no per-rod interval.

## Probe first (checks BDS, 19136; never 19132)
Run distinct criterion set `probe_pearl_*` (AC `L0-pear-ac07`):
- the hook's events and its resting height per plate type;
- whether the hook's owner is readable;
- whether `hook.remove()` resets the client's cast pose (iPad);
- **whether a cancelled `beforeEvents.itemUse` casts nothing** (`L0-pear-cx02`);
- whether durability can be written back to 0;
- whether dynamic properties survive a reel, a rename, a chest, a drop and a restart;
- ticking-area loads at 10 K, 100 K and 1 M blocks, plus the Nether and the End (`probe_tickingarea_load`);
- whether a cross-dimension teleport works;
- whether the fixed 3×3 recipe pattern is enforced.

Four rules depend on these results (decomposition plan).

## Acceptance
Six §8 bullets, each with a `bds` scenario and a negative control (`L0-pear-ac01` … `ac06`), plus the probe (`ac07`). The `ipad` checks are the cast pose after a retract; the name, lore and icon; the recipe book; how the arrival feels; and the failure messages.

## Reported limitations (C-16)
- A same-type plate replaced through an unobserved path (commands, structures, liquids, other add-ons) still teleports (`xcx34`, `L0-pear-ru03`).
- The input rod's enchantments are lost at the craft (`xasm43`).
- An anvil rename or combine may drop the mark (to be confirmed by the probe).
- The name is one fixed string and does not follow the client's language (`xq12` item 2).
- Used as a crafting ingredient (Orbital Cannon, carrot-on-a-stick, warped-fungus-on-a-stick, its own recipe), it is consumed as a plain rod. A craftgate refund returns a plain fishing rod (`L0-xasm45`).







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







## Architecture Decisions

### ADR-L0-hldb · Holder: decided, unbuilt, one seam (status: accepted, resolves `L0-lgnd-cx16`) (L0-adr-hldb)

---
title: "ADR-L0-hldb · The last-holder return is decided and unbuilt; tests target `mark.owner` through one helper until `LGND-HOLD` ships"
aliases: ["L0-adr-hldb", "Holder build-out"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-sclk", "L0-katn", "L0-adr-hold", "L0-xcx11", "L0-lgnd-cx16", "L0-lgnd-ad11", "L0-lgnd-ad17", "L0-lgnd-ac18", "L0-lgnd-ac27", "L0-sclk-ac20", "L0-xasm26"]
requires: ["L0-adr-hold"]
governs_files: ["src/legendary/state.ts", "src/legendary/recovery.ts"]
---
# ADR-L0-hldb · Holder: decided, unbuilt, one seam (status: accepted, resolves `L0-lgnd-cx16`)

**Context.** `decision-resolve-l0-xcx11` (2026-09-29) chose "return to the last holder" and named `LGND-GEN-01-AA`. That task shipped the mark generation only. As read in this run (`lgnd`, 2026-10-05): the mark has no holder field (`state.ts`), and `lost()` and the protect hand-back target `mark.owner` (`recovery.ts:490`, `:877-879`). `L0-adr-hold` still says "proposed", and `lgnd-ac18` said "pending confirmation". The crossbow spec §3 is the fifth spec asking for the last holder. `sclk-ac20` was written against `mark.owner` (`xasm26`).

**Decision.**
1. `L0-adr-hold` is **accepted**: the operator decision is final, and there is no client question left. `lgnd-ac18` was corrected in place to drop "pending confirmation".
2. The holder field is **its own task, `LGND-HOLD`**, per `lgnd-ad11`. It is independent of and not blocking the crossbow epics.
3. Until it ships, every weapon's T20/Void test (the crossbow's `sclk-ac20` included) resolves the expected recipient through a single `returnTarget(mark)` test helper that returns `mark.owner` (`lgnd-ad17`). `LGND-HOLD` changes that helper and the holder clauses of `lgnd-ac08`/`ac09`/`ac24`/`ac27`, and no per-weapon test.

**Consequence.** The crossbow ships with the same documented deviation as the Katana: Void and loss go to the crafter or `/give` target. That remains true only until `LGND-HOLD` lands.







### ADR-L0-lgwd · Widening `lgnd` and `strm` for the Underwater Bow (L0-adr-lgwd)

---
title: "ADR-L0-lgwd · The legendary framework widens for an armed ability without a lgnd re-run"
aliases: ["L0-adr-lgwd", "lgnd widening for armed abilities"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-uwbw", "L0-strm", "L0-magn", "L0-sclk", "L0-adr-ubfl", "L0-uwbw-adex", "L0-uwbw-cons", "L0-xcx33", "L0-xasm38"]
requires: ["L0-lgnd"]
governs_files: ["src/legendary/registry.ts", "src/legendary/cooldown.ts", "src/legendary/hands.ts", "src/storm/damage.ts"]
---
# ADR-L0-lgwd · Widening `lgnd` and `strm` for the Underwater Bow

**Context.** The plan's reduce rule said: record the bow's `lgnd` touch points as an ADR if they stay within def fields plus one HUD key; otherwise schedule a v11 `lgnd` re-run. `L0-uwbw` lists the touch points, and `L0-uwbw-adex` adds a `strm` touch point that the plan did not foresee. As read during reduce at v10:
- `hudKeys` is `{ ready: string; cooldown: string }` (`src/legendary/registry.ts:45`);
- `raiseHit` handles `entityAttack` only and adds to the hit (`src/storm/damage.ts`).

**Decision (accepted at reduce).**
1. **The HUD.** `hudKeys` gains an optional `armed?: string`. The seven shipped defs do not set it and render as before.
2. **The cooldown start.** Def #8 does **not** claim Use through `resolveActivation`. The bow's own module arms on sneak + the start of Use and calls the existing `startCooldown` from the armed hit's after-event. **No new def flag**: a `cooldownOn: "hit"` field is unnecessary while only one def needs it.
3. **The damage.** `src/storm/damage.ts` gains `setHit` beside `raiseHit`. They share an internal core, and `raiseHit`'s signature and behaviour are frozen.
4. **Gates.** Every merge touching (1)–(3) runs these scenarios as distinct criterion sets on the checks server:
   - the `lgnd` legendary scenarios;
   - the `magn` legendary scenarios, now including def #8;
   - the `sclk` legendary scenarios;
   - the Storm Blade scenarios.

**Consequence.** These are one optional field, one call site and one sibling function. **`lgnd` is not re-run at v11.** A second armed legendary would revisit (2) as a def field.

**Rejected.**
- **A v11 `lgnd` re-run.** The change is smaller than the threshold the plan set.
- **Letting `resolveActivation` claim Use for the bow.** Use is the draw; the bow could not shoot (`xcx33`).
- **Changing `raiseHit` to accept projectile causes.** That moves the Storm Blade's contract and still adds rather than replaces (`L0-uwbw-cx01`).







### ADR-L0-prbd · Pearl Rod design (status: proposed; `pear` deep-dive and probe refine it) (L0-adr-prbd)

---
title: "ADR-L0-prbd · Pearl Rod: a marked vanilla rod, item-borne binding with a life epoch, cancel-then-validate teleport"
aliases: ["L0-adr-prbd", "Pearl Rod design"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0", "L0-pear", "L0-xasm41", "L0-xasm42", "L0-xasm43", "L0-xcx34"]
see_also: ["underwaterbowfinalspecv3ruen-part-3", "underwaterbowfinalspecv3ruen-part-4", "underwaterbowfinalspecv3ruen-part-5"]
governs_files: ["src/pearlrod/", "src/legendary/craftgate.ts", "src/structures/spawn-search.ts"]
---
# ADR-L0-prbd · Pearl Rod design (status: proposed; `pear` deep-dive and probe refine it)

**Context.**
- Spec v3 §6–§8 ask for an item that "внешне и при обычной рыбалке работает как удочка" (looks and fishes like a fishing rod), with infinite durability and unlimited crafting.
- Its bobber binds it to a pressure plate. The binder's next use teleports them there, safely and once.
- The binding is voided by the binder's death and by transfer. It must survive a restart.
- The platform is stable `@minecraft/server` 2.10.0 on BDS 1.26.51.

**Decision.**
1. **The item is a marked vanilla `minecraft:fishing_rod`.**
   - The shaped recipe (`xasm43`) outputs `andrew:pearl_rod_token`.
   - A swap reuses the craftgate's settle-per-tick pattern from `playerInventoryItemChange`, with **no gate, no world flag and no refund** (C-46).
   - The swap replaces the token with a fishing rod carrying:
     - `nameTag` «Перовый сокровятель»;
     - a lore line "Pearl Rod", plus the binding status;
     - a dynamic property `andrew:pearl_rod` = a fresh rod id.
   - Real fishing is then free: the loot, Lure, Luck of the Sea and Mending all apply.
   - **Durability:** after each reel or release, and on a slow hand check in the shared interval, the rod's `durability.damage` is written back to 0. A reel costs at most 5, so a 64-durability rod can never break between checks.
2. **Binding detection is a poll, not an event.**
   - A plate has no collision box, so `projectileHitBlock` is expected to report the support block, or nothing at all (the probe decides).
   - A cast is correlated through `itemUse` (a holder of a marked rod) and the `minecraft:fishing_hook` `entitySpawn` in the same tick (the `trdt`/`uwbw` precedent), or through the hook's projectile owner if the probe shows it is readable.
   - While a tracked hook exists, the one shared interval checks the block at the hook's cell. A `*pressure_plate` there, with the hook within 0.25 of the cell floor (`xasm41`), triggers the binding.
3. **The binding lives on the rod.** It is stored as rod dynamic properties: `{dim, x, y, z, plateType, owner: player.id, epoch}`. After writing them the script calls `hook.remove()` and refreshes the lore. A new binding by anyone overwrites the old one.
4. **Owner life epoch (C-45).**
   - `andrew:life_epoch` is a player dynamic property, incremented in `entityDie` for players.
   - A binding is honoured only when `owner === user.id` and `epoch === user.epoch`.
   - So death and transfer need no item search. That matters because rods can sit in chests, drops or unloaded chunks.
5. **Bound use: cancel first, validate after.**
   - When owner and epoch match (a synchronous, cheap check), the cast is cancelled in `beforeEvents.itemUse`, or the hook is removed at `entitySpawn` +0. The probe picks which (`L0-adr-prcn`).
   - `system.run` then starts the async teleport of C-44:
     - preload, through the **world-wide ticking-area allocator** (`L0-adr-prta`; it also serves `spawn-search` and `search-ring`);
     - re-check the plate typeId;
     - re-check the plate generation (`xcx34`);
     - find a safe spot;
     - `teleport` with `dimension`;
     - read the arrival back.
   - On success it clears the binding. On "plate missing or changed" it clears the binding. On a load failure, a full pool or no safe spot, it keeps the binding and reports (`xasm42`).
   - A second use while a teleport is pending is cancelled with a message rather than queued.

**Rejected alternatives.**
- **A custom item `andrew:pearl_rod` with its own bobber entity.** Stable item components have no fishing behaviour, so "normal fishing" would mean re-implementing loot tables, bite timing, Lure and Luck of the Sea, and hooking entities. That is a large, lossy imitation, which C-16 forbids when a vanilla path exists. It is reconsidered only if the probe shows a marked vanilla rod loses its dynamic properties in normal use.
- **Bindings in a world registry keyed by rod id.** It still needs the epoch for death, it duplicates state that has to follow the item through chests and drops, and it leaks entries for rods that despawn. The item-borne record dies with the item.
- **Clearing bindings by scanning inventories on death.** It cannot reach chests, drops or unloaded chunks, which breaks "даже если предмет позже поднимет другой игрок" (even if another player picks the item up later).
- **Teleporting first and checking after**, or relying on the player's own chunk load. That breaks "перед перемещением убедиться" (check before moving) and can land the player in an unloaded void or a block.
- **`runJob` for the preload wait.** `runJob` start stalls the next tick by 15–30 ms (engine fact), so the shared `runInterval` is used.

**Consequences.**
- `craftgate.ts` gives up a token-swap helper, refactored with the `lgnd` scenarios kept green.
- `spawn-search.ts` and `search-ring` give up their ticking-area pools to one world-wide allocator (`L0-adr-prta`), with the structures scenarios kept green.
- The recipe book shows the token's icon. The RP gives the token the Pearl Rod's look (iPad check).
- Anvil renames or combines may drop the mark. The probe records this, and any loss is a reported limitation.







### ADR-L0-prcn · Bound use: cancel or remove, chosen by the probe (L0-adr-prcn)

---
title: "ADR-L0-prcn · Bound use starts by cancelling OR by removing the hook; the probe picks the branch"
aliases: ["L0-adr-prcn"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-pear", "L0-pear-cx02", "L0-pear-pr03", "L0-pear-ac07", "L0-adr-prbd", "L0-xcx13", "L0-orbc"]
requires: ["L0-pear-ac07"]
see_also: ["L0-pear-ru01"]
governs_files: ["src/pearlrod/"]
---
# ADR-L0-prcn · Bound use: cancel or remove, chosen by the probe

**Status:** accepted at reduce (v11). Resolves `L0-pear-cx02`, a gap in the design. The probe result is still owed and picks the branch.

**Context.**
- `L0-adr-prbd` §5 assumed that cancelling `beforeEvents.itemUse` on a vanilla `minecraft:fishing_rod` stops the cast.
- The Orbital Cannon's deviation record (`L0-xcx13`, `src/orbital/README.md` item 1) says stable API "cannot switch fishing off" on a real rod. That claim was about turning fishing off permanently. No one has probed a one-use cancel.
- Nothing else in the run depends on the answer. The binding path and the non-owner path never cancel.

**Decision.**
- The bound-use pipeline (`L0-pear-pr03`) has one entry, `start(player, rod)`, and two triggers.
- The probe in `L0-pear-ac07` item 5 fixes which trigger ships. The choice is a build-time constant, not a runtime fallback.
  1. **Cancel branch.** The probe shows the cancelled use spawns no `minecraft:fishing_hook`. Then `beforeEvents.itemUse` cancels, and `system.run` calls `start`.
  2. **Remove branch.** A hook still spawns. Then the use is allowed, the hook is removed at `entitySpawn` +0, and `start` is called. Ownership comes from the `itemUse` correlation (the `trdt`/`uwbw` precedent).
- Either way, the owner/epoch test runs before the trigger. A non-owner always gets a plain vanilla cast.
- If the iPad shows a line flicker, it is a listed iPad item. It does not block the build.

**Why this closes the contradiction.** The design no longer depends on the unproven claim, and both outcomes have a fixed, tested path. Leaving `L0-pear-cx02` open would block nothing. The probe's verdict goes into `src/pearlrod/README.md` alongside the `xcx13` note.

**Consequences.**
- `L0-pear-ac02` and `L0-pear-ac03` assert "no hook survives a bound use", not "no hook ever spawns". That makes them true under both branches.
- If the cancel branch ships, `src/orbital/README.md` item 1 should be reworded to "cannot switch fishing off permanently", so the next reader does not inherit the over-broad claim.







### ADR-L0-prta · Ticking areas: one world-wide allocator with a reserved Pearl Rod slot (L0-adr-prta)

---
title: "ADR-L0-prta · Ticking areas: one world-wide allocator with a reserved Pearl Rod slot (adopts L0-pear-ad01)"
aliases: ["L0-adr-prta"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-pear", "L0-pear-ad01", "L0-pear-cx01", "L0-adr-prbd", "L0-strc", "L0-airs-cx01", "L0-pear-ac05", "L0-pear-ac07"]
requires: ["L0-pear-ad01"]
see_also: ["L0-pear-pr03"]
governs_files: ["src/structures/spawn-search.ts", "src/structures/search-ring.ts", "src/structures/runtime.ts", "src/main.ts", "src/pearlrod/"]
---
# ADR-L0-prta · Ticking areas: one world-wide allocator with a reserved Pearl Rod slot

**Status:** accepted at reduce (v11). Resolves `L0-pear-cx01`. Amends `L0-adr-prbd` §5.

**Context.**
- The plan's invariant: the Pearl Rod preload must allocate from the same pool as `spawn-search`, "so a structure search and a teleport never evict each other". If sharing needs an edit to `spawn-search`, that edit is a refactor that keeps the structures scenarios green.
- The deep-dive found that `spawn-search` owns only one of **two** script pools. The other belongs to the ring loaders (`L0-pear-cx01`). Both pools draw on an engine cap of **10 ticking areas per world**.
  - Observed during reduce on 2026-10-12: the cap comment is at `src/structures/search-ring.ts:179`; the `andrew_find_` pool is 5 at `src/main.ts:85-87`; `RING_AREA_POOL = 4` is at `src/structures/runtime.ts:291`.
- The engine does not evict areas. It refuses the add, so the real hazard is starvation.

**Decision.** Adopt `L0-pear-ad01` unchanged:
- one `areas.ts` allocator, the only code that runs `tickingarea add/remove`, with a world budget of 10;
- its clients are `spawn-search`, `search-ring` and the Pearl Rod;
- one slot is reserved for the Pearl Rod, and structure clients share the other 9;
- the Pearl Rod may also borrow a free unreserved slot;
- when no slot is free, the trip ends with "server busy" and the binding is kept (`L0-pear-ru01` §4).

**Invariant check.**
- *Same pool as `spawn-search`:* met, and the scope is wider. Every product area now comes from one budget.
- *Never evict each other:* met. The reserved slot means a structure search cannot starve a teleport. Because the Pearl Rod only borrows free slots, a teleport never takes a slot a search holds.
- *Refactor keeps structures green:* this is a gate on the change. Before merge, run the broad tier plus every `find`/`ring` scenario. The blast radius is two structures modules, so the full ~50-min suite is not required.

**Text change to `L0-adr-prbd` §5.** "a ticking-area allocator shared with `spawn-search`" now reads "the world-wide ticking-area allocator (`L0-adr-prta`)".

**Consequences.**
- The `pear` build depends on a `strc` refactor and must be sequenced after it in the same epic. The board rejects cross-epic dependencies.
- `L0-pear-ac05` "budget exhausted" fills slots through the allocator, never with raw `/tickingarea`.
- GameTest site areas stay outside the allocator (`L0-pear-ad01`). On checks they still count against the engine cap of 10. `L0-pear-ac07` records the cap that is actually observed.







### ADR-L0-sbdm · Storm Blade damage (status: proposed, probe-gated) (L0-adr-sbdm)

---
title: "ADR-L0-sbdm · Storm Blade damage: armour-respecting and safe from the hurt window"
aliases: ["L0-adr-sbdm", "Storm Blade damage pipeline"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-strm", "L0-xcx26", "L0-xcx27", "L0-xasm29", "L0-adr-scdm"]
see_also: ["stormbladeelytratotemspecruen-part-1", "stormbladeelytratotemspecruen-part-2"]
governs_files: ["src/sculk/hit.ts", "src/scythe/volley.ts"]
---
# ADR-L0-sbdm · Storm Blade damage (status: proposed, probe-gated)

## Context
Spec §02/§05 asks for **10 HP (active)** and **+6 HP (passive)** *before* armour, as separate events that never double.

The engine has a hurt window (memory, CNTR-X22; `src/sculk/hit.ts:25`). For 10 ticks after a landed hit, a weaker or equal `applyDamage` takes 0 and a stronger one takes only the difference of the post-armour amounts, f(X) − f(L). `applyDamage` still returns true either way.

The passive fires from `entityHitEntity`, which is **the same tick as the melee hit**. A diamond-sword melee is 8.00 HP (14.00 with Sharpness V) and the bonus is 6, so a plain `applyDamage(6)` is swallowed every time (`xcx26`). An active hit on a target meleed within the last 10 ticks loses part of its damage the same way.

The crossbow's answer (`hit.ts` window mode: `applyDamage`, then a health write) gives *true* damage. It skips armour, which this spec forbids.

## Options
- **A: Difference-stacking (proposed).** Inside a known window whose last hit was L, call `applyDamage(L + D)` with `entityAttack` and the wielder as `damagingEntity`. Measured: the engine takes f(L+D) − f(L), so the total is one L+D hit (diamond 4.76, not 3.80). Exact only without armour (bare, iron golem +6.00). Raw L is not observable: entityHurt and beforeEvents.entityHurt both report post-armour damage. A constant L takes 0.00 under Sharpness V. Outside a window, call `applyDamage(D)` alone. L comes from the blade's own melee (`entityHitEntity` → `entityHurt.damage` in the same tick), or from a per-target record of the last landed hit and its tick.
  - Probe P1: is armour applied to the difference (D) or to L + D? **Answered: L + D.**
  - Probe P2: does the difference hold for players *and* mobs? **Unarmoured mob holds; armoured mob not run.**
- **B: Deferred bonus.** Schedule the passive/active damage for the tick the window closes (+10). Simple and native, but the bonus lands half a second late, and a second melee hit in between re-opens the window.
- **C: Manual armour.** Compute the vanilla armour/toughness/Protection/Resistance reduction in script and write health directly (the `hit.ts` window pattern with D′ = reduced D). Exact timing, but it re-implements the engine's armour formula. That is drift-prone across versions and breaks totems/absorption unless the lethal path goes through `applyDamage`.
- **R: raise the melee hit.** `beforeEvents.entityHurt`, `event.damage += f(D)`; the value read is post-armour. Exact f(L)+f(6) in one native event, absorption first. A flat +D adds true damage.

## Decision
P1 failed. Passive: **R**. Active inside a known window: **C** with D′ = f(10) from `totalArmor`/`totalToughness`/Protection. A before-event rewrite of the active is exact only while f(10) > the window's last hit. B stays rejected.

## Consequences
- `strm` owns a small `src/storm/damage.ts` that mirrors `hit.ts` modes (`lethal | native | window`). It must not import the crossbow's true-damage write.
- A GameTest proves each mode against an armoured SimulatedPlayer, comparing health before and after to a vanilla-sword control. It includes an in-test negative control for plain `applyDamage(6)` inside the window (red proof), plus a flat +6 raise as a second negative control (true damage, 8.24 on diamond).
- The shield question (`xcx27`) is separate: a raised shield cancels `entityAttack` + wielder only from the front half (< 90°), like a sword hit, and `applyDamage` then returns `false`. Mode C's health write must be skipped on `false`: the write passes the shield (X23 P2).







### ADR-L0-sblt · Storm Blade visuals (status: proposed, probe-gated) (L0-adr-sblt)

---
title: "ADR-L0-sblt · Visual-only lightning and the wind/electric trace"
aliases: ["L0-adr-sblt", "Storm Blade visuals"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-strm", "L0-adr-sbdm"]
see_also: ["stormbladeelytratotemspecruen-part-1", "stormbladeelytratotemspecruen-part-2"]
---
# ADR-L0-sblt · Storm Blade visuals (status: proposed, probe-gated)

## Context
The spec wants three lightning strikes at the active hit point and one per passive proc. They must deal no damage, set no fire and cause no knockback (C-30). It also wants a visible straight wind-and-electric line of up to 10 blocks. Spec §05 explicitly allows particles and sound if vanilla lightning cannot be purely visual.

On stable 2.10.0, a `minecraft:lightning_bolt` from `spawnEntity` or `/summon`:
- damages entities near the strike;
- can ignite blocks (unless `doFireTick` is off, which is world-wide);
- converts pigs, villagers and creepers.

There is no stable API to cancel entity damage before it applies.

## Options
- **A: Particles and sound (proposed).**
  - A vertical column of electric-spark and flash particles at each strike point, plus the vanilla thunder/impact sound (`ambient.weather.lightning.impact`).
  - The trace is particles every ~0.5 block along the real ray (wind-burst plus spark), emitted once from the shared interval.
  - No entity is spawned, so nothing can damage or ignite. Zero cost once the burst is over (C-5f analogue).
- **B: A custom RP-only "bolt" entity** (snowball runtime, no collision, no damage, a short lifetime) with a bolt geometry and render controller. It looks closer to vanilla, but it is a new entity: it must not push mobs (memory: use a snowball runtime) and it needs iPad proof of the render.
- **C: Real `lightning_bolt`** with the target pre-protected. Rejected: it cannot be made visual-only on stable (fire, conversions, bystander damage). This is the exact failure the spec forbids.

## Decision
**A**, and record the deviation from "lightning strikes" under C-16 in the deviations doc. **B** is a later iPad-driven upgrade if the operator judges A unreadable. It needs its own task and must keep C-30.

Probe on checks:
- Which particle ids exist on 1.26.51 (spark, wind burst, flash)?
- Does the sound play at the point for every player within 16 blocks?

The iPad criterion is "the operator reads it as lightning".

## Consequences
- No `lightning_bolt` id appears anywhere in `src/storm/`. A grep check guards this.
- GameTest: after an active hit and a forced passive proc, there is no fire block within 3 cells, no new entity of type `lightning_bolt`, and bystanders' health is unchanged.







### ADR-L0-sbvr · Vanilla item recipes (status: accepted) (L0-adr-sbvr)

---
title: "ADR-L0-sbvr · Elytra and Totem as plain native shaped recipes"
aliases: ["L0-adr-sbvr", "Vanilla item recipes"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-strm", "L0-lgnd"]
see_also: ["stormbladeelytratotemspecruen-part-1", "stormbladeelytratotemspecruen-part-2"]
governs_files: ["packs/behavior/recipes/"]
---
# ADR-L0-sbvr · Vanilla item recipes (status: accepted)

## Context
Spec §03–§05 asks for two **unlimited** recipes that output real `minecraft:elytra` and `minecraft:totem_of_undying`, with no new mechanics, using "native shaped recipes". Every legendary recipe in the pack outputs a **craft token** (`andrew:*_crafted`), which a script swaps under the craft gate.

## Options
- **A: Plain `minecraft:recipe_shaped` with the vanilla result (accepted).** Two JSON files in `packs/behavior/recipes/`, each with `tags: ["crafting_table"]` and an `unlock` on the feather or gold ingot. No token and no script.
- **B: A token plus a script swap.** Rejected: it adds a gate to an ungated item and risks C-31 (stray marks or properties).

## Decision
**A.** The recipes live in `strm`'s scope as one small task. `lgnd` is not touched: neither item is a def. The magnet and protection treat them as ordinary items (C-31).

## Consequences
- GameTest: real-recipe crafting is possible through a Crafter (memory). Craft each recipe twice. The output type id is exactly the vanilla id, it has no dynamic properties, and the input slots are empty afterwards.
- Collision check: neither pattern collides with any existing pack recipe. The Storm Blade's ` L / WSW / L ` shape shares its outline with the crossbow's but uses different keys, which is safe.
- iPad: both recipes appear in the recipe book once a feather or a gold ingot is held.







### ADR-L0-scbs · The crossbow's base item (status: proposed, probe-gated) (L0-adr-scbs)

---
title: "ADR-L0-scbs · The Sculk Crossbow's base item: a custom shooter, not a marked vanilla crossbow"
aliases: ["L0-adr-scbs", "Sculk Crossbow base item"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-lgnd", "L0-xcx24", "L0-xasm27"]
see_also: ["sculkcrossbowspecv1ruen-part-1", "sculkcrossbowspecv1ruen-part-2"]
---
# ADR-L0-scbs · The crossbow's base item (status: proposed, probe-gated)

**Context.** Spec §1 says "base: Vanilla Crossbow". It requires infinite durability, a Creative/search/`/give` entry, Quick Charge and Multishot working (T14, T16), and Piercing impossible (T15). The framework identifies legendaries **by type id** (`isLegendaryStack`, `registry.ts:127`). Every shipped legendary is a custom `andrew:` item: the Web Sword and Katana clone a sword, and the Cannon looks like a fishing rod.

**Options.**
- **A: a custom `andrew:sculk_crossbow`** with `minecraft:shooter` (arrow ammunition), `minecraft:enchantable` (slot `crossbow`), no `minecraft:durability`, and a crossbow icon.
  - Pros: framework identity is unchanged, as are Creative/`/give` (T03) and infinite durability by omission.
  - Measured: with `charge_on_draw` it loads at `max_draw_duration` and fires on the next press, like a crossbow — not like a bow. Quick Charge has **no** native effect; Multishot was not measured. Quick Charge is therefore emulated: set the native draw to the QC III floor (0.5 s) and gate on the length of the loading draw, 25 − 5·level ticks. Multishot, if it is not native, is two extra bolts at ±10°.
- **B: the vanilla `minecraft:crossbow`** with the legendary mark in item dynamic properties.
  - Pros: real loading; Quick Charge and Multishot are native.
  - Cons: `isLegendaryStack` has to become mark-aware throughout the framework, the magnet and the GameTests. There is no Creative entry (§10). Durability must be refilled after every shot (T18). The unmarked vanilla crossbow is the recipe input and looks identical.

**Decision (proposed).** **A.** It keeps C-7 (one identity mechanism) and needs only the no-ability framework delta (`L0-xcx24`).

**Gate.** It is accepted only after the `sclk` probe records:
1. that the custom shooter fires arrows in Survival and consumes ammunition;
2. whether the enchanting table and the anvil offer Quick Charge, Multishot and Piercing for slot `crossbow`;
3. whether Multishot and Quick Charge change the custom shooter's behaviour natively.
4. ~~(added at reduce) the minimum release time (probe Q5)~~ — **satisfied natively on BDS**: `charge_on_draw` + `max_draw_duration` admit no early shot at all, so §9's limiter needs no script.

If (1) or (4) fails, B is adopted. Under B, T18 (durability kept at 0) moves from `sclk` to `lgnd`, together with mark-aware identity. The reduce then re-opens `lgnd` for mark-based identity. Under C-16, emulated Quick Charge is a documented deviation from the vanilla feel.

**Rejected: C, a custom item that shoots nothing** (the script spawns bolts on `itemUse`). It loses the crossbow's charge, the ammunition use and vanilla enchantment handling altogether, and §9 makes the standard reload the weapon's only limiter.







### ADR-L0-scdm · How a bolt hits (status: proposed, probe-gated) (L0-adr-scdm)

---
title: "ADR-L0-scdm · Bolt substitution and true damage for the Sculk Crossbow"
aliases: ["L0-adr-scdm", "Sculk bolt and damage pipeline"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-xcx22", "L0-xcx23", "L0-xasm23", "L0-xasm27"]
see_also: ["sculkcrossbowspecv1ruen-part-2", "sculkcrossbowspecv1ruen-part-3", "sculkcrossbowspecv1ruen-part-4"]
governs_files: ["src/scythe/volley.ts", "src/scythe/volley-rules.ts"]
---
# ADR-L0-scdm · How a bolt hits (status: proposed, probe-gated)

**Context.** §5, §9 and §14 put the most weight on this: vanilla arrow damage must be **replaced**, never stacked. Stable 2.10.0 has `world.beforeEvents.entityHurt`, and it does fire for arrow damage (`projectile:6.00:minecraft:arrow`), but its `cancel` was not tested, so no before-event is relied on to cancel projectile damage. `projectileHitEntity` is an after-event: by the time it fires, the arrow has already dealt armour-reduced, shield-blocked damage.

**Decision (proposed).**
1. **Substitution at spawn.** When an arrow-type projectile spawns whose owner holds a marked crossbow (main or off hand), the script removes it in the same tick. It spawns one `andrew:sculk_bolt` in its place with the same location, velocity and owner (`minecraft:projectile` `shoot`). One spawn gives one bolt, so each Multishot projectile has its own record (C-26).
   - The bolt is a **snowball-runtime** entity with zero damage. Engine facts: an entity without `runtime_identifier` pushes mobs; snowball-runtime entities persist and reload through `entityLoad`, and the reload removes them (C-23).
   - Gravity and drag match the arrow (tuned constants, probe-measured), so the bolt still falls like a bolt (§9: physical, not hitscan).
2. **Hit.** `projectileHitEntity` and `projectileHitBlock` are filtered to `andrew:sculk_bolt`. The bolt's record is resolved exactly once, then the bolt is removed.
3. **Damage.** `SONIC_BOOM_DAMAGE` (`xasm23`) goes through the shipped Scythe true-damage pattern (`volley.ts:114`, `decision-scythe-true-damage`): `applyDamage(D, {cause: sonicBoom, damagingEntity: owner})` for the flash, the sound and kill credit, then `health.setCurrentValue(hp − D)` **only inside a known window**. If D ≥ hp, it is an overkill `applyDamage` with the same cause. Cause `projectile` throws when `damagingEntity` is set; `entityAttack` is cancelled by a raised shield, so the holder survives the lethal hit. `sonicBoom` passes armour, Protection and the shield, credits the owner and still lets a totem save (measured, diagnose-CNTR-X22 / -X23).
4. **Visual.** While a bolt lives, the shared interval emits `minecraft:sonic_explosion` (or a look-alike RP particle if the iPad shows it badly) at the bolt's real position and the previous one (C-5f).

**Gate.** The probe confirms:
- that the spawn event carries the owner and velocity of a crossbow/shooter arrow in time to swap it with no damage;
- ~~what a snowball-runtime bolt does against a raised shield (`xcx23`)~~ — answered: no deflection, `projectileHitEntity` fires on the shield holder (5/5);
- that three bolts in one tick each take the full D (T17).

**Rejected.**
- **Keep the vanilla arrow and top up the difference after the hit.** The arrow's damage depends on armour, Power and the shield. A lethal arrow cannot be undone. There is also no reliable way to tell "arrow damage" from other damage in the same tick (violates C-26 and §14 "no stacking").
- **A hitscan ray from the shooter.** Forbidden by §9.
- **Arrow runtime with damage 0.** The arrow runtime keeps knockback, sticks in targets and can be picked up. A raised shield deflects it, and the deflected arrow still raises `projectileHitEntity` and then a second `projectileHitBlock` where it lands — two events for one shot. The rejection stands, for that reason.







### ADR-L0-scfc · Full-charge gate (status: accepted, probe-gated; resolves `L0-sclk-cx02`) (L0-adr-scfc)

---
title: "ADR-L0-scfc · Full charge is the crossbow's fire-rate gate; a failed gate falls back to option B and re-opens `lgnd` identity"
aliases: ["L0-adr-scfc", "Crossbow full-charge gate"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-lgnd", "L0-adr-scbs", "L0-sclk-cx02", "L0-sclk-r006", "L0-sclk-as05", "L0-sclk-p001", "L0-sclk-ac18", "L0-xasm27", "L0-xq7"]
requires: ["L0-adr-scbs"]
governs_files: ["src/sculk/", "packs/behavior/items/sculk_crossbow.json"]
---
# ADR-L0-scfc · Full-charge gate (status: accepted, probe-gated; resolves `L0-sclk-cx02`)

**Context.** Spec §9 makes the standard crossbow reload (with Quick Charge) the weapon's only limiter: there is no cooldown. Option A of `adr-scbs` is a custom `minecraft:shooter`, which, with `charge_on_draw`, cannot fire before `max_draw_duration` (measured). Damage is fixed (C-28) and every block hit carves a full crater, so a tap-release would multiply both the DPS and the terrain edits.

**Decision.**
- Under option A, no early projectile exists: the native gate admits none. A load shorter than the Quick-Charge-adjusted time — possible only if the native draw is set below 25 ticks to emulate Quick Charge — is caught when its arrow spawns on the **next** press; that arrow is removed, and the arrow spent at load stays spent.
- Probe **Q5** is answered: `charge_on_draw` / `max_draw_duration` blocks an early release natively. The scripted check stays as a guard, but it measures the **length of the loading draw**, not the arrow's speed — every fired arrow is full speed.
- If neither the native nor the scripted gate holds reliably on BDS **and** the iPad, `adr-scbs` falls to **option B**.

**Why this is cross-component.** Option B is not a `sclk`-local change. It makes legendary identity mark-based across `lgnd` (`isLegendaryStack`, `defForStack`, the craft gate, retention) and `magn` (`hasitem` holder tags cannot read a mark). It also moves **T18** (durability) from `sclk` to `lgnd`, which has to keep a vanilla crossbow repaired. A Q1 or Q5 failure therefore needs a new L0 decision before any build task. This ADR does not pre-approve that rewrite.

**T18 routing (plan invariant).** Option A: T18 is in `sclk` (`sclk-ac18`: the item JSON has no `minecraft:durability`). Option B: T18 is in `lgnd`.







### ADR-L0-sckp · The Sculk Crossbow's key prefix is `sk` (status: accepted, resolves `L0-lgnd-cx15`) (L0-adr-sckp)

---
title: "ADR-L0-sckp · The Sculk Crossbow's key prefix is `sk`"
aliases: ["L0-adr-sckp", "Crossbow key prefix"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-lgnd", "L0-sclk", "L0-lgnd-cx15", "L0-xasm26", "L0-lgnd-as18", "L0-lgnd-ad16", "L0-sclk-p006", "L0-sclk-ent1", "L0-sclk-ac01", "L0-sclk-ac02", "L0-sclk-ac03"]
requires: ["L0-lgnd"]
governs_files: ["src/legendary/registry.ts"]
---
# ADR-L0-sckp · The Sculk Crossbow's key prefix is `sk` (status: accepted, resolves `L0-lgnd-cx15`)

**Context.** The v7 plan row for `lgnd` and `L0-xasm26` gave def #5 `keyPrefix "sc"`. `sclk` built on that (p006, ent1, ac01–ac03). `lgnd` read `registry.ts` and found `sc` is the **Scythe's** prefix. It has been live since v3, and worlds already hold `andrew:sc_crafted`, `sc_owed`, `sc_pending` and `sc_gen:*`. Sharing it would merge the two weapons' craft flags and ledgers, and the registry uniqueness test (`lgnd-ac23`) would stop the build.

**Decision.** Def #5 uses **`keyPrefix: "sk"`**. No `andrew:sk_` key exists anywhere. Like every prefix, it is frozen once a world ships (`lgnd-r006`).

**Reconciled in place at reduce.** All of these were written in this run, so they were corrected rather than filed against: `sclk-p006`, `sclk-ent1`, `sclk-ac01`–`ac03` (flag `sk`), `L0-xasm26`, and the `lgnd` row of the v7 decomposition plan (now annotated). The `lgnd` side (`as18`, component delta #3) already said `sk`.

**Consequence.** The token id, item id and command `andrew:crossbow` are unaffected. A test asserting the craft flag reads `andrew:sk_crafted`.







### ADR-L0-scpi · Piercing on the Sculk Crossbow (status: accepted, probe-gated; resolves `L0-sclk-cx01`) (L0-adr-scpi)

---
title: "ADR-L0-scpi · T15 reads as \"Piercing is stripped on entry and never acts\" (C-16 deviation)"
aliases: ["L0-adr-scpi", "Crossbow Piercing reading"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-sclk-cx01", "L0-sclk-ad01", "L0-sclk-r005", "L0-sclk-ac15", "L0-adr-scbs", "L0-sclk-p001"]
see_also: ["constraints"]
governs_files: ["src/sculk/"]
---
# ADR-L0-scpi · Piercing on the Sculk Crossbow (status: accepted, probe-gated; resolves `L0-sclk-cx01`)

**Context.** T15: "Piercing cannot be applied or used." `minecraft:enchantable.slot = "crossbow"` is needed for Quick Charge and Multishot (T14, T16), and it admits Piercing. Stable 2.10.0 has no hook to refuse an anvil or enchanting-table result (C-16). The v7 plan already allowed "strip it on sight if the slot cannot exclude it".

**Decision.**
- T15 passes when the following hold. (a) Every sculk-crossbow stack that gains Piercing loses it in the same tick the inventory-change event reports it (`sclk-r005`). (b) No bolt behaves differently with Piercing, because each bolt resolves once (`sclk-r001`).
- The README C-16 list states the cost: Piercing from a table roll or an anvil book is removed with no refund. `enchant_with_levels 30` gives Piercing in 65 % of rolls and Piercing alone in 19 % (levels 1–30: 70 % / 42 %), and such a roll leaves the crossbow bare.
- Probe **Q2** is answered: the engine does admit Piercing for the custom item, so the deviation is kept and T15 is tested as "removed at once".

**Scope.** This applies only to `sclk`. No `lgnd` hook is involved: the strip is crossbow code on `playerInventoryItemChange`, so the plan's single framework change still holds.







### ADR-L0-sctr · Crater and sculk (status: proposed) (L0-adr-sctr)

---
title: "ADR-L0-sctr · Crater and sculk: a scripted, bounded, protected carve with a shared deny list"
aliases: ["L0-adr-sctr", "Sculk crater carve"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-sclk", "L0-orbc", "L0-lgnd", "L0-xcx25", "L0-xasm24", "L0-xasm25"]
see_also: ["sculkcrossbowspecv1ruen-part-2", "sculkcrossbowspecv1ruen-part-4"]
governs_files: ["src/orbital/penetrator-keep.ts", "src/legendary/recovery.ts"]
---
# ADR-L0-sctr · Crater and sculk (status: proposed)

**Context.** §6, §7, §11 and §14 ask for an irregular crater of up to about 5×5×(2–3) with no explosion damage, then permanent plain sculk around it. The edits are event-driven, synced and saved. With Multishot and Quick Charge, one player can cause about 3 carves every ~0.6 s.

**Decision (proposed).**
1. **Shape.** A pure, node-tested `craterCells(impact, face, seed)`. It returns cells inside a 5×5 footprint and down to 3 deep: an ellipsoid with radius jitter, seeded per bolt so a GameTest can replay it. The centre column is always at least 2 deep. The **patch** is `sculkCells(…)`: the top exposed solid full-block faces within ≤ 5×5, with a ragged edge.
2. **Order in the hit tick:**
   1. clip the box to loaded chunks and the height range (C-12);
   2. `protectLegendariesIn(dimension, box)` (`recovery.ts:679`);
   3. set each crater cell to air if it is not on the deny list and not a liquid;
   4. turn each patch cell into `minecraft:sculk`.

   There are no item drops (`xasm25`) and no entity damage. Each bolt does at most 75 + 25 `setType` calls. A per-tick budget (for example 300 calls) queues overflow to the next tick of the shared interval, keeping the order per bolt.
3. **The deny list is shared.** `penetrator-keep.ts` (the Orbital LMB Survival-unbreakable list, `L0-xasm6`) moves to a neutral module, for example `src/terrain/keep.ts`. Both weapons import it, with no change in behaviour for the Orbital (C-7, `xcx25`).

**Rejected.**
- **`dimension.createExplosion`.** It always damages entities, breaks blocks by blast resistance rather than to the bounds asked for, and drops items (§6, T12).
- **Spreading the carve over a `runJob`.** The engine fact: starting `runJob` stalls the next tick by 15–30 ms. The interval budget achieves the same thing without that.
- **A per-weapon copy of the deny list.** It would drift (C-7).







### ADR-L0-trlg · The trident widens `lgnd` by two generic hooks (L0-adr-trlg)

---
title: "ADR-L0-trlg · The trident widens lgnd by two generic hooks: an exported delivery and a refund exchange"
aliases: ["L0-adr-trlg", "Trident lgnd widening"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0-trdt", "L0-lgnd", "L0-magn", "L0-xcx30", "L0-xasm32", "L0-xasm33", "L0-trdt-adcl", "L0-trdt-adrf", "L0-trdt-cx01", "L0-adr-twth"]
requires: ["L0-lgnd"]
see_also: ["L0-trdt-ecus", "L0-trdt-pfbk", "L0-trdt-cons"]
governs_files: ["src/legendary/recovery.ts", "src/legendary/craftgate.ts", "src/legendary/registry.ts"]
---
# ADR-L0-trlg · The trident widens `lgnd` by two generic hooks

**Status:** accepted at the v9 reduce. It settles `L0-xcx30` and `L0-trdt-cx01`.

**Context.**
- `xasm32` (v7/v8) says a new legendary adds one `registry.ts` entry plus its `main.ts` subscriptions. Any other framework hook needs an L0 decision.
- `xcx30` allowed the trident at most "a delivery export plus a scan exclusion". More than that would mean re-running `lgnd` at v10.
- `L0-trdt-adcl` lists the touch points T1–T7. Only T2 changes framework code: `recovery.ts`'s private `lost()` is exported as `deliverToLastHolder`, with its body unchanged. **No scan exclusion is needed**, because `watch()`, retention and the magnet already skip entities that are not `minecraft:item` and have no inventory.
- Outside custody, `L0-trdt-adrf` needs the craftgate to *take* the 2 empty buckets the engine returns before it refunds 2 water buckets (C-34, C-7). As read during reduce at v9, `craftgate.ts` `refund()` (lines 185–196) only adds stacks (`returnToPlayer` → `addItem`), and `recovery.ts:506` holds `lost()` as a private function.

**Decision.**
1. **Accept T2.** Export `lost` as `deliverToLastHolder`. Its signature stays the existing `({def, mark}, how)`; `adcl`'s `(def, mark, how)` is notation, not a new shape. This is within `xcx30`'s allowance, so **`lgnd` is not re-run.**
2. **Accept an optional `refundExchange` field on the def base type**, handled inside `craftgate.refund`.
   - It is generic: `[fromItem, toItem, count][]`. It removes up to `count` of `fromItem` from the inventory and off hand, then adds that many of `toItem`.
   - It is unset, and therefore inert, for defs 1–6.
   - **It is conditional on probe P1.** If the engine returns no bucket, the field is not added, `def.refund` lists the water buckets, and `xasm32` is widened by T2 only.
3. **`xasm32` is restated:** a new def adds a registry entry, its subscriptions, and at most the generic hooks accepted by an L0 ADR. Today those are `deliverToLastHolder` and `refundExchange`. A third hook needs a new L0 contradiction.
4. **Proof obligation.** Any change to `recovery.ts` or `craftgate.ts` puts the full `lgnd` scenario set (with def #7) and the magnet's legendary scenarios into the merge gate. The T3–T6 "no code" seams each need the named GameTest from `adcl`; they are not assumed.

**Rejected alternatives.**
- **Re-running `lgnd` at v10.** Both hooks are small and generic, and the existing `lgnd` scenarios cover them. A re-run adds no knowledge.
- **A trident-local refund hook.** It would duplicate the craftgate's token detection and settle order, and risk a double refund (`adrf`).
- **A "custody" place inside `lgnd`.** It needs new scan hooks in recovery, retention and magnet (`adcl`, rejected).

**Consequences.**
- `L0-xcx30` and `L0-trdt-cx01` are resolved.
- The `lgnd` README must document both exports as framework API.








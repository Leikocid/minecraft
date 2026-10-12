---
type: "concept-component"
node_id: "L0-uwbw"
source_channel: "rollout"
analysis_version: 10
title: "L0-uwbw · The Underwater Bow (`andrew:underwater_bow`), def #8, plus the Mace and Firework Rocket recipes"
aliases: ["L0-uwbw"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 640
size_chars: 3890
tags: ["v10", "underwater-bow", "def-8", "component", "recipes"]
level: 1
---
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

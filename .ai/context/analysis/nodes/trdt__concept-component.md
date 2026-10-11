---
type: "concept-component"
node_id: "L0-trdt"
source_channel: "rollout"
analysis_version: 9
title: "L0-trdt · The Above-Water Trident (`andrew:above_water_trident`), def #7"
aliases: ["L0-trdt"]
is_a: ["component"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 630
size_chars: 3906
tags: ["v9", "above-water-trident", "def-7", "component"]
level: 1
---
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

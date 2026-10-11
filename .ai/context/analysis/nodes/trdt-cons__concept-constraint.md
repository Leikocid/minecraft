---
type: "concept-constraint"
node_id: "L0-trdt-cons"
source_channel: "rollout"
analysis_version: 9
title: "Constraints and probe plan (run on checks BDS 19136 before building)"
aliases: ["L0-trdt-cons"]
is_a: ["constraint"]
part_of: ["L0-trdt"]
relates_to: ["L0-trdt"]
priority: 630
size_chars: 2422
tags: ["above-water-trident", "probe", "checks-19136", "first-deliverable"]
level: 2
---
# Constraints and probe plan (run on checks BDS 19136 before building)

**Links.** is_a: constraints. relates_to: L0-xcx31, L0-xasm33, L0-xasm34, L0-xasm37, L0-adr-twth, L0-adr-twrp.

## Binding constraints
- C-7, C-16, C-29, C-30′ (visual strike only until `xq10`), C-33 to C-37.
- Stable `@minecraft/server` 2.10.0 only.
- One shared `runInterval`, never `runJob` (`runJob` stalls 15–30 ms).
- Probes run on a private BDS copy and never import `bds-gametest.mjs`.

## Probe list
Each probe records numbers into the README "Measured" table.

| # | Probe | Decides |
|---|---|---|
| P1 | Token recipe with 2 water buckets: are the empties returned? With a full inventory, where do they go? Shift-craft ×1 | `L0-trdt-adrf` branch |
| P2 | Vanilla `minecraft:trident` melee and thrown damage against no armour and against diamond armour. Impaling V on the custom item against a drowned | `minecraft:damage`, `impact_damage`, the Impaling limitation |
| P3 | `itemStartUse` / `itemReleaseUse` with a use-duration item, no `throwable`: event, `useDuration`, `isSneaking` at release. On iPad touch, run by Andrey's session or the QA BDS | the input in `pmov` |
| P4 | Vanilla Riptide III in water, flat, standing: horizontal and vertical distance. Then `applyKnockback` H/V to match ± 20 % | dash constants |
| P5 | `beforeEvents.entityHurt` cancel on cause `fall` after a knockback launch from 20 blocks up | fall grant path or katana fallback |
| P6 | Sim player swim speed: plain, sprint-swim, with the impulse | swim impulse constants |
| P7 | Vanilla thrown trident: launch speed and gravity per tick. Match the custom projectile's `power`, `gravity`, `inertia` | entity JSON |
| P8 | Teleport-steered entity at 0.5 b/tick through a 3-block wall: arrival time | return implementation |
| P9 | Restart with a custody entity loaded: does `entityLoad` fire, and is the `andrew:tr.throw` property kept? Is `Entity.id` stable? | stale handling |
| P10 | `damageSource.damagingProjectile` and `damagingEntity` for a script-shot projectile with an owner | thrown raise or the scripted fallback (`addm` §3) |

## Non-functional limits
- No added per-tick work when no record exists and no player holds the trident.
- No world dynamic property write per tick: the record is written at throw, swap, every 20 ticks during return, and at delivery.
- The return interval itself is shared and starts and stops with records and holders.

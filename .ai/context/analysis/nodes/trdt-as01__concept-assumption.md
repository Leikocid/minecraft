---
type: "concept-assumption"
node_id: "L0-trdt-as01"
source_channel: "rollout"
analysis_version: 9
title: "ASM-trdt-01 · Engine behaviour the custody and damage design leans on"
aliases: ["L0-trdt-as01"]
is_a: ["assumption"]
part_of: ["L0-trdt"]
relates_to: ["L0-trdt"]
priority: 630
size_chars: 1500
tags: ["above-water-trident", "CAN_ASSUME", "probe-dependent"]
level: 2
---
# ASM-trdt-01 · Engine behaviour the custody and damage design leans on

**Links.** relates_to: L0-trdt-adcl, L0-trdt-addm, L0-trdt-cons.

**Assumptions (CAN_ASSUME, each with a probe).**
1. **Item use (P3).** A custom item with a use duration and no `throwable` raises `itemReleaseUse` with a usable remaining duration, on touch as well. If wrong: the input moves to `itemStopUse` or the charge is timed from `itemStartUse`.
2. **Thrown damage source (P10).** A script-shot projectile with an owner reports `damagingProjectile` and the owner as `damagingEntity` in `beforeEvents.entityHurt`. If wrong: the scripted `entityAttack` fallback (`addm` §3) is used.
3. **Restart (P9).** The entity dynamic property `andrew:tr.throw` survives a restart, and `entityLoad` fires for the custody entity. If wrong: a stale entity is caught by `entitySpawn` plus a type sweep near the players on the first ticks.
4. **Drops.** A player rarely presses Drop within `DROP_SWING_WINDOW_TICKS` of a throw. If they do, lgnd's departure watch may `lost()` the instance. The generation bump then makes the custody mark stale: the return inserts nothing and exactly one copy remains. Impact: a harmless "recovered" message.
5. **Unmarked Creative copies** thrown while the thrower is offline are dropped at the last position rather than owed. If wrong: Andrey wants Creative copies owed too, which needs lgnd owed support for unmarked stacks.
6. **Entity hit return speed.** It is 10 b/s, the same as a miss (`xasm36`).

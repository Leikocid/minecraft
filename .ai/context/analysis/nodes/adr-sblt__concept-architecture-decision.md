---
type: "concept-architecture-decision"
node_id: "L0-adr-sblt"
source_channel: "rollout"
analysis_version: 8
level: 1
title: "ADR-L0-sblt · Storm Blade visuals (status: proposed, probe-gated)"
aliases: ["L0-adr-sblt"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 620
size_chars: 2656
tags: ["v8", "storm-blade", "status:proposed", "probe-gated"]
---
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

---
type: "concept-architecture-decision"
node_id: "L0-pntr-ad03"
source_channel: "rollout"
analysis_version: 5
title: "ADR-pntr-3 · Particle wave as a separate 20-tick job"
aliases: ["L0-pntr-ad03"]
is_a: ["architecture-decision"]
part_of: ["L0-pntr"]
relates_to: ["L0-pntr"]
priority: 540
size_chars: 1183
tags: ["title:ADR-pntr-3 · Particle wave as a separate 20-tick job, decoupled from removal", "is_a:architecture-decision", "status:proposed", "relates_to:L0-pntr-p003"]
level: 2
---
# ADR-pntr-3 · Particle wave as a separate 20-tick job

**Status:** proposed.

**Context.** Orbital §9/§12: removal is immediate, and particles play **separately** for ~1 s, top-down. The wave must cover columns from 1 to 384 layers in the same ~1 s.

**Decision.**
- A second bounded `runJob` (or `system.runInterval` cleared after 20 ticks) walks a layer cursor from `top` to `bottom` in 20 equal steps.
- Each step emits vanilla particles (`huge_explosion_emitter` every 4th layer, `large_explosion` on rim cells), capped at 16 calls per tick.
- It shares only `ColumnPlan` with the removal job. There is no progress coupling.

**Rejected alternatives.**
- **Particles emitted by the removal job as it goes.** The duration would then depend on throughput, not ~1 s, and would change with server load.
- **A custom particle in a resource pack.** It adds an RP asset (§12 allows an RP only "if needed"), and vanilla explosion particles already read as a blast.
- **Particles only at the surface.** This fails "wave passes top-down".

**Consequences.** The look and particle density are judged on iPad (`L0-pntr-ac08`). The cap keeps network traffic bounded for all players in range.

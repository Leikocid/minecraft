---
type: "concept-architecture-decision"
node_id: "L0-sauc-ad02"
source_channel: "rollout"
analysis_version: 5
title: "ADR-sauc-2 · The saucer is moved by a per-tick script teleport on `ufoc`'s shared interval; the spin is client animation"
aliases: ["L0-sauc-ad02"]
is_a: ["architecture-decision"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 1618
tags: ["is_a:architecture-decision", "status:proposed", "motion", "relates_to:L0-sauc-p001", "relates_to:L0-adr-ufom"]
level: 2
---
# ADR-sauc-2 · The saucer is moved by a per-tick script teleport on `ufoc`'s shared interval; the spin is client animation

**Status:** proposed.

**Context.**
- The path is exact and time-boxed: 400 / 1200 / 300 ticks (AC-2).
- The saucer has no physics.
- `magn` and the hull test need the position in each tick.
- C-5d allows one shared interval per event family.
- The shipped `orbital_charge` already moves this way: a snowball runtime, no gravity, a teleport per tick.

**Decision.**
- `saucerStep(tick)` is called from `ufoc`'s interval. It computes the position analytically from `legStartTick` (`p001`) and calls `entity.teleport(pos)` once.
- The spin and the light blink are RP animations and cost the server nothing.
- The script never sets a rotation.

**Rejected alternatives.**
- **`applyImpulse` / velocity.** The snowball runtime has no gravity or physics, so velocity integration is not authoritative, and the time to reach the hover point would drift.
- **`minecraft:movement` + navigation components.** They need a mob runtime, which brings back pushing, AI and despawn problems (engine notes: no `runtime_identifier` pushes mobs).
- **Our own `runInterval` in `sauc`.** This violates C-5d and races with `magn` over the position.
- **Rotating through teleport `rotation`.** It costs per-tick network data for something the client can animate.

**Consequences.**
- The client interpolates teleports. The arrival steps are ≤ 0.23 blocks per tick and look smooth. This is confirmed on the iPad (`ac06`).
- The position is deterministic in a GameTest given the tick, so `ac01` can assert exact points.

---
type: "concept-architecture-decision"
node_id: "L0-sauc-ad03"
source_channel: "rollout"
analysis_version: 5
title: "ADR-sauc-3 · The shoot-down fall and blast are scripted (teleport + particles + sound), not engine physics or `createExplosion`"
aliases: ["L0-sauc-ad03"]
is_a: ["architecture-decision"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 1418
tags: ["is_a:architecture-decision", "status:proposed", "shoot-down", "relates_to:L0-sauc-r004", "relates_to:L0-sauc-p002"]
level: 2
---
# ADR-sauc-3 · The shoot-down fall and blast are scripted (teleport + particles + sound), not engine physics or `createExplosion`

**Status:** proposed.

**Context.**
- UFO §8 asks for a 3 s fall with smoke, and a blast on touching the ground or at 3 s.
- The blast has "no block destruction and **no damage**".
- The reward must spawn exactly once, at the blast.

**Decision.**
- The fall continues the per-tick teleport with an accelerating `vy` (`as02`). Contact comes from a cell check under the hull.
- The blast is `huge_explosion_emitter` plus `random.explode` at the contact point.
- The reward is two `spawnItem` calls, behind the `eventId` latch (`r004`).

**Rejected alternatives.**
- **`dimension.createExplosion(P, r, {breaksBlocks: false})`.** It still damages and knocks back entities. Players gathered under a downed saucer would take damage, which violates §8.
- **Switching on `has_gravity` (a component group) and letting the entity fall.**
  - The fall time and contact detection become engine-defined.
  - A snowball runtime with gravity may get projectile hit behaviour.
  - The 3 s cap still needs a script timer.
- **A `/summon tnt` with `doTileDrops`/`mobGriefing` off.** It still deals damage, and it changes game rules.

**Consequences.** Everything is deterministic and GameTest-assertable: the block snapshot is unchanged, player health is unchanged, and the item counts are exactly 8 + 1.

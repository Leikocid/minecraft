---
type: "concept-architecture-decision"
node_id: "L0-sauc-ad01"
source_channel: "rollout"
analysis_version: 5
title: "ADR-sauc-1 · The beam is a bone of the saucer model, toggled by a client-synced actor property"
aliases: ["L0-sauc-ad01"]
is_a: ["architecture-decision"]
part_of: ["L0-sauc"]
relates_to: ["L0-sauc"]
priority: 580
size_chars: 1717
tags: ["is_a:architecture-decision", "status:proposed", "beam", "amends:L0-adr-ufom", "relates_to:L0-sauc-r005", "relates_to:L0-sauc-ent1"]
level: 2
---
# ADR-sauc-1 · The beam is a bone of the saucer model, toggled by a client-synced actor property

**Status:** proposed. It amends the wording of `L0-adr-ufom` §4 ("the saucer and the beam" entities). Cleanup by family still covers both.

**Context.**
- The beam must appear and disappear with the magnet.
- It spans ~40 blocks below a moving saucer, it is translucent, and it is "visible whole" on the iPad.
- It must be immune and non-colliding like the saucer.
- The probe used a separate `andrew:ufo_beam_probe` entity.

**Decision.**
- One entity. The beam is a cone bone in `geometry.andrew.ufo_saucer`:
  - it is drawn with `entity_alphablend` through bone-pattern materials;
  - its visibility is `q.property('andrew:beam')`;
  - its length is scaled by `andrew:beam_len`.
- The script sets the properties at the magnet-on and magnet-off ticks only.

**Rejected alternatives.**
- **A second beam entity, teleported each tick under the saucer.**
  - It needs two teleports per tick, and the two can jitter apart on the client.
  - It is a second entity for cleanup and for the AC-16 checks.
  - It is a second chunk-load and visible-bounds problem.
- **Particles (a column of `minecraft:villager_happy`, or a custom emitter).**
  - They are not a solid translucent cone.
  - The density needed for 40 blocks costs network traffic every tick.
  - A custom particle still needs an RP asset.
- **A per-tick `/fill` of green stained glass.** It changes the world, which breaks priority (1).

**Consequences.**
- `visible_bounds` must enclose the beam, or the client culls it when the disc is off screen (`as04`).
- The beam's look is judged only on the iPad (`ac06`). On BDS the property value is asserted (`ac05`).

---
type: "concept-glossary-term"
node_id: "L0-trap-gchk"
source_channel: "rollout"
aliases: ["L0-trap-gchk"]
part_of: ["L0-trap"]
is_a: ["glossary-term"]
relates_to: ["L0-trap"]
analysis_version: 2
level: 2
priority: 510
size_chars: 820
tags: ["glossary","L0-trap"]
---

**Loaded / accessible area** *(загруженная/доступная область)*

The region of the world the server currently has in memory and may safely read and write. Cells outside it are **skipped like protected cells** (R-007).

The spec treats this as a hard edge, not best effort: §6 says *«Не пытаться создавать паутину вне загруженной/доступной области»* and §12 calls a write at the boundary *«опасная запись»* — dangerous. The component may not force-load a chunk, pin a ticket, or attempt a speculative write and swallow the error to complete a cube.

Consequence: a player activating at the edge of the simulation distance gets a clipped cube, and that is correct behaviour.

How "loaded" is probed on the stable `@minecraft/server` surface is **ASM-020**.

**Synonyms**: loaded chunks, simulation area, доступная область.

---
type: "concept-architecture-decision"
node_id: "L0-magn-adhp"
source_channel: "rollout"
analysis_version: 5
title: "ADR magn-adhp · A hopper with anything in it is a container; an empty hopper is a pulled block (settles `L0-xcx18`)"
aliases: ["L0-magn-adhp"]
is_a: ["architecture-decision"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 1465
tags: ["is_a:architecture-decision", "status:accepted", "resolves:L0-xcx18", "deviation:C-16", "relates_to:L0-xcx18", "relates_to:L0-lgnd"]
level: 2
---
# ADR magn-adhp · A hopper with anything in it is a container; an empty hopper is a pulled block (settles `L0-xcx18`)

**Context.**
- UFO §4 and §5 Blocks list the `hopper` as a built iron block.
- §5 Containers lists the hopper among containers whose contents and block are **not touched**.
- Pulling it as a block would either:
  - spill or lose its non-iron contents, or
  - set a legendary inside it loose under a moving saucer.

**Decision.** Spec §5 / `decision-resolve-l0-lgnd-cx13`.
- The hopper is in both CONTAINER_BLOCKS and IRON_BLOCKS; `blockRole` picks by contents at magnet-on (`iron.ts:140–141`): any contents → class 2 source, empty → class 4.
- A hopper **item**, on the ground or in a container, is still iron and is pulled.
- A hopper minecart is still pulled whole, as a minecart.

**Rejected alternatives.**
- **(b) `setblock … destroy`, then pull the hopper.** It spills contents vanilla-style. Spilled iron inside the zone would race the selection, and a legendary would need `protectLegendariesIn`. This adds a world-mutation path for one block type, against C-15 priority 1.

**Consequence.** AC-10 covers the empty hopper as a block (`ufo_magnet_blocks`), AC-9 the non-empty one as a container (`ufo_magnet_containers`).

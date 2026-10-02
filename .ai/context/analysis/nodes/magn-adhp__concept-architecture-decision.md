---
type: "concept-architecture-decision"
node_id: "L0-magn-adhp"
source_channel: "rollout"
analysis_version: 5
title: "ADR magn-adhp · The hopper is a container only, never a pulled block (settles `L0-xcx18`)"
aliases: ["L0-magn-adhp"]
is_a: ["architecture-decision"]
part_of: ["L0-magn"]
relates_to: ["L0-magn"]
priority: 580
size_chars: 1465
tags: ["is_a:architecture-decision", "status:accepted", "resolves:L0-xcx18", "deviation:C-16", "relates_to:L0-xcx18", "relates_to:L0-lgnd"]
level: 2
---
# ADR magn-adhp · The hopper is a container only, never a pulled block (settles `L0-xcx18`)

**Context.**
- UFO §4 and §5 Blocks list the `hopper` as a built iron block.
- §5 Containers lists the hopper among containers whose contents and block are **not touched**.
- Pulling it as a block would either:
  - spill or lose its non-iron contents, or
  - set a legendary inside it loose under a moving saucer.

**Decision.** This is option (a) of `L0-xcx18`, the autopilot default.
- A placed hopper is in CONTAINER_BLOCKS only. Its iron stacks are extracted (class 2), and the block stays.
- It is removed from IRON_BLOCKS and is never a class 4 candidate.
- A hopper **item**, on the ground or in a container, is still iron and is pulled.
- A hopper minecart is still pulled whole, as a minecart.
- This is recorded as a C-16 deviation note in `src/ufo/README` and in the release notes.

**Rejected alternatives.**
- **(b) `setblock … destroy`, then pull the hopper.** It spills contents vanilla-style. Spilled iron inside the zone would race the selection, and a legendary would need `protectLegendariesIn`. This adds a world-mutation path for one block type, against C-15 priority 1.
- **(c) Pull only empty hoppers.** It is consistent but surprising ("why did this hopper stay?"), and it still contradicts §5 Containers.

**Consequence.** For UFO AC-10 and the block side of AC-8, the hopper is excluded from the block-class tests. AC-9 covers it as a container.

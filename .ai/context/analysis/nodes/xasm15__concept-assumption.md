---
type: "concept-assumption"
node_id: "L0-xasm15"
source_channel: "rollout"
analysis_version: 4
level: 1
title: "ASM-L0-15 · The UFO §4 iron lists are verified against the 1.26.51 id registry before coding (`chain` may be `iron_chain`)"
aliases: ["L0-xasm15"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 580
size_chars: 1151
tags: ["CAN_ASSUME", "status:to-probe", "channel:bds", "relates_to:L0-magn", "v4"]
---
---
title: "ASM-L0-15 · The UFO §4 iron lists are verified against the 1.26.51 id registry before coding (`chain` may be `iron_chain`)"
aliases: ["L0-xasm15"]
is_a: ["assumption"]
part_of: ["L0"]
relates_to: ["L0-magn", "L0-sauc"]
see_also: ["ufomagnetspecv1ruen-part-1"]
---
# ASM-L0-15 · The UFO §4 iron lists are verified against the 1.26.51 id registry before coding (`chain` may be `iron_chain`)

**Assumption.**
- The spec names vanilla ids informally: "all rails", "all minecarts", "all buckets with contents", "anvil (all damage states)", `chain`.
- Recent Bedrock drops renamed or extended some of them; for example, the copper update introduced metal-specific chains and lanterns.
- `magn` therefore builds its lists from `ItemTypes.getAll()` / `BlockTypes.getAll()` on BDS 1.26.51.1, filtered by explicit id patterns.
- A GameTest asserts that every listed id resolves. A missing id fails the build, not the event.
- Copper or other non-iron variants are **not** added.

**Impact if wrong.** A misspelt id makes `getBlocks` `includeTypes` throw, or silently drops a class. Per C-16, the event either never starts or never pulls that class.

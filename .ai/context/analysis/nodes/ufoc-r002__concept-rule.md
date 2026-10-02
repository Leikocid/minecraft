---
type: "concept-rule"
node_id: "L0-ufoc-r002"
source_channel: "rollout"
analysis_version: 5
title: "R-ufoc-2 · Target and centre selection"
aliases: ["L0-ufoc-r002"]
is_a: ["rule"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 957
tags: ["is_a:rule", "targeting", "relates_to:L0-ufoc-as02"]
level: 2
---
# R-ufoc-2 · Target and centre selection

**Links:** `part_of: ["L0-ufoc"]` · `is_a: ["rule"]` · `relates_to: ["L0-ufoc-ent2", "L0-ufoc-as02", "L0-ufoc-p001"]`

**Rule** (UFO §2, §10):
- **Candidates** = `env.overworldPlayers()`, the online players for which all of these hold:
  - `isValid === true`;
  - `dimension.id === "minecraft:overworld"`;
  - health > 0.

  Unreadable (`undefined`) entries are dropped; product packs see simulated players that way. Game mode is not a filter (`as02`).
- **Target** = one candidate drawn uniformly through `env.random()`. For `come`, the target is the invoker when they are a candidate (`p004`).
- **Centre** = `{floor(x), floor(y) − 1, floor(z)}` of the target at arrival start, which is the block under their feet (`as02`). It is frozen for the whole event.
- The event goes on at the centre if the target leaves, dies, changes dimension or logs out (§10). After selection, no `ufoc` logic reads the target again.

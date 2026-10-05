---
type: "concept-glossary-term"
node_id: "L0-lgnd-gl10"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-gl10"]
is_a: ["glossary-term"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 540
size_chars: 481
tags: ["v3-delta"]
level: 2
---
**Activation mode** (`"use"` | `"attack"`)

The kind of input a press is: **use** is RMB, or a tap on iPad; **attack** is LMB, or hold on iPad (`L0-xasm10`).
- Each `LegendaryDef` lists the modes it accepts in `activations`. Only the Orbital Cannon accepts `attack`.
- `resolveActivation(player, mode)` picks the activated weapon:
  - use: main hand, then off hand;
  - attack: main hand only.
- All modes of one weapon share one cooldown.

**Synonyms:** LMB/RMB mode, input mode.

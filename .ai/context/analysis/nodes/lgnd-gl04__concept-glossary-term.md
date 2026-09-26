---
type: "concept-glossary-term"
node_id: "L0-lgnd-gl04"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-lgnd-gl04"]
is_a: ["glossary-term"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 429
tags: ["glossary"]
level: 2
---
**Busy (ability state)**

The in-memory state of an ability between activation and the end of a multi-tick effect such as a Scythe volley. While busy:
- the ability is not ready;
- a repeat Use is ignored silently;
- the HUD shows "active".

It is distinct from **cooldown**, which is durable and time-based, and which starts only when the ability owner decides (ASM-017).

**States:** Ready → Busy (active) → Cooldown or Ready.

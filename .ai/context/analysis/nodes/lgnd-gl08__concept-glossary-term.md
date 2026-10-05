---
type: "concept-glossary-term"
node_id: "L0-lgnd-gl08"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-lgnd-gl08"]
is_a: ["glossary-term"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 530
size_chars: 496
tags: ["is_a:glossary-term"]
level: 2
---
**Activation resolver (`resolveActivation`)**

The single function in `src/legendary/hands.ts` that answers "which held legendary does this Use press activate?". The answer is:
- the main hand, if its ability is ready and not busy;
- otherwise, the off hand, if its ability is ready and not busy;
- otherwise, none.

Every ability module calls it and acts only when the answer is its own weapon. It replaces the planned central dispatcher (`L0-lgnd-ad07`).

**Synonyms:** hand-priority resolver.

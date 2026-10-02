---
type: "concept-glossary-term"
node_id: "L0-ring-gl03"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ring-gl03"]
is_a: ["glossary-term"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 402
tags: ["is_a:glossary-term", "drops", "relates_to:L0-ring-ent3", "relates_to:L0-ring-ad01"]
level: 2
---
**Drop-Suppression Window**

The synchronous `try/finally` scope in which `world.gameRules.doTileDrops` is held false while a batch of ring explosions runs. It is then restored to its previous value. It never spans a tick. It removes block and container drops without touching mob loot or death drops. See `L0-ring-ent3`, `L0-ring-ad01`, `L0-ring-r006`.

**Synonyms:** no-drop window, tile-drop window.

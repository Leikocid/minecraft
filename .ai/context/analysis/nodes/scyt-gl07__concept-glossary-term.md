---
type: "concept-glossary-term"
node_id: "L0-scyt-gl07"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-scyt-gl07"]
is_a: ["glossary-term"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 394
tags: ["is_a:glossary-term", "targeting", "mob-targeting", "delta:2026-09-26"]
level: 2
---
**Links:** `part_of: ["L0-scyt"]` · `is_a: ["glossary-term"]` · `relates_to: []`

**Target tier** (приоритет игрока над мобом)

The first sort key in `pickTarget`: every player candidate ranks ahead of every mob candidate, whatever the distances. The mob tier is considered only when no player in range is visible and unhidden (`L0-scyt-ad04`).

**Synonyms:** player priority, `isPlayer` tier.

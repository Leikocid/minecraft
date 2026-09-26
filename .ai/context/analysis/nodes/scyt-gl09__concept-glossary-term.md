---
type: "concept-glossary-term"
node_id: "L0-scyt-gl09"
source_channel: "rollout"
analysis_version: 1
aliases: ["L0-scyt-gl09"]
is_a: ["glossary-term"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 340
tags: ["is_a:glossary-term", "volley", "outcome", "delta:2026-09-26"]
level: 2
---
**Links:** `part_of: ["L0-scyt"]` · `is_a: ["glossary-term"]` · `relates_to: []`

**Volley end reason** (`EndReason`)

One of `spent`, `out_of_radius`, `timeout` (200 ticks), `target_invalid` or `error`, set once when a volley ends and logged. The cooldown verdict ignores the reason: hits > 0 → full 30 s, otherwise none (`L0-scyt-ent3`).

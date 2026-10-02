---
type: "concept-glossary-term"
node_id: "L0-strf-g003"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-strf-g003"]
is_a: ["glossary-term"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 468
tags: ["is_a:glossary-term"]
level: 2
---
**Instance record / запись экземпляра**

The durable registry row for one generated structure: id, def, origin, rotation and init state (`planned → placed → looted → guarded → done`, or `failed`). It is stored in region-sharded world dynamic properties. It is the only proof that a structure exists or has been initialised, and it is never deleted.

**Synonyms**: registry entry, init flag («устойчивый признак инициализации»). **See**: `L0-strf-e002`, `L0-strf-r008`.

---
type: "concept-glossary-term"
node_id: "L0-infr-g009"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-infr-g009"]
is_a: ["glossary-term"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 530
size_chars: 424
tags: ["is_a:glossary-term", "v2-delta"]
level: 2
---
**Restart/idempotency check**

**Links:** `part_of: ["L0-infr"]` · `is_a: ["glossary-term"]`

An infra-owned BDS check that restarts the server process mid-lifetime (same world, not a fresh re-stage) and diffs structure-instance state before/after to prove one-time init (loot fill, guard spawn, marker placement) never re-runs — the engine-provable half of the project's no-duplication constraint (C-7). See `L0-infr-p007`.

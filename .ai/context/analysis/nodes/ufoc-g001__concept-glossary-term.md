---
type: "concept-glossary-term"
node_id: "L0-ufoc-g001"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ufoc-g001"]
is_a: ["glossary-term"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 339
tags: ["is_a:glossary-term", "schedule"]
level: 2
---
**Next arrival (`andrew:ufo_next_ms`)**

A world dynamic property holding the epoch-ms time (`Date.now()`) at which the next UFO arrival becomes due.
- **Absent:** no first join has been seen yet.
- **`0`:** the in-flight marker (`L0-ufoc-ad03`).
- **In the past:** due; waiting for an Overworld player.

**Synonyms:** schedule, UFO timer.

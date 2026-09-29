---
type: "concept-glossary-term"
node_id: "L0-ring-gl02"
source_channel: "rollout"
analysis_version: 3
aliases: ["L0-ring-gl02"]
is_a: ["glossary-term"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 431
tags: ["is_a:glossary-term", "relates_to:L0-ring-p003", "relates_to:L0-ring-ad02"]
level: 2
---
**Detonation Queue**

`ring`'s global, in-memory FIFO of Queued Blasts. It is filled by `onDetonate` and drained at ≤ `RING_MAX_BLASTS_PER_TICK` explosions per tick by one interval, which runs only while the queue is non-empty. It spreads a same-tick touchdown of hundreds of charges over a few ticks. See `L0-ring-p003`, `L0-ring-ad02`.

**Not to be confused with** the orbc *flight job* (`L0-orbc-ad02`), which moves the charges.

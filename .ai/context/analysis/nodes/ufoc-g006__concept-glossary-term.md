---
type: "concept-glossary-term"
node_id: "L0-ufoc-g006"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ufoc-g006"]
is_a: ["glossary-term"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 406
tags: ["is_a:glossary-term", "testability"]
level: 2
---
**Environment seam (`env`)**

The object `createUfoCore(env)` takes in place of the engine globals. It provides:
- `now()`;
- the phase-duration table;
- `overworldPlayers()`;
- `random()`;
- the property store.

The product binds `Date.now`, the spec durations and `world.getAllPlayers()`. GameTest binds a scaled clock and its simulated players (`L0-xasm13`).

**Synonyms:** clock seam, injectable clock.

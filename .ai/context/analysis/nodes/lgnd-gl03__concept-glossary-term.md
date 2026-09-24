---
type: "concept-glossary-term"
node_id: "L0-lgnd-gl03"
source_channel: "rollout"
analysis_version: 1
aliases: ["L0-lgnd-gl03"]
is_a: ["glossary-term"]
part_of: ["L0-lgnd"]
relates_to: ["L0-lgnd"]
priority: 520
size_chars: 383
tags: ["glossary"]
level: 2
---
**Instance generation (gen)**

An integer stored on each marked stack (`andrew:<p>_gen`) and in the world ledger (`andrew:<p>_gen:<id>`). The framework bumps it every time it re-issues a lost instance.

A stack whose gen is lower than the ledger's is **stale**: it cannot cast, and it is deleted when a player picks it up. Stacks made before the framework have no gen and read as 0.

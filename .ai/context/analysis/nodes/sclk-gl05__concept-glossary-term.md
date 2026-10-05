---
type: "concept-glossary-term"
node_id: "L0-sclk-gl05"
source_channel: "rollout"
analysis_version: 7
aliases: ["L0-sclk-gl05"]
is_a: ["glossary-term"]
part_of: ["L0-sclk"]
relates_to: ["L0-sclk"]
priority: 610
size_chars: 263
tags: ["glossary"]
level: 2
---
**Bolt record (`BoltRecord`)**

The in-memory, never-persisted state of one live bolt: owner, seed, birth tick, last position and volley id (`ent3`). Deleting it is the resolve-once guard (C-26). A bolt with no record (after a reload) is removed with no outcome.

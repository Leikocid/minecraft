---
type: "concept-glossary-term"
node_id: "L0-infr-g005"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-infr-g005"]
is_a: ["glossary-term"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 512
tags: ["is_a:glossary-term"]
level: 2
---
**"Pack Stack" line**

**Links:** `part_of: ["L0-infr"]` · `is_a: ["glossary-term"]`

A specific line BDS prints to its log at world load, naming each loaded behavior pack and its uuid. `bds-check.mjs`'s log analysis treats its presence (for the release and selftest pack uuids) as positive proof those packs were actually loaded by the engine — resource packs get no such line, so their loading is proven negatively instead (absence of a "Configured pack … was not found and was ignored" warning for that uuid).

---
type: "concept-glossary-term"
node_id: "L0-orbc-gloss-orph"
source_channel: "rollout"
analysis_version: 3
aliases: ["L0-orbc-gloss-orph"]
is_a: ["glossary-term"]
part_of: ["L0-orbc"]
relates_to: ["L0-orbc"]
priority: 540
size_chars: 441
tags: ["is_a:glossary-term", "relates_to:L0-orbc-p003", "relates_to:L0-orbc-ad03"]
level: 3
---
**Orphan charge / lost charge**

A *lost* charge is one dropped from its attack because its entity or its next cell became unloaded. It never detonates.

An *orphan* is a charge entity that exists in the world with no live attack in memory: one that was saved in an unloaded chunk or at shutdown, then loaded again. It is removed on load or startup and **never** detonates.

**Related:** *voided*, a charge that fell below `heightRange.min`.

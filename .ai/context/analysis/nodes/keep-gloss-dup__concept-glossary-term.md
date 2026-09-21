---
type: "concept-glossary-term"
node_id: "L0-keep-gloss-dup"
source_channel: "rollout"
aliases: ["L0-keep-gloss-dup"]
part_of: ["L0-keep"]
is_a: ["glossary-term"]
relates_to: ["L0-keep"]
analysis_version: 2
level: 2
priority: 510
size_chars: 866
tags: ["glossary-term","L0-keep"]
---

**Dup path** · RU: *«дюп»*, *«способ дюпа»*

Any reproducible sequence of player or server actions that increases the number of Web Sword instances in the world without a legitimate craft or admin grant. Named explicitly in §14 — *«Нет известных способов дюпа через крафт, смерть или reconnect»* — and elevated to constraint **C-7**, where it is stated absolutely with no error budget.

The three named vectors:
- **via craft** — owned by `L0-once` (concurrent-craft race, §9)
- **via death** — owned by `L0-keep` (`L0-keep-p001`/`p002`)
- **via reconnect** — owned by `L0-keep` (`L0-keep-p003`)

A dup is distinguished from ordinary bugs by being **permanent and silent**: the extra item persists in world state indefinitely and cannot be detected after the fact without auditing every inventory and container.

**Synonyms**: duplication exploit, item duplication.

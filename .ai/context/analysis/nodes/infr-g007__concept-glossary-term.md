---
type: "concept-glossary-term"
node_id: "L0-infr-g007"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-infr-g007"]
is_a: ["glossary-term"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 530
size_chars: 577
tags: ["is_a:glossary-term", "v2-delta"]
level: 2
---
**worldSalt**

**Links:** `part_of: ["L0-infr"]` · `is_a: ["glossary-term"]`

A random value created once per world and stored in a world dynamic property, used as the seed for `strf`'s deterministic per-chunk roll (`hash(worldSalt, dim, cx, cz, structureId) < chance`, `L0-adr-strc`). Makes re-evaluating an already-seen chunk idempotent — the same chunk always rolls the same outcome — so a lost "evaluated" bit can't double-generate a structure. Owned by `L0-strf`; infra's statistical chunk-roll check (`L0-infr-p006`) exercises it but does not generate or store it itself.

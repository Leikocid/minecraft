---
type: "concept-glossary-term"
node_id: "L0-infr-g008"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-infr-g008"]
is_a: ["glossary-term"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 530
size_chars: 544
tags: ["is_a:glossary-term", "v2-delta"]
level: 2
---
**Chunk-roll statistical check**

**Links:** `part_of: ["L0-infr"]` · `is_a: ["glossary-term"]`

An infra-owned GameTest-lane check that drives `strf`'s roll formula over many synthetic chunk coordinates and asserts the observed generation rate matches the configured per-structure constant (1 % Windmill / 2 % Airship / 5 % Warden City & Bastion) within a tolerance band, because the real rate can't be observed by exploring a normal-sized test world. See `L0-infr-p006`, `L0-infr-r006`.

**Synonyms**: statistical chunk-roll test, rate check.

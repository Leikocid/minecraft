---
type: "concept-glossary-term"
node_id: "L0-pick-gl03"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-pick-gl03"]
is_a: ["glossary-term"]
part_of: ["L0-pick"]
relates_to: ["L0-pick"]
priority: 520
size_chars: 390
tags: ["is_a:glossary-term", "relates_to:L0-pick-r003", "relates_to:L0-pick-r004"]
level: 2
---
**Closed allow-list**

The auto-smelt design pattern used by `src/autosmelt.ts`: a fixed, enumerated `Map` of exactly the block ids the spec named (7 entries), with no wildcard, tag-based, or "any ore" matching. Anything not explicitly listed keeps vanilla behavior (`L0-pick-r004`). Contrast with an "open" or tag-driven transform, which was considered out of scope for the Stage 1 probe.

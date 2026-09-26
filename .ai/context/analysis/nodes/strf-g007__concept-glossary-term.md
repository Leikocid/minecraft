---
type: "concept-glossary-term"
node_id: "L0-strf-g007"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-strf-g007"]
is_a: ["glossary-term"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 500
tags: ["is_a:glossary-term"]
level: 2
---
**Collision signature / сигнатура структуры**

A block type that does not occur naturally at a given dimension and depth, so finding it inside a candidate's AABB is taken as evidence of a vanilla structure (e.g. `deepslate_tiles`, `polished_blackstone_bricks`, `nether_bricks`, rails, `chest`, `bell`). It is the basis of the heuristic collision detector. The heuristic is incomplete by design and recorded in the deviation report.

**Synonyms**: signature block. **See**: `L0-strf-r006`, `L0-xasm3`.

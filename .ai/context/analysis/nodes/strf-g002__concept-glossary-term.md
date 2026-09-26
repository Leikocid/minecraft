---
type: "concept-glossary-term"
node_id: "L0-strf-g002"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-strf-g002"]
is_a: ["glossary-term"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 424
tags: ["is_a:glossary-term"]
level: 2
---
**Footprint / горизонтальная проекция**

The rotated horizontal extent (x/z) of a structure's template. Validity checks (land, water, flatness, max terrain height) sample the **whole** footprint, not just its centre. "Footprint + margin" (2 blocks) is the area that must be loaded and free of collisions. The 3D version is the instance **AABB**.

**Synonyms**: projection, AABB (3D). **See**: `L0-strf-r005`, `L0-strf-r007`.

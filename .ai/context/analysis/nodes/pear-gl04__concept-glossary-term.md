---
type: "concept-glossary-term"
node_id: "L0-pear-gl04"
source_channel: "rollout"
analysis_version: 11
aliases: ["L0-pear-gl04"]
is_a: ["glossary-term"]
part_of: ["L0-pear"]
relates_to: ["L0-pear"]
priority: 650
size_chars: 457
tags: ["v11", "pearl-rod", "glossary", "xcx34"]
level: 2
---
**Plate generation**

A per-cell counter in a world dynamic property (`andrew:pg:<dim>:<x>:<y>:<z>`). It is bumped whenever an observed path (player break or place, explosion, piston) touches a watched plate cell or its support. It stands in for block identity, which Bedrock blocks do not have (`xcx34`). A mismatch at teleport time means the plate was replaced.

**Related term:** watched cell (`andrew:pg_watch`): a plate cell that some rod is bound to.

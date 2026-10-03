---
type: "concept-glossary-term"
node_id: "L0-ufoc-g003"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ufoc-g003"]
is_a: ["glossary-term"]
part_of: ["L0-ufoc"]
relates_to: ["L0-ufoc"]
priority: 580
size_chars: 375
tags: ["is_a:glossary-term", "altitude"]
level: 2
---
**Hover height (`hoverY`)**

`min(centre.y + 40, overworld.heightRange.max − 15)`, the Y at which the saucer hangs during the magnet phase. `ufoc` computes it once and passes it in every `onPhase` payload. It is the top of the magnet zone. `sauc` flies its legs at `min(hoverY + 10, ceiling − 4)`.

**Synonyms:** высота зависания, hover point (together with the centre's x/z).

---
type: "concept-acceptance-criterion"
node_id: "L0-infr-ac08"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-infr-ac08"]
is_a: ["acceptance-criterion"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 530
size_chars: 492
tags: ["channel:build", "is_a:acceptance-criterion", "relates_to:L0-infr-p005", "v2-delta"]
level: 2
---
**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-infr-p005"]`

GIVEN checked-in structure layout sources, WHEN the structure-compilation step of `npm run build` runs, THEN it emits one `.mcstructure` file per structure under `packs/behavior/structures/andrew/`, and a round-trip unit test confirms each file's chest/spawner/shrieker/door counts and footprint bounds match its source definition, for all four structures. [src: L0-adr-tmpl; L0-infr-p005]

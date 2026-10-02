---
type: "concept-acceptance-criterion"
node_id: "L0-infr-ac10"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-infr-ac10"]
is_a: ["acceptance-criterion"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 530
size_chars: 516
tags: ["channel:bds", "is_a:acceptance-criterion", "relates_to:L0-infr-p006", "relates_to:L0-infr-as03", "v2-delta"]
level: 2
---
**Links:** `part_of: ["L0-infr"]` · `is_a: ["acceptance-criterion"]` · `relates_to: ["L0-infr-p006", "L0-infr-as03"]`

GIVEN the statistical chunk-roll check drives `strf`'s roll formula over a large synthetic sample of chunk coordinates per structure, WHEN the harness tallies successful rolls, THEN the observed rate falls inside the configured tolerance band of that structure's chance constant, and the run exits 0/1 by that verdict alone, with no human eye needed. [src: L0-adr-strc; L0-infr-p006; L0-infr-as03]

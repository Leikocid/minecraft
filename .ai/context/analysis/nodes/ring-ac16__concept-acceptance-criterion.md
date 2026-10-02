---
type: "concept-acceptance-criterion"
node_id: "L0-ring-ac16"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-ring-ac16"]
is_a: ["acceptance-criterion"]
part_of: ["L0-ring"]
relates_to: ["L0-ring"]
priority: 540
size_chars: 593
tags: ["is_a:acceptance-criterion", "verify:bds", "legendary", "relates_to:L0-ring-r008", "relates_to:L0-lgnd-ac19", "relates_to:L0-ring-cx02"]
level: 2
---
**AC-ring-16 · RMB never destroys a legendary** (Orbital §5, §10; `r008`) · **verify: bds**

GIVEN a live-marked Web Sword in a chest on ring 5, and a live-marked Scythe as an item entity on the ground 6 blocks outside ring 20. WHEN RMB is fired, THEN:
- both legendaries exist afterwards as item entities in the same dimension, outside the footprint ± 8, with the same `id` and `gen` (no `gen + 1`);
- no "returned" log line appears, and `handedBack` is 0;
- the `lgnd` `ac19` detector reports no unprotected container removal.

This AC fails today by design until `L0-ring-cx02` is resolved.

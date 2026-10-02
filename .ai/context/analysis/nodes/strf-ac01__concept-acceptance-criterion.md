---
type: "concept-acceptance-criterion"
node_id: "L0-strf-ac01"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-strf-ac01"]
is_a: ["acceptance-criterion"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 384
tags: ["is_a:acceptance-criterion", "verify:unit", "determinism"]
level: 2
---
**AC-strf-01 · The roll is deterministic and uniform** (`L0-strf-r001`)

GIVEN a fixed salt, WHEN `roll(salt, dim, cx, cz, def)` is computed twice for 100 000 keys, THEN the results are identical. The success share for chance 0.05 is within 0.05 ± 0.004 (≈ 3σ). A χ² test over 100 buckets gives p > 0.01. Three golden keys produce their recorded values.
**Verify:** unit (`npm test`).

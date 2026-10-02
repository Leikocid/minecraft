---
type: "concept-rule"
node_id: "L0-wind-r006"
source_channel: "rollout"
analysis_version: 5
title: "Rule: normal generation — 1 %, dry flat land only, cancel instead of fix"
aliases: ["L0-wind-r006"]
is_a: ["rule"]
part_of: ["L0-wind"]
relates_to: ["L0-wind"]
priority: 530
size_chars: 879
tags: ["is_a:rule", "worldgen", "normal-generation", "relates_to:L0-strf-r002", "relates_to:L0-strf-r005", "relates_to:L0-strf-r006", "relates_to:L0-wind-p001"]
level: 2
---
# Rule: normal generation — 1 %, dry flat land only, cancel instead of fix

**Links:** `part_of: ["L0-wind"]` · `is_a: ["rule"]` · `relates_to: [L0-strf-r002, L0-strf-r005, L0-strf-r006, L0-wind-p001]`

**Source:** §4.6, §2 last bullet, §9 edge cases 2 and 4, test 23.

- Chance 1 % per suitable Overworld land chunk. Ocean / fully-water chunks are not suitable.
- After a successful roll, the whole rotated ~35×35 plot must be naturally flat enough (`flat`, Δ ≤ 3) and dry (`dryLand`, liquid ≤ 5 %).
- Invalid → the candidate is **cancelled**. It is never moved to another chunk and the terrain is never levelled, cut or filled by script (forced prep is exclusive to the spawn Windmill, `L0-wind-r008`).
- Overlap with a registry instance, a detected vanilla structure or any spawner → cancelled; nothing is damaged (`L0-strf-r006`).
- At most one Windmill per candidate chunk.

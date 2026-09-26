---
type: "concept-assumption"
node_id: "L0-bast-as01"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-bast-as01"]
is_a: ["assumption"]
part_of: ["L0-bast"]
relates_to: ["L0-bast"]
priority: 530
size_chars: 808
tags: ["is_a:assumption", "CAN_ASSUME", "generation"]
level: 2
---
**ASM-bast-01 — "Suitable chunk" for the 5% Nether roll** `CAN_ASSUME`

The spec's "подходящий Nether-чанк" (suitable Nether chunk) is not formally defined beyond "not a lava ocean, needs solid support." Assume: a chunk is suitable when its surface/support area can host the ~20×20 footprint on solid, non-lava-ocean terrain without requiring artificial leveling — unlike the Windmill spawn-area rule, which explicitly allows site preparation; Mini Bastion has no such fallback.

**Impact if wrong:** If suitability is defined too loosely, bastions could generate partially clipped into terrain or floating over voids. If too strict, the effective generation rate drops well below the nominal 5%, which would fail AC-bast-01's statistical test.

**Source:** §14.2 (silent on the exact suitability algorithm).

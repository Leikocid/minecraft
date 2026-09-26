---
type: "concept-process"
node_id: "L0-bast-p001"
source_channel: "rollout"
analysis_version: 2
title: "P-bast-001 — Candidate roll, site validation, and template placement"
aliases: ["L0-bast-p001"]
is_a: ["process"]
part_of: ["L0-bast"]
relates_to: ["L0-bast"]
priority: 530
size_chars: 1217
tags: ["is_a:process", "generation", "placement", "delta:2026-09-26"]
level: 2
---
# P-bast-001 — Candidate roll, site validation, and template placement

GIVEN a Nether chunk is generated/loaded and has not yet been evaluated for Mini Bastion:

1. Roll 5% chance for that chunk to become a Mini Bastion candidate.
2. If the roll fails, do nothing (the chunk is not re-rolled later).
3. If the roll succeeds, evaluate physical suitability: reject if the candidate site sits over a lava ocean, or lacks solid supporting terrain for the ~20×20 footprint, or physically intersects any other already-detected structure (custom: Windmill/Airship/Mini Warden City, or vanilla, including a real Bastion Remnant).
4. If site validation fails, cancel generation outright — do **not** search neighboring chunks or retry elsewhere.
5. If site validation passes, pick a random rotation (0/90/180/270) and place the single fixed template (~20×20 footprint, ~10-12 height, 2-3 connected levels) without damaging any pre-existing structure.
6. Hand off to P-bast-002 for one-time population (chests, gold, guards).

Applies in all Nether biomes; biome identity is not a gating factor beyond physical suitability.

**Rules invoked:** R-bast-001 (roll/rejection), R-bast-002 (footprint/shape).
**Source:** §14.1-14.2.

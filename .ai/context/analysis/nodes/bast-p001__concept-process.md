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

GIVEN the `strf` discovery worker dequeues a Nether chunk (`L0-strf-p001`) and it has not yet been evaluated for Mini Bastion:

1. Steps `L0-strf-p001` → `p002` → `p003`; the body supplies the `StructureDef` (5% chance, lava-ocean/support rejection, overlap rejection against custom or vanilla structures including a real Bastion Remnant, ~20×20 footprint) and the template (random rotation, placement without damaging pre-existing structures).
2. Except `pending` (footprint not loaded): the same origin and rotation are retried (`L0-strf-r002` §2, `L0-strf-r007`).
3. Hand off to P-bast-002 for one-time population (chests, gold, guards).

Applies in all Nether biomes; biome identity is not a gating factor beyond physical suitability.

**Rules invoked:** `L0-strf-r001`, `L0-strf-r002`, `L0-strf-p001` (roll/rejection), R-bast-002 (footprint/shape).
**Source:** §14.1-14.2.

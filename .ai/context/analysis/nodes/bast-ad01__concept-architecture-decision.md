---
type: "concept-architecture-decision"
node_id: "L0-bast-ad01"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-bast-ad01"]
is_a: ["architecture-decision"]
part_of: ["L0-bast"]
relates_to: ["L0-bast"]
priority: 530
size_chars: 1126
tags: ["is_a:architecture-decision", "generation", "stable-api"]
level: 2
---
**ADR-bast-01 — Script-API-driven candidate generation and template placement, not vanilla structure sets**

**Context:** Mini Bastion (and its three siblings) need per-chunk candidate rolls, custom suitability checks (lava-ocean rejection, overlap-with-any-structure rejection), and bespoke one-time post-placement population (chests/gold/guards) with idempotency — all while §15 mandates "prefer stable Bedrock Add-On/Script API without Experiments."

**Chosen:** Implement generation as script-driven logic (per-chunk roll → site validation → template block placement → one-time population), keyed off world-generation/chunk-load events, entirely on stable `@minecraft/server` APIs.

**Rejected alternative:** Author Mini Bastion as a vanilla `structure_set`/jigsaw feature definition. Rejected because jigsaw-based custom structure generation typically needs experimental toggles or offers far less control over the required one-time, idempotent guard/chest population and overlap-with-real-Bastion-Remnant detection that §14 demands.

**Source:** §15 ("предпочитать стабильные Bedrock Add-On/Script API без Experiments").

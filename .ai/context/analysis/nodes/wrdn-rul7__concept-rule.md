---
type: "concept-rule"
node_id: "L0-wrdn-rul7"
source_channel: "rollout"
analysis_version: 2
aliases: ["L0-wrdn-rul7"]
is_a: ["rule"]
part_of: ["L0-wrdn"]
relates_to: ["L0-wrdn"]
priority: 530
size_chars: 651
tags: ["is_a:rule", "persistence", "idempotency"]
level: 2
---
**Rule — Persistence & idempotency**

- Once generated, every block of Mini Warden City is an ordinary world block, changeable by the player under the normal vanilla rules for that block type.
- Destroyed or altered parts of the structure never regenerate.
- Initialization must be idempotent: reloading the chunk/world must never create a second set of chests, Shriekers, Sensors, or surface marker for the same city instance.

Rationale: matches the shared four-structure persistence contract (§15 — none of the four regenerate loot/blocks/one-time mobs after restart) and the project-wide single-durable-registry expectation for generated content.

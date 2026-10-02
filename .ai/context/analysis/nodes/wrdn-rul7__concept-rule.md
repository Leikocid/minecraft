---
type: "concept-rule"
node_id: "L0-wrdn-rul7"
source_channel: "rollout"
analysis_version: 5
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

- Once generated, every block of Mini Warden City is an ordinary world block, changeable by the player under the normal vanilla rules for that block type (`L0-strf-r008`).
- Destroyed or altered parts of the structure never regenerate (`L0-strf-p004`).
- Initialization must be idempotent: reloading the chunk/world must never create a second set of chests, Shriekers, Sensors, or surface marker for the same city instance (`L0-adr-strs`).

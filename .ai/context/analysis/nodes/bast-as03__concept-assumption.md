---
type: "concept-assumption"
node_id: "L0-bast-as03"
source_channel: "rollout"
analysis_version: 5
aliases: ["L0-bast-as03"]
is_a: ["assumption"]
part_of: ["L0-bast"]
relates_to: ["L0-bast"]
priority: 530
size_chars: 686
tags: ["is_a:assumption", "CAN_ASSUME", "idempotency"]
level: 2
---
**ASM-bast-03 — Superseded: no per-instance init marker**

Superseded: idempotency is the single region-sharded registry (`L0-strf-r008`, `L0-adr-strs`); there is no per-instance marker. This assumption is void — nothing in the code refers to it.

**Source:** §14.6 (states the idempotency requirement, not the mechanism); the mechanism is `L0-strf-r008`.

---
type: "concept-architecture-decision"
node_id: "cool-adr3"
source_channel: "rollout"
analysis_version: 1
title: "ADR-3 · Legendary state lives in world dynamic properties, with one shared framework for all weapons"
aliases: ["cool-adr3"]
is_a: ["architecture-decision"]
part_of: ["L0"]
relates_to: ["L0"]
priority: 520
size_chars: 1025
tags: ["title:ADR-3 World dynamic properties for legendary state", "is_a:architecture-decision"]
---
# ADR-3 · Legendary state lives in world dynamic properties, with one shared framework for all weapons

**Context.** One-per-world craft flags must survive restarts and be race-safe. Death retention and cooldowns (decision q-009: kept across exits) need persistent per-player/per-instance state. A second weapon (Scythe) needs the same rules.

**Decision.** Persist the craft flags, instance provenance marks (q-006), retention records and cooldown expiry in `world` / entity dynamic properties, keyed by `andrew:<weapon>`. Check and set the craft flag inside a single synchronous tick, so concurrent crafts can't both pass. Extract the Web Sword–specific modules (`craftgate`, `retention`, `cooldown`, `state`) into a weapon-agnostic `lgnd` layer before implementing the Scythe.

**Rejected.** (a) Scoreboard objectives: visible and editable by operators via commands, awkward for per-instance data. (b) Copying the Web Sword modules for each weapon: the rules would drift and each copy would need its own anti-dup testing.

---
type: "concept-rule"
node_id: "L0-strf-r008"
source_channel: "rollout"
analysis_version: 2
title: "Rule: the registry is the only source of truth for \"this structure exists / is initialised\""
aliases: ["L0-strf-r008"]
is_a: ["rule"]
part_of: ["L0-strf"]
relates_to: ["L0-strf"]
priority: 530
size_chars: 1225
tags: ["is_a:rule", "idempotency", "persistence", "C-6", "C-7", "relates_to:L0-strf-p004", "relates_to:L0-adr-strs"]
level: 2
---
# Rule: the registry is the only source of truth for "this structure exists / is initialised"

**Links:** `part_of: ["L0-strf"]` · `is_a: ["rule"]`

1. Every instance has a durable record in world dynamic properties (§6 "устойчивый признак инициализации"). It is written **before** the first world mutation (`planned`) and advanced after each init step.
2. Each init step runs only while the record is in that step's predecessor state. Restarts and chunk reloads can therefore never produce a second set of chests, loot, spawners, guards, markers or gold blocks (§11, tests 22, 50, 58).
3. The "initial guards spawned" state (`guarded`) is set once and **never reset**, whatever happens to the guards (§6).
4. The chest container itself is the loot state after `looted` (§6). `strf` keeps no copy of loot.
5. Records are never deleted, even when a player levels the structure. A missing structure is a permanent world change (§2, §6, §9), and the record keeps blocking new candidates on that spot. That spot keeps what the player built.
6. Registry writes are synchronous within the job step (`world.setDynamicProperty`). No two jobs run, so there are no concurrent writers inside one pack. Across packs: stores are per pack; only the release pack's store is the world registry, test packs use private runtimes (`L0-adr-own`).

---
type: "concept-architecture-decision"
node_id: "L0-scyt-ad01"
source_channel: "rollout"
analysis_version: 1
title: "ADR-scyt-01 — Target search is one bounded `dimension.getPlayers` query per press"
aliases: ["L0-scyt-ad01"]
is_a: ["architecture-decision"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1308
tags: ["is_a:architecture-decision", "targeting", "performance", "status:proposed"]
level: 2
---
# ADR-scyt-01 — Target search is one bounded `dimension.getPlayers` query per press

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-scyt-p001", "C-5"]` · status: proposed.

**Context.** Scythe §7 says: «Поиск цели выполнять при активации, а не постоянным тяжёлым сканированием каждый tick.» C-5 forbids permanent global per-tick scans. The candidate set must hold players only, from the owner's dimension, within 20 blocks.

**Decision.** At activation, call `owner.dimension.getPlayers({ location: launchPoint, maxDistance: 20 })` once. The engine prunes by dimension and distance. The script then drops the owner and applies the r001 filters. The query plus the raycasts is bounded by the number of nearby players, which is small on a LAN/BDS server.

**Rejected.**
- `world.getPlayers()` plus manual distance and dimension filters. It works, but it iterates every player in every dimension on each press. It is wasteful, and it duplicates filtering the engine already does.
- `dimension.getEntities({ type: "minecraft:player", maxDistance: 20 })`. It is equivalent, but the result is typed `Entity[]` and needs casts. That is against strict TS style (C-10).
- Tracking the nearest player continuously in a tick loop so a press is O(1). This violates C-5 and §7.

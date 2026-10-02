---
type: "concept-architecture-decision"
node_id: "L0-scyt-ad01"
source_channel: "rollout"
analysis_version: 5
title: "ADR-scyt-01 — Candidates: every player, plus a 20-block entity query for mobs, once per press"
aliases: ["L0-scyt-ad01"]
is_a: ["architecture-decision"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1439
tags: ["is_a:architecture-decision", "targeting", "performance", "delta:2026-09-26"]
level: 2
---
# ADR-scyt-01 — Candidates: every player, plus a 20-block entity query for mobs, once per press

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["architecture-decision"]` · `relates_to: ["L0-scyt-p001", "L0-scyt-ad04", "C-5"]`

Status: **implemented** (`gatherCandidates`, since `4b74f2f`). It replaces the earlier proposal to use a single `dimension.getPlayers`.

**Context.** Spec §7 says to search at activation and not scan every tick (C-5). Since 2026-09-25 mobs count too (`L0-scyt-ad04`), so the candidate set is players ∪ living entities within 20 blocks.

**Decision.** On each press, and once only:
1. `world.getAllPlayers()`, keeping the valid ones. A SimulatedPlayer can come back `undefined` in a non-beta pack, so each entry is typed nullable.
2. `owner.dimension.getEntities({ location: owner.location, maxDistance: 20 })`, which the engine bounds. Each entity is kept if it is valid, not already present and not the owner, and has a `minecraft:health` component.
3. The pure rules then apply dimension, distance, hidden, tier, visibility and gaze.

**Rejected.**
- `dimension.getPlayers` only. It cannot see mobs.
- `getEntities` with a `families` or `type` filter. The health check is simpler and excludes non-living entities in the same step.
- Per-tick nearest tracking. It violates C-5.

**Cost:** step 1 walks every player in every dimension. That is cheap on a LAN server, and the rules drop the other-dimension players.

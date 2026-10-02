---
type: "concept-rule"
node_id: "L0-scyt-r001"
source_channel: "rollout"
analysis_version: 5
title: "R-scyt-001 — Candidate filter (players and living mobs)"
aliases: ["L0-scyt-r001"]
is_a: ["rule"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1350
tags: ["is_a:rule", "targeting", "mob-targeting", "delta:2026-09-26"]
level: 2
---
# R-scyt-001 — Candidate filter (players and living mobs)

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-scyt-p001", "L0-scyt-ad02", "L0-scyt-ad04", "L0-scyt-as01", "Q-022"]`

Source: spec §3 as amended by `decision-scythe-targets-mobs` (2026-09-25). Code: `gatherCandidates`, `eligibleCandidates`, `hasLineOfSight`.

**Rule:** an entity E is a candidate for owner O only if **all** of these hold:
1. E is a player from `world.getAllPlayers()` with `isValid`, **or** an entity returned by `O.dimension.getEntities({ location: O.location, maxDistance: 20 })` that is valid and has a `minecraft:health` component. The health component is what excludes arrows, dropped items, xp orbs and similar entities.
2. E ≠ O.
3. E is in O's dimension, and `dist3D(E.location, O.location) ≤ 20`. The bound is inclusive and measured feet to feet.
4. If E is a player, `isHiddenFromTargeting(E)` is false. Mobs are never hidden.
5. E is **visible**: there is line of sight from O's eyes to E's eyes (`L0-scyt-ad02`).

**Not a filter (as shipped):** game mode (Creative and Spectator players are **not** skipped, see `L0-scyt-as01`), vanilla Invisibility, sneaking, teams, name tags, the `pvp` gamerule (Q-022), and whether a mob is hostile or passive. Armour stands have health, so they qualify as mob-tier candidates. That is unverified.

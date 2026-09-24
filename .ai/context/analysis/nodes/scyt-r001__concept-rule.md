---
type: "concept-rule"
node_id: "L0-scyt-r001"
source_channel: "rollout"
analysis_version: 1
title: "R-scyt-001 — Candidate filter"
aliases: ["L0-scyt-r001"]
is_a: ["rule"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 926
tags: ["is_a:rule", "targeting"]
level: 2
---
# R-scyt-001 — Candidate filter

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["rule"]` · `relates_to: ["L0-scyt-p001", "L0-scyt-ad02", "ASM-023", "ASM-024", "Q-015", "Q-022"]` · source: Scythe §3.

**Rule:** a player P is a candidate for owner O only if **all** of these hold:
1. P is a `Player`, not a mob or any other entity (§3 «Мобы не являются целями»).
2. P ≠ O.
3. P is in O's dimension, and `dist(P.location, launchPoint) ≤ 20`. The bound is inclusive.
4. `P.isValid` holds and P is alive. P is not in Spectator or Creative. Only Survival and Adventure count (the mirror of Q-015; an assumption, see `L0-scyt-as01`).
5. `isHiddenByShadowBlade(P) === false` (§3). This is a stub until Shadow Blade exists (ASM-024).
6. P is **visible** from O's eyes (`L0-scyt-ad02`).

**Not a filter:** vanilla Invisibility, sneaking, name tags, team membership, or the `pvp` gamerule. Q-022 is open, and the default is (a): ignore it.

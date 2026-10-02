---
type: "concept-assumption"
node_id: "L0-scyt-as01"
source_channel: "rollout"
analysis_version: 5
title: "ASM-scyt-01 — Game mode is not a targeting filter (as shipped) `CAN_ASSUME`"
aliases: ["L0-scyt-as01"]
is_a: ["assumption"]
part_of: ["L0-scyt"]
relates_to: ["L0-scyt"]
priority: 520
size_chars: 1111
tags: ["is_a:assumption", "assumption", "targeting", "delta:2026-09-26"]
level: 2
---
# ASM-scyt-01 — Game mode is not a targeting filter (as shipped) `CAN_ASSUME`

**Links:** `part_of: ["L0-scyt"]` · `is_a: ["assumption"]` · `relates_to: ["L0-scyt-r001", "Q-015", "L0-scyt-ac02"]`

**As shipped:** neither `gatherCandidates` nor `pickTarget` reads the game mode. A visible Creative or Spectator player within 20 blocks outranks every mob and **is locked**. The prior design skipped them, as a mirror of Q-015.

**Assumed acceptable:** the damage has no lasting effect on Creative players. A Spectator is normally not reachable, because the LOS ray and a hit still apply. The practical harm is a wasted volley. If no hit lands, it costs nothing.

**Unverified risks:**
1. The `setCurrentValue` correction in `r005` may lower a Creative player's health.
2. A Spectator near the owner can "steal" the lock from a real enemy or a mob.

**Impact if wrong:** add `getGameMode() ∈ {Survival, Adventure}` for players in `gatherCandidates`. That is one line, and it needs one new row in the table test. The owner side is unchanged: a Creative owner can cast, which is useful for `/andrew:scythe` testing.

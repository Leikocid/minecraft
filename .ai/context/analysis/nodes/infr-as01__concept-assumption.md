---
type: "concept-assumption"
node_id: "L0-infr-as01"
source_channel: "rollout"
analysis_version: 1
title: "Assumption: the GameTest harness is not one of Stage 0's five closing criteria"
aliases: ["L0-infr-as01"]
is_a: ["assumption"]
part_of: ["L0-infr"]
relates_to: ["L0-infr"]
priority: 520
size_chars: 1004
tags: ["is_a:assumption", "relates_to:L0-infr-ac06"]
level: 2
---
# Assumption: the GameTest harness is not one of Stage 0's five closing criteria

**Links:** `part_of: ["L0-infr"]` · `is_a: ["assumption"]` · `relates_to: ["L0-infr-ac06"]`

**Assumed**: `npm run bds:gametest` is an additional verification lane layered on top of Stage 0, not a hard gate for Stage 0 itself. The original `stage-0-infrastructure.md` (2026-09-20) lists exactly 5 closing criteria — build, JSON validation, BDS-in-Docker load, iPad checks, first git commit — and does not mention GameTest or SimulatedPlayer at all. The GameTest harness (`scripts/bds-gametest.mjs`, `decision-q-012`) was introduced later (2026-09-21) as a lane for Stage 1 (Miner's Pickaxe behavior) and Stage 2 (legendary-weapon multiplayer proof).

**Impact if wrong**: if GameTest is actually meant to gate Stage 0's "done" status, then Stage 0 is not closed by `build` + `validate` + `bds:check` alone, and AC06 (`L0-infr-ac06`) would need to move from "additional lane" to "Stage-0 blocking criterion" in the rollups.

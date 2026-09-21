---
type: "concept-process"
node_id: "L0-qatg-p003"
source_channel: "rollout"
title: "Process — Two-Player Evidence Collection"
aliases: ["L0-qatg-p003"]
part_of: ["L0-qatg"]
is_a: ["process"]
relates_to: ["L0-qatg-asm1", "L0-qatg-adr2"]
analysis_version: 2
level: 2
priority: 510
size_chars: 2093
tags: ["process","multiplayer","gametest","L0-qatg"]
---

# Process — Two-Player Evidence Collection

**Links** — `part_of: ["L0-qatg"]` · `is_a: ["process"]` · `relates_to: ["L0-qatg-asm1", "L0-qatg-adr2"]` · `spec: ["§14", "§9"]` · `governed_by: ["C-11"]`

**Trigger.** `L0-qatg-p002` step 4/5 needs multiplayer evidence and no run exists yet, or existing evidence is stale.

**Goal.** Produce the "≥2-player" evidence §14 requires, working within the one-iPad constraint C-11 documents (ASM-010, Q-012).

## Steps

1. **Primary path — simulated multiplayer.** Run `bds:gametest` scenarios with two `SimulatedPlayer` instances performing the relevant action in the same tick (already proven feasible in Stage 1 — `once-accp5` flags this exact substitution for the craft race). Use this for every test whose §9 claim is about **server-side logic determinism** (AT-3's craft race, AT-7/AT-12's placement determinism).
2. **Secondary path — genuine two-client corroboration, best-effort.** If a second physical Bedrock-capable device is available, run the Docker BDS LAN server with two real clients for at least AT-12 (both clients must visually agree on the same cobweb) — the one test where "the client renders it" is part of the claim, not just server state.
3. **Record which path produced which row's evidence** in the Acceptance Matrix. A row backed only by path 1 is valid evidence per the recommended answer to Q-012, but the record must not silently imply path 2 happened.
4. **If neither path is available for a given row**, that row is BLOCKED, not downgraded to single-player-only-counts.

## Edge cases

| Case | Behaviour |
|---|---|
| Second device never materialises for the life of this analysis | Path 1 alone satisfies the gate per Q-012's recommended answer — but the DoD verdict should still note the amendment was assumed, not confirmed by the spec owner |
| Two simulated players collide on the same tick in an unrelated way (e.g. both craft-racing when the test only wanted one to craft) | Scenario script bug, not evidence of a real race — re-run with corrected script before drawing a conclusion |
